import axios from "axios";

// Log environment
console.log("Environment:", import.meta.env.MODE);
console.log("Is prod?", import.meta.env.PROD);

// API URL'sini ortama göre belirleme
const baseURL = import.meta.env.DEV 
  ? import.meta.env.VITE_API_URL || "http://localhost:5001/api"
  : "/api";  // Netlify yönlendirmesi için /api kullan

console.log("Current API baseURL:", baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false
});

// Request interceptor - token eklemek için
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // URL'i düzeltme - başında zaten /api/ varsa tekrar ekleme
    if (import.meta.env.PROD && !config.url.startsWith('/api/') && !config.url.startsWith('api/')) {
      if (config.url.startsWith('/')) {
        config.url = `/api${config.url}`;
      } else {
        config.url = `/api/${config.url}`;
      }
    }
    
    console.log("API Request URL:", config.url);
    console.log("API Request Method:", config.method);
    console.log("API Request Headers:", config.headers);
    
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi için
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("API Response Success:", response.status);
    console.log("API Response Data:", response.data);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.message, error.response?.status);
    console.error("API Response Error Data:", error.response?.data);
    
    // 401 hatasını Login bileşeni ele alsın, yönlendirme yapma
    if (error.response?.status === 401) {
      console.warn(
        "401 Unauthorized hatası alındı, yönlendirme Login bileşenine bırakıldı:",
        error.response?.data?.message || error.message
      );
      return Promise.reject(error);
    }
    // Diğer hata durumları için genel hata fırlat
    return Promise.reject(error);
  }
);

export default axiosInstance;