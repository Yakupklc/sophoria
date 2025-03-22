import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Upload,
  AlertCircle,
  Trash2,
} from "lucide-react";
import "./ProductForm.css";

const ProductForm = ({
  initialProduct,
  onSubmit,
  onCancel,
  buttonText = "Ürünü Ekle",
}) => {
  const [product, setProduct] = useState(initialProduct || {
    name: "",
    price: "",
    description: "",
    image: "", // Geriye dönük uyumluluk için
    images: [],
    category: "",
    stock: "",
    features: [],
    shipping: {
      isFree: false,
      time: "2-3 iş günü",
    },
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState(
    product.images?.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : []
  );
  const [darkMode, setDarkMode] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Sistem koyu mod ayarını kontrol et
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    // Koyu mod tercihindeki değişiklikleri dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("shipping.")) {
      const field = name.split(".")[1];
      setProduct({
        ...product,
        shipping: {
          ...product.shipping,
          [field]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setProduct({
        ...product,
        [name]: value,
      });
    }
  };

  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...product.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value,
    };
    setProduct({ ...product, features: updatedFeatures });
  };

  const addFeature = () => {
    setProduct({
      ...product,
      features: [...product.features, { title: "", value: "" }],
    });
  };

  const removeFeature = (index) => {
    const updatedFeatures = product.features.filter((_, i) => i !== index);
    setProduct({ ...product, features: updatedFeatures });
  };

  // Resim silme fonksiyonu
  const removeImage = (index) => {
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);

    const updatedImages = Array.isArray(product.images) 
      ? [...product.images] 
      : product.image ? [product.image] : [];
    
    updatedImages.splice(index, 1);
    
    // Eğer hiç resim kalmazsa images ve image alanlarını temizle
    if (updatedImages.length === 0) {
      setProduct({
        ...product,
        images: [],
        image: ""
      });
    } else {
      // Çoklu resim desteği için images alanını güncelle
      // Geriye dönük uyumluluk için image alanını da ayarla
      setProduct({
        ...product,
        images: updatedImages,
        image: updatedImages[0] // İlk resmi ana resim olarak ayarla
      });
    }
  };

  // Çoklu resim yükleme fonksiyonu
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Dosya boyutu kontrolü
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        image: `${oversizedFiles.length} dosya 5MB'dan büyük`
      }));
      return;
    }

    // Tüm dosyaları base64'e çevir
    const readerPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    // Tüm resimleri işle
    Promise.all(readerPromises).then(results => {
      // Mevcut resimleri al
      const currentImages = Array.isArray(product.images) && product.images.length > 0
        ? [...product.images] 
        : product.image ? [product.image] : [];
      
      // Yeni resimleri ekle
      const updatedImages = [...currentImages, ...results];
      
      // Önizlemeleri güncelle
      setImagePreviews(prevPreviews => [...prevPreviews, ...results]);
      
      // Ürün state'ini güncelle
      setProduct({
        ...product,
        images: updatedImages,
        image: updatedImages[0] // İlk resmi ana görsel olarak ayarla
      });
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!product.name?.trim()) errors.name = "Ürün adı zorunludur";
    
    const price = parseFloat(product.price);
    if (isNaN(price) || price <= 0) errors.price = "Geçerli bir fiyat giriniz";
    
    // Resim kontrolü - en az bir resim olmalı
    if ((!product.images || product.images.length === 0) && !product.image) 
      errors.image = "En az bir ürün fotoğrafı zorunludur";
    
    if (!product.category) errors.category = "Kategori seçimi zorunludur";
    
    if (!product.stock || product.stock < 1)
      errors.stock = "Geçerli bir stok miktarı giriniz";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(product);
    }
  };

  const categories = [
    "Elektronik",
    "Giyim",
    "Ev & Yaşam",
    "Kitap",
    "Spor",
    "Kozmetik",
    "Gıda",
    "Diğer",
  ];

  return (
    <div className={`product-form-card ${darkMode ? 'dark-mode' : ''}`}>
      <h3>{initialProduct._id ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Ürün Adı</label>
          <input
            autoFocus
            type="text"
            name="name"
            value={product.name || ""}
            onChange={handleChange}
            className={formErrors.name ? "error" : ""}
            placeholder="Örn: Apple MacBook Pro"
          />
          {formErrors.name && (
            <span className="error-message">
              <AlertCircle size={16} />
              {formErrors.name}
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Fiyat (TL)</label>
          <input
            type="number"
            name="price"
            value={product.price || ""}
            onChange={handleChange}
            min="0"
            className={formErrors.price ? "error" : ""}
            placeholder="Örn: 1999.99"
          />
          {formErrors.price && (
            <span className="error-message">
              <AlertCircle size={16} />
              {formErrors.price}
            </span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Kategori</label>
          <select
            name="category"
            value={product.category || ""}
            onChange={handleChange}
            className={formErrors.category ? "error" : ""}
          >
            <option value="">Kategori Seçin</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {formErrors.category && (
            <span className="error-message">
              <AlertCircle size={16} />
              {formErrors.category}
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Stok Miktarı</label>
          <input
            type="number"
            name="stock"
            value={product.stock || ""}
            onChange={handleChange}
            min="1"
            className={formErrors.stock ? "error" : ""}
            placeholder="Örn: 10"
          />
          {formErrors.stock && (
            <span className="error-message">
              <AlertCircle size={16} />
              {formErrors.stock}
            </span>
          )}
        </div>
      </div>

      {/* Kargo Bilgileri */}
      <div className="form-group">
        <label>Kargo Bilgileri</label>
        <div className="shipping-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="shipping.isFree"
              checked={product.shipping?.isFree || false}
              onChange={handleChange}
            />
            Ücretsiz Kargo
          </label>
          <input
            type="text"
            name="shipping.time"
            value={product.shipping?.time || ""}
            onChange={handleChange}
            placeholder="Kargo Süresi (örn: 2-3 iş günü)"
          />
        </div>
      </div>

      {/* Ürün Özellikleri */}
      <div className="form-group">
        <label>Ürün Özellikleri</label>
        <button
          type="button"
          onClick={addFeature}
          className="add-feature-button"
        >
          <Plus size={16} /> Özellik Ekle
        </button>
        {product.features?.map((feature, index) => (
          <div key={index} className="feature-row">
            <input
              type="text"
              value={feature.title || ""}
              onChange={(e) =>
                handleFeatureChange(index, "title", e.target.value)
              }
              placeholder="Özellik Başlığı"
            />
            <input
              type="text"
              value={feature.value || ""}
              onChange={(e) =>
                handleFeatureChange(index, "value", e.target.value)
              }
              placeholder="Özellik Değeri"
            />
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="remove-feature-button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>Ürün Açıklaması</label>
        <textarea
          name="description"
          value={product.description || ""}
          onChange={handleChange}
          placeholder="Ürününüz hakkında detaylı bilgi verin..."
        />
      </div>

      {/* Çoklu Resim Yükleme */}
      <div className="form-group file-input">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className={formErrors.image ? "error" : ""}
          id="product-image"
          multiple // Çoklu dosya seçimi için
        />
        <label
          htmlFor="product-image"
          className="file-upload-label"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="file-upload-icon" />
          <span>Ürün fotoğrafları yüklemek için tıklayın veya sürükleyin</span>
          <small>(Birden fazla fotoğraf seçebilirsiniz)</small>
        </label>
        {formErrors.image && (
          <span className="error-message">
            <AlertCircle size={16} />
            {formErrors.image}
          </span>
        )}
        
        {/* Resim Önizleme Galerisi */}
        {imagePreviews.length > 0 && (
          <div className="image-previews-gallery">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview-item">
                <img src={preview} alt={`Önizleme ${index + 1}`} />
                <button 
                  type="button"
                  className="remove-image-button"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 size={16} />
                </button>
                {index === 0 && <span className="main-image-badge">Ana Görsel</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-button-group">
        <button
          type="button"
          className="save-button"
          onClick={handleSubmit}
        >
          {buttonText}
        </button>
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
        >
          İptal
        </button>
      </div>
    </div>
  );
};

export default ProductForm;