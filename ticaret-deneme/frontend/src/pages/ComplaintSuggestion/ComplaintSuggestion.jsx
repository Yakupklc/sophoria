import React, { useState } from 'react';
import './ComplaintSuggestion.css';

const ComplaintSuggestion = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
        const response = await fetch('http://localhost:5001/api/auth/send-complaint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

      if (response.ok) {
        setSubmissionStatus('success');
        setFormData({ name: '', email: '', message: '' }); // Formu temizle
      } else {
        setSubmissionStatus('error');
      }
    } catch (error) {
      setSubmissionStatus('error');
      console.error('E-posta gönderme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="complaint-wrapper">
      <div className="complaint-container">
        <div className="complaint-paper">
          <div className="complaint-header">
            <h2 className="complaint-title">Şikayet ve Önerileriniz</h2>
            <p className="complaint-subtitle">Düşüncelerinizi bizimle paylaşın!</p>
          </div>
          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-field">
              <label htmlFor="name" className="form-label">Adınız</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Adınızı girin"
                className="complaint-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="email" className="form-label">E-posta Adresiniz</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="E-posta adresinizi girin"
                className="complaint-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="message" className="form-label">Mesajınız</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Şikayet veya önerinizi buraya yazın"
                className="complaint-input complaint-textarea"
              />
            </div>
            <button type="submit" className="complaint-button" disabled={isSubmitting}>
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            {submissionStatus === 'success' && (
              <p className="success-message">Teşekkürler! Mesajınız gönderildi.</p>
            )}
            {submissionStatus === 'error' && (
              <p className="error-message">Hata oluştu, lütfen tekrar deneyin.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintSuggestion;