const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Product = require('../models/Product');

// Ürüne ait tüm yorumları getir
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    console.log('Yorumlar getiriliyor. Ürün ID:', req.params.productId);
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`${reviews.length} yorum bulundu`);
    res.json(reviews);
  } catch (error) {
    console.error('Yorumlar getirilirken hata:', error);
    res.status(500).json({ message: 'Yorumlar getirilirken bir hata oluştu' });
  }
});

// Kullanıcının yorum yapabilirliğini kontrol et
router.get('/products/:productId/reviews/eligibility', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    
    // Kullanıcının daha önce yorum yapıp yapmadığını kontrol et
    const existingReview = await Review.findOne({
      productId: productId,
      userId: userId
    });
    
    res.json({
      canReview: !existingReview,
      message: existingReview ? "Bu ürün için zaten bir yorum yapmışsınız" : null
    });
  } catch (error) {
    console.error('Yorum eligibility kontrol hatası:', error);
    res.status(500).json({
      canReview: false,
      message: "Yorum durumu kontrol edilirken bir hata oluştu"
    });
  }
});

// Yeni yorum ekle
router.post('/products/:productId/reviews', auth, async (req, res) => {
  try {
    console.log('Yeni yorum ekleniyor:', {
      productId: req.params.productId,
      userId: req.user._id,
      rating: req.body.rating
    });

    // Kullanıcının daha önce yorum yapıp yapmadığını kontrol et
    const existingReview = await Review.findOne({
      productId: req.params.productId,
      userId: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({
        message: 'Bu ürün için zaten bir yorum yapmışsınız'
      });
    }

    // Ürünün var olup olmadığını kontrol et
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Yeni yorumu oluştur
    const review = new Review({
      productId: req.params.productId,
      userId: req.user._id,
      rating: Number(req.body.rating), // Sayıya dönüştürdüğünüzden emin olun
      comment: req.body.comment
    });

    const savedReview = await review.save();
    console.log('Yorum başarıyla kaydedildi. Review ID:', savedReview._id);

    // ÖNEMLİ: Ürünün rating değerlerini güncelle
    await updateProductRating(req.params.productId);

    // Kullanıcı bilgileriyle birlikte yanıt dön
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'username');

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Yorum eklenirken hata oluştu' });
  }
});

// Yorum silme
router.delete('/products/:productId/reviews/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }

    await review.deleteOne();
    console.log(`Yorum silindi. Review ID: ${req.params.reviewId}`);

    // ÖNEMLİ: Ürünün rating değerlerini güncelle
    await updateProductRating(req.params.productId);

    res.json({ message: 'Yorum başarıyla silindi' });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    res.status(500).json({ message: 'Yorum silinirken bir hata oluştu' });
  }
});

// Helper function: Ürün rating değerlerini güncelleme
async function updateProductRating(productId) {
  try {
    console.log(`Rating güncelleniyor. Ürün ID: ${productId}`);
    
    // Tüm yorumları getir
    const reviews = await Review.find({ productId: productId });
    console.log(`Ürün için ${reviews.length} yorum bulundu`);
    
    // Ortalama puanı hesapla
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
      averageRating = totalRating / reviews.length;
    }
    
    console.log('Hesaplanan yeni rating değerleri:', {
      average: averageRating,
      count: reviews.length
    });
    
    // Ürünü güncelle
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        'rating.average': averageRating,
        'rating.count': reviews.length
      },
      { new: true }
    );
    
    if (!updatedProduct) {
      throw new Error('Ürün güncellenirken hata: Ürün bulunamadı');
    }
    
    console.log('Ürün rating güncellendi:', updatedProduct.rating);
    return updatedProduct;
  } catch (error) {
    console.error('Rating güncelleme hatası:', error);
    throw error;
  }
}

module.exports = router;