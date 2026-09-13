# OLA SOCIAL — Arquitectura Tecnológica y Cumplimiento de Plataforma (2026)

## 1. Visión General
OLA SOCIAL es una plataforma de descubrimiento y apoyo mutuo entre creadores y usuarios de diversas redes sociales basada en el principio de "Abrazos que conectan personas".

## 2. Regla Fundamental de Cumplimiento (Section 2)
- **Cero Bots**: Queda estrictamente prohibido cualquier mecanismo automatizado para simular o inflar métricas externas (likes, seguidores, visualizaciones).
- **Interacciones Humanas y Voluntarias**: Todas las acciones se realizan mediante enlaces oficiales a las plataformas externas donde el usuario interactúa conscientemente.
- **Sin Credenciales Externas**: No se almacenan cookies, sesiones ni contraseñas de terceros.

## 3. Capa de Adaptadores (SocialPlatformAdapter)
Soporta inicialmente 15 redes sociales:
- TikTok, Instagram, YouTube, X, Facebook, Twitch, Kick, Threads, Snapchat, Discord, Telegram, LinkedIn, Pinterest, Reddit, Bluesky.
- Cada plataforma mantiene un estado explícito de API (`SUPPORTED_API`, `LIMITED_API`, `PUBLIC_PROFILE_ONLY`, `MANUAL_VERIFICATION`).
- Si una red no provee API oficial de métricas, el sistema muestra con transparencia: *"Información no disponible mediante API oficial"*.

## 4. Stack Técnico
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion.
- **Backend & Database**: Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth con Google OAuth, Realtime Presence y Notificaciones).
- **Despliegue**: Vercel / GitHub Actions / Cloud Run.

## 5. Antifraude y Reputación
- Detección de colusión circular (A <-> B).
- Límites de frecuencia horarios y diarios (Rate Limit Engine).
- Calificación ponderada en base a valoraciones auténticas (1 a 5 estrellas).
