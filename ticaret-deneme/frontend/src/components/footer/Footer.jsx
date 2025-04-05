import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Hakkımızda</h3>
          <p>Sophoria: Dünyada giyinmenin en pahalı yolu! Burada alışveriş yapmak değil, alışveriş yapacakmış gibi hissetmek bile lüks.</p>
          <p>Biz kredi kartınızı uçurduğumuzda gülümsemeyi hiç bırakmayan tek e-ticaret sitesiyiz.</p>
          <p className="created-by">Gerçek bir yatırımcı kadar ciddi olsaydık, bu notu göremezdiniz - Jacop</p>
        </div>
        
        <div className="footer-section">
          <h3>Hızlı Linkler</h3>
          <ul>
            <li><a href="/">Ana Sayfa</a></li>
            <li><a href="/complaint-suggestion">Öneri ve Şikayet</a></li>
            <li><a href="/order-success">Siparişlerim</a></li>
            <li><a href="/profile">Profilim</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>İletişim</h3>
          <ul>
            <li>Telefon: (533) 488-3185 📱</li>
            <li>Email: yakupkilic876@gmail.com ✉️</li>
            <li>Adres: Edirne, Merkez 📍</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2024 Sophoria. Tüm hakları saklıdır. (Tasarruf etme hakkınız hariç) 💰</p>
      </div>
    </footer>
  );
};

export default Footer;