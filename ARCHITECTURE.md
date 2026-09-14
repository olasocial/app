# OLA SOCIAL — Arquitectura Tecnológica y Especificación de Producción (2026)

## 1. Visión General
**OLA SOCIAL** (slogan: *"Crece junto a una comunidad real."*) es una plataforma de descubrimiento y crecimiento colaborativo voluntario entre creadores de contenido digital y comunidades. 

La plataforma opera bajo el principio de **cero bots, cero métricas simuladas y cero cuentas ficticias**.

---

## 2. Principios Fundamentales y Cumplimiento de Políticas
1. **Cero Bots y Cero Automatización:**
   - Queda estrictamente prohibido cualquier script, bot, macro o extensión que automatice acciones en plataformas de terceros (TikTok, Instagram, YouTube, X, Facebook, Twitch, Kick, etc.).
   - Todo apoyo ("Abrazo Digital") es una acción consciente y voluntaria realizada por un ser humano abriendo el enlace oficial en su propio navegador o aplicación nativa.
2. **Sin Credenciales de Terceros:**
   - La plataforma nunca solicita ni almacena contraseñas, tokens de sesión o cookies de las redes sociales de los creadores.
   - Solo se registran nombres de usuario públicos normalizados y URLs de destino oficiales.
3. **Cero Datos Simulados en Producción:**
   - No existen usuarios ficticios, estadísticas infladas ni botones de simulación. Todos los rankings y contadores reflejan registros reales almacenados en PostgreSQL / Supabase.

---

## 3. Arquitectura del Sistema

```
+-------------------------------------------------------------------------+
|                              FRONTEND PWA                               |
|   React 19 + TypeScript + Vite + TailwindCSS + Motion (Framer Motion)  |
|                                                                         |
|   [Lobby] <-> [Perfiles] <-> [Batallas] <-> [Rankings] <-> [Invitaciones]|
|                                   |                                     |
|                      [Centro de Seguridad & 2FA]                        |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTPS / WSS (Realtime)
                                     v
+-------------------------------------------------------------------------+
|                          SUPABASE BACKEND (PostgreSQL 15+)              |
|                                                                         |
|   +--------------------------+     +--------------------------------+   |
|   |      Supabase Auth       |     |     Row Level Security (RLS)   |   |
|   |  - Email/Password        |     |  - profiles: owner / read all  |   |
|   |  - Google OAuth          |     |  - tasks: assigned / creator   |   |
|   |  - MFA TOTP (AAL1/AAL2)  |     |  - campaigns: public view      |   |
|   +--------------------------+     |  - invitations: referrer only  |   |
|                                    +--------------------------------+   |
|   +--------------------------+     +--------------------------------+   |
|   |   Realtime Engine        |     |      Anti-Fraud & Audit        |   |
|   |  - Presence Channel      |     |  - audit_logs (append-only)    |   |
|   |  - Postgres CDC Events   |     |  - Circular collusion checks   |   |
|   +--------------------------+     |  - One email = One account     |   |
|                                    +--------------------------------+   |
+-------------------------------------------------------------------------+
```

---

## 4. Esquema de Base de Datos y Entidades

### `profiles` (Identidad y Reputación)
- `id` (UUID, PK, coincide 1:1 con `auth.users.id`).
- `email` (TEXT, único, inmutable por usuario).
- `username` (TEXT, único, normalizado en minúsculas).
- `display_name` (TEXT).
- `avatar_url` (TEXT).
- `user_level` (ENUM: EXPLORADOR, ACTIVO, COLABORADOR, INFLUYENTE, EMBAJADOR, MAESTRO).
- `level_number` (INT: 1 a 6).
- `experience_points` (INT: acumulativo).
- `reputation_score` (NUMERIC: 0.0 - 1000.0).
- `stars_count` (INT).
- `rating_avg` (NUMERIC: 1.0 - 5.0).
- `hugs_done` / `hugs_received` / `hugs_verified` (INT).
- `invite_code` (TEXT, único: `OLA-XXXXXX`).
- `invited_by_user_id` (UUID, FK a `profiles.id`).
- `role` (ENUM: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN').
- `is_banned` / `banned_reason` (BOOLEAN / TEXT).
- `two_factor_enabled` (BOOLEAN).

### `invitations` (Sistema de Referidos y Crecimiento Orgánico)
- `id` (UUID, PK).
- `referrer_id` (UUID, FK `profiles.id`).
- `invited_user_id` (UUID, FK `profiles.id`, UNIQUE).
- `invite_code` (TEXT).
- `status` (ENUM: 'registered' | 'verified' | 'active').
- `reputation_awarded` (NUMERIC).
- `created_at` / `verified_at` (TIMESTAMPTZ).

### `campaigns` & `tasks` (Colaboraciones y Abrazos)
- `campaigns`: Creadas voluntariamente por miembros para dar a conocer sus perfiles o contenido oficial.
- `tasks`: Generadas por campañas para que otros miembros visiten el perfil oficial externamente, interactúen legítimamente y declaren evidencia.

### `audit_logs` (Trazabilidad y Seguridad)
- Registro inmutable de acciones críticas (inicios de sesión, cambios de contraseña, activación de 2FA, sanciones administrativas, eliminaciones de cuenta).

---

## 5. Algoritmo Ponderado de Reputación
La reputación es calculada en Supabase según la siguiente matriz ponderada:

$$\text{Reputación} = \text{Base} (100) + (\text{Abrazos Validados} \times 10) + (\text{Estrellas 5★} \times 5) + (\text{Invitados Validados} \times 25) - (\text{Sanciones} \times 50)$$

- **Límites de rango:** $0 \le \text{Reputación} \le 1000$.
- **Anti-Colusión:** El sistema impide que dos cuentas intercambien abrazos cíclicos constantes para inflar artificialmente el puntaje.

---

## 6. Autenticación Robusta y 2FA
1. **Supabase Auth nativo:**
   - Soporta Email/Contraseña y Google OAuth.
   - Restricción estricta de cuenta única por correo electrónico (`One Email = One Account`).
2. **TOTP MFA (RFC 6238):**
   - Transición de AAL1 a AAL2.
   - Códigos temporales de 6 dígitos con ventana de 30 segundos.
   - Compatible con Google Authenticator, Microsoft Authenticator, Authy y 1Password.
   - Códigos QR generados dinámicamente en formato SVG directamente desde Supabase Auth.
