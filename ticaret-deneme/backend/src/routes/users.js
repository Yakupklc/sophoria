const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/userController');
const User = require('../models/User');
const Product = require('../models/Product');

// Giriş yapmış kullanıcının bilgilerini getir
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('username email');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı' });
  }
});

// Auth gerektiren route'lar
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

// Public route - Satıcı profili
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcının tüm ürünlerini bul
    const products = await Product.find({ userId: req.params.id });
    
    // İstatistikleri hesapla
    const stats = {
      productCount: products.length,
      totalSales: products.reduce((total, product) => total + (product.stats?.sales || 0), 0),
      averageRating: 0,
      totalReviews: 0
    };

    // Ortalama puanı hesapla
    const productsWithRating = products.filter(product => product.rating?.average > 0);
    if (productsWithRating.length > 0) {
      stats.averageRating = productsWithRating.reduce((total, product) => 
        total + product.rating.average, 0) / productsWithRating.length;
      stats.totalReviews = productsWithRating.reduce((total, product) => 
        total + (product.rating?.count || 0), 0);
    }

    // Yanıt olarak kullanıcı bilgileri ve istatistikleri gönder
    res.json({
      _id: user._id,
      username: user.username,
      joinDate: user.createdAt || user._id.getTimestamp(),
      stats: stats
    });
  } catch (error) {
    console.error('Satıcı profili getirme hatası:', error);
    res.status(500).json({
      message: 'Satıcı bilgileri getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;