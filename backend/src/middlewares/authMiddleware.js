const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medqueue_super_secret_jwt_key_2026';

/**
 * Middleware untuk memverifikasi autentikasi dokter / petugas
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token otentikasi dokter tidak ditemukan. Pasien tidak diizinkan mengakses menu ini.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token otentikasi tidak valid.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesi dokter telah kedaluwarsa atau token tidak valid. Silakan login kembali.',
      error: error.message
    });
  }
}

/**
 * Middleware untuk membatasi akses berdasarkan peran (Role-Based Access Control)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hak akses Anda tidak mencukupi untuk melakukan tindakan ini.'
      });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  JWT_SECRET
};
