pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        SONARQUBE_URL = 'http://sonarqube:9000'
        SONARQUBE_PROJECT_KEY = 'pokedex-pwa'
        SONARQUBE_PROJECT_NAME = 'Pokédex PWA'
        VERCEL_ORG_ID = credentials('vercel-org-id')
        VERCEL_PROJECT_ID = credentials('vercel-project-id')
    }

    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Rama detectada: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📦 Instalando dependencias..."
                sh 'npm ci'
            }
        }

        stage('Unit Tests') {
            steps {
                echo "🧪 Ejecutando tests unitarios..."
                sh 'npm test -- --coverage --watchAll=false'
            }
            post {
                always {
                    publishCoverage adapters: [istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')]
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "🔍 Ejecutando análisis SonarQube..."
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=${SONARQUBE_PROJECT_KEY} \
                        -Dsonar.projectName="${SONARQUBE_PROJECT_NAME}" \
                        -Dsonar.projectVersion=1.0.0 \
                        -Dsonar.sources=src \
                        -Dsonar.tests=src \
                        -Dsonar.test.inclusions=**/*.test.js \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.host.url=${SONARQUBE_URL} \
                        -Dsonar.login=${SONAR_AUTH_TOKEN}
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo "🚦 Esperando resultado del Quality Gate..."
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo "🔨 Construyendo aplicación..."
                sh 'npm run build'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo "🚀 Desplegando a producción (Vercel)..."
                withCredentials([string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN')]) {
                    sh '''
                        # Configurar Vercel CLI
                        vercel link --project ${VERCEL_PROJECT_ID} --org ${VERCEL_ORG_ID} --yes
                        vercel pull --yes
                        vercel build --prod
                        vercel deploy --prebuilt --prod --token=${VERCEL_TOKEN}
                    '''
                }
            }
            post {
                success {
                    echo "✅ Despliegue exitoso a producción"
                    script {
                        def deploymentUrl = sh(script: 'vercel --token=${VERCEL_TOKEN} ls | grep Production | head -1 | awk \'{print $3}\'', returnStdout: true).trim()
                        echo "🌐 URL de producción: ${deploymentUrl}"
                        currentBuild.description = "Production URL: ${deploymentUrl}"
                    }
                }
                failure {
                    echo "❌ Error en el despliegue"
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Limpiando workspace..."
            cleanWs()
        }
        success {
            echo "✅ Pipeline completado exitosamente"
            script {
                if (env.BRANCH_NAME == 'develop') {
                    echo "📋 Rama develop: Tests y análisis completados. Listo para merge a main."
                } else if (env.BRANCH_NAME == 'main') {
                    echo "🎉 Rama main: Despliegue a producción completado."
                }
            }
        }
        failure {
            echo "❌ Pipeline falló"
            script {
                if (env.BRANCH_NAME == 'develop') {
                    echo "🔴 Rama develop: Corregir errores antes de hacer merge a main."
                }
            }
        }
    }
}