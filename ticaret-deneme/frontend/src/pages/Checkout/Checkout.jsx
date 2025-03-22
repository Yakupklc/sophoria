import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { Package2, CreditCard, Truck, Clock, ChevronRight } from "lucide-react";
import axiosInstance from '../../config/axiosConfig';
import Navbar from "../../components/navbar/Navbar";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart, decreaseQuantity, addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState("shipping");
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    district: "",
    zipCode: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "zipCode") {
      const numericValue = value.replace(/\D/g, "");
      setShippingAddress((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setShippingAddress((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const goToPayment = (e) => {
    e.preventDefault();
    setActiveStep("payment");
  };

  const goBackToShipping = () => {
    setActiveStep("shipping");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ürün stok kontrolü
      for (const item of cartItems) {
        const stockCheck = await axiosInstance.get(`/products/${item._id}`);
        if (stockCheck.data.stock < item.quantity) {
          alert(`${item.name} için yeterli stok bulunmuyor. Mevcut stok: ${stockCheck.data.stock}`);
          setIsLoading(false);
          return;
        }
      }

      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shippingAddress,
        totalAmount: getCartTotal(),
        paymentMethod,
      };

      const response = await axiosInstance.post("/orders", orderData);

      if (response.data.success) {
        // Stokları güncelle
        await Promise.all(
          cartItems.map(item => 
            axiosInstance.patch(`/products/${item._id}`, {
              stock: item.stock - item.quantity
            })
          )
        );

        clearCart();
        navigate("/order-success", {
          state: { 
            orderNumber: response.data.order.orderNumber,
            totalAmount: getCartTotal()
          }
        });
      }
    } catch (error) {
      console.error("Sipariş hatası:", error);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="has-navbar">
        <Navbar />
        <div className="empty-cart-message">
          <Package2 size={48} />
          <h2>Sepetiniz Boş</h2>
          <p>Alışverişe başlamak için ürünleri keşfedin.</p>
          <button
            onClick={() => navigate("/")}
            className="continue-shopping-button"
          >
            Alışverişe Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="has-navbar">
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-content">
          <div className="checkout-main">
            {activeStep === "shipping" ? (
              <form onSubmit={goToPayment} className="shipping-form">
                <h2>Teslimat Bilgileri</h2>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Ad</label>
                    <input
                      type="text"
                      name="firstName"
                      value={shippingAddress.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Adınız"
                      className="light-input" // Yeni class eklendi
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Soyad</label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingAddress.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Soyadınız"
                      className="light-input" // Yeni class eklendi
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="5XX XXX XX XX"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="light-input" // Yeni class eklendi
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Adres</label>
                  <textarea
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Detaylı adres bilgisi"
                    className="light-input" // Yeni class eklendi
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Şehir</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      required
                      placeholder="Şehir"
                      className="light-input" // Yeni class eklendi
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">İlçe</label>
                    <input
                      type="text"
                      name="district"
                      value={shippingAddress.district}
                      onChange={handleInputChange}
                      required
                      placeholder="İlçe"
                      className="light-input" // Yeni class eklendi
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Posta Kodu</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                      required
                      placeholder="Posta kodu"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="light-input" // Yeni class eklendi
                    />
                  </div>
                </div>

                <button type="submit" className="primary-button">
                  Devam Et
                </button>
              </form>
            ) : (
              <div className="payment-section">
                <div className="section-header">
                  <h2>Ödeme Yöntemi</h2>
                  <button onClick={goBackToShipping} className="back-button">
                    Teslimat Bilgilerine Dön
                  </button>
                </div>

                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <CreditCard size={24} />
                      <div className="option-text">
                        <span className="option-title">Kredi Kartı</span>
                        <span className="option-description">
                          Güvenli ödeme
                        </span>
                      </div>
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <Clock size={24} />
                      <div className="option-text">
                        <span className="option-title">Havale/EFT</span>
                        <span className="option-description">
                          Banka havalesi ile ödeme
                        </span>
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  className="primary-button"
                  disabled={isLoading}
                >
                  {isLoading ? "İşleniyor..." : "Siparişi Tamamla"}
                </button>
              </div>
            )}
          </div>

          <div className="order-summary-container">
            <div className="order-summary">
              <h2>Sipariş Özeti</h2>
              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="order-item">
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <h3>{item.name}</h3>
                      <div className="order-item-actions">
                        <div className="quantity-controls">
                          <button
                            className="quantity-button"
                            onClick={() => decreaseQuantity(item._id)}
                            aria-label="Ürün miktarını azalt"
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="quantity-button"
                            onClick={() => addToCart(item)}
                            disabled={item.quantity >= (item.stock || 0)}
                            aria-label="Ürün miktarını artır"
                          >
                            +
                          </button>
                        </div>
                        <div className="order-item-price">
                          <strong>
                            {((item.price || 0) * item.quantity).toLocaleString("tr-TR")}{" "}
                            TL
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-summary-totals">
                <div className="summary-row">
                  <span>Ara Toplam</span>
                  <span>{getCartTotal().toLocaleString("tr-TR")} TL</span>
                </div>
                <div className="summary-row">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <div className="summary-row total">
                  <span>Toplam</span>
                  <strong>{getCartTotal().toLocaleString("tr-TR")} TL</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;