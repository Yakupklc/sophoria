import React from 'react';
import { X, LogIn } from 'lucide-react';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onConfirm, action }) => {
  if (!isOpen) return null;

  // İşlem türüne göre mesaj oluştur
  const getActionMessage = () => {
    switch (action) {
      case 'add_to_cart':
        return "Sepete ürün eklemek için giriş yapmanız gerekmektedir.";
      case 'add_review':
        return "Yorum yapmak için giriş yapmanız gerekmektedir.";
      case 'ask_question':
        return "Satıcıya soru sormak için giriş yapmanız gerekmektedir.";
      case 'checkout':
        return "Siparişinizi tamamlamak için giriş yapmanız gerekmektedir.";  
      default:
        return "Bu işlemi gerçekleştirmek için giriş yapmanız gerekmektedir.";
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <button className="login-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="login-modal-content">
          <div className="login-modal-icon">
            <LogIn size={48} />
          </div>
          
          <h2>Giriş Yapın</h2>
          <p>{getActionMessage()}</p>
          
          <div className="login-modal-actions">
            <button 
              className="login-modal-confirm" 
              onClick={onConfirm}
            >
              Giriş Yap
            </button>
            <button 
              className="login-modal-cancel" 
              onClick={onClose}
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;