import axios from '../config/axiosConfig';

const LoginService = {
    async login(credentials) {
        try {
            console.log('Login attempt with:', credentials);
            
            // Tüm kullanıcıları getir
            const response = await axios.get('/users');
            console.log('Users from server:', response.data);
            
            const users = response.data;

            // Giriş yapan kullanıcıyı bul
            const user = users.find(
                u => (u.username === credentials.username || u.email === credentials.username) &&
                     u.password === credentials.password
            );

            console.log('Matched user:', user);

            if (user) {
                // Şifreyi client tarafında tutmamak için kaldırıyoruz
                const { password, ...userWithoutPassword } = user;
                return { 
                    success: true, 
                    user: userWithoutPassword 
                };
            } else {
                throw new Error('Kullanıcı adı veya şifre hatalı!');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response) {
                // Server kaynaklı hata
                console.error('Server error:', error.response.data);
                throw new Error('Sunucu hatası: ' + error.response.data);
            } else if (error.request) {
                // İstek yapıldı ama cevap alınamadı
                console.error('Network error:', error.request);
                throw new Error('Ağ hatası: Sunucuya ulaşılamıyor');
            } else {
                // İstek oluşturulurken hata
                throw error;
            }
        }
    }
};

export default LoginService;