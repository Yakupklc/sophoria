// src/controllers/productController.js

const Product = require("../models/Product");
const Review = require("../models/Review");

// Tüm ürünleri getir
exports.getAllProducts = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    const products = await Product.find(query).sort({ stock: -1 });
    console.log("Returned Products:", products); // userId var mı?
    res.json(products);
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ message: "Ürünler getirilirken hata oluştu" });
  }
};

// ID'ye göre ürün getir
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("userId", "username")
      .lean(); // Lean kullanarak saf JavaScript objesi al

    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    // Mevcut ürünler için uyumluluk sağla
    const safeProduct = {
      ...product,
      images: product.images || (product.image ? [product.image] : []),
      mainImage:
        product.mainImage ||
        product.image ||
        (product.images && product.images.length > 0
          ? product.images[0]
          : null),
    };

    // İstatistikleri güncelle (lean kullandığımız için ayrı bir işlem gerekiyor)
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { "stats.views": 1 },
    });

    res.json(safeProduct);
  } catch (error) {
    console.error("Get product by id error:", error);
    res.status(500).json({ message: "Ürün getirilirken bir hata oluştu" });
  }
};

// Kullanıcının kendi ürünlerini getir
exports.getUserProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    console.error("Get user products error:", error);
    res
      .status(500)
      .json({ message: "Ürünleriniz getirilirken bir hata oluştu" });
  }
};

// Yeni ürün oluştur (çoklu resim destekli)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images,
      image,
      category,
      stock,
      features,
      shipping,
    } = req.body;

    // Temel alan kontrolü
    if (!name || !price || !category) {
      // description kontrolünü kaldırın
      return res
        .status(400)
        .json({
          message: "Lütfen zorunlu alanları doldurun (isim, fiyat, kategori)",
        });
    }

    // Resim kontrolü - en az bir resim gerekli (images veya image)
    if ((!images || images.length === 0) && !image) {
      return res
        .status(400)
        .json({ message: "En az bir ürün fotoğrafı gereklidir" });
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
      shipping: shipping || { isFree: false, time: "2-3 iş günü" },
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
    console.error("Create product error:", error);
    res.status(500).json({ message: "Ürün eklenirken bir hata oluştu" });
  }
};

// Ürün güncelleme (çoklu resim destekli)
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    // Ürünü bul
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    // Ürünün sahibi olduğunu kontrol et
    if (
      product.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bu ürünü düzenleme yetkiniz yok" });
    }

    // Güncellenebilecek alanlar
    const allowedUpdates = [
      "name",
      "description",
      "price",
      "category",
      "stock",
      "features",
      "shipping",
      "images",
      "image",
      "mainImage",
    ];

    // Özel resim işlemleri
    if (updates.images && updates.images.length > 0) {
      product.images = updates.images;
      product.mainImage = updates.mainImage || updates.images[0];
      product.image = updates.images[0]; // Geriye dönük uyumluluk
    } else if (
      updates.image &&
      (!product.images || product.images.length === 0)
    ) {
      product.image = updates.image;
      product.images = [updates.image];
      product.mainImage = updates.image;
    }

    // Diğer alanları güncelle
    for (const key of Object.keys(updates)) {
      if (
        allowedUpdates.includes(key) &&
        key !== "images" &&
        key !== "image" &&
        key !== "mainImage"
      ) {
        product[key] = updates[key];
      }
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Ürün güncellenirken bir hata oluştu" });
  }
};

// Ürün silme
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    // Ürünün sahibi olduğunu kontrol et
    if (
      product.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Bu ürünü silme yetkiniz yok" });
    }

    // İlgili yorumları sil
    await Review.deleteMany({ productId: req.params.id });

    // Ürünü sil
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Ürün başarıyla silindi" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Ürün silinirken bir hata oluştu" });
  }
};
