const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Sipariş oluştur
router.post('/orders', auth, orderController.createOrder);

// Kullanıcının siparişlerini getir
router.get('/orders', auth, orderController.getUserOrders);

// Sipariş detayını getir
router.get('/orders/:orderId', auth, orderController.getOrderDetail);

module.exports = router;