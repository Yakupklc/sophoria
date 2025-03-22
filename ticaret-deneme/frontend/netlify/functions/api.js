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
    console.log("Function triggered with path:", event.path);
    console.log("Query parameters:", event.queryStringParameters);
    console.log("HTTP Method:", event.httpMethod);
    
    // event.path'ten API yolunu çıkar 
    // Örnek: /.netlify/functions/api/auth/login -> /auth/login
    const path = event.path.replace('/.netlify/functions/api', '');
    
    console.log("Extracted path:", path);
    
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
    
    // Başarılı yanıt
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Error details:', error.response?.data);
    
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