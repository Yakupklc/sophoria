# E-Ticaret Projesi

Bu proje, React ve Firebase kullanılarak oluşturulmuş bir e-ticaret uygulamasıdır.

## Özellikler

- Kullanıcı kimlik doğrulama (giriş, kayıt, şifre sıfırlama)
- Ürün listeleme ve arama
- Ürün detay sayfaları
- Sepet yönetimi
- Sipariş oluşturma ve takip

## Teknolojiler

- React
- Firebase (Authentication, Firestore, Storage)
- React Router
- Vite

## Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/Yakupklc/sophoria.git

# Proje dizinine gidin
cd sophoria/ticaret-deneme/frontend

# Bağımlılıkları yükleyin
npm install
```

## Geliştirme

```bash
# Geliştirme sunucusunu başlatın
npm run dev
```

## Yapılandırma

Firebase yapılandırması için `src/firebase.js` dosyasını düzenleyin:

```javascript
// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Derleme ve Dağıtım

```bash
# Projeyi derleyin
npm run build

# Firebase CLI'yi yükleyin (henüz yoksa)
npm install -g firebase-tools

# Firebase'e giriş yapın
firebase login

# Firebase projesi oluşturun
firebase init

# Firebase'e dağıtın
firebase deploy
```

## Firebase Dağıtım Adımları

1. Firebase hesabı oluşturun ve oturum açın.
2. Firebase konsolundan yeni bir proje oluşturun.
3. Authentication, Firestore ve Storage servislerini etkinleştirin.
4. Firebase CLI'yi yükleyin: `npm install -g firebase-tools`
5. Terminal üzerinden Firebase'e giriş yapın: `firebase login`
6. Aşağıdaki komutlarla projeyi dağıtın:

```bash
# Firebase CLI'ye giriş yapın
firebase login

# Projeyi derleyin
npm run build

# Firebase'e dağıtın
firebase deploy
```

## Proje Yapısı

- `src/components/`: UI bileşenleri
- `src/pages/`: Sayfa bileşenleri
- `src/services/`: API ve Firebase servis fonksiyonları
- `src/context/`: Context API tanımlamaları
- `src/utils/`: Yardımcı fonksiyonlar
- `src/firebase.js`: Firebase yapılandırması

## Lisans

MIT
