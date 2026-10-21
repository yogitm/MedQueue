pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {
        stage('1. Environment Inspection') {
            steps {
                echo '=== Memeriksa Lingkungan Runtime ==='
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('2. Install Backend Dependencies') {
            steps {
                echo '=== Menginstal dependensi Backend ==='
                dir('backend') {
                    sh 'npm install'
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

        stage('4. Install Frontend Dependencies') {
            steps {
                echo '=== Menginstal dependensi Frontend ==='
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('5. Frontend Production Build') {
            steps {
                echo '=== Membangun Bundle Produksi Frontend (Vite) ==='
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('6. Deployment / Artifact Archiving') {
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
            echo '✅ Deployment Pipeline Berhasil! Seluruh pengujian dan proses build lulus.'
        }
        failure {
            echo '❌ Pipeline Gagal! Silakan periksa log pengujian atau build di atas.'
        }
    }
}
