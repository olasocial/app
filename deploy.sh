#!/usr/bin/env bash
set -e

COMMIT_MSG="${1:-Update OLA SOCIAL webapp $(date +'%Y-%m-%d %H:%M:%S')}"

echo "🔄 Preparando sincronización con GitHub olasocial/app..."
git add .
git commit -m "$COMMIT_MSG" || echo "Sin cambios nuevos para commitear."
git push origin main

echo "✅ Código sincronizado exitosamente con https://github.com/olasocial/app"
