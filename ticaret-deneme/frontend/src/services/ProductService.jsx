import axios from '../config/axiosConfig';

const ProductService = {
    async getAllProducts() {
        try {
            const response = await axios.get('/products');
            return response;
        } catch (error) {
            throw error;
        }
    },

    async getCategories() {
        try {
            const response = await axios.get('/categories');
            return response;
        } catch (error) {
            throw error;
        }
    },

    async addProduct(productData) {
        try {
            const response = await axios.post('/products', productData);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default ProductService;