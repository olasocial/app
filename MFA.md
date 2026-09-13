# OLA SOCIAL — AUTENTICACIÓN DE DOBLE FACTOR (2FA / MFA TOTP)

## 1. VISIÓN GENERAL

OLA SOCIAL implementa autenticación multifactor estándar de la industria basada en contraseñas de un solo uso por tiempo (**TOTP — Time-based One-Time Password**, RFC 6238), soportada de forma nativa por el motor criptográfico de Supabase Auth.

Permite a los creadores y especialmente al personal administrativo asegurar sus cuentas frente a suplantaciones de identidad.

---

## 2. NIVELES DE GARANTÍA DE AUTENTICACIÓN (AAL)

Conforme a las directivas de seguridad de Supabase Auth:

| Nivel | Descripción | Requisito en OLA SOCIAL |
| :--- | :--- | :--- |
| **`aal1`** | Autenticación con un solo factor (Google OAuth o Contraseña). | Acceso estándar de lectura para usuarios generales. |
| **`aal2`** | Autenticación reforzada con segundo factor (TOTP verificado). | **Requerido** para el acceso al Panel Administrativo de Producción y cambios críticos de perfil social. |

---

## 3. FLUJO DE ENROLAMIENTO (ENROLLMENT)

1. El usuario navega al **Centro de Seguridad**.
2. Al hacer clic en **"Configurar 2FA"**, la aplicación invoca:
   ```ts
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp',
     issuer: 'OLA SOCIAL',
     friendlyName: user.email
   });
   ```
3. Supabase retorna un secreto TOTP y un código QR codificado en SVG (`data.totp.qr_code`) o URI (`data.totp.uri`).
4. El usuario escanea el código en **Google Authenticator**, **Authy** o **1Password**.
5. Para confirmar la activación, el usuario ingresa un código de 6 dígitos:
   ```ts
   const { error } = await supabase.auth.mfa.challengeAndVerify({
     factorId: data.id,
     code: userSixDigitCode
   });
   ```
6. Al validarse exitosamente, el campo `mfa_enabled` del perfil se actualiza a `TRUE` y se graban los códigos de recuperación de emergencia cifrados.

---

## 4. FLUJO DE DESAFÍO Y VERIFICACIÓN EN SESIÓN (CHALLENGE)

Al iniciar una nueva sesión en un dispositivo no reconocido o al acceder a rutas de administración:
1. La aplicación comprueba el nivel actual con `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`.
2. Si `nextLevel === 'aal2'` pero `currentLevel === 'aal1'`, se despliega el modal de verificación 2FA.
3. Se genera un desafío con `supabase.auth.mfa.challenge({ factorId })`.
4. El usuario introduce el código TOTP de su app autenticadora.
5. Se completa la verificación con `supabase.auth.mfa.verify(...)`, elevando la sesión a `aal2`.

---

## 5. CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA

- Al completar el enrolamiento, se generan 8 códigos de respaldo alfanuméricos únicos.
- Se recomienda al creador guardarlos en un gestor de claves offline.
- Cada código de emergencia es de un solo uso para permitir la recuperación en caso de pérdida o extravío del dispositivo móvil.
