const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public route: Login Dokter
router.post('/login', AuthController.login);

// Protected route: Ambil data akun dokter yang sedang login
router.get('/me', authMiddleware, AuthController.getMe);

// Logout dokter
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
