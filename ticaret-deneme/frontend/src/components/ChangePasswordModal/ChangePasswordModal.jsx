import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ onClose, onSubmit, isLoading }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwords;
    
    // Validasyon kontrolleri
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor");
      return;
    }
    
    onSubmit(passwords);
  };

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className="modal-content password-modal">
        <div className="modal-header">
          <Lock className="lock-icon" />
          <h2>Şifre Değiştir</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Mevcut Şifre</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">Yeni Şifre</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <small>Şifreniz en az 8 karakter olmalıdır</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>
          
          <div className="button-group">
            <button 
              type="submit" 
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? "İşleniyor..." : "Şifreyi Değiştir"}
            </button>
            <button 
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isLoading}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;