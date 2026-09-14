# OLA SOCIAL — SISTEMA REAL DE INVITACIONES Y ATRIBUCIÓN

## 1. PROPÓSITO DEL SISTEMA

En OLA SOCIAL, el crecimiento se basa en comunidades auténticas de creadores. El sistema de invitaciones permite a cada usuario invitar a otros creadores, atribuir transparentemente el origen de cada registro y premiar la reputación de forma limpia, **sin bots ni enlaces piramidales falsos**.

---

## 2. GENERACIÓN DE CÓDIGO ÚNICO DE INVITACIÓN

Cada perfil creado en la plataforma cuenta con un código alfanumérico único derivado de su nombre o generado por el sistema (ej: `VCTOR196`, `ALEX772`):
- Almacenado en `public.profiles.invite_code` con restricción de unicidad (`UNIQUE`).
- El enlace oficial de invitación adopta la estructura:
  ```
  https://olasocial.github.io/app/#/?ref=CODIGO_UNICO
  ```

---

## 3. ATRIBUCIÓN DE INVITACIÓN Y REGLAS ANTIFRAUDE

Al momento del registro de un nuevo usuario con un parámetro `?ref=...`:

1. **Búsqueda del emisor:** Se consulta la base de datos para localizar el perfil dueño del código.
2. **Prevención de auto-invitación:**
   ```ts
   if (inviterProfile.id === newUserId) {
     return { success: false, message: 'No es posible auto-invitarse' };
   }
   ```
3. **Registro en `public.invitations`:**
   Se crea una fila con:
   - `inviter_user_id`: ID del anfitrión.
   - `invited_user_id`: ID del nuevo creador registrado.
   - `invite_code`: Código utilizado.
   - `status`: `'registered'`.
   - `created_at`: Marca temporal ISO.
4. **Vínculo en perfil:** Se asigna `invited_by = inviterProfile.id` en el perfil del usuario recién registrado.

---

## 4. IMPACTO EN REPUTACIÓN Y CONDICIONES DE VALIDACIÓN

- Un registro por invitación **no** otorga reputación masiva inmediata; esto previene granjas de bots creadas para inflar puntuaciones.
- Los puntos de reputación por invitación se liberan de forma escalonada únicamente cuando el nuevo usuario completa sus primeros **3 abrazos válidos** a otros creadores y confirma su mayoría de edad.
- Esto garantiza que solo las invitaciones que aportan actividad humana real contribuyan al ranking de "Top Invitadores".

---

## 5. SUPERVISIÓN ADMINISTRATIVA

El panel de administración (`AdminPanel.tsx`) y las funciones de base de datos permiten:
- Consultar el historial completo de invitaciones en `public.invitations`.
- Detectar anomalías o bucles circulares (Usuario A invita a Usuario B y viceversa con la misma IP o red social).
- Anular invitaciones fraudulentas mediante el registro inmutable de auditoría.
