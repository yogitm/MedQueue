require('dotenv').config();
const express = require('express');
const cors = require('cors');
const queueRoutes = require('./routes/queueRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Pada tahap produksi, ganti dengan domain frontend yang diizinkan
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging sederhana untuk request masuk
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Sistem Manajemen Antrean Puskesmas/Klinik API',
    version: '1.0.0',
    documentation: '/api/antrean'
  });
});

// Routing API
app.use('/api', queueRoutes);

// 404 Handler untuk rute yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan.`
  });
});

// Global Error Handler (Selalu kembalikan response JSON)
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Jalankan Server hanya jika file ini dieksekusi langsung
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di: http://localhost:${PORT}`);
    console.log(`📡 Endpoints aktif:`);
    console.log(`   - POST http://localhost:${PORT}/api/antrean`);
    console.log(`   - GET  http://localhost:${PORT}/api/antrean/aktif`);
    console.log(`   - GET  http://localhost:${PORT}/api/antrean`);
    console.log(`   - PUT  http://localhost:${PORT}/api/antrean/:id/panggil`);
    console.log(`   - PUT  http://localhost:${PORT}/api/antrean/:id/selesai`);
  });
}

module.exports = app;
