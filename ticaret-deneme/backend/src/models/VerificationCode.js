const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationCodeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800 // 30 dakika sonra otomatik silinir
  },
  createdFor: {
    type: String,
    enum: ['password-reset', 'email-verification'], // 2fa-auth kaldırıldı (eğer gerekirse ekleyebilirsin)
    default: 'password-reset'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
});

// Kullanılmamış aynı türde ve aynı kullanıcı için maksimum doğrulama kodu sayısını sınırlama
verificationCodeSchema.statics.canSendNewCode = async function(userId, createdFor) {
  const lastHour = new Date(Date.now() - 60 * 60 * 1000); // 1 saat
  const count = await this.countDocuments({
    userId,
    createdFor,
    createdAt: { $gte: lastHour }
  });
  
  // Son bir saatte en fazla 5 kod gönderilebilir
  return count < 5;
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);