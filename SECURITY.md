# OLA SOCIAL — Políticas de Seguridad y Control de Acceso (2026)

## 1. Identidad y Autorización
- **Autenticación**: Supabase Auth mediante Google OAuth.
- **Segundo Factor (2FA)**: Soporte TOTP compatible con Google Authenticator y Authy.
- **Administrador Inicial**: Correo oficial registrado `v19629049@gmail.com` con rol `SUPER_ADMIN`.

## 2. Row Level Security (RLS)
- Cada consulta en PostgreSQL es evaluada a nivel de fila.
- `service_role_key` y secretos de API nunca se exponen al navegador.

## 3. Prevención de Abusos
- Bloqueo automático de autovalidación.
- Restricción única normalizada: `platform::username` para evitar perfiles duplicados.
- Límites de frecuencia y detección de colusión entre cuentas afines.
