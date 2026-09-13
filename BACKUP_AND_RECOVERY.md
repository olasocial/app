# OLA SOCIAL — Estrategia de Backup y Recuperación (2026)

## 1. Principio Fundamental
Conforme a la Sección 45 del Prompt Maestro, no se realizan promesas falsas de cifrados locales. La arquitectura se fundamenta en las capacidades enterprise de Supabase y PostgreSQL:
- Respaldos diarios automáticos gestionados por Supabase con Point-in-Time Recovery (PITR).
- Almacenamiento en caliente y copias en frío geodistribuidas.
- Claves maestras y variables privadas excluidas del repositorio y del frontend.

## 2. Tablas Inmutables (Append-Only)
- `admin_audit_log`
- `task_verifications`
- `security_events`
- `fraud_events`

## 3. Plan de Restauración
1. Aislar el tráfico de la API temporalmente.
2. Ejecutar snapshot verificado de PostgreSQL.
3. Validar integridad de las políticas RLS antes de reabrir el tráfico público.
