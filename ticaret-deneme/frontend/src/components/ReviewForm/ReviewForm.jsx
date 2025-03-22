// src/components/ReviewForm/ReviewForm.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './ReviewForm.css';

const ReviewForm = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Lütfen bir puan verin');
            return;
        }
        onSubmit({ rating, comment });
        setRating(0);
        setComment('');
    };

    return (
        <div className="review-form">
            <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={24}
                        fill={star <= (hoveredRating || rating) ? "#FFD700" : "none"}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer' }}
                    />
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ürün hakkında düşüncelerinizi yazın..."
                    required
                />
                <button type="submit">Yorumu Gönder</button>
            </form>
        </div>
    );
};

export default ReviewForm;