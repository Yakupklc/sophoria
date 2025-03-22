const axios = require('axios');

// Mock data for testing
const mockProducts = [
  {
    id: "1",
    name: "Akıllı Telefon",
    description: "Son model akıllı telefon",
    price: 7999,
    category: "Elektronik",
    image: "https://picsum.photos/id/1/500/300",
    images: ["https://picsum.photos/id/1/500/300", "https://picsum.photos/id/2/500/300"],
    stock: 10,
    features: ["Su geçirmez", "5G Destekli"],
    shipping: { isFree: true, time: "2-3 iş günü" }
  },
  {
    id: "2",
    name: "Laptop",
    description: "Güçlü işlemcili iş bilgisayarı",
    price: 12999,
    category: "Elektronik",
    image: "https://picsum.photos/id/2/500/300",
    images: ["https://picsum.photos/id/2/500/300", "https://picsum.photos/id/3/500/300"],
    stock: 5,
    features: ["16GB RAM", "512GB SSD"],
    shipping: { isFree: true, time: "1-2 iş günü" }
  }
];

exports.handler = async function(event, context) {
  // CORS başlıkları
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // OPTIONS isteği (preflight) yanıtı
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log("Function triggered with path:", event.path);
    console.log("Query parameters:", event.queryStringParameters);
    console.log("HTTP Method:", event.httpMethod);
    
    // event.path'ten API yolunu çıkar 
    // Örnek: /.netlify/functions/api/auth/login -> /auth/login
    const path = event.path.replace('/.netlify/functions/api', '');
    
    console.log("Extracted path:", path);
    
    // Fallback çözümü: eğer /products endpoint'i ise, mock data döndür
    if (path === '/products' && event.httpMethod === 'GET') {
      console.log("Returning mock products data");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockProducts)
      };
    }
    
    // API isteği parametreleri
    const API_URL = 'https://sophoria-api.vercel.app/api';
    const url = `${API_URL}${path}`;
    const method = event.httpMethod;
    let body;
    
    try {
      body = event.body ? JSON.parse(event.body) : {};
      console.log("Request body:", body);
    } catch (e) {
      console.error("Error parsing body:", e);
      body = {};
    }
    
    // Client'ten gelen authorization header'ını al
    const authorization = event.headers.authorization || '';
    console.log("Authorization header present:", !!authorization);

    console.log(`Sending proxy request: ${method} ${url}`);

    // API isteği
    const response = await axios({
      method,
      url,
      data: method !== 'GET' ? body : undefined,
      params: method === 'GET' ? event.queryStringParameters : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });

    console.log("Proxy response status:", response.status);
    console.log("Proxy response data:", JSON.stringify(response.data).substring(0, 200) + "...");
    
    // Başarılı yanıt
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    
    // Hata durumunda fallback çözümler
    // Products endpoint için bir sorun varsa mock data döndür
    if (event.path.includes('/products') && event.httpMethod === 'GET') {
      console.log("Returning mock products data after error");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockProducts)
      };
    }
    
    // Hata yanıtı
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || 'Internal Server Error'
      })
    };
  }
}; 