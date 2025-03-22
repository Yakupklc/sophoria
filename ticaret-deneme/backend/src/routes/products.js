// src/routes/products.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Product = require('../models/Product');
const {
  getAllProducts,
  getProductById,
  getUserProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Product routes
router.get('/', getAllProducts);
router.get('/user', auth, getUserProducts);
router.get('/:id', getProductById);
router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

// Review routes
router.get('/:id/reviews', async (req, res) => {
  try {
    console.log('Fetching reviews for product:', req.params.id);
    const reviews = await Review.find({ productId: req.params.id })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    console.log('Found reviews:', reviews.length);
    res.json(reviews);
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ message: 'Yorumlar getirilirken bir hata oluştu' });
  }
});

// Yeni ürün ekleme rotası (çoklu resimli)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, images, image, category, stock, features, shipping } = req.body;
    
    // Temel alan kontrolü
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Lütfen zorunlu alanları doldurun (isim, açıklama, fiyat, kategori)' });
    }
    
    // Resim kontrolü - en az bir resim gerekli (images veya image)
    if ((!images || images.length === 0) && !image) {
      return res.status(400).json({ message: 'En az bir ürün fotoğrafı gereklidir' });
    }
    
    // Yeni ürün oluştur
    const newProduct = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: stock || 0,
      userId: req.user._id,
      features: features || [],
      shipping: shipping || { isFree: false, time: "2-3 iş günü" }
    });
    
    // Resimleri ayarla
    if (images && images.length > 0) {
      newProduct.images = images;
      newProduct.mainImage = images[0];
      // Geriye dönük uyumluluk için
      newProduct.image = images[0];
    } else if (image) {
      newProduct.image = image;
      newProduct.images = [image];
      newProduct.mainImage = image;
    }
    
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    res.status(500).json({ message: 'Ürün eklenirken bir hata oluştu' });
  }
});

// Ürün güncelleme rotası (çoklu resimli)
router.put('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;
    
    // Ürünü bul
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    // Ürünün sahibi olduğunu kontrol et
    if (product.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu ürünü düzenleme yetkiniz yok' });
    }
    
    // Güncellenebilecek alanlar
    const allowedUpdates = [
      'name', 'description', 'price', 'category', 
      'stock', 'features', 'shipping', 'images', 'image', 'mainImage'
    ];
    
    // Özel resim işlemleri
    if (updates.images && updates.images.length > 0) {
      product.images = updates.images;
      product.mainImage = updates.mainImage || updates.images[0];
      product.image = updates.images[0]; // Geriye dönük uyumluluk
    } else if (updates.image && (!product.images || product.images.length === 0)) {
      product.image = updates.image;
      product.images = [updates.image];
      product.mainImage = updates.image;
    }
    
    // Diğer alanları güncelle
    for (const key of Object.keys(updates)) {
      if (allowedUpdates.includes(key) && key !== 'images' && key !== 'image' && key !== 'mainImage') {
        product[key] = updates[key];
      }
    }
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({ message: 'Ürün güncellenirken bir hata oluştu' });
  }
});

// Stok güncelleme endpointi
router.patch('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Yeni stok miktarını güncelle
    if (req.body.stock !== undefined) {
      product.stock = req.body.stock;
      await product.save();
    }

    res.json(product);
  } catch (error) {
    console.error('Stok güncelleme hatası:', error);
    res.status(500).json({ message: 'Stok güncellenirken bir hata oluştu' });
  }
});

// Yorum silme
router.delete('/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }

    await review.deleteOne();

    // Ürünün ortalama puanını güncelle
    const reviews = await Review.find({ productId: req.params.id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await Product.findByIdAndUpdate(req.params.id, {
      'rating.average': averageRating,
      'rating.count': reviews.length
    });

    res.json({ message: 'Yorum başarıyla silindi' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ message: 'Yorum silinirken bir hata oluştu' });
  }
});

module.exports = router;