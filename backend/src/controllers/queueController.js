const db = require('../config/database');

/**
 * Controller untuk mengelola antrean klinik/puskesmas
 */
class QueueController {
  /**
   * POST /api/antrean
   * Mendaftar antrean baru (Pasien Mandiri / Resepsionis)
   */
  static async registerQueue(req, res) {
    try {
      const { nama, nomor_identitas, keluhan } = req.body;

      // Validasi Input
      if (!nama || !nomor_identitas) {
        return res.status(400).json({
          success: false,
          message: 'Nama dan Nomor Identitas (NIK) wajib diisi.'
        });
      }

      // Gunakan transaksi SQLite untuk menjaga integritas data
      const registerTransaction = db.transaction(() => {
        // 1. Cek keberadaan pasien berdasarkan nomor_identitas
        let patient = db
          .prepare('SELECT * FROM patients WHERE nomor_identitas = ?')
          .get(nomor_identitas);

        let patientId;
        if (!patient) {
          // Buat pasien baru
          const insertPatient = db.prepare(`
            INSERT INTO patients (nama, nomor_identitas, keluhan_utama)
            VALUES (?, ?, ?)
          `);
          const result = insertPatient.run(nama, nomor_identitas, keluhan || null);
          patientId = result.lastInsertRowid;
        } else {
          patientId = patient.id;
          // Perbarui nama atau keluhan jika ada perubahan
          db.prepare(`
            UPDATE patients
            SET nama = ?, keluhan_utama = ?
            WHERE id = ?
          `).run(nama, keluhan || patient.keluhan_utama, patientId);
        }

        // 2. Generate Nomor Antrean Hari Ini (Format: A-001, A-002, ...)
        // Hitung total antrean hari ini berdasarkan tanggal lokal
        const countToday = db.prepare(`
          SELECT COUNT(*) as total 
          FROM queues 
          WHERE date(waktu_daftar, 'localtime') = date('now', 'localtime')
        `).get().total;

        const nextSequence = countToday + 1;
        const nomorAntrean = `A-${String(nextSequence).padStart(3, '0')}`;

        // 3. Simpan ke tabel queues
        const insertQueue = db.prepare(`
          INSERT INTO queues (patient_id, nomor_antrean, status)
          VALUES (?, ?, 'menunggu')
        `);
        const queueResult = insertQueue.run(patientId, nomorAntrean);

        // Ambil data lengkap antrean yang baru dibuat
        const newQueue = db.prepare(`
          SELECT 
            q.id,
            q.nomor_antrean,
            q.status,
            q.waktu_daftar,
            p.id as patient_id,
            p.nama,
            p.nomor_identitas,
            p.keluhan_utama
          FROM queues q
          JOIN patients p ON q.patient_id = p.id
          WHERE q.id = ?
        `).get(queueResult.lastInsertRowid);

        return newQueue;
      });

      const queueData = registerTransaction();

      return res.status(201).json({
        success: true,
        message: 'Nomor antrean berhasil didaftarkan.',
        data: queueData
      });
    } catch (error) {
      console.error('Error on registerQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server saat mendaftarkan antrean.',
        error: error.message
      });
    }
  }

  /**
   * GET /api/antrean/aktif
   * Mengambil 1 data antrean dengan status 'dipanggil' terbaru untuk Layar Ruang Tunggu
   */
  static async getActiveQueue(req, res) {
    try {
      const activeQueue = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.waktu_daftar,
          p.id as patient_id,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.status = 'dipanggil'
        ORDER BY q.id DESC
        LIMIT 1
      `).get();

      return res.status(200).json({
        success: true,
        data: activeQueue || null,
        message: activeQueue 
          ? 'Antrean aktif berhasil diambil.' 
          : 'Belum ada antrean yang sedang dipanggil.'
      });
    } catch (error) {
      console.error('Error on getActiveQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat antrean aktif.',
        error: error.message
      });
    }
  }

  /**
   * GET /api/antrean
   * Mengambil seluruh antrean berstatus 'menunggu' dan 'dipanggil' untuk Dashboard Dokter/Admin
   */
  static async getAllQueues(req, res) {
    try {
      const queues = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.waktu_daftar,
          p.id as patient_id,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.status IN ('menunggu', 'dipanggil')
        ORDER BY 
          CASE q.status 
            WHEN 'dipanggil' THEN 1 
            WHEN 'menunggu' THEN 2 
            ELSE 3 
          END,
          q.id ASC
      `).all();

      return res.status(200).json({
        success: true,
        count: queues.length,
        data: queues
      });
    } catch (error) {
      console.error('Error on getAllQueues:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat daftar antrean.',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/antrean/:id/panggil
   * Mengubah status antrean spesifik menjadi 'dipanggil'
   */
  static async callQueue(req, res) {
    try {
      const { id } = req.params;

      const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: `Antrean dengan ID ${id} tidak ditemukan.`
        });
      }

      // Opsional: Anda bisa mengubah status antrean yang sebelumnya 'dipanggil' menjadi 'menunggu' kembali atau membiarkan
      // Update status menjadi 'dipanggil'
      db.prepare(`
        UPDATE queues 
        SET status = 'dipanggil' 
        WHERE id = ?
      `).run(id);

      const updatedQueue = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.waktu_daftar,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.id = ?
      `).get(id);

      return res.status(200).json({
        success: true,
        message: `Antrean ${updatedQueue.nomor_antrean} berhasil dipanggil.`,
        data: updatedQueue
      });
    } catch (error) {
      console.error('Error on callQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memanggil antrean.',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/antrean/:id/selesai
   * Mengubah status antrean menjadi 'selesai' dan mencatat diagnosa serta tindakan/resep dokter
   */
  static async finishQueue(req, res) {
    try {
      const { id } = req.params;
      const { diagnosa, tindakan_resep } = req.body || {};

      const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: `Antrean dengan ID ${id} tidak ditemukan.`
        });
      }

      db.prepare(`
        UPDATE queues 
        SET status = 'selesai',
            diagnosa = ?,
            tindakan_resep = ?,
            waktu_selesai = datetime('now', 'localtime')
        WHERE id = ?
      `).run(diagnosa || null, tindakan_resep || null, id);

      const updated = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.diagnosa,
          q.tindakan_resep,
          q.waktu_daftar,
          q.waktu_selesai,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.id = ?
      `).get(id);

      return res.status(200).json({
        success: true,
        message: `Antrean ${queue.nomor_antrean} telah selesai diperiksa. Rekam medis tersimpan.`,
        data: updated
      });
    } catch (error) {
      console.error('Error on finishQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyelesaikan antrean.',
        error: error.message
      });
    }
  }

  /**
   * GET /api/rekam-medis
   * Mengambil seluruh daftar pasien yang sudah selesai diperiksa (Rekam Medis)
   */
  static async getCompletedQueues(req, res) {
    try {
      const records = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.diagnosa,
          q.tindakan_resep,
          q.waktu_daftar,
          q.waktu_selesai,
          p.id as patient_id,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.status = 'selesai'
        ORDER BY coalesce(q.waktu_selesai, q.waktu_daftar) DESC, q.id DESC
      `).all();

      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (error) {
      console.error('Error on getCompletedQueues:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat daftar rekam medis.',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/rekam-medis/:id
   * Memperbarui catatan diagnosa dan tindakan/resep pasien
   */
  static async updateMedicalRecord(req, res) {
    try {
      const { id } = req.params;
      const { diagnosa, tindakan_resep } = req.body;

      const record = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Data rekam medis ID ${id} tidak ditemukan.`
        });
      }

      db.prepare(`
        UPDATE queues
        SET diagnosa = ?,
            tindakan_resep = ?
        WHERE id = ?
      `).run(diagnosa || null, tindakan_resep || null, id);

      return res.status(200).json({
        success: true,
        message: 'Rekam medis berhasil diperbarui.'
      });
    } catch (error) {
      console.error('Error on updateMedicalRecord:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui rekam medis.',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/antrean/:id
   * Menghapus antrean aktif (Pasien batal, salah pendaftaran, dll)
   */
  static async deleteQueue(req, res) {
    try {
      const { id } = req.params;

      const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: `Antrean dengan ID ${id} tidak ditemukan.`
        });
      }

      db.prepare('DELETE FROM queues WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: `Antrean ${queue.nomor_antrean} berhasil dihapus dari sistem.`
      });
    } catch (error) {
      console.error('Error on deleteQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus antrean.',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/antrean/:id
   * Memperbarui informasi antrean / pasien aktif (Nama, NIK, Keluhan)
   */
  static async updateQueue(req, res) {
    try {
      const { id } = req.params;
      const { nama, nomor_identitas, keluhan } = req.body;

      const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: `Antrean dengan ID ${id} tidak ditemukan.`
        });
      }

      // Update data pada tabel patients
      if (nama || nomor_identitas || keluhan !== undefined) {
        db.prepare(`
          UPDATE patients 
          SET nama = coalesce(?, nama),
              nomor_identitas = coalesce(?, nomor_identitas),
              keluhan_utama = coalesce(?, keluhan_utama)
          WHERE id = ?
        `).run(nama || null, nomor_identitas || null, keluhan !== undefined ? keluhan : null, queue.patient_id);
      }

      const updated = db.prepare(`
        SELECT 
          q.id,
          q.nomor_antrean,
          q.status,
          q.waktu_daftar,
          p.id as patient_id,
          p.nama,
          p.nomor_identitas,
          p.keluhan_utama
        FROM queues q
        JOIN patients p ON q.patient_id = p.id
        WHERE q.id = ?
      `).get(id);

      return res.status(200).json({
        success: true,
        message: `Data antrean ${queue.nomor_antrean} berhasil diperbarui.`,
        data: updated
      });
    } catch (error) {
      console.error('Error on updateQueue:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data antrean.',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/rekam-medis/:id
   * Menghapus catatan rekam medis pasien yang sudah selesai
   */
  static async deleteMedicalRecord(req, res) {
    try {
      const { id } = req.params;

      const record = db.prepare("SELECT * FROM queues WHERE id = ? AND status = 'selesai'").get(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Data rekam medis ID ${id} tidak ditemukan.`
        });
      }

      db.prepare('DELETE FROM queues WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: `Rekam medis antrean ${record.nomor_antrean} berhasil dihapus.`
      });
    } catch (error) {
      console.error('Error on deleteMedicalRecord:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus rekam medis.',
        error: error.message
      });
    }
  }
}

module.exports = QueueController;
