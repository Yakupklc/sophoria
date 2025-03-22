const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createQuestion } = require('../controllers/questionsController');
const Question = require('../models/Question');
const Product = require('../models/Product');

// 1. Spesifik ürüne ait soruları getir
router.get('/products/:productId/questions', async (req, res) => {
  try {
    const questions = await Question.find({ productId: req.params.productId })
      .populate('askerId', 'username')
      .populate('sellerId', 'username')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Sorular getirme hatası:', error);
    res.status(500).json({ message: 'Sorular getirilirken bir hata oluştu' });
  }
});

// 2. Yeni soru ekle (controller’a taşındı)
router.post('/products/:productId/questions', auth, createQuestion);

// 3. Soruyu yanıtla
router.post('/questions/:questionId/answer', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }

    if (question.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu soruyu yanıtlama yetkiniz yok' });
    }

    question.answer = {
      text: req.body.answer,
      answeredAt: new Date()
    };
    question.status = 'answered';

    await question.save();

    const populatedQuestion = await Question.findById(question._id)
      .populate('askerId', 'username')
      .populate('sellerId', 'username');

    res.json(populatedQuestion);
  } catch (error) {
    console.error('Yanıt ekleme hatası:', error);
    res.status(500).json({ message: 'Yanıt eklenirken bir hata oluştu' });
  }
});

// 4. Satıcının sorularını getir
router.get('/questions/seller', auth, async (req, res) => {
  try {
    const questions = await Question.find({ sellerId: req.user.id })
      .populate('askerId', 'username')
      .populate({
        path: 'productId',
        select: 'name image'
      })
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Satıcı soruları getirme hatası:', error);
    res.status(500).json({ message: 'Sorular getirilirken bir hata oluştu' });
  }
});

// 5. Soru sil
router.delete('/questions/:questionId', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }

    if (question.askerId.toString() !== req.user.id && 
        question.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu soruyu silme yetkiniz yok' });
    }

    await question.deleteOne();
    res.json({ message: 'Soru başarıyla silindi' });
  } catch (error) {
    console.error('Soru silme hatası:', error);
    res.status(500).json({ message: 'Soru silinirken bir hata oluştu' });
  }
});

module.exports = router;