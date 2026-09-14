# OLA SOCIAL — Plataforma Oficial (2026)

> *"Abrazos que conectan personas"* — Comunidad de descubrimiento y apoyo auténtico entre creadores culturales.

[![CI/CD Build & Verify](https://github.com/olasocial/app/actions/workflows/deploy.yml/badge.svg)](https://github.com/olasocial/app/actions/workflows/deploy.yml)

## 🌟 Características Principales

- **Lobby y Tareas de Apoyo Humano (Abrazos)**:
  - Descubrimiento de canales y creadores.
  - Flujo voluntario sin compra de seguidores ni bots.
  - Sistema de reserva con límite de 20 minutos e idempotencia.
  - Calificación de 1 a 5 estrellas y tasa de validación real.

- **Integración Segura de Redes Sociales (LOCKED Profiles)**:
  - Soporte de 15 plataformas: TikTok, Instagram, YouTube, X, Facebook, Twitch, Kick, Discord, Threads, Snapchat, Pinterest, Reddit, Telegram, LinkedIn, Bluesky.
  - Perfil inmutable una vez confirmado para prevenir fraudes e identidad duplicada.
  - Solicitud formal de corrección con revisión por moderación.

- **Batallas Culturales de Creadores**:
  - Arena comunitaria en vivo para creadores de alto prestigio.
  - Verificación asistida de capturas y revisión humana obligatoria (Sección 29 y 31).

- **Ranking Ponderado Antifraude**:
  - Algoritmo de puntuación por calidad, estrellas y antigüedad, neutralizando el spam.

- **Centro de Seguridad y Privacidad**:
  - Soporte para 2FA (TOTP con Google Authenticator / Authy).
  - Eliminación segura y anonimización de datos (RGPD / Privacy-first).

- **Panel Administrativo Central**:
  - Métricas operativas en tiempo real.
  - Cola de eventos de riesgo antifraude (detección de colusión circular A-B).
  - Registro inmutable de auditoría (*append-only*).

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion.
- **Backend & Database**: Supabase (PostgreSQL 15+, Row Level Security, Realtime Presence).
- **Iconos**: Lucide React.

---

## 🚀 Despliegue Rápido y Desarrollo Local

### 1. Clonar e Instalar Dependencias

```bash
git clone https://github.com/olasocial/app.git
cd app
npm install
```

### 2. Variables de Entorno

Copia el archivo de ejemplo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Configura tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### 4. Build de Producción

```bash
npm run build
```

Los archivos estáticos generados se ubicarán en `/dist`.

---

## 📄 Documentación Técnica de Producción

Consulte los manuales específicos para la operación y auditoría del sistema:

- **Arquitectura Global:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Seguridad y RLS:** [`SECURITY.md`](./SECURITY.md)
- **Base de Datos y Procedimientos:** [`DATABASE.md`](./DATABASE.md)
- **Flujo de Autenticación Supabase Auth:** [`AUTH_FLOW.md`](./AUTH_FLOW.md)
- **Doble Factor de Autenticación (2FA TOTP):** [`MFA.md`](./MFA.md)
- **Sistema Real de Invitaciones:** [`INVITATIONS.md`](./INVITATIONS.md)
- **Reporte de Auditoría y Limpieza Supabase:** [`SUPABASE_CLEANUP_AUDIT.md`](./SUPABASE_CLEANUP_AUDIT.md)
- **Guía de Limpieza y Mantenimiento:** [`SUPABASE_CLEANUP.md`](./SUPABASE_CLEANUP.md)
- **Verificación Humana Cloudflare Turnstile:** [`TURNSTILE.md`](./TURNSTILE.md)
- **Esquema SQL Oficial:** [`supabase_schema.sql`](./supabase_schema.sql)

---

## ⚖️ Licencia y Cumplimiento

Este software prohíbe terminantemente la simulación artificial de métricas, el scraping invasivo y cualquier automatización de interacciones en plataformas de terceros. Todos los datos mostrados proceden de interacciones humanas voluntarias verificadas.
