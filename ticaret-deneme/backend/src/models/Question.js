const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  askerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    text: String,
    answeredAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'deleted'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);