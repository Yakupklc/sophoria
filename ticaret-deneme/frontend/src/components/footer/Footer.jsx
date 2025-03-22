import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Hakkımızda</h3>
          <p>SOPHORIA kullanıma açık bir site değildir, eğlencesine yapılan bir projedir</p>
          <p>Site içeriğini görmek ve denemek için "email:konuk@gmail.com & şifre:konuk123" hesabından giriş yapabilir ya da register sayfasından kendi hesabınızı oluşturabilirsiniz</p>
          <p className="created-by">Created BY Jacop</p>
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
            <li>Telefon: (533) 488-3185</li>
            <li>Email: yakupkilic876@gmail.com</li>
            <li>Adres: Edirne, Merkez</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2024 E-Ticaret Sitesi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer;