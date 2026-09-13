#!/usr/bin/env bash
set -e

COMMIT_MSG="${1:-Update OLA SOCIAL webapp $(date +'%Y-%m-%d %H:%M:%S')}"

echo "🔄 Preparando sincronización con GitHub olasocial/app..."
git add .
git commit -m "$COMMIT_MSG" || echo "Sin cambios nuevos para commitear."

echo "🚀 Intentando push hacia https://github.com/olasocial/app.git (main)..."
if git push origin main 2>&1; then
  echo "✅ Código sincronizado exitosamente con https://github.com/olasocial/app"
  echo "📡 GitHub Actions iniciará el build y deploy en https://olasocial.github.io/app/"
else
  echo ""
  echo "⚠️ ATENCIÓN: No se pudo realizar el push automático por falta de credenciales de GitHub en esta terminal."
  echo "👉 Para publicar los cambios:"
  echo "   Opción A: Usa el menú 'Export to GitHub' / 'Push to GitHub' de Google AI Studio (arriba a la derecha)."
  echo "   Opción B: En tu terminal local con acceso a GitHub, ejecuta: git push origin main"
fi
