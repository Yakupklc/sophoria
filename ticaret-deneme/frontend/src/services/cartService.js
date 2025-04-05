import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment, 
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";

// Kullanıcı sepetini getir
export const getCart = async () => {
  try {
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      // Kullanıcı oturum açmamışsa, yerel depolamadan sepeti al
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      return cartItems;
    }
    
    // Kullanıcı oturum açmışsa, Firestore'dan sepeti al
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().cart) {
      return userDoc.data().cart;
    } else {
      // Sepet yoksa boş dizi döndür
      return [];
    }
  } catch (error) {
    console.error("Sepet getirme hatası:", error);
    // Hata durumunda yerel depolamadan sepeti almayı dene
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    return cartItems;
  }
};

// Sepete ürün ekle
export const addToCart = async (product, quantity = 1) => {
  try {
    // Ürünün gerekli bilgilerini al
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: quantity,
      addedAt: new Date().toISOString()
    };
    
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      // Kullanıcı oturum açmamışsa, yerel depolamaya ekle
      let cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      
      // Eğer ürün zaten sepette varsa, miktarını artır
      const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
      if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        cartItems.push(cartItem);
      }
      
      localStorage.setItem("cart", JSON.stringify(cartItems));
      return cartItems;
    }
    
    // Kullanıcı oturum açmışsa, Firestore'a ekle
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Kullanıcı belgesi varsa, sepeti güncelle
      const cart = userDoc.data().cart || [];
      
      // Eğer ürün zaten sepette varsa, miktarını artır
      const existingItemIndex = cart.findIndex(item => item.id === product.id);
      if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantity;
        await updateDoc(userRef, { cart });
      } else {
        // Ürün sepette yoksa, yeni ürün olarak ekle
        await updateDoc(userRef, {
          cart: arrayUnion(cartItem)
        });
      }
      
      // Güncellenmiş sepeti al ve döndür
      const updatedUserDoc = await getDoc(userRef);
      return updatedUserDoc.data().cart;
    } else {
      // Kullanıcı belgesi yoksa oluştur
      await setDoc(userRef, {
        userId: user.uid,
        username: user.displayName || "",
        email: user.email,
        cart: [cartItem],
        createdAt: serverTimestamp()
      });
      
      return [cartItem];
    }
  } catch (error) {
    console.error("Sepete ürün ekleme hatası:", error);
    throw error;
  }
};

// Sepetten ürün çıkar
export const removeFromCart = async (productId) => {
  try {
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      // Kullanıcı oturum açmamışsa, yerel depolamadan çıkar
      let cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      cartItems = cartItems.filter(item => item.id !== productId);
      localStorage.setItem("cart", JSON.stringify(cartItems));
      return cartItems;
    }
    
    // Kullanıcı oturum açmışsa, Firestore'dan çıkar
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().cart) {
      const cart = userDoc.data().cart;
      const updatedCart = cart.filter(item => item.id !== productId);
      
      await updateDoc(userRef, { cart: updatedCart });
      
      return updatedCart;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Sepetten ürün çıkarma hatası:", error);
    throw error;
  }
};

// Sepet ürün miktarını güncelle
export const updateCartItemQuantity = async (productId, quantity) => {
  try {
    // Miktar 0 veya negatifse, ürünü sepetten çıkar
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      // Kullanıcı oturum açmamışsa, yerel depolamayı güncelle
      let cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      const itemIndex = cartItems.findIndex(item => item.id === productId);
      
      if (itemIndex !== -1) {
        cartItems[itemIndex].quantity = quantity;
        localStorage.setItem("cart", JSON.stringify(cartItems));
      }
      
      return cartItems;
    }
    
    // Kullanıcı oturum açmışsa, Firestore'u güncelle
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().cart) {
      const cart = userDoc.data().cart;
      const itemIndex = cart.findIndex(item => item.id === productId);
      
      if (itemIndex !== -1) {
        cart[itemIndex].quantity = quantity;
        await updateDoc(userRef, { cart });
      }
      
      return cart;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Sepet ürün miktarı güncelleme hatası:", error);
    throw error;
  }
};

// Sepeti temizle
export const clearCart = async () => {
  try {
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      // Kullanıcı oturum açmamışsa, yerel depolamayı temizle
      localStorage.removeItem("cart");
      return [];
    }
    
    // Kullanıcı oturum açmışsa, Firestore'daki sepeti temizle
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { cart: [] });
    
    return [];
  } catch (error) {
    console.error("Sepet temizleme hatası:", error);
    throw error;
  }
};

// Sipariş oluştur
export const createOrder = async (orderDetails) => {
  try {
    // Kullanıcı oturum açmış mı kontrol et
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Sipariş oluşturmak için oturum açmanız gerekiyor");
    }
    
    // Siparişi Firestore'a ekle
    const orderRef = collection(db, "orders");
    const newOrder = {
      userId: user.uid,
      items: orderDetails.items,
      shippingAddress: orderDetails.shippingAddress,
      billingAddress: orderDetails.billingAddress,
      paymentMethod: orderDetails.paymentMethod,
      totalAmount: orderDetails.totalAmount,
      status: "pending",
      createdAt: serverTimestamp()
    };
    
    const orderDoc = await addDoc(orderRef, newOrder);
    
    // Kullanıcı belgesine sipariş referansını ekle
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      orders: arrayUnion(orderDoc.id)
    });
    
    // Sepeti temizle
    await clearCart();
    
    return { id: orderDoc.id, ...newOrder };
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error);
    throw error;
  }
}; 