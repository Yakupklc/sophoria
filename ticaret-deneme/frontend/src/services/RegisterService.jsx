import axios from '../config/axiosConfig';

const RegisterService = {
    async register(newUser) {
        try {
            // Mevcut kullanıcıları getir
            const existingUsers = await axios.get('/users');
            
            // Email kontrolü
            const emailExists = existingUsers.data.some(
                user => user.email.toLowerCase() === newUser.email.toLowerCase()
            );
            if (emailExists) {
                const error = new Error('Bu email adresi zaten kullanılıyor!');
                error.type = 'email_exists';
                throw error;
            }

            // Username kontrolü
            const usernameExists = existingUsers.data.some(
                user => user.username.toLowerCase() === newUser.username.toLowerCase()
            );
            if (usernameExists) {
                const error = new Error('Bu kullanıcı adı zaten kullanılıyor!');
                error.type = 'username_exists';
                throw error;
            }

            // Kontroller geçildi, yeni kullanıcıyı kaydet
            const response = await axios.post('/users', newUser);
            return {
                success: true,
                data: response.data,
                message: 'Kayıt başarıyla tamamlandı!'
            };

        } catch (error) {
            if (error.type === 'email_exists' || error.type === 'username_exists') {
                throw error;
            }
            throw new Error('Kayıt işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
}

export default RegisterService;