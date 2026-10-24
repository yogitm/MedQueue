const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

class AuthController {
  /**
   * POST /api/auth/login
   * Autentikasi dokter/tenaga medis
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password wajib diisi.'
        });
      }

      // Cari user berdasarkan username
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah. Akses dashboard khusus dokter dan tenaga medis.'
        });
      }

      // Verifikasi password
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah. Akses dashboard khusus dokter dan tenaga medis.'
        });
      }

      // Generate JWT Token (Aktif selama 24 jam)
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role,
          sip: user.sip
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: `Selamat datang kembali, ${user.nama}.`,
        token,
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role,
          sip: user.sip
        }
      });
    } catch (error) {
      console.error('Error on AuthController.login:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server saat proses login dokter.',
        error: error.message
      });
    }
  }

  /**
   * GET /api/auth/me
   * Ambil data profil dokter yang sedang login
   */
  static async getMe(req, res) {
    try {
      const user = db.prepare('SELECT id, username, nama, role, sip, created_at FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Data dokter tidak ditemukan.'
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error on AuthController.getMe:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat profil dokter.',
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Sesi dokter berhasil diakhiri.'
    });
  }
}

module.exports = AuthController;
