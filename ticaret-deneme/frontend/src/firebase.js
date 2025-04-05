// Firebase yapılandırması
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase yapılandırma bilgileri - bunları Firebase konsolundan almalısınız
const firebaseConfig = {
  apiKey: "AIzaSyC6xxxxxxxxxxxxxxxxxxxxxxxxx", // Firebase konsolundan alınacak
  authDomain: "e-ticaret-app.firebaseapp.com", // Firebase konsolundan alınacak
  projectId: "e-ticaret-app", // Firebase konsolundan alınacak
  storageBucket: "e-ticaret-app.appspot.com", // Firebase konsolundan alınacak
  messagingSenderId: "123456789000", // Firebase konsolundan alınacak
  appId: "1:123456789000:web:abcdefghijklmnopqrst", // Firebase konsolundan alınacak
  measurementId: "G-ABCDEFGHIJ" // Firebase konsolundan alınacak (opsiyonel)
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app); // Kullanıcı kimlik doğrulama
export const db = getFirestore(app); // Firestore veritabanı
export const storage = getStorage(app); // Firebase storage

export default app; 