import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

// Tüm ürünleri getir
export const getAllProducts = async () => {
  try {
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    return products;
  } catch (error) {
    console.error("Ürünleri getirme hatası:", error);
    throw error;
  }
};

// Ürün detaylarını getir
export const getProductById = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() };
    } else {
      throw new Error("Ürün bulunamadı");
    }
  } catch (error) {
    console.error("Ürün detayı getirme hatası:", error);
    throw error;
  }
};

// Kategori veya filtreye göre ürün getir
export const getProductsByCategory = async (category, sortBy = "price", sortOrder = "asc", itemLimit = 20) => {
  try {
    const productsRef = collection(db, "products");
    let q;
    
    if (category && category !== "all") {
      q = query(
        productsRef, 
        where("category", "==", category), 
        orderBy(sortBy, sortOrder === "asc" ? "asc" : "desc"),
        limit(itemLimit)
      );
    } else {
      q = query(
        productsRef, 
        orderBy(sortBy, sortOrder === "asc" ? "asc" : "desc"),
        limit(itemLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    return products;
  } catch (error) {
    console.error("Kategoriye göre ürün getirme hatası:", error);
    throw error;
  }
};

// Yeni ürün ekle (admin için)
export const addProduct = async (productData, imageFile) => {
  try {
    let imageUrl = null;
    
    // Eğer resim dosyası varsa, önce Storage'a yükle
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Firestore'a ürün bilgilerini ekle
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      image: imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...productData, image: imageUrl };
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    throw error;
  }
};

// Ürünü güncelle (admin için)
export const updateProduct = async (productId, productData, imageFile) => {
  try {
    const productRef = doc(db, "products", productId);
    
    // Mevcut ürün bilgilerini al
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error("Güncellenecek ürün bulunamadı");
    }
    
    let imageUrl = productDoc.data().image;
    
    // Eğer yeni resim dosyası varsa, önce eski resmi sil, sonra yeni resmi yükle
    if (imageFile) {
      // Eski resim varsa sil
      if (imageUrl) {
        try {
          const oldImageRef = ref(storage, imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn("Eski resim silme hatası:", error);
        }
      }
      
      // Yeni resmi yükle
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Firestore'daki ürün belgesini güncelle
    await updateDoc(productRef, {
      ...productData,
      image: imageUrl,
      updatedAt: serverTimestamp()
    });
    
    return { id: productId, ...productData, image: imageUrl };
  } catch (error) {
    console.error("Ürün güncelleme hatası:", error);
    throw error;
  }
};

// Ürünü sil (admin için)
export const deleteProduct = async (productId) => {
  try {
    // Önce ürün bilgilerini al (resim URL'si için)
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error("Silinecek ürün bulunamadı");
    }
    
    // Eğer ürünün resmi varsa, Storage'dan sil
    const imageUrl = productDoc.data().image;
    if (imageUrl) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn("Ürün resmi silme hatası:", error);
      }
    }
    
    // Firestore'dan ürünü sil
    await deleteDoc(productRef);
    
    return { success: true, id: productId };
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    throw error;
  }
};

// Ürün arama
export const searchProducts = async (searchTerm) => {
  try {
    // Firestore'da tam metin araması bulunmadığından,
    // tüm ürünleri çekip isimlerine göre filtreliyoruz
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      // Arama terimini içeren ürünleri filtrele (büyük/küçük harf duyarsız)
      if (
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        products.push(product);
      }
    });
    
    return products;
  } catch (error) {
    console.error("Ürün arama hatası:", error);
    throw error;
  }
}; 