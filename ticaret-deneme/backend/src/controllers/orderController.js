const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      paymentMethod
    } = req.body;

    // Ürünlerin stok kontrolü
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Ürün bulunamadı: ${item.product}`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} için yeterli stok bulunmamaktadır`
        });
      }
    }

    // Siparişi oluştur
    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      paymentMethod
    });

    await order.save();

    // Stok güncelleme
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: { 
            stock: -item.quantity,
            'stats.sales': item.quantity 
          }
        }
      );
    }

    // Sipariş onay e-postası gönder
    try {
      await sendOrderConfirmationEmail(req.user.email, order);
    } catch (emailError) {
      console.error('Sipariş onay e-postası gönderilemedi:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      order
    });

  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu'
    });
  }
};

// Sipariş onay e-postası gönderme fonksiyonu
const sendOrderConfirmationEmail = async (email, order) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "2dba3a786e8bbd",
      pass: "47184da90cd71a"
    }
  });

  const mailOptions = {
    from: `"E-Ticaret" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Sipariş Onayı - #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Siparişiniz Alındı!</h2>
        <p>Sayın ${order.shippingAddress.firstName} ${order.shippingAddress.lastName},</p>
        <p>Siparişiniz başarıyla oluşturuldu. Sipariş detayları aşağıdadır:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
          <p><strong>Sipariş Numarası:</strong> ${order.orderNumber}</p>
          <p><strong>Toplam Tutar:</strong> ${order.totalAmount.toLocaleString('tr-TR')} TL</p>
          <p><strong>Ödeme Yöntemi:</strong> ${order.paymentMethod}</p>
        </div>

        <h3>Teslimat Adresi:</h3>
        <p>
          ${order.shippingAddress.address}<br>
          ${order.shippingAddress.district} / ${order.shippingAddress.city}<br>
          ${order.shippingAddress.zipCode}
        </p>

        <p>Siparişinizin durumu hakkında sizi bilgilendireceğiz.</p>
        
        <p>Teşekkür ederiz!</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Kullanıcının siparişlerini getir
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Siparişleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler getirilirken bir hata oluştu'
    });
  }
};

// Sipariş detayını getir
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Sipariş detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı getirilirken bir hata oluştu'
    });
  }
};