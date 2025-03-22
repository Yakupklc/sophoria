// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    // Eski `image` alanını koruyor, ama artık zorunlu değil (geriye dönük uyumluluk için)
    image: {
        type: String
    },
    // Yeni `images` alanı - resim dizisi
    images: [{
        type: String
    }],
    // Ana görsel için ayrı alan (opsiyonel)
    mainImage: {
        type: String
    },
    category: {
        type: String,
        required: true,
        enum: ['Elektronik', 'Giyim', 'Ev & Yaşam', 'Kitap', 'Spor', 'Kozmetik', 'Gıda', 'Diğer']
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    features: [{
        title: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    shipping: {
        isFree: {
            type: Boolean,
            default: false
        },
        time: {
            type: String,
            default: "2-3 iş günü"
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0,
            min: 0
        },
        sales: {
            type: Number,
            default: 0,
            min: 0
        },
        favorites: {
            type: Number,
            default: 0,
            min: 0
        }
    }
}, {
    timestamps: true
});

// Kaydetmeden önce çalışacak validator
productSchema.pre('validate', function(next) {
    // Eğer images boşsa ve image doluysa, image'i images'a ekle
    if ((!this.images || this.images.length === 0) && this.image) {
        this.images = [this.image];
    }
    
    // Eğer images doluysa ama mainImage yoksa, ilk resmi mainImage olarak ayarla
    if (this.images && this.images.length > 0 && !this.mainImage) {
        this.mainImage = this.images[0];
    }
    
    // Eğer image yoksa ama images varsa, ilk images'ı image olarak ayarla (geriye dönük uyumluluk)
    if (!this.image && this.images && this.images.length > 0) {
        this.image = this.images[0];
    }
    
    next();
});

// Ürün silindiğinde ilgili yorumları da sil
productSchema.pre('remove', async function(next) {
    try {
        await mongoose.model('Review').deleteMany({ productId: this._id });
        next();
    } catch (error) {
        next(error);
    }
});

// Ürün güncellendiğinde stats'ları kontrol et
productSchema.pre('save', function(next) {
    // Negatif değerleri engelle
    if (this.stats) {
        this.stats.views = Math.max(0, this.stats.views);
        this.stats.sales = Math.max(0, this.stats.sales);
        this.stats.favorites = Math.max(0, this.stats.favorites);
    }
    
    // Rating değerlerini kontrol et
    if (this.rating) {
        this.rating.average = Math.min(5, Math.max(0, this.rating.average));
        this.rating.count = Math.max(0, this.rating.count);
    }

    next();
});

module.exports = mongoose.model('Product', productSchema);