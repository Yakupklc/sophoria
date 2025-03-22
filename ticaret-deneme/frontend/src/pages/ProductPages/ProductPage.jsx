import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import axiosInstance from "../../config/axiosConfig";
import { isLoggedIn } from "../../utils/authUtils";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import AskQuestion from "../../components/AskQuestion/AskQuestion";
import LoginModal from "../../components/LoginModal/LoginModal";
import Navbar from "../../components/navbar/Navbar";
import "./ProductPage.css";
import {
  MessageCircle,
  ShoppingCart,
  User,
  Star,
  Heart,
  Eye,
  ShoppingBag,
  Clock,
  Truck,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";

const ProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId, setUserId] = useState(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRedirectAction, setLoginRedirectAction] = useState("");

  const userLoggedIn = isLoggedIn();
  const [currentUser, setCurrentUser] = useState(null);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const fetchUserData = async () => {
      if (userLoggedIn) {
        try {
          const userData = await axiosInstance.get("/users/me");
          setCurrentUser(userData.data);
        } catch (error) {
          console.error("Kullanıcı bilgileri alınamadı:", error);
        }
      }
    };

    fetchUserData();
  }, [userLoggedIn]);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/products/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error("Yorumlar yüklenirken hata:", error);
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axiosInstance.get(`/products/${id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Ürün yüklenirken hata:", error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!userLoggedIn) return;

      try {
        const response = await axiosInstance.get(
          `/products/${id}/reviews/eligibility`
        );
        setUserHasReviewed(!response.data.canReview);
      } catch (error) {
        console.error("Yorum eligibility kontrol hatası:", error);
      }
    };

    checkReviewEligibility();
  }, [id, userLoggedIn]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axiosInstance.get(`/products/${id}/questions`);
        setQuestions(response.data);
      } catch (error) {
        console.error("Sorular yüklenirken hata:", error);
      }
    };

    fetchQuestions();
  }, [id]);

  // Kullanıcının kendi ürünü kontrolü
  const isOwnProduct = () => {
    return (
      currentUser &&
      product &&
      product.userId &&
      currentUser._id === product.userId._id
    );
  };

  // Sepete ekleme işleyicisi
  const handleAddToCart = (product) => {
    if (!userLoggedIn) {
      handleAuthRequiredAction("add_to_cart");
      return;
    }

    // Kullanıcının kendi ürünü mü kontrol et
    if (isOwnProduct()) {
      alert("Kendi ürününüzü sepete ekleyemezsiniz!");
      return;
    }

    // Her şey yolundaysa sepete ekle
    addToCart(product);
  };

  // Soru sorma işleyicisi
  const handleAskQuestion = () => {
    if (!userLoggedIn) {
      handleAuthRequiredAction("ask_question");
      return;
    }

    // Kullanıcının kendi ürünü mü kontrol et
    if (isOwnProduct()) {
      alert("Kendi ürününüze soru soramazsınız!");
      return;
    }

    // Her şey yolundaysa soru sorma modalını aç
    setIsQuestionModalOpen(true);
  };

  const handleAuthRequiredAction = (action) => {
    if (!userLoggedIn) {
      setLoginRedirectAction(action);
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
    setLoginRedirectAction("");
  };

  const handleLoginModalConfirm = () => {
    navigate("/login");
  };

  const handleQuestionSubmit = async (question) => {
    if (!userLoggedIn) {
      handleAuthRequiredAction("ask_question");
      return;
    }

    // question’ın bir string ve boş olmadığını kontrol et
    if (!question || typeof question !== 'string' || question.trim() === '') {
      throw new Error('Lütfen bir soru girin.');
    }

    try {
      const response = await axiosInstance.post(`/products/${id}/questions`, {
        question: question.trim(), // Boşlukları temizle
      });
      setQuestions([response.data, ...questions]);
      setIsQuestionModalOpen(false);
    } catch (error) {
      console.error("Soru gönderilirken hata:", error.response?.data || error.message);
      throw new Error('Soru gönderilirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    if (!userLoggedIn) {
      handleAuthRequiredAction("add_review");
      return;
    }

    // Kendi ürününe yorum yapma kontrolü
    if (isOwnProduct()) {
      alert("Kendi ürününüze yorum yapamazsınız!");
      return;
    }

    try {
      if (userHasReviewed) {
        alert("Bu ürün için zaten bir yorum yapmışsınız");
        return;
      }

      if (!reviewData.rating || !reviewData.comment) {
        alert("Lütfen puan ve yorumunuzu giriniz");
        return;
      }

      const data = {
        rating: Number(reviewData.rating),
        comment: reviewData.comment.trim(),
      };

      const response = await axiosInstance.post(
        `/products/${id}/reviews`,
        data
      );
      setReviews([response.data, ...reviews]);
      setUserHasReviewed(true);
      await fetchReviews();
      alert("Yorumunuz başarıyla eklendi!");
    } catch (error) {
      console.error("Hata detayı:", error);
      const errorMessage =
        error.response?.data?.message || "Yorum eklenirken bir hata oluştu";
      alert(errorMessage);
    }
  };

  const prevImage = () => {
    if (!product || !getProductImages().length) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? getProductImages().length - 1 : prevIndex - 1
    );
  };

  const nextImage = () => {
    if (!product || !getProductImages().length) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === getProductImages().length - 1 ? 0 : prevIndex + 1
    );
  };

  const setMainImage = (index) => {
    setCurrentImageIndex(index);
  };

  const getProductImages = () => {
    if (!product) return [];

    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images;
    }

    if (product.image) {
      return [product.image];
    }

    return [];
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!product) return <div className="error">Ürün bulunamadı</div>;

  const productImages = getProductImages();
  const mainImageSrc = productImages[currentImageIndex];

  return (
    <div className="has-navbar">
      <Navbar />
      <div className="product-page">
        <div className="product-container">
          <div className="product-image-section">
            <div className="main-image-container">
              {productImages.length > 1 && (
                <button className="gallery-nav prev" onClick={prevImage}>
                  <ChevronLeft />
                </button>
              )}

              <img
                src={mainImageSrc}
                alt={product.name}
                className="product-main-image"
              />

              {productImages.length > 1 && (
                <button className="gallery-nav next" onClick={nextImage}>
                  <ChevronRight />
                </button>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="product-thumbnails">
                {productImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.name} - Görsel ${index + 1}`}
                    className={`thumbnail ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                    onClick={() => setMainImage(index)}
                  />
                ))}
              </div>
            )}

            <div className="product-questions">
              <h2>Sorular ve Yanıtlar ({questions.length})</h2>
              <div className="questions-list">
                {questions.map((question) => (
                  <div key={question._id} className="question-item">
                    <div className="question-header">
                      <span className="asker-name">
                        {question.askerId.username}
                      </span>
                      <span className="question-date">
                        {new Date(question.createdAt).toLocaleDateString(
                          "tr-TR"
                        )}
                      </span>
                    </div>
                    <p className="question-text">{question.question}</p>
                    {question.answer && (
                      <div className="answer-section">
                        <div className="answer-header">
                          <span className="seller-name">
                            {question.sellerId.username}
                          </span>
                          <span className="answer-date">
                            {new Date(
                              question.answer.answeredAt
                            ).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                        <p className="answer-text">{question.answer.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="product-info-section">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              <Link
                to={`/seller/${product.userId._id}`}
                className="seller-info"
              >
                <User className="seller-icon" size={20} />
                <span className="seller-name">{product.userId.username}</span>
              </Link>
            </div>

            <p className="product-price">
              {product.price.toLocaleString("tr-TR")} TL
            </p>

            <div className="product-stats">
              <div className="stat-item">
                <Eye size={16} />
                <span>{product.stats?.views || 0} görüntülenme</span>
              </div>
              <div className="stat-item">
                <ShoppingBag size={16} />
                <span>{product.stats?.sales || 0} satış</span>
              </div>
              <div className="stat-item">
                <Heart size={16} />
                <span>{product.stats?.favorites || 0} favori</span>
              </div>
            </div>

            <div className="product-details">
              <h2>Ürün Açıklaması</h2>
              <p className="product-description">{product.description}</p>
            </div>

            {product.features && product.features.length > 0 && (
              <div className="product-features">
                <h2>Ürün Özellikleri</h2>
                <ul className="features-list">
                  {product.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-title">{feature.title}:</span>
                      <span className="feature-value">{feature.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="product-info">
              <div className="shipping-info">
                {product.shipping?.isFree && (
                  <div className="shipping-card free-shipping">
                    <div className="shipping-icon-wrapper">
                      <Truck size={20} />
                    </div>
                    <div className="shipping-content">
                      <span className="shipping-title">Kargo</span>
                      <span className="shipping-value">Ücretsiz</span>
                    </div>
                  </div>
                )}

                <div className="shipping-card shipping-time">
                  <div className="shipping-icon-wrapper">
                    <Clock size={20} />
                  </div>
                  <div className="shipping-content">
                    <span className="shipping-title">Tahmini Teslimat</span>
                    <span className="shipping-value">
                      {product.shipping?.time || "2-3 iş günü"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button
                className="add-to-cart-button"
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0 || isOwnProduct()}
                title={
                  isOwnProduct() ? "Kendi ürününüzü sepete ekleyemezsiniz" : ""
                }
              >
                <ShoppingCart size={20} />
                {product.stock > 0
                  ? isOwnProduct()
                    ? "Kendi Ürününüz"
                    : "Sepete Ekle"
                  : "Ürün Tükendi"}
              </button>

              <button
                className="ask-question-button"
                onClick={handleAskQuestion}
                disabled={isOwnProduct()}
                title={
                  isOwnProduct() ? "Kendi ürününüze soru soramazsınız" : ""
                }
              >
                <MessageCircle size={20} />
                {isOwnProduct() ? "Kendi Ürününüz" : "Satıcıya Soru Sor"}
              </button>
            </div>

            <div className="reviews-and-questions">
              <div className="product-reviews">
                <h2>Değerlendirmeler ({reviews.length})</h2>

                {!userLoggedIn ? (
                  <div className="login-to-review">
                    <div className="login-message">
                      <LogIn size={20} />
                      <p>Yorum yapabilmek için giriş yapmalısınız.</p>
                    </div>
                    <button
                      className="login-button"
                      onClick={() => handleAuthRequiredAction("add_review")}
                    >
                      Giriş Yap
                    </button>
                  </div>
                ) : isOwnProduct() ? (
                  <div className="cannot-review">
                    <p>Kendi ürününüze yorum yapamazsınız.</p>
                  </div>
                ) : userHasReviewed ? (
                  <div className="already-reviewed">
                    <p>
                      Bu ürün için zaten bir yorum yapmışsınız. Her ürün için
                      sadece bir yorum yapabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <ReviewForm onSubmit={handleReviewSubmit} />
                )}

                <div className="reviews-list">
                  {reviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <span className="review-author">
                          {review.userId.username}
                        </span>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < review.rating ? "#FFD700" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AskQuestion
              isOpen={isQuestionModalOpen}
              onClose={() => setIsQuestionModalOpen(false)}
              onSubmit={handleQuestionSubmit}
              productId={id}
            />
          </div>

          <div className="mobile-questions">
            <h2>Sorular ve Yanıtlar ({questions.length})</h2>
            <div className="questions-list">
              {questions.map((question) => (
                <div key={question._id} className="question-item">
                  <div className="question-header">
                    <span className="asker-name">
                      {question.askerId.username}
                    </span>
                    <span className="question-date">
                      {new Date(question.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="question-text">{question.question}</p>
                  {question.answer && (
                    <div className="answer-section">
                      <div className="answer-header">
                        <span className="seller-name">
                          {question.sellerId.username}
                        </span>
                        <span className="answer-date">
                          {new Date(
                            question.answer.answeredAt
                          ).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <p className="answer-text">{question.answer.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        onConfirm={handleLoginModalConfirm}
        action={loginRedirectAction}
      />
    </div>
  );
};

export default ProductPage;