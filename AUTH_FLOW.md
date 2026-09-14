# OLA SOCIAL — FLUJO DE AUTENTICACIÓN Y AUTORIDAD DE IDENTIDAD

## 1. AUTORIDAD ABSOLUTA: SUPABASE AUTH + GOOGLE OAUTH

En OLA SOCIAL, **Google OAuth a través de Supabase Auth** es el único método de autenticación permitido. Se han eliminado de la interfaz y del flujo los formularios de correo/contraseña, registros manuales y bypasses para garantizar la unicidad de perfiles reales.

```
+-------------------+        +--------------------+        +---------------------+
|   Usuario en Web  | -----> | Cloudflare Turnstile| -----> | Supabase Auth       |
| (Acceso Comunitario)       | (Validación Humana)|        | (Solo Google OAuth) |
+-------------------+        +--------------------+        +---------------------+
                                                                      |
                                                                      v
                                                           +---------------------+
                                                           | public.profiles     |
                                                           | (Perfil y Rol RLS)  |
                                                           +---------------------+
```

---

## 2. ETAPAS DEL FLUJO DE REGISTRO / INGRESO

### 2.1 Verificación Humana Previa (Turnstile)
1. Antes de iniciar el flujo de autenticación, el cliente resuelve el desafío de **Cloudflare Turnstile**.
2. El token generado se valida en el backend:
   - En producción: Mediante la Edge Function `verify-turnstile` que ejecuta `siteverify` directo a Cloudflare.
   - En entorno dev/local: Mediante middleware del servidor que igualmente consulta a Cloudflare.
3. **Cero Bypass:** Queda prohibido aceptar un token basado exclusivamente en su longitud o en parámetros de cliente sin comprobación del servidor.

### 2.2 Autenticación con Google OAuth
1. Se inicia con `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2. La redirección conserva la ruta base (`window.location.origin + window.location.pathname`), garantizando compatibilidad con GitHub Pages (`/app/#`).
3. Al retornar a la aplicación:
   - Se obtiene la sesión de `auth.users`.
   - Si no existe un perfil en `public.profiles`, se crea automáticamente mediante el trigger `on_auth_user_created` o la rutina de bootstrap.

### 2.3 Declaración Jurada de Mayoría de Edad (18+)
- OLA SOCIAL exige confirmación de mayoría de edad (`is_18_confirmed = true`) y aceptación de términos comunitarios antes de habilitar la interacción y publicación de campañas.

### 2.4 Vinculación de Códigos de Invitación
- Si el usuario ingresa mediante un enlace de referencia (ej: `?ref=VCTOR196`), el sistema verifica la existencia del código en `profiles` y le atribuye la invitación sin permitir auto-referidos.

---

## 3. ROL DE SUPER ADMINISTRADOR

El correo electrónico **`v19629049@gmail.com`** tiene asignado el rol **`SUPER_ADMIN`**.
- La verificación de privilegios se realiza tanto en frontend (`isAdmin`) como en backend mediante la función SQL `public.is_admin(auth.uid())` y un trigger protector `protect_super_admin` que impide que nadie pueda retirarle el rol o eliminar la cuenta.

---

## 4. PREVENCIÓN DE CUENTAS DUPLICADAS

1. **Unicidad de correo:** La base de datos impone `UNIQUE(email)` en `auth.users` y en `public.profiles`.
2. **Unicidad de usuario:** El nombre de usuario (`username`) no admite colisiones.
3. **Idempotencia de Redes Sociales:** Un perfil de red externa (ej: `instagram/@marcos`) solo puede estar vinculado a una cuenta a la vez (`UNIQUE(platform, LOWER(username))`).
