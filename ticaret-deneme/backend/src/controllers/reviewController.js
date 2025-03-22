// backend/src/controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');

exports.addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;

        // Yeni yorumu oluştur
        const review = await Review.create({
            userId: req.user._id,
            productId,
            rating,
            comment
        });

        // Ürünün ortalama puanını güncelle
        const reviews = await Review.find({ productId });
        const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            'rating.average': averageRating,
            'rating.count': reviews.length
        });

        await review.populate('userId', 'username');

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Yorum eklenirken bir hata oluştu' });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Yorumlar getirilirken bir hata oluştu' });
    }
};

