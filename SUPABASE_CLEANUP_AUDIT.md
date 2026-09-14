# OLA SOCIAL — REPORTE TÉCNICO DE AUDITORÍA Y LIMPIEZA SUPABASE

**Fecha de Auditoría:** 13 de Septiembre de 2026  
**Entorno Objetivo:** Supabase Production (`ocyjnplyywvctqikjrrh.supabase.co`)  
**Política Operativa:** Cero Datos Simulados — Conservación Irrestricta de Datos Reales  
**Administradores Protegidos:** `Authorized administrative operators` (`SUPER_ADMIN`)

---

## 1. PRINCIPIO RECTOR Y CLASIFICACIÓN DE DATOS

Conforme a las directivas de OLA SOCIAL, ningún dato es eliminado sin categorización previa, evaluación de impacto y respaldo (*backup*). Los datos auditados se clasifican estrictamente en una de las cuatro categorías:

| Clasificación | Definición Operativa | Acción Permitida |
| :--- | :--- | :--- |
| **REAL** | Creado por un usuario legítimo registrado a través de Supabase Auth, o configuración operativa crítica. | **CONSERVAR SIEMPRE**. Prohibida su eliminación. |
| **SIMULADO** | Datos generados mediante algoritmos, scripts de seeding, bucles automáticos o datos mock. | **ELIMINAR**. Reemplazar por estado vacío profesional o consulta real. |
| **PRUEBA** | Creado expresamente con fines de test en desarrollo/staging (ej: cuentas `@example.com`). | **ELIMINAR** previa confirmación y backup. |
| **DUDOSO** | Registros inconsistentes o desalineados que requieren revisión humana del administrador. | **NO ELIMINAR AUTOMÁTICAMENTE**. Notificar a los operadores administrativos. |

---

## 2. INVENTARIO Y AUDITORÍA TABLA POR TABLA

### 2.1 Tabla `auth.users`
- **Función:** Autoridad absoluta de identidad de OLA SOCIAL.
- **Registros Auditados:**
  - Cuentas de Super Administrador -> **REAL** (Protegidas por triggers inmutables).
  - Usuarios registrados mediante Google OAuth -> **REAL** (Conservar con integridad referencial).
  - Cuentas con dominio `@example.com` o identificadas como testing -> **PRUEBA** (Candidatas a depuración tras verificación).

### 2.2 Tabla `public.profiles`
- **Función:** Perfiles de comunidad, estadísticas de abrazos, reputación y nivel.
- **Auditoría:**
  - Perfiles de administración autorizados -> **REAL** (Preservar íntegramente).
  - Registros importados anteriormente desde `seedData.ts` (ej: `@marcos_musica`, `@elena_art`, etc.) -> **SIMULADO**.
  - *Acción ejecutada:* `src/data/seedData.ts` ha sido **eliminado** del código fuente. Las variables en memoria de `OlaSocialContext.tsx` ahora se inicializan en arrays vacíos `[]` y se nutren exclusivamente de consultas a `public.profiles` y `public.campaigns`.
  - Estadísticas derivadas: El conteo de usuarios online ahora responde a Supabase Realtime Presence y el conteo de usuarios registrados a la cantidad exacta de filas en `profiles`. Si existen 0 creadores, la interfaz presenta el estado vacío profesional.

### 2.3 Tabla `public.social_profiles`
- **Función:** Enlaces a plataformas de redes sociales vinculadas por los creadores.
- **Auditoría:**
  - Registros de usuarios reales vinculando sus redes oficiales -> **REAL**.
  - Redes asignadas por fixtures estáticos de seed -> **SIMULADO** (Depuradas del contexto cliente).
  - Restricciones activas: Índice único `(platform, LOWER(username))` para evitar que dos usuarios reclamen el mismo perfil en una red externa.

### 2.4 Tabla `public.campaigns` y `public.campaign_tasks`
- **Función:** Campañas de apoyo mutuo ("Abrazos") y tareas de acción comunitaria.
- **Auditoría:**
  - Inicialización estática previa (`INITIAL_COMMUNITY_CAMPAIGNS`, `INITIAL_COMMUNITY_TASKS`) -> **SIMULADO**.
  - *Estado actual:* 100% desvinculado de datos mock. Todas las campañas y tareas en el Lobby provienen de `supabase.from('campaigns').select('*')`. Si la base no tiene campañas, se exhibe el mensaje: *"No hay tareas de apoyo activas en este momento. Sé el primero en impulsar tu contenido creando una campaña comunitaria con apoyo real."*

### 2.5 Tabla `public.invitations`
- **Función:** Trazabilidad del sistema de invitaciones con códigos únicos (ej: `VCTOR196`).
- **Auditoría:**
  - Invitaciones vinculadas a usuarios reales -> **REAL**.
  - Registros donde `inviter_user_id = invited_user_id` -> **SIMULADO / COLUSIÓN** (Identificados por `cleanup_audit()`, sujetos a depuración).
  - Invitaciones huérfanas sin perfil emisor -> **PRUEBA** (Depuración segura).

### 2.6 Tablas de Reputación, Niveles y Badges
- **Tablas:** `experience_ledger`, `reputation_events`, `support_verifications`, `badges`, `user_badges`.
- **Auditoría:**
  - Eventos generados por validación humana de abrazos -> **REAL**.
  - Puntuaciones aleatorias (`Math.random()`) -> **ELIMINADAS** de todo el código de la aplicación.
  - El cálculo de reputación ahora se ejecuta según la fórmula matemática ponderada oficial descrita en `ARCHITECTURE.md`.

---

## 3. PROCEDIMIENTO ALMACENADO: `cleanup_audit()`

Para auditar en cualquier momento la base de datos de producción sin ejecutar acciones destructivas involuntarias, se ha implementado en PostgreSQL la función `cleanup_audit()`:

```sql
-- Ejecución desde el SQL Editor de Supabase:
SELECT * FROM public.cleanup_audit();
```

### Categorías de detección:
1. **`ORPHAN_PROFILE`** (`DUDOSO`): Perfiles sin correspondencia en `auth.users`.
2. **`TEST_ACCOUNT`** (`PRUEBA`): Cuentas con correos `@example.com` o patrones de test (excluyendo al super admin).
3. **`ORPHAN_INVITATION`** (`PRUEBA`): Invitaciones huérfanas sin emisor.
4. **`ORPHAN_NOTIFICATION`** (`PRUEBA`): Notificaciones dirigidas a IDs eliminados.
5. **`SELF_INVITATION`** (`SIMULADO`): Intentos de auto-invitación para ganar puntos ilegítimamente.
6. **`ORPHAN_TASK`** (`PRUEBA`): Tareas cuya campaña asociada ha sido borrada.

---

## 4. PROTOCOLO OBLIGATORIO DE BACKUP ANTES DE DEPURACIÓN

Antes de ejecutar cualquier sentencia `DELETE` sobre registros marcados como `SIMULADO` o `PRUEBA`:

1. **Crear tabla de respaldo con timestamp:**
   ```sql
   CREATE TABLE backup_profiles_20260913 AS SELECT * FROM public.profiles;
   CREATE TABLE backup_campaigns_20260913 AS SELECT * FROM public.campaigns;
   CREATE TABLE backup_tasks_20260913 AS SELECT * FROM public.campaign_tasks;
   CREATE TABLE backup_invitations_20260913 AS SELECT * FROM public.invitations;
   ```
2. **Registrar checksum y conteo:**
   ```sql
   SELECT count(*), md5(array_agg(id::text order by id)::text) FROM public.profiles;
   ```
3. **Ejecutar depuración selectiva únicamente de clasificaciones `SIMULADO` y `PRUEBA`:**
   ```sql
   -- Ejemplo para cuentas de test identificadas
   DELETE FROM public.profiles 
   WHERE (email ILIKE '%@example.com' OR email ILIKE '%test%@%') 
     AND role != 'SUPER_ADMIN';
   ```
4. **Registrar la operación en el registro inmutable `admin_audit_log`:**
   ```sql
   INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
   VALUES (
     auth.uid(),
     'admin@olasocial.example',
     'CLEANUP_EXECUTION',
     'DATABASE',
     'ALL_SIMULATED',
     'Depuración clasificada conforme a SUPABASE_CLEANUP_AUDIT.md con backup previo'
   );
   ```

---

## 5. RESUMEN DE SEGURIDAD

- **Cero pérdida de datos reales:** Los registros legítimos de usuarios, reputación comprobada e interacciones válidas se preservan al 100%.
- **Super Administradores Protegidos:** Las cuentas autorizadas cuentan con disparadores `BEFORE UPDATE OR DELETE` que impiden la pérdida de su rol o eliminación accidental.
- **Frontend Limpio:** Desaparecieron completamente los datos ficticios y mensajes de depuración en la interfaz.
