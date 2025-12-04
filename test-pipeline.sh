#!/bin/bash

# Script para probar el pipeline completo
echo "🧪 PRUEBA COMPLETA DEL PIPELINE CI/CD"
echo "===================================="

REPO_URL="https://github.com/Blxckbxll24/pokedexPWA.git"

echo "📋 Verificación previa al test:"
echo ""

# Verificar servicios
echo "🔍 Servicios:"
if [ -f "./check-services.sh" ]; then
    ./check-services.sh
else
    echo "   check-services.sh no encontrado"
fi

echo ""
echo "📊 Estado de configuración:"

# Verificar SonarQube
echo -n "SonarQube Quality Gate: "
if ./verify-sonarqube.sh > /dev/null 2>&1; then
    echo "✅ Configurado"
else
    echo "❌ Pendiente configuración"
fi

# Verificar credenciales Jenkins (básico)
echo -n "Jenkins accesible: "
if curl -s http://localhost:8090 > /dev/null; then
    echo "✅ OK"
else
    echo "❌ No responde"
fi

echo ""
echo "🚀 INSTRUCCIONES PARA PRUEBA DEL PIPELINE:"
echo ""
echo "1. 🌿 PRUEBA EN RAMA DEVELOP (sin despliegue):"
echo "   git checkout -b develop"
echo "   # Hacer un cambio pequeño"
echo "   echo '// Test change' >> src/App.js"
echo "   git add . && git commit -m 'test: pipeline develop'"
echo "   git push origin develop"
echo ""
echo "2. 👁️ VERIFICAR EN JENKINS:"
echo "   - Ve a: http://localhost:8090"
echo "   - El job 'pokedex-pwa-pipeline' debería ejecutarse"
echo "   - Debería: Instalar deps → Tests → SonarQube → Quality Gate"
echo "   - Estado esperado: ✅ SUCCESS (sin despliegue)"
echo ""
echo "3. 🚀 PRUEBA EN RAMA MAIN (con despliegue):"
echo "   git checkout main"
echo "   git merge develop"
echo "   git push origin main"
echo ""
echo "4. 📊 VERIFICAR RESULTADO COMPLETO:"
echo "   - Jenkins: Tests + SonarQube + Deploy ✅"
echo "   - Vercel: Nueva URL de producción generada"
echo "   - SonarQube: Análisis completado"
echo ""
echo "5. 🎯 VERIFICACIÓN FINAL:"
echo "   - PWA funciona offline"
echo "   - Notificaciones push operativas"
echo "   - URL de producción accesible"
echo ""
echo "📞 Si hay errores:"
echo "   - Ver logs en Jenkins: http://localhost:8090/job/pokedex-pwa-pipeline/lastBuild/console"
echo "   - Ver logs SonarQube: docker-compose logs sonarqube"
echo "   - Verificar credenciales de Vercel"
echo ""
echo "🎉 ¡TU PIPELINE CI/CD ESTÁ LISTO PARA DEMOSTRACIÓN!"