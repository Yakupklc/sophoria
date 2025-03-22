// userController.js dosyasının en başına eklenecek:
const User = require('../models/User');
const Product = require('../models/Product');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('products');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Profil bilgileri getirilirken hata oluştu' });
  }
};

// userController.js içinde updateProfile fonksiyonunu güncelle

exports.updateProfile = async (req, res) => {
  try {
    // Önce username kontrolü yap
    if (req.body.username) {
      // Username'in benzersiz olup olmadığını kontrol et
      const existingUser = await User.findOne({ 
        username: req.body.username,
        _id: { $ne: req.user._id } // Kendi ID'si hariç kontrol et
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu kullanıcı adı zaten kullanımda'
        });
      }
    }

    // Güncellenecek alanları hazırla
    const updates = {
      username: req.body.username, // Username direkt olarak güncelle
      profile: {
        fullName: req.body.fullName,
        phone: req.body.phone,
        address: req.body.address
      }
    };
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      user
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Profil güncellenirken hata oluştu',
      error: error.message 
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    console.log('Delete account request received');
    console.log('Request body:', req.body);
    console.log('User from request:', req.user);

    const { password } = req.body;

    if (!password) {
      console.log('No password provided');
      return res.status(400).json({
        success: false,
        message: 'Şifre gereklidir'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(req.user._id);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    try {
      // Şifreyi doğrula
      console.log('Attempting password verification');
      const isMatch = await user.comparePassword(password);
      console.log('Password match:', isMatch ? 'Yes' : 'No');

      if (!isMatch) {
        console.log('Password mismatch');
        return res.status(401).json({
          success: false,
          message: 'Şifre yanlış'
        });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      throw passwordError;
    }

    try {
      // İlişkili ürünleri sil
      console.log('Deleting related products');
      const productsResult = await Product.deleteMany({ userId: user._id });
      console.log('Deleted products count:', productsResult.deletedCount);
    } catch (productError) {
      console.error('Error deleting products:', productError);
      throw productError;
    }

    try {
      // Hesabı sil
      console.log('Deleting user account');
      await User.findByIdAndDelete(user._id);
      console.log('Account deleted successfully');
    } catch (deleteError) {
      console.error('Error deleting account:', deleteError);
      throw deleteError;
    }

    res.json({ 
      success: true,
      message: 'Hesap başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete account operation failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hesap silinirken bir hata oluştu',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre gereklidir'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 8 karakter uzunluğunda olmalıdır'
      });
    }
    
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
    
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Şifre değiştirme işlemi sırasında bir hata oluştu'
    });
  }
};

