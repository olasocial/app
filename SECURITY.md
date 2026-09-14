# OLA SOCIAL — Seguridad, Modelo de Amenazas y Políticas de Acceso (2026)

## 1. Política de Divulgación Responsable de Vulnerabilidades (Responsible Disclosure)

OLA SOCIAL mantiene un compromiso activo con la seguridad de su plataforma comunitaria y la privacidad de sus creadores.

- **Canal de Reporte de Seguridad:** Si descubre una vulnerabilidad técnica, reporte los detalles confidencialmente a `security@olasocial.example` (o mediante un Security Advisory privado en el repositorio oficial de GitHub).
- **Proceso de Evaluación:** Las alertas de seguridad son evaluadas de forma prioritaria por los operadores de seguridad antes de cualquier publicación.
- **Compromiso de No Represalias:** No se emprenderán acciones contra investigadores que actúen de buena fe, respeten la privacidad de los usuarios y no interrumpan los servicios en producción.

---

## 2. Autoridad de Identidad y Autenticación

- **Proveedor Único de Identidad:** Supabase Auth utilizando exclusivamente **Google OAuth**.
- **Supresión de Credenciales Débiles:** Se han erradicado del sistema los formularios de correo/contraseña y registros sin verificación federada, eliminando riesgos de relleno de credenciales (*credential stuffing*), fuerza bruta o almacenamiento inseguro de hashes.
- **Operadores Administrativos Autorizados:** El acceso a facultades de `SUPER_ADMIN` y moderación global está reservado a operadores administrativos autorizados (`Authorized administrative operators`), verificado criptográficamente por `auth.uid()` y reforzado mediante disparadores inmutables de base de datos (`protect_super_admin`).
- **Rotación y Revocación de Sesiones:** Soporte nativo para cierre remoto de sesiones activas en dispositivos no confiables mediante `supabase.auth.signOut({ scope: 'others' })`.

---

## 3. Autenticación de Dos Factores (MFA TOTP)

- **Estándar Criptográfico:** RFC 6238 (HMAC-based One-Time Password) implementado nativamente mediante el motor criptográfico de Supabase Auth MFA.
- **Niveles de Aseguramiento (AAL):**
  - **AAL1:** Sesión base autenticada vía Google OAuth.
  - **AAL2:** Sesión reforzada con segundo factor de autenticación TOTP verificado. Obligatorio para operadores administrativos antes de interactuar con el panel de administración o modificar configuraciones comunitarias sensibles.
- **Códigos de Emergencia:** Códigos alfanuméricos de un solo uso generados localmente al completar el enrolamiento, recomendados para resguardo en almacenamiento offline.

---

## 4. Control de Acceso y Seguridad a Nivel de Filas (PostgreSQL RLS)

Todas las tablas en la base de datos de producción aplican de manera obligatoria **Row Level Security (RLS)**:

- **`public.profiles`:**
  - `SELECT`: Público para usuarios autenticados para permitir rankings comunitarios e identificación de creadores.
  - `UPDATE`: Restringido estrictamente al propietario del registro (`auth.uid() = id`). Los campos críticos de seguridad (`role`, `is_banned`, `reputation`) solo pueden ser modificados por funciones con `SECURITY DEFINER` y operadores autorizados.
  - `DELETE`: Prohibido para cuentas administrativas protegidas mediante el disparador de base de datos `protect_super_admin`.
- **`public.tasks` y `public.campaigns`:**
  - Asignación, reserva y validación auditadas por ID de usuario y expiración temporal (20 minutos) para evitar monopolización o bloqueo deliberado.
- **`public.invitations`:**
  - Visible únicamente para el usuario emisor (`referrer_id = auth.uid()`) y operadores de auditoría.
- **`public.admin_audit_log`:**
  - Registro inmutable (*append-only*). Las políticas RLS deniegan explícitamente operaciones `UPDATE` y `DELETE`.

---

## 5. Gestión de Secretos y Separación Cliente / Servidor

- **Principio de Mínimo Privilegio en Frontend:**
  - El cliente frontend únicamente recibe la URL pública de Supabase (`VITE_SUPABASE_URL`), la clave pública anónima (`VITE_SUPABASE_ANON_KEY`) y la clave pública del widget Turnstile (`VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`).
  - La clave `anon` no otorga privilegios administrativos; todas sus consultas se filtran automáticamente mediante las políticas de PostgreSQL RLS.
- **Aislamiento de Claves Privadas:**
  - Las claves con privilegios elevados (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`, `GEMINI_API_KEY`) residen exclusivamente en Supabase Edge Functions y variables de entorno de servidor.
  - Queda estrictamente prohibida la presencia de claves de servicio o secretos privados en el código cliente frontend o en el repositorio Git.
- **Escaneo Continuo de Secretos en CI/CD:**
  - Cada commit y pull request es analizado automáticamente por pipelines de integración continua para detectar patrones de credenciales, claves de API o tokens antes de su compilación y despliegue.

---

## 6. Prevención de Bots, Automatizaciones y Colusión

- **Verificación Humana Cloudflare Turnstile:**
  - Compuerta antirobot no invasiva obligatoria previa al inicio de sesión federado.
  - Validación del token efectuada exclusivamente en backend mediante llamadas seguras a `challenges.cloudflare.com/turnstile/v0/siteverify`.
- **Detección de Colusión Circular:**
  - Algoritmos antifraude de base de datos identifican patrones simétricos y circulares (Usuario A <-> Usuario B) para neutralizar granjas de reciprocidad artificial.
- **Rate Limiting y Ventanas Temporales:**
  - Tiempos de espera mínimos entre interacciones, límites de reservas concurrentes y penalizaciones automáticas en el índice de reputación ante comportamientos anómalos.
