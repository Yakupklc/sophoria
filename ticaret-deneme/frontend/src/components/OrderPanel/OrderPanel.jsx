import React, { useEffect } from 'react';
import { Package2, Clock, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için useNavigate import edildi
import './OrderPanel.css';

const OrderPanel = ({ order, onClose, onProductClick }) => {
  const navigate = useNavigate(); // useNavigate hook’u eklendi

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleProductClick = (productId) => {
    onClose(); // Modalı kapat
    navigate(`/product/${productId}`); // Ürün ID’sine göre ProductPage’e yönlendir
    if (onProductClick) {
      onProductClick(productId); // Opsiyonel callback’i tetikle
    }
  };

  return (
    <div className="order-panel-overlay" onClick={onClose}>
      <div className="order-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
          <h2>Sipariş Detayı</h2>
          <div className="order-info">
            <span className="order-number">#{order.orderNumber}</span>
            <span className="order-date">
              {new Date(order.createdAt).toLocaleDateString('tr-TR')}
            </span>
            <span className="order-status">
              {order.status === 'pending' ? 'Beklemede' : order.status}
            </span>
          </div>
        </div>

        <div className="panel-content">
          <div className="scroll-container">
            <div className="order-items">
              {order.items.map((item) => (
                <div 
                  key={item._id} 
                  className="order-item clickable"
                  onClick={() => handleProductClick(item.product._id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleProductClick(item.product._id);
                    }
                  }}
                >
                  <img
                    src={item.product.images?.[0] || item.product.image}
                    alt={item.name}
                    className="order-item-image"
                  />
                  <div className="order-item-details">
                    <h3>{item.name}</h3>
                    <div className="order-item-info">
                      <span className="quantity">{item.quantity} adet</span>
                      <span className="price">
                        {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="shipping-address">
              <h3><MapPin size={18} /> Teslimat Adresi</h3>
              <p>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                {order.shippingAddress.address}<br />
                {order.shippingAddress.district} / {order.shippingAddress.city}<br />
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          <div className="order-summary">
            <div className="total-row">
              <span>Toplam</span>
              <strong>{order.totalAmount.toLocaleString('tr-TR')} TL</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;