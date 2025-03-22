const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Email transporter oluştur
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // TLS için false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Geliştirme ortamı için
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP Bağlantı hatası:', error);
  } else {
    console.log('SMTP Sunucusu hazır');
  }
});

// Register controller
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        message: userExists.email === email 
          ? 'Bu email zaten kullanımda'
          : 'Bu kullanıcı adı zaten kullanımda'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      profile: {
        fullName: '',
        phone: '',
        address: ''
      }
    });
    
    await user.save();

    // Hoş geldiniz e-postası gönder
    try {
      await sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.error('Hoş geldiniz e-postası gönderilemedi:', emailError);
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu' });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu' });
  }
};

// Şifre sıfırlama - E-posta ve doğrulama kodu gönderme
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi gereklidir'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı'
      });
    }

    // Yeni kod gönderilebilir mi kontrol et
    const canSend = await VerificationCode.canSendNewCode(user._id, 'password-reset');
    if (!canSend) {
      return res.status(429).json({
        success: false,
        message: 'Çok fazla doğrulama kodu gönderildi. Lütfen 1 saat sonra tekrar deneyin.'
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await VerificationCode.deleteMany({ 
      userId: user._id,
      createdFor: 'password-reset',
      isUsed: false
    });
    
    const newCode = new VerificationCode({
      userId: user._id,
      email: email,
      code: verificationCode,
      createdFor: 'password-reset'
    });
    
    await newCode.save();

    try {
      await sendPasswordResetEmail(email, verificationCode);
      return res.status(200).json({
        success: true, 
        message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi'
      });
    } catch (emailError) {
      console.error('E-posta gönderimi hatası:', emailError);
      return res.status(200).json({
        success: true, 
        message: 'Doğrulama kodu oluşturuldu (E-posta gönderilemedi)',
        verificationCode: verificationCode
      });
    }
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    });
  }
};

// Doğrulama kodunu kontrol et
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('Doğrulama isteği alındı:', { email, code });

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve doğrulama kodu gereklidir'
      });
    }

    const verificationData = await VerificationCode.findOne({
      email,
      code,
      createdFor: 'password-reset',
      isUsed: false
    });
    console.log('Veritabanı sonucu:', verificationData);

    if (!verificationData || verificationData.createdAt.getTime() + 30 * 60 * 1000 < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş doğrulama kodu'
      });
    }

    verificationData.isUsed = true;
    await verificationData.save();
    console.log('Kod kullanıldı olarak işaretlendi');

    const resetToken = jwt.sign(
      { email, code },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    console.log('Oluşturulan resetToken:', resetToken);

    return res.status(200).json({
      success: true,
      message: 'Doğrulama başarılı',
      resetToken
    });
  } catch (error) {
    console.error('Kod doğrulama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Doğrulama işlemi sırasında bir hata oluştu'
    });
  }
};

// Şifreyi sıfırla
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token ve yeni şifre gereklidir'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 8 karakter uzunluğunda olmalıdır'
      });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    user.password = newPassword;
    await user.save();

    try {
      await sendPasswordChangedEmail(decoded.email);
    } catch (emailError) {
      console.error('Bildirim e-postası gönderilemedi:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Şifre değiştirme işlemi sırasında bir hata oluştu'
    });
  }
};

// Şifre sıfırlama e-posta gönderimi ve tasarımı
const sendPasswordResetEmail = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: `"SOPHORIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Şifre Sıfırlama Kodunuz | SOPHORIA',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Roboto', Arial, sans-serif;">
          <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #483D8B 100%); padding: 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; font-family: 'Playfair Display', serif; letter-spacing: 1.5px;">
                SOPHORIA
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #d4d4d4; font-weight: 300;">
                Zarafetin ve Stilin Buluşma Noktası
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 32px; color: #333333;">
              <h2 style="margin: 0 0 20px; font-size: 26px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', serif; text-align: center;">
                Şifre Sıfırlama İsteği
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Merhaba,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanabilirsiniz. Bu kod 30 dakika geçerlidir.
              </p>

              <!-- Verification Code -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background-color: #f8f8f8; padding: 20px 32px; border-radius: 12px; border: 1px dashed #483D8B;">
                  <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                    Doğrulama Kodu
                  </p>
                  <h3 style="margin: 8px 0 0; font-size: 28px; font-weight: 700; color: #483D8B; letter-spacing: 4px; font-family: 'Roboto', monospace;">
                    ${verificationCode}
                  </h3>
                </div>
              </div>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #555555; text-align: center;">
                Bu isteği siz yapmadıysanız, lütfen bizimle <a href="mailto:destek@sophoria.com" style="color: #483D8B; text-decoration: none;">iletişime</a> geçin.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                © ${new Date().getFullYear()} SOPHORIA. Tüm hakları saklıdır.<br>
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Şifre sıfırlama e-postası gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw new Error(`E-posta gönderilemedi: ${error.message}`);
  }
};

// Şifre başarıyla değiştirildiğine dair bilgilendirme e-postası
const sendPasswordChangedEmail = async (email) => {
  try {
    const mailOptions = {
      from: `"SOPHORIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Şifreniz Değiştirildi | SOPHORIA',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Roboto', Arial, sans-serif;">
          <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #483D8B 100%); padding: 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; font-family: 'Playfair Display', serif; letter-spacing: 1.5px;">
                SOPHORIA
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #d4d4d4; font-weight: 300;">
                Zarafetin ve Stilin Buluşma Noktası
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 32px; color: #333333;">
              <h2 style="margin: 0 0 20px; font-size: 26px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', serif; text-align: center;">
                Şifreniz Değiştirildi
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Merhaba,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                SOPHORIA hesabınızın şifresi başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5001'}" 
                  style="display: inline-block; background: linear-gradient(135deg, #483D8B 0%, #6A5ACD 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(72, 61, 139, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                  Giriş Yap
                </a>
              </div>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #555555; text-align: center;">
                Bu değişikliği siz yapmadıysanız, lütfen hemen <a href="mailto:destek@sophoria.com" style="color: #483D8B; text-decoration: none;">ekibimize</a> ulaşın.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                © ${new Date().getFullYear()} SOPHORIA. Tüm hakları saklıdır.<br>
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Şifre değişikliği e-postası gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
};

// Hoş geldiniz e-postası (kayıt sonrası)
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: `"SOPHORIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'SOPHORIA’ya Hoş Geldiniz! 🎉',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Roboto', Arial, sans-serif;">
          <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #483D8B 100%); padding: 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; font-family: 'Playfair Display', serif; letter-spacing: 1.5px;">
                SOPHORIA
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #d4d4d4; font-weight: 300;">
                Zarafetin ve Stilin Buluşma Noktası
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 32px; color: #333333;">
              <h2 style="margin: 0 0 20px; font-size: 26px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', serif; text-align: center;">
                Hoş Geldiniz, ${username}!
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                SOPHORIA ailesine katıldığınız için mutluyuz! Artık eşsiz alışveriş deneyimine başlayabilirsiniz.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5001'}" 
                  style="display: inline-block; background: linear-gradient(135deg, #483D8B 0%, #6A5ACD 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(72, 61, 139, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                  Alışverişe Başla
                </a>
              </div>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #555555; text-align: center;">
                Sorularınız için <a href="mailto:destek@sophoria.com" style="color: #483D8B; text-decoration: none;">ekibimize</a> ulaşabilirsiniz.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                © ${new Date().getFullYear()} SOPHORIA. Tüm hakları saklıdır.<br>
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Hoş geldiniz e-postası gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
};

exports.sendComplaint = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Ad, e-posta ve mesaj gereklidir'
      });
    }

    const mailOptions = {
      from: `"SOPHORIA" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Şikayetlerin gönderileceği e-posta
      subject: `Şikayet/Öneri - ${name}`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Roboto', Arial, sans-serif;">
          <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #483D8B 100%); padding: 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; font-family: 'Playfair Display', serif; letter-spacing: 1.5px;">
                SOPHORIA
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #d4d4d4; font-weight: 300;">
                Zarafetin ve Stilin Buluşma Noktası
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 32px; color: #333333;">
              <h2 style="margin: 0 0 20px; font-size: 26px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', serif; text-align: center;">
                Yeni Şikayet/Öneri
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Aşağıdaki şikayet/öneri tarafımıza ulaştı:
              </p>

              <div style="background-color: #f8f8f8; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px; font-size: 16px; color: #333;"><strong>Ad:</strong> ${name}</p>
                <p style="margin: 0 0 10px; font-size: 16px; color: #333;"><strong>E-posta:</strong> ${email}</p>
                <p style="margin: 0; font-size: 16px; color: #333;"><strong>Mesaj:</strong> ${message}</p>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #555555; text-align: center;">
                Bu mesajı incelemek için lütfen en kısa sürede yanıt verin.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                © ${new Date().getFullYear()} SOPHORIA. Tüm hakları saklıdır.<br>
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: 'Şikayet/öneriniz gönderildi, en kısa sürede incelenecektir'
    });
  } catch (error) {
    console.error('Şikayet/öneri e-postası hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Şikayet/öneri gönderilemedi'
    });
  }
};

exports.testEmail = async (req, res) => {
  try {
    const mailOptions = {
      from: `"SOPHORIA" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // veya test etmek istediğiniz e-posta adresi
      subject: 'Test E-postası',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h1>Test E-postası</h1>
          <p>Bu bir test e-postasıdır.</p>
          <p>Gönderilme zamanı: ${new Date().toLocaleString('tr-TR')}</p>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: 'Test e-postası başarıyla gönderildi'
    });
  } catch (error) {
    console.error('Test e-postası gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test e-postası gönderilemedi',
      error: error.message
    });
  }
};