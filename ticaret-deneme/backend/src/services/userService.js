//userService
import axiosInstance from '../config/axiosConfig';

export const updateProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put('/users/profile', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Profil güncellenirken hata oluştu' };
    }
};

export const getProfile = async () => {
    try {
        const response = await axiosInstance.get('/users/profile');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Profil bilgileri getirilirken hata oluştu' };
    }
};