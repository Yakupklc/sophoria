import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { X, Trash2, Plus, Minus, LogIn } from "lucide-react";
import { isLoggedIn } from "../../utils/authUtils";
import LoginModal from "../LoginModal/LoginModal";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    toggleCart,
    removeFromCart,
    addToCart,
    decreaseQuantity,
  } = useCart();
  const userLoggedIn = isLoggedIn();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const total = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  // Sepet açılıp kapandığında animasyon
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      setIsDrawerVisible(true);
    } else {
      setIsDrawerVisible(false);
      setTimeout(() => {
        document.body.style.overflow = "auto";
      }, 300);
    }
  }, [isCartOpen]);

  const handleCheckout = () => {
    if (!userLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    navigate("/checkout");
    toggleCart();
  };

  const handleLoginModalClose = () => setIsLoginModalOpen(false);

  const handleLoginModalConfirm = () => {
    toggleCart();
    navigate("/login");
  };

  if (!isCartOpen && !isDrawerVisible) return null;

  return (
    <>
      <div
        className={`cart-overlay ${isDrawerVisible ? "active" : "closing"}`}
        onClick={toggleCart}
      />
      <div className={`cart-drawer ${isDrawerVisible ? "open" : "closing"}`}>
      <div className="cart-header">
          <h2>Sepetim ({cartItems.length} Ürün)</h2>
          <button className="close-button" onClick={toggleCart}>
            <X size={24} />
          </button>
        </div>

        {cartItems.length > 0 ? (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img
                      src={item.image || "https://via.placeholder.com/100"}
                      alt={item.title}
                    />
                  </div>
                  <div className="item-details">
                    <h3>{item.title}</h3>
                    <div className="item-price">₺{item.price?.toFixed(2)}</div>
                    <div className="item-actions">
                      <div className="quantity-buttons">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          aria-label="Azalt"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item, 1)}
                          aria-label="Artır"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Kaldır"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Toplam</span>
                <span className="total-price">₺{total.toFixed(2)}</span>
              </div>
              <button
                className="checkout-button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                Satın Al
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <div className="empty-cart-message">
              <h3>Sepetiniz Boş</h3>
              <p>Ürünleri sepetinize ekleyin.</p>
              <button className="continue-shopping" onClick={toggleCart}>
                Alışverişe Devam Et
              </button>
            </div>
          </div>
        )}
      </div>
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleLoginModalClose}
          onConfirm={handleLoginModalConfirm}
          title="Giriş Yapın"
          message="Satın alma işlemi için lütfen giriş yapın."
          confirmText="Giriş Yap"
          icon={<LogIn className="modal-icon" />}
        />
      )}
    </>
  );
};

export default Cart;
