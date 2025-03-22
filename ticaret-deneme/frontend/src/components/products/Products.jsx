import React, { useState, useEffect } from "react";
import axiosInstance from "../../config/axiosConfig";
import { useSearch } from "../../context/SearchContext";
import { useFilter } from "../../context/FilterContext";
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from "lucide-react";
import { getCurrentUser, isLoggedIn } from "../../utils/authUtils";
import LoginModal from "../LoginModal/LoginModal"
import "./Products.css";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { searchQuery } = useSearch();
  const { selectedCategory } = useFilter();
  const { addToCart } = useCart();
  const userLoggedIn = isLoggedIn();
  const currentUser = getCurrentUser();

  const isOwnProduct = (product) => {
    return (
      currentUser &&
      product &&
      product.userId &&
      currentUser.userId === product.userId
    );
  };

  const handleAddToCart = (product) => {
    if (!userLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isOwnProduct(product)) {
      alert("Kendi ürününüzü sepete ekleyemezsiniz!");
      return;
    }

    addToCart(product);
  };

  const handleLoginConfirm = () => {
    navigate('/login'); // veya login sayfanızın yolu
  };

  const normalizeRating = (productData) => {
    let normalizedRating = { average: 0, count: 0 };
    if (productData.rating) {
      if (typeof productData.rating === 'object') {
        if (productData.rating.average !== undefined) {
          normalizedRating.average = isNaN(parseFloat(productData.rating.average)) ? 0 : parseFloat(productData.rating.average);
          normalizedRating.count = isNaN(parseInt(productData.rating.count)) ? 0 : parseInt(productData.rating.count);
        } else if (productData.rating.avg !== undefined) {
          normalizedRating.average = isNaN(parseFloat(productData.rating.avg)) ? 0 : parseFloat(productData.rating.avg);
          normalizedRating.count = isNaN(parseInt(productData.rating.total)) ? 0 : parseInt(productData.rating.total);
        }
      } else if (typeof productData.rating === 'number') {
        normalizedRating.average = productData.rating;
      }
    }
    return { ...productData, rating: normalizedRating };
  };

  useEffect(() => {
    const fetchProductsWithRatings = async () => {
      try {
        const params = selectedCategory ? { category: selectedCategory } : {};
        const productsResponse = await axiosInstance.get('/products', { params });
        const normalizedProducts = productsResponse.data
          .map(normalizeRating)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(normalizedProducts);
        setLoading(false);
      } catch (error) {
        console.error("Ürünler yüklenirken hata:", error);
        setError('Ürünler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };
    fetchProductsWithRatings();
  }, [selectedCategory]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="products-container loading">Ürünler yükleniyor...</div>;
  if (error) return <div className="products-container error">{error}</div>;
  if (filteredProducts.length === 0) {
    return <div className="products-container no-results">Ürün bulunamadı</div>;
  }

  return (
    <>
      <div className="products-container">
        {filteredProducts.map((product) => {
          const ratingValue = parseFloat(product.rating.average || 0);
          const hasRating = ratingValue > 0;
          const ratingAverage = ratingValue.toFixed(1);
          const ratingCount = product.rating.count || 0;
          const starFill = hasRating ? "#FFD700" : "#e0e0e0";
          const isOwn = isOwnProduct(product);

          return (
            <div
              key={product._id}
              className={`product-box ${isOwn ? 'own-product' : ''}`}
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <div className="product-image-wrapper">
                <img
                  src={product.image || '/default-image.jpg'}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-date">
                  {new Date(product.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-rating">
                  <Star size={16} fill={starFill} />
                  <span>{ratingAverage}</span>
                  <span className="rating-count">({ratingCount})</span>
                </div>
                <p className="product-price">{product.price.toLocaleString('tr-TR')} TL</p>
                <button
                  className="add-to-cart-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  disabled={product.stock === 0 || isOwn}
                  title={
                    isOwn ? "Kendi ürününüzü sepete ekleyemezsiniz" : ""
                  }
                >
                  <ShoppingCart size={20} />
                  {product.stock > 0
                    ? isOwn
                      ? "Kendi Ürününüz"
                      : "Sepete Ekle"
                    : "Ürün Tükendi"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={handleLoginConfirm}
        action="add_to_cart"
      />
    </>
  );
};

export default Products;