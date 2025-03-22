import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert as MuiAlert } from '@mui/material'; // MUI Alert bileşenini ekliyoruz
import './DeleteAccountModal.css';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DeleteAccountModal = ({ onClose, onConfirm, isLoading, username, errorFromServer }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin');
      return;
    }
    onConfirm(password); // Şifreyi onConfirm'e gönder, hata varsa errorFromServer üzerinden yakala
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <AlertCircle className="warning-icon" size={24} />
          <h2>Hesabı Sil</h2>
        </div>
        
        <div className="modal-body">
          <p className="warning-text">
            Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
          </p>
          
          <form onSubmit={handleSubmit} aria-label="Hesap silme formu">
            <input
              type="text"
              name="username"
              autoComplete="username"
              defaultValue={username}
              aria-hidden="true"
              style={{ display: 'none' }}
              tabIndex={-1}
            />
            
            <div className="form-group">
              <label htmlFor="current-password">Şifrenizi Girin</label>
              <input
                type="password"
                id="current-password"
                name="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(''); // Local hata mesajını temizle
                }}
                placeholder="Şifreniz"
                className={`modal-input ${error ? 'error' : ''}`}
                autoComplete="current-password"
                required
              />
              {(error || errorFromServer) && (
                <Alert 
                  severity="error" 
                  className="error-alert"
                  sx={{ 
                    marginTop: '1rem', 
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  }}
                >
                  {error || errorFromServer}
                </Alert>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
                disabled={isLoading}
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="delete-button"
                disabled={isLoading}
              >
                {isLoading ? 'Siliniyor...' : 'Hesabı Sil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;