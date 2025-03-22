import axiosInstance from '../config/axiosConfig';

export const getAllProducts = async (params = {}) => {
    try {
      const response = await axiosInstance.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Ürünler getirilirken hata oluştu' };
    }
  };

export const getUserProducts = async () => {
    try {
        const response = await axiosInstance.get('/products/user');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Ürünler getirilirken hata oluştu' };
    }
};

export const createProduct = async (productData) => {
    try {
        const response = await axiosInstance.post('/products', productData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Ürün eklenirken hata oluştu' };
    }
};

export const updateProduct = async (id, updates) => {
    try {
        const response = await axiosInstance.put(`/products/${id}`, updates);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Ürün güncellenirken hata oluştu' };
    }
};

export const deleteProduct = async (id) => {
    try {
        const response = await axiosInstance.delete(`/products/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Ürün silinirken hata oluştu' };
    }
};