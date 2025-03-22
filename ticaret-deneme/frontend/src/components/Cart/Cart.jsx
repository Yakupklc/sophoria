import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { X, Trash2, Plus, Minus, LogIn, Moon, Sun } from "lucide-react";
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
  const [systemTheme, setSystemTheme] = useState("light");

  const total = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  // Sistem temasını algıla
  useEffect(() => {
    const detectSystemTheme = () => {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        setSystemTheme("dark");
      } else {
        setSystemTheme("light");
      }
    };

    detectSystemTheme();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) =>
      setSystemTheme(e.matches ? "dark" : "light");

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

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
          <div className="theme-indicator">
            {systemTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <span>{systemTheme === "dark" ? "Koyu Mod" : "Açık Mod"}</span>
          </div>
          <h2>Sepetim ({cartItems.length} Ürün)</h2>
          <button className="close-button" onClick={toggleCart}>
            <X size={24} />
          </button>
        </div>


        <div className="cart-items">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-image-container">
                  <img
                    src={item.images?.[0] || "/default-image.jpg"}
                    alt={item.name || "Ürün"}
                    className="cart-item-image"
                    onError={(e) => (e.target.src = "/default-image.jpg")}
                  />
                </div>
                <div className="cart-item-details">
                  <h3>{item.name || "Bilinmeyen Ürün"}</h3>
                  <p className="cart-item-price">
                    {(item.price || 0).toLocaleString("tr-TR")} TL
                  </p>
                  <div className="cart-item-actions">
                    <button
                      className="quantity-button"
                      onClick={() => decreaseQuantity(item._id)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-button"
                      onClick={() => addToCart(item)}
                      disabled={item.quantity >= (item.stock || Infinity)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <button
                  className="remove-item-button"
                  onClick={() => removeFromCart(item._id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <p>Sepetiniz boş</p>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Toplam:</span>
              <span>{total.toLocaleString("tr-TR")} TL</span>
            </div>
            <button className="checkout-button" onClick={handleCheckout}>
              Alışverişi Tamamla
            </button>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        onConfirm={handleLoginModalConfirm}
        action="checkout"
      />
    </>
  );
};

export default Cart;
