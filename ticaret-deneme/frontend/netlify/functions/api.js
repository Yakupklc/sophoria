const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const router = express.Router();

// Ekstra test verileri ve yedek çözümler
const mockProducts = [
  {
    id: "mock1",
    name: "Test Akıllı Telefon",
    description: "Bu bir test akıllı telefon ürünüdür - API'den veri alınamadığında gösterilir",
    price: 5999.99,
    category: "Elektronik",
    image: "https://via.placeholder.com/450x450?text=Test+Smartphone",
    stock: 15,
    rating: 4.5,
    features: ["6.5 inç ekran", "128GB Depolama", "8GB RAM"],
    shipping: { free: true, sameDay: false },
    timestamp: new Date().toISOString()
  },
  {
    id: "mock2",
    name: "Test Dizüstü Bilgisayar",
    description: "Bu bir test dizüstü bilgisayar ürünüdür - API'den veri alınamadığında gösterilir",
    price: 12499.99,
    category: "Bilgisayar",
    image: "https://via.placeholder.com/450x450?text=Test+Laptop",
    stock: 8,
    rating: 4.8,
    features: ["15.6 inç ekran", "512GB SSD", "16GB RAM", "NVIDIA RTX 3050"],
    shipping: { free: true, sameDay: true },
    timestamp: new Date().toISOString()
  }
];

// Mock auth yanıtları
const mockAuthResponses = {
  login: {
    token: "mock-token-" + Date.now(),
    user: {
      id: "mock-user-" + Date.now(),
      username: "testuser",
      email: "test@example.com"
    }
  },
  register: {
    token: "mock-token-" + Date.now(),
    user: {
      id: "mock-user-" + Date.now(),
      username: "newuser",
      email: "new@example.com"
    }
  }
};

app.use(cors());
app.use(bodyParser.json());

// Base URL ayarı - Netlify'da boş olmalı, redirection için
const BASE_URL = "";

// Debug bilgileri ekle
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Netlify proxy işleyicisi
exports.handler = async (event, context) => {
  // İsteği logla
  console.log("Event path:", event.path);
  console.log("Headers:", event.headers);
  console.log("HTTP method:", event.httpMethod);
  console.log("Query parameters:", event.queryStringParameters);
  console.log("Body:", event.body ? JSON.parse(event.body) : "No body");

  // OPTIONS isteklerini işle (CORS için)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      }
    };
  }

  // API yolunu al
  const apiPath = event.path.replace("/.netlify/functions/api", "");
  
  if (!apiPath) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "API yolu belirtilmedi" })
    };
  }

  // Mock yanıtlar için kontroller
  if (apiPath === "/auth/login" && event.httpMethod === "POST") {
    console.log("Login endpoint hit, sending mock response");
    const body = JSON.parse(event.body || "{}");
    // Email ve şifre için basit doğrulama
    if (body.email && body.password) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...mockAuthResponses.login,
          user: {
            ...mockAuthResponses.login.user,
            email: body.email,
            username: body.email.split('@')[0]
          }
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email ve şifre gereklidir" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      };
    }
  }

  if (apiPath === "/auth/register" && event.httpMethod === "POST") {
    console.log("Register endpoint hit, sending mock response");
    const body = JSON.parse(event.body || "{}");
    // Email, şifre ve username için basit doğrulama
    if (body.email && body.password && body.username) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...mockAuthResponses.register,
          user: {
            ...mockAuthResponses.register.user,
            email: body.email,
            username: body.username
          }
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email, şifre ve kullanıcı adı gereklidir" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      };
    }
  }

  if (apiPath === "/products" && event.httpMethod === "GET") {
    console.log("Products endpoint hit, sending mock product data");
    return {
      statusCode: 200,
      body: JSON.stringify(mockProducts),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    };
  }

  // Gerçek API isteği
  try {
    const url = `${BASE_URL}${apiPath}`;
    console.log(`Forwarding request to: ${url}`);
    
    const axiosConfig = {
      method: event.httpMethod,
      url,
      headers: { ...event.headers, host: undefined, 'x-forwarded-for': undefined },
    };

    if (event.body) {
      axiosConfig.data = JSON.parse(event.body);
    }

    if (event.queryStringParameters) {
      axiosConfig.params = event.queryStringParameters;
    }

    const response = await axios(axiosConfig);
    console.log("API Response preview:", JSON.stringify(response.data).substring(0, 200) + "...");

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    };
  } catch (error) {
    console.error("API Error:", error);

    // Yanıt kontrol et - HTML içeriyorsa, yanlış endpoint olabilir
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
      console.error("HTML yanıtı alındı - muhtemelen yanlış endpoint");
    }

    let statusCode = error.response?.status || 500;
    let errorMessage = error.response?.data || error.message;

    // Ürünler için fallback çözüm
    if (apiPath === "/products") {
      console.log("Providing fallback products");
      return {
        statusCode: 200,
        body: JSON.stringify(mockProducts),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      };
    }

    return {
      statusCode,
      body: JSON.stringify({ error: errorMessage }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    };
  }
};

router.get("/", (req, res) => {
  res.json({
    message: "Netlify Functions API çalışıyor",
    timestamp: new Date().toISOString()
  });
});

app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app); 