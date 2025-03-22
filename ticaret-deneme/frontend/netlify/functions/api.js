const axios = require('axios');

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
    // event.path'ten API yolunu çıkar (örn: /.netlify/functions/api/auth/login -> /auth/login)
    const path = event.path.replace('/.netlify/functions/api', '');
    
    // API isteği parametreleri
    const API_URL = 'https://sophoria-api.vercel.app/api';
    const url = `${API_URL}${path}`;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Client'ten gelen authorization header'ını al
    const authorization = event.headers.authorization || '';

    console.log(`Proxy istek: ${method} ${url}`);

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

    // Başarılı yanıt
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy hatası:', error.message);
    
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