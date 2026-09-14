# OLA SOCIAL — ESPECIFICACIÓN DE BASE DE DATOS Y PERSISTENCIA (SUPABASE POSTGRESQL)

## 1. ARQUITECTURA DE INTEGRIDAD

El sistema de persistencia de OLA SOCIAL se ejecuta sobre **Supabase PostgreSQL 15+** con un estricto modelo de **Row Level Security (RLS)** y control de integridad referencial.

### Principios Fundamentales:
1. **Identidad Autorizada:** `auth.users` es la autoridad canónica. La tabla `public.profiles` referencia a `auth.users(id)` mediante clave foránea en cascada (`ON DELETE CASCADE`).
2. **Cero Duplicados:**
   - `email` es estrictamente único en `profiles`.
   - `(platform, LOWER(username))` es único en `social_profiles` para impedir la usurpación de cuentas de terceros.
   - `invite_code` es único en `profiles`.
   - Idempotencia en tareas mediante clave única o validación por disparador.
3. **Inmutabilidad Administrativa:**
   - La cuenta `v19629049@gmail.com` está protegida por el disparador `protect_super_admin` que bloquea su degradación de rol o eliminación, incluso ante sentencias directas.
4. **Auditoría Append-Only:**
   - Las operaciones sensibles se graban en `admin_audit_log`, tabla que prohíbe `UPDATE` y `DELETE` mediante RLS.

---

## 2. ESQUEMA DE TABLAS PRINCIPALES

### 2.1 `public.profiles`
| Columna | Tipo | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `REFERENCES auth.users(id)` | Identificador del usuario. |
| `email` | `TEXT` | `UNIQUE`, `NOT NULL` | Correo electrónico validado. |
| `display_name` | `TEXT` | `NOT NULL` | Nombre público del creador. |
| `username` | `TEXT` | `UNIQUE`, `NOT NULL` | Handle único en OLA SOCIAL. |
| `avatar_url` | `TEXT` | | Foto de perfil. |
| `role` | `TEXT` | Default `'USER'` | Roles: `USER`, `VERIFIED_USER`, `MODERATOR`, `SUPPORT`, `ADMIN`, `SUPER_ADMIN`. |
| `status` | `TEXT` | Default `'ACTIVE'` | Estados: `ACTIVE`, `LIMITED`, `SUSPENDED`, `BANNED`, `DELETED`. |
| `reputation` | `NUMERIC(5,2)` | Default `75.00` | Puntuación ponderada calculada. |
| `hugs_done` | `INT` | Default `0` | Cantidad de apoyos otorgados. |
| `hugs_received` | `INT` | Default `0` | Cantidad de apoyos recibidos. |
| `hugs_verified` | `INT` | Default `0` | Cantidad de apoyos confirmados por la contraparte. |
| `stars_count` | `INT` | Default `0` | Total de estrellas acumuladas. |
| `rating_avg` | `NUMERIC(3,2)` | Default `5.00` | Promedio de calificaciones recibidas. |
| `invite_code` | `TEXT` | `UNIQUE` | Código único para referir a otros creadores. |
| `invited_by` | `UUID` | `REFERENCES profiles(id)` | Identificador del usuario referente. |
| `is_18_confirmed`| `BOOLEAN` | Default `FALSE` | Declaración jurada de mayoría de edad. |
| `mfa_enabled` | `BOOLEAN` | Default `FALSE` | Indicador de 2FA TOTP activado. |

### 2.2 `public.social_profiles`
Redes sociales enlazadas por el creador. Una vez validadas y activas, quedan bloqueadas (*LOCKED*) para garantizar confianza.
- Clave única: `UNIQUE(platform, username)`
- Relación: `user_id REFERENCES profiles(id) ON DELETE CASCADE`

### 2.3 `public.campaigns` y `public.campaign_tasks`
- **`campaigns`**: Publicaciones de canales/videos que buscan apoyo genuino.
- **`campaign_tasks`**: Unidades de interacción para otros creadores. Incluyen temporizador de expiración de reserva (20 minutos) para evitar bloqueos fraudulentos.

### 2.4 `public.invitations`
- Registra el uso de códigos de invitación con fecha, estado (`pending`, `registered`, `active`), y reputación otorgada.
- Previene auto-invitaciones mediante restricción `CHECK (inviter_user_id <> invited_user_id)`.

### 2.5 `public.admin_audit_log`
- Registro inmutable de eventos de auditoría administrativa. RLS permite únicamente `INSERT` para funciones y `SELECT` para administradores.

---

## 3. PROCEDIMIENTO `cleanup_audit()`

Permite diagnosticar la salud e integridad de los datos sin ejecutar borrados a ciegas:

```sql
SELECT * FROM public.cleanup_audit();
```

Reporta:
- Huérfanos en `profiles`, `campaign_tasks`, `invitations`, `notifications`.
- Intentos de auto-invitación.
- Cuentas con correos identificados como patrones de prueba (`@example.com`).

---

## 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)

Todas las tablas cuentan con RLS activado (`ENABLE ROW LEVEL SECURITY`):
- Los usuarios solo pueden modificar sus propios perfiles (`auth.uid() = id`).
- Las campañas son de lectura pública pero solo el creador puede editarlas.
- Los registros de fraude y auditoría solo son legibles por usuarios con rol `ADMIN` o `SUPER_ADMIN` validado a través de la función de base de datos `public.is_admin(auth.uid())`.
