// Kullanıcı bilgilerini al
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1])); // JWT decode örneği
    return decoded; // { _id: "12345", username: "testuser" }
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

// Kullanıcının giriş yapmış olup olmadığını kontrol et
export const isLoggedIn = () => {
    return getCurrentUser() !== null;
};

// Çıkış yap
export const logout = () => {
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");
    window.location.href = '/login';
};

// Kullanıcı bilgilerini güncelle
export const updateUserData = (newData) => {
    const storageType = localStorage.getItem("currentUser") ? localStorage : sessionStorage;
    storageType.setItem("currentUser", JSON.stringify(newData));
};

export const clearUserSession = () => {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');
};