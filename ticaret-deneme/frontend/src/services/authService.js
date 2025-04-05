import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Kayıt işlemi
export const registerUser = async (email, password, username) => {
  try {
    // Firebase ile kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Kullanıcı profilini güncelle
    await updateProfile(user, {
      displayName: username
    });
    
    // Firestore'da kullanıcı bilgilerini sakla
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      username,
      email,
      createdAt: serverTimestamp(),
      cart: [],
      favorites: [],
      orders: []
    });
    
    // Onay e-postası gönder
    await sendEmailVerification(user);
    
    // JWT formatında token oluştur (client tarafında kullanmak için)
    const token = await user.getIdToken();
    
    // Kullanıcı bilgilerini döndür
    return {
      token,
      user: {
        id: user.uid,
        username: username,
        email: user.email
      }
    };
  } catch (error) {
    console.error("Kayıt hatası:", error.message);
    throw error;
  }
};

// Giriş işlemi
export const loginUser = async (email, password) => {
  try {
    // Firebase ile giriş yap
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Kullanıcı bilgilerini Firestore'dan al
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // JWT token al
    const token = await user.getIdToken();
    
    // Kullanıcı bilgilerini döndür
    return {
      token,
      user: {
        id: user.uid,
        username: userData.username || user.displayName,
        email: user.email,
        profile: userData.profile || {}
      }
    };
  } catch (error) {
    console.error("Giriş hatası:", error.message);
    throw error;
  }
};

// Çıkış işlemi
export const logoutUser = async () => {
  try {
    await signOut(auth);
    // LocalStorage'dan token ve kullanıcı bilgilerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('currentUser');
    return true;
  } catch (error) {
    console.error("Çıkış hatası:", error.message);
    throw error;
  }
};

// Şifre sıfırlama
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error.message);
    throw error;
  }
};

// Mevcut kullanıcıyı kontrol et
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Token kontrolü - JWT token ayrıştırma
export const parseJwt = (token) => {
  try {
    if (token && token.split('.').length === 3) {
      // Standard JWT token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
    return null;
  } catch (error) {
    console.error("Token ayrıştırma hatası:", error);
    return null;
  }
}; 