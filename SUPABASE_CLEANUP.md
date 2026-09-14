# OLA SOCIAL — GUÍA OPERATIVA DE LIMPIEZA Y MANTENIMIENTO DE SUPABASE

## 1. POLÍTICA DE CERO DATOS SIMULADOS

Está expresamente prohibido en el proyecto OLA SOCIAL:
1. Crear usuarios ficticios o cuentas *dummy*.
2. Inyectar estadísticas artificiales o contadores incrementados por temporizador (`Math.random()`).
3. Crear botones "demo", "simular", "fake" o "test user" en producción.
4. Mostrar números inflados que no coincidan con la base de datos real.

Si la base de datos contiene únicamente 2 creadores registrados, la aplicación mostrará con orgullo **2 usuarios**. La credibilidad de la comunidad depende de la veracidad de la información.

---

## 2. PROCEDIMIENTO DE AUDITORÍA REGULAR

Antes de realizar cualquier mantenimiento o depuración en Supabase:

1. Ejecutar el procedimiento de diagnóstico:
   ```sql
   SELECT * FROM public.cleanup_audit();
   ```
2. Revisar la salida categorizada:
   - **`REAL`**: Conservar intacto.
   - **`SIMULADO`**: Candidato a depuración previa confirmación.
   - **`PRUEBA`**: Cuentas de desarrollo candidatas a depuración.
    - **`DUDOSO`**: Requiere revisión manual de los operadores autorizados.

---

## 3. PROTOCOLO OBLIGATORIO DE RESPALDO (BACKUP)

Nunca ejecutar sentencias `DELETE` masivas sin respaldo previo:

```sql
-- 1. Crear instantánea de seguridad
CREATE TABLE backup_profiles_YYYYMMDD AS SELECT * FROM public.profiles;
CREATE TABLE backup_campaigns_YYYYMMDD AS SELECT * FROM public.campaigns;
CREATE TABLE backup_tasks_YYYYMMDD AS SELECT * FROM public.campaign_tasks;

-- 2. Anotar cantidad de filas respaldadas
SELECT count(*) FROM backup_profiles_YYYYMMDD;

-- 3. Proceder a la depuración selectiva
DELETE FROM public.profiles 
WHERE (email ILIKE '%@example.com' OR email ILIKE '%dummy%')
  AND role != 'SUPER_ADMIN';
```

---

## 4. INTEGRIDAD DE CUENTAS PROTEGIDAS

- Las cuentas de administración (`Authorized administrative operators`) con rol `SUPER_ADMIN` están protegidas a nivel de base de datos por el trigger `protect_super_admin`.
- Intentar ejecutar un `DELETE` sobre dicha cuenta generará una excepción:
  `ERROR: Operación rechazada: La cuenta del Super Administrador principal está protegida contra eliminación.`

---

## 5. ESTADOS VACÍOS PROFESIONALES

En lugar de rellenar tablas vacías con datos ficticios, la interfaz de OLA SOCIAL implementa **estados vacíos profesionales**:
- Si no hay tareas de apoyo activas: *"No hay tareas de apoyo activas en este momento. Sé el primero en impulsar tu contenido creando una campaña comunitaria con apoyo real."*
- Si no hay usuarios conectados: Mostrar el número real actual (`0` o `1`).
- Si no hay alertas de fraude: *"Cero alertas de fraude pendientes. El sistema opera con normalidad y sin incidencias detectadas."*
- Si no hay registros de auditoría: *"No hay eventos en el registro de auditoría."*
