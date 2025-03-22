const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  forgotPassword, 
  verifyCode, 
  resetPassword,
  sendComplaint,
  testEmail 
} = require('../controllers/authController');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Şifre sıfırlama için doğrulama kodu gönderme
router.post('/forgot-password', forgotPassword);

// Doğrulama kodunu kontrol etme
router.post('/verify-code', verifyCode);

// Şifreyi sıfırla
router.post('/reset-password', resetPassword);

// Şikayet ve Öneri e-postası gönderme
router.post('/send-complaint', sendComplaint);

// Test e-postası gönderme (opsiyonel)
router.post('/test-email', testEmail);

module.exports = router;