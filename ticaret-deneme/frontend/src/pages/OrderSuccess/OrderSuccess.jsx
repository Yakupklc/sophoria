import React, { useState, useEffect } from 'react';
import { Package2, Clock, Truck, CheckCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom'; 
import axiosInstance from '../../config/axiosConfig';
import Navbar from '../../components/navbar/Navbar';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get('/orders');
      setOrders(response.data.orders);
      setLoading(false);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      setOrders([
        {
          _id: '1',
          orderNumber: '2024001',
          createdAt: new Date(),
          status: 'processing',
          items: [
            {
              _id: 'item1',
              name: 'Modern Koltuk',
              quantity: 1,
              price: 5999,
              product: {
                _id: 'product1', // Ürün ID’si eklendi
                images: ['/api/placeholder/400/400']
              }
            }
          ],
          shippingAddress: {
            address: 'Örnek Mahallesi, 123 Sokak No:4',
            district: 'Kadıköy',
            city: 'İstanbul'
          },
          totalAmount: 5999
        }
      ]);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package2 className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusStyle = (status) => {
    const baseStyle = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-pulse";
    switch (status) {
      case 'pending':
        return `${baseStyle} bg-amber-100 text-amber-800`;
      case 'processing':
        return `${baseStyle} bg-blue-100 text-blue-800`;
      case 'shipped':
        return `${baseStyle} bg-emerald-100 text-emerald-800`;
      case 'delivered':
        return `${baseStyle} bg-green-100 text-green-800`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Beklemede',
      processing: 'Hazırlanıyor',
      shipped: 'Kargoda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="p-8 bg-white rounded-2xl shadow-lg text-center max-w-md w-full animate-fade-in">
            <Package2 className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz Siparişiniz Yok</h2>
            <p className="text-gray-600 mb-6">Alışverişe başlamak için ürünleri keşfedin.</p>
            <a 
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Alışverişe Başla
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="has-navbar">
    <div className="min-h-screen bg-gray-50 py-8 px-4 has-navbar">
      <Navbar />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Siparişlerim</h1>
        
        <div className="space-y-6">
          {orders.map((order, index) => (
            <div 
              key={order._id} 
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sipariş #{order.orderNumber}
                    </h3>
                  </div>
                  <div className={getStatusStyle(order.status)}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <Link 
                      key={item._id} 
                      to={`/product/${item.product._id}`} // ProductPage’e yönlendirme
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <img
                        src={item.product.images?.[0]}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 font-medium truncate">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">{item.quantity} adet</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform" />
                    </Link>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Teslimat Adresi</h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.address}, {order.shippingAddress.district} / {order.shippingAddress.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Toplam Tutar</span>
                      <p className="text-xl font-semibold text-gray-900 mt-1">
                        {order.totalAmount.toLocaleString('tr-TR')} TL
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default OrderSuccess;