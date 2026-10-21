const express = require('express');
const router = express.Router();
const QueueController = require('../controllers/queueController');

// 1. Pendaftaran antrean baru (Pasien)
router.post('/antrean', QueueController.registerQueue);

// 2. Mengambil 1 data antrean dengan status 'dipanggil' terbaru (Layar Ruang Tunggu)
// Catatan: Rute ini diletakkan sebelum /antrean/:id agar tidak bentrok dengan parameter id
router.get('/antrean/aktif', QueueController.getActiveQueue);

// 3. Mengambil seluruh daftar antrean berstatus 'menunggu' dan 'dipanggil' (Dashboard Dokter)
router.get('/antrean', QueueController.getAllQueues);

// 4. Mengubah status antrean menjadi 'dipanggil'
router.put('/antrean/:id/panggil', QueueController.callQueue);

// 5. Mengubah status antrean menjadi 'selesai'
router.put('/antrean/:id/selesai', QueueController.finishQueue);

// 6. Memperbarui informasi antrean / pasien aktif (Nama, NIK, Keluhan)
router.put('/antrean/:id', QueueController.updateQueue);

// 7. Menghapus antrean aktif (Cancel / Delete)
router.delete('/antrean/:id', QueueController.deleteQueue);

// 8. Mengambil seluruh daftar antrean berstatus 'selesai' (Rekam Medis)
router.get('/rekam-medis', QueueController.getCompletedQueues);

// 9. Memperbarui catatan diagnosa dan resep rekam medis
router.put('/rekam-medis/:id', QueueController.updateMedicalRecord);

// 10. Menghapus data rekam medis
router.delete('/rekam-medis/:id', QueueController.deleteMedicalRecord);

module.exports = router;
