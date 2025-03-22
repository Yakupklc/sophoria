import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import "./DeleteConfirmModal.css";

const DeleteConfirmModal = ({ onConfirm, onCancel, productName }) => {
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <div className={`delete-modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className="delete-confirm-modal">
        <div className="delete-modal-icon">
          <AlertTriangle size={48} />
        </div>
        <h3>Ürün Silme Onayı</h3>
        <p>
          <strong>{productName}</strong> ürününü silmek istediğinize emin misiniz?
        </p>
        <div className="button-group">
          <button className="delete-confirm-button" onClick={onConfirm}>
            Evet, Sil
          </button>
          <button className="cancel-button" onClick={onCancel}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;