const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Gelen istekleri logla
app.use((req, res, next) => {
  console.log('Netlify Function Request:', req.method, req.path);
  next();
});

// Auth Routes
router.post('/auth/login', (req, res) => {
  console.log('Login isteği alındı:', req.body);
  
  // Mock login yanıtı
  const userData = {
    token: `mock-token-${Date.now()}`,
    user: {
      id: `user-${Date.now()}`,
      username: req.body.email ? req.body.email.split('@')[0] : 'kullanici',
      email: req.body.email || 'test@example.com'
    }
  };
  
  res.json(userData);
});

router.post('/auth/register', (req, res) => {
  console.log('Register isteği alındı:', req.body);
  
  // Mock register yanıtı
  const userData = {
    token: `mock-token-${Date.now()}`,
    user: {
      id: `user-${Date.now()}`,
      username: req.body.email ? req.body.email.split('@')[0] : 'yenikullanici',
      email: req.body.email || 'test@example.com'
    }
  };
  
  res.json(userData);
});

// Products Route
router.get('/products', (req, res) => {
  console.log('Ürünler isteği alındı');
  
  const mockProducts = [
    {
      id: 1,
      title: 'Örnek Ürün 1',
      price: 199.99,
      description: 'Bu örnek bir ürün açıklamasıdır.',
      image: 'https://placeimg.com/640/480/tech',
      category: 'Elektronik'
    },
    {
      id: 2,
      title: 'Örnek Ürün 2',
      price: 99.99,
      description: 'İkinci örnek ürün açıklaması.',
      image: 'https://placeimg.com/640/480/tech',
      category: 'Giyim'
    }
  ];
  
  res.json(mockProducts);
});

// Base endpoint - sağlık kontrolü
router.get('/', (req, res) => {
  res.json({
    message: 'API çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route
router.all('*', (req, res) => {
  console.log('Bilinmeyen istek:', req.method, req.path);
  res.status(404).json({ 
    message: 'Endpoint bulunamadı',
    requestedPath: req.path,
    method: req.method
  });
});

// Router'ı kullan - Netlify Functions yapısı için
app.use('/api', router);

// serverless-http ile sarmalama
module.exports.handler = serverless(app); 