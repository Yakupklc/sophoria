import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ProductFormExternal from "../ProductForm/ProductForm";
import "./ProductModal.css";

const ProductModal = ({
  initialProduct,
  onSubmit,
  onClose,
  mode = "add"
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const defaultProduct = {
    name: "",
    description: "",
    price: "",
    category: "",
    image: "", // Tekli resim için
    images: [], // Çoklu resim için
    stock: 0,
    features: [],
    shipping: {
      isFree: false,
      time: "2-3 iş günü"
    }
  };

  const validateProduct = (data) => {
    if (!data.name?.trim()) {
      throw new Error("Ürün adı zorunludur");
    }
    // Açıklama artık zorunlu değil
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
      throw new Error("Geçerli bir fiyat giriniz");
    }
    if (!data.category) {
      throw new Error("Kategori seçimi zorunludur");
    }
    if ((!data.images || data.images.length === 0) && !data.image) {
      throw new Error("En az bir ürün fotoğrafı gereklidir");
    }
  };

  const handleSubmit = async (productData) => {
    try {
      // Veri doğrulama
      validateProduct(productData);

      // Veriyi hazırla
      const formattedData = {
        ...productData,
        price: Number(productData.price),
        stock: Number(productData.stock || 0),
        // Eğer images boşsa ve image varsa, image'i images dizisine ekle
        images: productData.images?.length ? productData.images : 
                productData.image ? [productData.image] : []
      };

      await onSubmit(formattedData);
      setError(null);
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Ürün ekleme hatası:", err);
    }
  };

  return (
    <div className={`product-modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className="product-modal-content">
        <div className="product-modal-header">
          <h2>{mode === "add" ? "Yeni Ürün Ekle" : "Ürünü Düzenle"}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="product-modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <ProductFormExternal
            initialProduct={initialProduct || defaultProduct}
            onSubmit={handleSubmit}
            onCancel={onClose}
            buttonText={mode === "add" ? "Ürünü Ekle" : "Ürünü Güncelle"}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductModal;