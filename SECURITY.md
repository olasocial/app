# OLA SOCIAL — Políticas de Seguridad, Control de Acceso y Cumplimiento (2026)

## 1. Autoridad de Identidad y Autenticación
- **Autoridad Primaria:** Supabase Auth gestiona la autenticación, tokens JWT y niveles de aseguramiento (AAL).
- **One Email = One Account:** Un correo electrónico no puede estar asociado a múltiples identidades. Las solicitudes de registro con correos existentes devuelven un error específico y orientan al usuario al inicio de sesión.
- **Administrador Oficial:** El correo `v19629049@gmail.com` ostenta el rol de `SUPER_ADMIN`.
- **Rotación de Sesiones:** El cierre remoto de sesiones (`supabase.auth.signOut({ scope: 'others' })`) permite revocar el acceso a dispositivos comprometidos.

---

## 2. Autenticación de Dos Factores (MFA TOTP)
- **Estándar:** RFC 6238 (HMAC-based One-Time Password) implementado nativamente en Supabase Auth MFA.
- **Flujo de Seguridad:**
  1. El usuario solicita inscripción desde el Centro de Seguridad.
  2. Supabase Auth genera un secreto criptográfico y el código QR SVG correspondiente.
  3. El usuario ingresa un código de 6 dígitos para validar la sincronización de reloj antes de activar el factor.
  4. En los siguientes inicios de sesión con factor activo, el nivel de aseguramiento inicia en `aal1` y transiciona a `aal2` únicamente tras presentar un código TOTP válido.

---

## 3. Seguridad a Nivel de Filas (PostgreSQL Row Level Security - RLS)
- **`profiles`:**
  - `SELECT`: Público para todos los usuarios autenticados (necesario para rankings y comunidad).
  - `UPDATE`: Restringido exclusivamente al propietario (`auth.uid() = id`), excepto campos sensibles (`role`, `is_banned`, `reputation_score`) que solo pueden ser modificados por funciones de base de datos seguras o administradores.
- **`tasks`:**
  - `SELECT`: Tareas disponibles públicas para usuarios autenticados.
  - `UPDATE`: Asignación restringida al usuario que toma la tarea o al creador que la valida.
- **`invitations`:**
  - `SELECT`: Solo visible por el invitador (`referrer_id = auth.uid()`) y administradores.
  - `INSERT`: Gestionado por la función de registro; validación de no autoinvitación.

---

## 4. Protección de Secretos y Llaves
- **Anon Key:** La clave `anon` (`VITE_SUPABASE_ANON_KEY`) es la única expuesta al frontend. Tiene privilegios mínimos restringidos por RLS.
- **Service Role Key:** **NUNCA** se incluye ni se referencia en el código del cliente frontend.
- **Variables de Entorno:**
  - `.env.example` documenta todas las variables públicas y de backend requeridas sin exponer secretos reales.

---

## 5. Prevención de Bots y Abuso Comunitario
- **Cloudflare Turnstile:** Actúa como compuerta antirobot en los formularios de registro y autenticación.
- **Anti-Colusión:** Prohibición estricta de validaciones cruzadas simétricas o circulares entre cuentas afines.
- **Límites de Ritmo (Rate Limiting):** Restricciones de frecuencia temporal en la creación de campañas y ejecución de tareas para garantizar un comportamiento humano natural.
