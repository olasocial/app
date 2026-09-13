# OLA SOCIAL — GUÍA DE CONFIGURACIÓN Y VERIFICACIÓN CLOUDFLARE TURNSTILE

## 1. OBJETIVO Y FILOSOFÍA

En OLA SOCIAL, la verificación humana protege a la comunidad contra granjas de bots, auto-validaciones masivas y ataques de denegación de servicio. 

La integración debe mantenerse limpia, profesional y libre de mensajes confusos como:
> *"Solo para pruebas. Si se ve, informe al propietario del sitio"*

---

## 2. ORIGEN DEL MENSAJE DE PRUEBA Y SU SOLUCIÓN DEFINITIVA

### ¿Por qué aparece dicho mensaje?
El mensaje *"Solo para pruebas. Si se ve, informe al propietario del sitio"* es generado **directamente dentro del iframe de Cloudflare** cuando el widget se inicializa con la clave de prueba pública de Cloudflare (`1x00000000000000000000AA`).

Cloudflare inyecta esta advertencia por diseño para alertar a los usuarios de que el sitio está usando credenciales de desarrollo.

### Solución en Producción:
Para que la interfaz de OLA SOCIAL quede 100% limpia y orientada a producción sin dicho mensaje:

1. **Crear el Widget de Producción en Cloudflare:**
   - Iniciar sesión en el [Panel de Cloudflare](https://dash.cloudflare.com/) -> **Turnstile**.
   - Hacer clic en **Add Widget** (Añadir Widget).
   - **Widget Name:** `OLA SOCIAL Production`
   - **Domains (Dominios Autorizados):**
     - `olasocial.github.io`
     - `localhost` (para pruebas locales seguras)
   - **Widget Mode:** `Managed` (recomendado) o `Non-interactive`.
2. **Obtener las Claves:**
   - **Site Key (Pública):** Empieza típicamente con `0x4AAAAAA...`
   - **Secret Key (Secreta):** Empieza típicamente con `0x4AAAAAA...`
3. **Configurar las Variables de Entorno:**
   - En el entorno de despliegue frontend (GitHub Pages Secrets / CI/CD):
     ```env
     VITE_TURNSTILE_SITE_KEY=0x4AAAAAA_TU_SITE_KEY_REAL
     ```
   - En Supabase Edge Functions (Secrets):
     ```bash
     supabase secrets set CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA_TU_SECRET_KEY_REAL
     ```

Una vez provista una Site Key de producción autorizada para el dominio `olasocial.github.io`, **Cloudflare suprime automáticamente el aviso de prueba** y muestra el sello oficial de verificación humana.

---

## 3. ARQUITECTURA DE VALIDACIÓN OBLIGATORIA EN BACKEND

Queda expresamente prohibido falsificar la verificación con mecanismos tipo:
```ts
// ❌ PROHIBIDO
if (token.length > 10) return { success: true };
```

En OLA SOCIAL, cada token debe ser comprobado contra el endpoint oficial de Cloudflare:
`https://challenges.cloudflare.com/turnstile/v0/siteverify`

### Flujo Oficial:
1. El usuario completa el captcha en el componente `<TurnstileWidget />`.
2. El widget invoca `verifyTurnstileTokenServerSide(token)`.
3. La función remite el token a la Edge Function `verify-turnstile` en Supabase (o middleware en dev).
4. El servidor realiza una petición POST segura con `secret` y `response`.
5. Si Cloudflare responde `{ success: true, challenge_ts, hostname }`, se autoriza la acción.
6. Si la respuesta es inválida o el token fue reutilizado, la acción es rechazada.

---

## 4. SOPORTE DE DESARROLLO LOCAL

Para permitir el desarrollo local sin exponer secretos en el repositorio:
- El archivo `vite.config.ts` incluye un middleware interno `/api/verify-turnstile` que valida con el endpoint de Cloudflare durante `npm run dev`.
- Si `VITE_TURNSTILE_SITE_KEY` no se especifica, el sistema usa el fallback de desarrollo para permitir iterar localmente, manteniendo el código de producción listo para recibir la clave real.
