import axios from "axios";

// API URL'sini ortama göre belirleme
const baseURL = import.meta.env.VITE_API_URL || "https://sophoria-api.vercel.app/api";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - token eklemek için
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi için
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
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