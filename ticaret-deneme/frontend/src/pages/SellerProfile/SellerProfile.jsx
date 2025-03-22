import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../config/axiosConfig';
import Navbar from '../../components/navbar/Navbar';
import { Star, Package, ShoppingBag, Calendar, ShoppingCart, MessageCircle } from 'lucide-react';
import AskQuestion from '../../components/AskQuestion/AskQuestion';
import { getCurrentUser, isLoggedIn } from "../../utils/authUtils";
import './SellerProfile.css';

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showAskQuestionPanel, setShowAskQuestionPanel] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const currentUser = getCurrentUser();
  const userLoggedIn = isLoggedIn();

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        
        // Satıcı profilini getir
        const sellerResponse = await axiosInstance.get(`/users/${id}/profile`);
        setSeller(sellerResponse.data);
    
        // Satıcının ürünlerini getir
        const productsResponse = await axiosInstance.get(`/products`);
        
        // Daha güvenli bir filtreleme yöntemi
        const filteredProducts = productsResponse.data.filter(product => {
          if (!product.userId) return false;
          
          if (typeof product.userId === 'object' && product.userId !== null) {
            return product.userId._id == id;
          }
          
          return product.userId == id;
        });
        
        setSellerProducts(filteredProducts);
        if (filteredProducts.length > 0) {
          setCurrentProduct(filteredProducts[0]);
        }
      } catch (error) {
        console.error('Satıcı bilgileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerData();
  }, [id]);

  // Kullanıcının kendi ürünü mü kontrolü
  const isOwnProduct = () => {
    return currentUser && currentUser.userId === id;
  };

  const handleAddToCart = (product) => {
    if (!userLoggedIn) {
      alert("Sepete eklemek için giriş yapmalısınız!");
      return;
    }

    // Kullanıcının kendi ürünü mü kontrol et
    if (isOwnProduct()) {
      alert("Kendi ürününüzü sepete ekleyemezsiniz!");
      return;
    }

    if (product.stock > 0) {
      addToCart(product);
    } else {
      alert('Bu ürün stokta bulunmuyor');
    }
  };

  const handleQuestionButton = () => {
    if (!userLoggedIn) {
      alert('Soru sormak için giriş yapmalısınız');
      return;
    }

    if (isOwnProduct()) {
      alert('Kendi ürünlerinize soru soramazsınız');
      return;
    }

    if (sellerProducts.length > 0) {
      setCurrentProduct(sellerProducts[0]);
      setShowAskQuestionPanel(true);
    } else {
      alert('Satıcının henüz ürünü bulunmuyor');
    }
  };

  const handleSendQuestion = async (questionText) => {
    try {
      if (!userLoggedIn) {
        alert('Soru sormak için giriş yapmalısınız');
        return false;
      }

      if (isOwnProduct()) {
        alert('Kendi ürünlerinize soru soramazsınız');
        return false;
      }

      if (!currentProduct) {
        if (sellerProducts.length === 0) {
          throw new Error('Satıcının henüz ürünü bulunmuyor');
        }
        setCurrentProduct(sellerProducts[0]);
      }

      const response = await axiosInstance.post(
        `/products/${currentProduct._id}/questions`,
        { question: questionText }
      );

      if (response.data) {
        alert('Sorunuz başarıyla gönderildi');
        setShowAskQuestionPanel(false);
        return true;
      }
    } catch (error) {
      console.error('Soru gönderme hatası:', error);
      if (error.response?.status === 401) {
        alert('Soru sormak için giriş yapmalısınız');
      } else {
        alert(error.message || 'Soru gönderilirken bir hata oluştu');
      }
      return false;
    }
  };

  const calculateAverageRating = () => {
    const productsWithRating = sellerProducts.filter(
      product => product.rating && product.rating.average > 0
    );
    
    if (productsWithRating.length === 0) return 0;
    
    const totalRating = productsWithRating.reduce(
      (sum, product) => sum + product.rating.average, 0
    );
    
    return (totalRating / productsWithRating.length).toFixed(1);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-wrapper">
          <div className="loader"></div>
        </div>
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <Navbar />
        <div className="error-message">
          <h2>Satıcı Bulunamadı</h2>
          <p>Aradığınız satıcı bilgilerine ulaşılamadı.</p>
          <button onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
        </div>
      </>
    );
  }

  return (
    <div className='has-navbar'>
      <Navbar />
      <div className="seller-profile-container">
        <div className="seller-info-panel">
          <div className="seller-info-header">
            <h2>Satıcı Bilgileri</h2>
          </div>
          <div className="seller-info-content">
            <div className="seller-username">
              <h3>{seller.username}</h3>
            </div>
            
            <div className="seller-join-date">
              <Calendar size={16} />
              <span>
                {new Date(seller.joinDate || seller._id.getTimestamp()).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} tarihinden beri üye
              </span>
            </div>
            
            <div className="seller-rating">
              {calculateAverageRating() > 0 ? (
                <div className="rating-stars">
                  <Star size={18} fill="#fbbf24" stroke="#fbbf24" />
                  <span>{calculateAverageRating()}</span>
                  <span className="rating-count">
                    ({sellerProducts.reduce((total, p) => total + (p.rating?.count || 0), 0)} değerlendirme)
                  </span>
                </div>
              ) : (
                <span className="no-rating">Henüz değerlendirilmemiş</span>
              )}
            </div>
          </div>
          
          <div className="statistics-section">
            <h3>Satıcı İstatistikleri</h3>
            <div className="stat-row">
              <div className="stat-icon">
                <Package size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Toplam Ürün</span>
                <span className="stat-value">{seller.stats?.productCount || sellerProducts.length}</span>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-icon">
                <ShoppingBag size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Toplam Satış</span>
                <span className="stat-value">{seller.stats?.totalSales || 0}</span>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-icon">
                <Star size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Ortalama Puan</span>
                <span className="stat-value">
                  {seller.stats?.averageRating ? 
                    `${seller.stats.averageRating.toFixed(1)} / 5.0` : 
                    "Henüz yok"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="seller-contact">
            <h3>İletişim</h3>
            <button 
              className={`message-seller-btn ${isOwnProduct() ? 'blocked-button' : ''}`}
              onClick={handleQuestionButton}
              disabled={isOwnProduct()}
              title={isOwnProduct() ? "Kendi ürünlerinize soru soramazsınız" : ""}
            >
              <MessageCircle size={18} />
              {isOwnProduct() ? "Kendi Ürünleriniz" : "Satıcıya Soru Sor"}
            </button>
          </div>
        </div>
        
        <div className="products-panel">
          <div className="products-header">
            <h2>Satıcının Ürünleri</h2>
          </div>
          
          {sellerProducts.length === 0 ? (
            <div className="no-products-message">
              <p>Bu satıcının henüz ürünü bulunmuyor.</p>
            </div>
          ) : (
            <div className="products-grid">
              {sellerProducts.map(product => (
                <div 
                  key={product._id} 
                  className="product-card"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="product-image-container">
                    <img 
                      src={product.mainImage || product.image || product.images?.[0] || '/no-image.png'} 
                      alt={product.name}
                    />
                    {product.discount && (
                      <span className="discount-badge">%{product.discount}</span>
                    )}
                  </div>
                  <div className="product-details">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">{product.price.toLocaleString('tr-TR')} ₺</p>
                    <div className="product-meta">
                      <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? `Stokta` : 'Tükendi'}
                      </span>
                      {product.rating && product.rating.average > 0 && (
                        <span className="product-rating">
                          <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                          <span>{product.rating.average.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                    <div className="free-shipping-add-cart">
                      <button 
                        className="add-to-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock <= 0 || isOwnProduct()}
                        title={isOwnProduct() ? "Kendi ürününüzü sepete ekleyemezsiniz" : ""}
                      >
                        <ShoppingCart size={16} />
                        {isOwnProduct() 
                          ? "Kendi Ürününüz"
                          : product.stock > 0 
                            ? 'Sepete Ekle' 
                            : 'Tükendi'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AskQuestion
        isOpen={showAskQuestionPanel}
        onClose={() => setShowAskQuestionPanel(false)}
        onSubmit={handleSendQuestion}
        productId={currentProduct?._id}
      />
    </div>
  );
};

export default SellerProfile;