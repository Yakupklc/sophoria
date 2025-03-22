const Question = require('../models/Question');
const Product = require('../models/Product');

exports.createQuestion = async (req, res) => {
  try {
    const { question } = req.body; // Sadece question string’i al
    const productId = req.params.productId; // productId URL’den alınır
    const userId = req.user.id; // Token’dan gelen userId (auth middleware ile)

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Lütfen bir soru girin' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'Ürün ID gereklidir' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.userId) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    const newQuestion = new Question({
      question: question.trim(), // Boşlukları temizle
      productId: productId,
      askerId: userId, // Soruyu soran kullanıcı
      sellerId: product.userId // Ürünün sahibi (satıcı)
    });

    await newQuestion.save();
    const populatedQuestion = await Question.findById(newQuestion._id)
      .populate('askerId', 'username')
      .populate('sellerId', 'username');

    res.status(201).json(populatedQuestion);
  } catch (error) {
    console.error('Soru ekleme hatası:', error);
    res.status(500).json({ message: 'Soru eklenirken bir hata oluştu' });
  }
};

// Diğer controller fonksiyonlarını buraya ekleyebilirsin (örneğin, getQuestions, answerQuestion, deleteQuestion)