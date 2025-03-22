import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../config/axiosConfig";
import Navbar from "../../components/navbar/Navbar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Lock,
  Package2,
  LogOut,
} from "lucide-react";
import "./Profile.css";
import ProfileQuestions from "../../components/ProfileQuestions/ProfileQuestions";
import ChangePasswordModal from "../../components/ChangePasswordModal/ChangePasswordModal";
import ProductModal from "../../components/ProductModal/ProductModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";
import OrderPanel from "../../components/OrderPanel/OrderPanel";
import DeleteAccountModal from "../../components/DeleteAccountModal/DeleteAccountModal";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    username: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    productId: null,
    productName: "",
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axiosInstance.get("/users/profile");
        setUser(userResponse.data);
        setEditedInfo({
          username: userResponse.data.username || "",
          fullName: userResponse.data.profile?.fullName || "",
          phone: userResponse.data.profile?.phone || "",
          address: userResponse.data.profile?.address || "",
        });

        const productsResponse = await axiosInstance.get("/products/user");
        setUserProducts(productsResponse.data);

        const ordersResponse = await axiosInstance.get("/orders");
        setOrders(ordersResponse.data.orders);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserData();
  }, [navigate]);

  const handleSaveChanges = async () => {
    try {
      const response = await axiosInstance.put("/users/profile", editedInfo);
  
      if (response.data.success) {
        setUser((prev) => ({
          ...prev,
          username: response.data.user.username,
          profile: response.data.user.profile,
        }));
  
        // LocalStorage'daki currentUser bilgisini güncelle
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            username: response.data.user.username,
            profile: response.data.user.profile,
          })
        );
  
        setIsEditing(false);
        alert("Profil başarıyla güncellendi!");
      } else {
        alert(response.data.message || "Profil güncellenirken bir hata oluştu!");
      }
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      if (error.response?.status === 400) {
        alert(error.response.data.message);
      } else {
        alert("Profil güncellenirken bir hata oluştu!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsEditingProduct(true);
  };

  const handleEditCancel = () => {
    setIsEditingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteAccount = async (password) => {
    setIsDeletingAccount(true);
    try {
      const response = await axiosInstance.delete('/users/account', {
        data: { password }
      });
      
      if (response.data.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        navigate('/login');
      }
    } catch (error) {
      // Sadece geliştirme ortamında konsola yazdır
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete account error:', error);
      }
  
      // Kullanıcıya gösterilecek hata mesajını belirle
      let errorMessage = 'Hesap silinirken bir hata oluştu';
      
      if (error.response?.status === 401) {
        errorMessage = 'Girdiğiniz şifre yanlış. Lütfen kontrol edip tekrar deneyin.';
      }
  
      alert(errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateProduct = async (updatedProductData) => {
    try {
      await axiosInstance.put(
        `/products/${editingProduct._id}`,
        updatedProductData
      );
      const productsResponse = await axiosInstance.get("/products/user");
      setUserProducts(productsResponse.data);
      setIsEditingProduct(false);
      setEditingProduct(null);
      alert("Ürün başarıyla güncellendi!");
    } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      alert("Ürün güncellenirken bir hata oluştu!");
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await axiosInstance.post("/products", productData);
      const productsResponse = await axiosInstance.get("/products/user");
      setUserProducts(productsResponse.data);
      setIsAddingProduct(false);
      alert("Ürün başarıyla eklendi!");
    } catch (error) {
      console.error("Ürün ekleme hatası:", error);
      alert("Ürün eklenirken bir hata oluştu!");
    }
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm({
      show: true,
      productId: product._id,
      productName: product.name,
    });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, productId: null, productName: "" });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/products/${deleteConfirm.productId}`);
      const productsResponse = await axiosInstance.get("/products/user");
      setUserProducts(productsResponse.data);
      setDeleteConfirm({ show: false, productId: null, productName: "" });
      alert("Ürün başarıyla silindi!");
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Ürün silinirken bir hata oluştu!");
    }
  };

  const handleChangePassword = async (passwordData) => {
    setPasswordLoading(true);
    try {
      await axiosInstance.post("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      alert("Şifreniz başarıyla değiştirildi!");
      setIsChangingPassword(false);
    } catch (error) {
      console.error("Şifre değiştirme hatası:", error);
      alert("Şifre değiştirilirken bir hata oluştu!");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return <div className="loading">Profil yükleniyor...</div>;

  return (
    <div className="has-navbar">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar">
            <User size={64} />
          </div>
          <h1>{user.username}</h1>
          <button
            className="delete-button"
            onClick={() => setIsDeleteAccountModalOpen(true)}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Hesabı Sil"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="profile-content">
          <div className="info-section">
            <h2>Kişisel Bilgiler</h2>
            <div className="info-grid">
              <div className="info-item">
                <Mail />
                <div className="info-details">
                  <span className="label">Email</span>
                  <span className="value">{user.email}</span>
                </div>
              </div>
              {isEditing ? (
                <>
                  <div className="info-item">
                    <User />
                    <div className="info-details">
                      <span className="label">Kullanıcı Adı</span>
                      <input
                        type="text"
                        value={editedInfo.username}
                        onChange={(e) =>
                          setEditedInfo({
                            ...editedInfo,
                            username: e.target.value,
                          })
                        }
                        placeholder="Kullanıcı adı"
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <Phone />
                    <div className="info-details">
                      <span className="label">Telefon</span>
                      <input
                        type="tel"
                        value={editedInfo.phone}
                        onChange={(e) =>
                          setEditedInfo({
                            ...editedInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Telefon numarası"
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <User />
                    <div className="info-details">
                      <span className="label">Ad Soyad</span>
                      <input
                        type="text"
                        value={editedInfo.fullName}
                        onChange={(e) =>
                          setEditedInfo({
                            ...editedInfo,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="Ad Soyad"
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <MapPin />
                    <div className="info-details">
                      <span className="label">Adres</span>
                      <input
                        type="text"
                        value={editedInfo.address}
                        onChange={(e) =>
                          setEditedInfo({
                            ...editedInfo,
                            address: e.target.value,
                          })
                        }
                        placeholder="Adres"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-item">
                    <User />
                    <div className="info-details">
                      <span className="label">Kullanıcı Adı</span>
                      <span className="value">{user.username}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <Phone />
                    <div className="info-details">
                      <span className="label">Telefon</span>
                      <span className="value">
                        {user.profile?.phone || "Belirtilmemiş"}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <User />
                    <div className="info-details">
                      <span className="label">Ad Soyad</span>
                      <span className="value">
                        {user.profile?.fullName || "Belirtilmemiş"}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <MapPin />
                    <div className="info-details">
                      <span className="label">Adres</span>
                      <span className="value">
                        {user.profile?.address || "Belirtilmemiş"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="button-group">
              {isEditing ? (
                <>
                  <button className="save-button" onClick={handleSaveChanges}>
                    Kaydet
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => setIsEditing(false)}
                  >
                    İptal
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Bilgileri Düzenle
                  </button>
                  <button
                    className="change-password-button"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <Lock size={16} className="button-icon" />
                    Şifremi Değiştir
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="products-section">
            <div className="products-header">
              <h2>Ürünlerim</h2>
              <button
                className="add-product-button"
                onClick={() => setIsAddingProduct(true)}
              >
                <Plus size={16} /> Ürün Ekle
              </button>
            </div>

            <div className="products-compact-grid">
              {userProducts.map((product) => (
                <div key={product._id} className="product-compact-item">
                  <div
                    className="product-compact-image"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.name}
                    />
                    <div className="product-price-badge">
                      {product.price} TL
                    </div>
                  </div>

                  <div className="product-compact-details">
                    <h3 onClick={() => navigate(`/product/${product._id}`)}>
                      {product.name}
                    </h3>

                    <div className="product-compact-actions">
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(product);
                        }}
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(product);
                        }}
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="orders-section">
            <h2>Sipariş Geçmişi</h2>
            <div className="orders-grid">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="order-card"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-item-preview">
                    <img
                      src={
                        order.items[0]?.product?.images?.[0] ||
                        order.items[0]?.product?.image
                      }
                      alt={order.items[0]?.name}
                    />
                  </div>
                  <div className="order-card-info">
                    <span className="order-number">#{order.orderNumber}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="order-total">
                      {order.totalAmount.toLocaleString("tr-TR")} TL
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <h2>Gelen Sorular</h2>
            <ProfileQuestions />
          </div>
        </div>

        {/* Modallar */}
        {isAddingProduct && (
          <ProductModal
            mode="add"
            onSubmit={handleAddProduct}
            onClose={() => setIsAddingProduct(false)}
          />
        )}

{isDeleteAccountModalOpen && (
  <DeleteAccountModal
    onClose={() => setIsDeleteAccountModalOpen(false)}
    onConfirm={handleDeleteAccount}
    isLoading={isDeletingAccount}
    username={user.username}  // username prop'unu ekliyoruz
  />
)}

        {isEditingProduct && editingProduct && (
          <ProductModal
            mode="edit"
            initialProduct={editingProduct}
            onSubmit={handleUpdateProduct}
            onClose={handleEditCancel}
          />
        )}

        {deleteConfirm.show && (
          <DeleteConfirmModal
            productName={deleteConfirm.productName}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}

        {isChangingPassword && (
          <ChangePasswordModal
            onClose={() => setIsChangingPassword(false)}
            onSubmit={handleChangePassword}
            isLoading={passwordLoading}
          />
        )}

        {selectedOrder && (
          <OrderPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
