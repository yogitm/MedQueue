pipeline {
    agent any

    stages {
        stage('1. Environment Inspection') {
            steps {
                echo '=== Memeriksa Lingkungan Runtime ==='
                sh 'node -v'
                sh 'npm -v'
                sh 'sonar-scanner -v'
            }
        }

        stage('2. Install Backend Dependencies') {
            steps {
                echo '=== Menginstal dependensi Backend ==='
                dir('backend') {
                    sh 'npm install --include=dev'
                }
            }
        }

        stage('3. Backend Testing') {
            steps {
                echo '=== Menjalankan Automated Test Backend (Node Test Runner) ==='
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('4. SonarQube Code Quality Analysis') {
            steps {
                echo '=== Menjalankan Analisis Kualitas Kode (SonarQube) ==='
                sh 'sonar-scanner -Dsonar.host.url=http://100.76.214.88:9001 -Dsonar.login=squ_663fa8497be6b5b67af74b8f214118e8fca7b695'
            }
        }

        stage('5. Install Frontend Dependencies') {
            steps {
                echo '=== Menginstal dependensi Frontend ==='
                dir('frontend') {
                    sh 'npm install --include=dev'
                }
            }
        }

        stage('6. Frontend Production Build') {
            steps {
                echo '=== Membangun Bundle Produksi Frontend (Vite) ==='
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('7. Deployment / Artifact Archiving') {
            steps {
                echo '=== Pengemasan Berhasil & Siap Dideploy ==='
                archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
            }
        }
    }

    post {
        always {
            echo 'Pipeline CI/CD selesai dieksekusi.'
        }
        success {
            echo '✅ Deployment Pipeline Berhasil! Seluruh pengujian, audit SonarQube, dan build lulus.'
        }
        failure {
            echo '❌ Pipeline Gagal! Silakan periksa log pengujian atau build di atas.'
        }
    }
}
