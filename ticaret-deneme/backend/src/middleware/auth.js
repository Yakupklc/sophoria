// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Request header'larını logla
        console.log('Request headers:', req.headers);
        
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Extracted token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            console.log('Token eksik');
            return res.status(401).json({ message: 'Lütfen giriş yapın' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded:', decoded);

            const user = await User.findById(decoded.userId);
            console.log('User found:', user ? user._id : 'Not found');

            if (!user) {
                console.log('Kullanıcı bulunamadı');
                return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.log('JWT verification error:', jwtError);
            return res.status(401).json({ message: 'Geçersiz token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            message: 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın',
            error: error.message 
        });
    }
};

module.exports = auth;