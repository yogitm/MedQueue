const express = require('express');
const router = express.Router();
const QueueController = require('../controllers/queueController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ==========================================
// RUTE PUBLIK (Dapat diakses Pasien & Monitor TV)
// ==========================================

// 1. Pendaftaran antrean baru (Pasien Mandiri / Resepsionis)
router.post('/antrean', QueueController.registerQueue);

// 2. Mengambil antrean aktif terbaru (Layar Monitor Ruang Tunggu)
// Diletakkan sebelum parameter :id agar tidak bentrok
router.get('/antrean/aktif', QueueController.getActiveQueue);

// ==========================================
// RUTE KHUSUS DOKTER & TENAGA MEDIS (Terproteksi Autentikasi)
// Pasien tidak diizinkan mengakses pemanggilan & rekam medis
// ==========================================

// 3. Mengambil seluruh daftar antrean berstatus 'menunggu' dan 'dipanggil' (Dashboard Dokter)
router.get('/antrean', authMiddleware, QueueController.getAllQueues);

// 4. Mengubah status antrean menjadi 'dipanggil' (Pemanggilan Pasien oleh Dokter)
router.put('/antrean/:id/panggil', authMiddleware, QueueController.callQueue);

// 5. Mengubah status antrean menjadi 'selesai' & mencatat diagnosa serta resep
router.put('/antrean/:id/selesai', authMiddleware, QueueController.finishQueue);

// 6. Memperbarui informasi antrean / pasien aktif
router.put('/antrean/:id', authMiddleware, QueueController.updateQueue);

// 7. Menghapus antrean aktif (Batalkan antrean)
router.delete('/antrean/:id', authMiddleware, QueueController.deleteQueue);

// 8. Mengambil seluruh daftar pasien yang telah diperiksa (Rekam Medis)
router.get('/rekam-medis', authMiddleware, QueueController.getCompletedQueues);

// 9. Memperbarui catatan diagnosa dan resep rekam medis
router.put('/rekam-medis/:id', authMiddleware, QueueController.updateMedicalRecord);

// 10. Menghapus data rekam medis
router.delete('/rekam-medis/:id', authMiddleware, QueueController.deleteMedicalRecord);

module.exports = router;

