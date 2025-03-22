import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../config/axiosConfig";
import { getCurrentUser } from '../utils/authUtils';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cartItems");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.warn("Sepet yüklenirken hata:", error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const currentUser = getCurrentUser(); // JWT'den user bilgisini al

  useEffect(() => {
    const fetchCartItems = async () => {
      const savedCart = localStorage.getItem("cartItems");
      if (!savedCart) {
        setCartItems([]);
        return;
      }

      const parsedCart = JSON.parse(savedCart);
      try {
        const updatedItems = await Promise.all(
          parsedCart.map(async (item) => {
            try {
              const response = await axiosInstance.get(`/products/${item._id}`);
              const productData = response.data;
              return {
                _id: item._id,
                quantity: item.quantity,
                name: productData.name || "Bilinmeyen Ürün",
                price: productData.price || 0,
                images: productData.images || [],
                stock: productData.stock || 0,
                userId: productData.userId, // Ürün sahibi ID'sini ekle
              };
            } catch (error) {
              console.error(`Ürün ${item._id} alınamadı:`, error.response?.status || error.message);
              if (error.response?.status === 404) {
                return null;
              }
              return {
                _id: item._id,
                quantity: item.quantity,
                name: "Ürün Bulunamadı",
                price: 0,
                images: [],
                stock: 0,
              };
            }
          })
        );
        setCartItems(updatedItems.filter((item) => item !== null));
      } catch (error) {
        console.warn("Sepet API ile güncellenemedi:", error);
        setCartItems(parsedCart);
      }
    };
    fetchCartItems();
  }, []);

  useEffect(() => {
    try {
      const minimalCart = cartItems.map((item) => ({
        _id: item._id,
        quantity: item.quantity,
      }));
      localStorage.setItem("cartItems", JSON.stringify(minimalCart));
    } catch (error) {
      console.warn("Sepet kaydedilemedi:", error);
      if (error.name === "QuotaExceededError") {
        alert("Sepetiniz çok büyük, lütfen sepetinizi temizleyin.");
      }
    }
  }, [cartItems]);

  const addToCart = (product) => {
    // Ürün kullanıcının kendisine aitse eklemeyi engelle
    if (currentUser && product.userId === currentUser.userId) { // _id yerine userId
      alert('Kendi ürününüzü sepete ekleyemezsiniz!');
      return;
    }
  
    setCartItems((prev) => {
      const existingProduct = prev.find((item) => item._id === product._id);
      if (existingProduct && existingProduct.quantity + 1 > (product.stock || 0)) {
        alert(`Bu üründen en fazla ${product.stock} adet ekleyebilirsiniz!`);
        return prev;
      }
      if (existingProduct) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name || "Bilinmeyen Ürün",
          price: product.price || 0,
          images: product.images || [],
          stock: product.stock || 0,
          quantity: 1,
          userId: product.userId,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const decreaseQuantity = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item._id === productId
            ? item.quantity === 1
              ? null
              : { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        getCartCount,
        getCartTotal,
        isCartOpen,
        toggleCart,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};