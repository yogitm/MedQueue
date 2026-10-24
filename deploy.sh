#!/bin/bash
# ==========================================
# MedQueue Deployment Script for Production
# ==========================================
set -e

echo "🚀 [1/4] Menarik perubahan kode terbaru dari GitHub..."
cd /opt/medqueue
git pull origin main

echo "📦 [2/4] Menginstal dependensi & me-restart backend..."
cd /opt/medqueue/backend
npm install --omit=dev
pkill -f 'node src/server.js' || true
echo "✓ Backend process restarted."

echo "🏗️ [3/4] Mengompilasi bundle produksi frontend..."
cd /opt/medqueue/frontend
npm install
npm run build

echo "✅ [4/4] Deployment selesai! Aplikasi MedQueue live di https://medqueue.yogitrim.my.id"
