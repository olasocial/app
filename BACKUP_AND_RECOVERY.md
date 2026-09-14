# OLA SOCIAL — Estrategia de Backup, Resiliencia y Recuperación (2026)

## 1. Principio de Resiliencia Operativa

La arquitectura de persistencia y continuidad de negocio de OLA SOCIAL se fundamenta en las capacidades enterprise de Supabase y PostgreSQL:
- Respaldos diarios automatizados gestionados por Supabase con Point-in-Time Recovery (PITR).
- Almacenamiento primario en caliente con réplicas de lectura y copias en frío geodistribuidas.
- Claves maestras, secretos y credenciales administrativas excluidas del código cliente y del repositorio Git.

---

## 2. Tablas Inmutables y Trazabilidad (Append-Only)

Para garantizar la inalterabilidad de los registros forenses y evitar manipulaciones en caso de incidentes:
- `public.admin_audit_log`
- `public.task_verifications`
- `public.security_events`
- `public.fraud_events`

Las políticas RLS impiden de manera estricta sentencias `UPDATE` y `DELETE` sobre estas tablas, permitiendo únicamente inserciones autorizadas.

---

## 3. Procedimiento de Restauración y Contingencia

1. **Aislamiento Temporal:** Conmutar el acceso frontend a modo mantenimiento si se detecta compromiso o corrupción de datos.
2. **Restauración PITR:** Desplegar el snapshot consistente verificado de PostgreSQL al punto temporal previo al incidente.
3. **Verificación de Políticas RLS:** Ejecutar la suite de pruebas de integridad (`npm test`) y verificar que todas las políticas de Row Level Security permanezcan activas y funcionales.
4. **Reanudación Segura:** Restablecer el tráfico público y documentar el evento en el registro inmutable de auditoría.

