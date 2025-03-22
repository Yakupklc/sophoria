// Auth işlemleri için kullanılan servisler
// Register, login ve logout işlemleri burada yapılır
import axiosInstance from "../config/axiosConfig";

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Bir hata oluştu" };
  }
};

export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
    }
    return {
      success: true,
      data: response.data,
      message: "Giriş başarılı",
    };
  } catch (error) {
    let errorMessage = "Bir hata oluştu";

    if (error.response) {
      // Backend'den gelen hata mesajını kontrol et
      errorMessage =
        error.response.data?.message ||
        (error.response.status === 401
          ? "E-posta adresi veya şifre hatalı!"
          : error.response.status === 404
          ? "Bu e-posta adresi ile kayıtlı bir hesap bulunamadı!"
          : "Lütfen tüm alanları doldurun!");
    } else if (error.request) {
      errorMessage = "Sunucuyla bağlantı kurulamadı";
    } else {
      errorMessage = "Bir beklenmedik hata oluştu";
    }

    console.error("Login Error:", errorMessage, error);

    throw {
      success: false,
      message: errorMessage,
      status: error.response?.status,
    };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
};