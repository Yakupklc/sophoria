import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Container,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
  Paper,
} from "@mui/material";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../config/axiosConfig";
import "./Register.css";

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .required("Kullanıcı adı gereklidir"),
  email: Yup.string()
    .email("Geçerli bir e-posta adresi girin")
    .required("E-posta gereklidir"),
  password: Yup.string()
    .min(6, "Şifre en az 6 karakter olmalıdır")
    .required("Şifre gereklidir"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Şifreler eşleşmelidir")
    .required("Şifre onayı gereklidir"),
  agreeTerms: Yup.bool().oneOf([true], "Kullanım koşullarını kabul etmelisiniz"),
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Kayıt işlemi başlatılıyor...", values.email);

        const response = await axiosInstance.post("/auth/register", {
          username: values.username,
          email: values.email,
          password: values.password,
        });

        console.log("Register response:", response.data);

        if (response.data.token) {
          // Token ve kullanıcı bilgilerini kaydet
          localStorage.setItem("token", response.data.token);
          
          // User bilgisini kaydet
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }

          const userData = {
            ...(response.data.user || { 
              username: values.username, 
              email: values.email,
              id: Date.now().toString() 
            }),
            isLoggedIn: true,
            loginTime: new Date().toISOString(),
          };

          localStorage.setItem("currentUser", JSON.stringify(userData));
          
          await new Promise((resolve) => setTimeout(resolve, 100));
          navigate("/");
        } else {
          // Token yoksa fallback çözümü
          console.warn("Token alınamadı, fallback çözüm kullanılıyor");
          localStorage.setItem("token", "mock-token-" + Date.now());
          localStorage.setItem("user", JSON.stringify({
            id: "user" + Date.now(),
            username: values.username,
            email: values.email
          }));
          
          navigate("/");
        }
      } catch (err) {
        console.error("Register Error:", err);
        
        // API erişilemiyor, test modu
        if (!err.response || err.message === "Network Error") {
          console.warn("API erişilemedi, test modu etkinleştiriliyor");
          localStorage.setItem("token", "mock-token-" + Date.now());
          localStorage.setItem("user", JSON.stringify({
            id: "user" + Date.now(),
            username: values.username,
            email: values.email
          }));
          
          await new Promise((resolve) => setTimeout(resolve, 100));
          navigate("/");
          return;
        }

        let errorMessage = "Kayıt işlemi başarısız oldu!";
        if (err.response?.status === 409) {
          errorMessage = "Bu e-posta adresi zaten kullanılıyor!";
        } else if (err.response?.status === 400) {
          errorMessage = "Lütfen tüm alanları doldurun!";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = "Bir hata oluştu, lütfen tekrar deneyin.";
        }

        console.error("Register Error:", err.response ? err.response.data : err.message);
        setError(errorMessage);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-page">
    <div className="auth-wrapper">
      <Container className="auth-container">
        <Paper className="auth-paper">
          <div className="auth-header">
            <Typography variant="h4" className="auth-title">
              SOPHORIA
            </Typography>
            <Typography variant="subtitle1" className="auth-subtitle">
              Yeni Bir Hesap Oluşturun
            </Typography>
          </div>

          <form onSubmit={formik.handleSubmit} className="auth-form">
            {error && <Alert severity="error" className="auth-error">{error}</Alert>}

            <TextField
              fullWidth
              id="username"
              name="username"
              label="Kullanıcı Adı"
              autoComplete="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              className="auth-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              id="email"
              name="email"
              label="E-posta Adresi"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              className="auth-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaEnvelope />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="password"
              label="Şifre"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              className="auth-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaLock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="confirmPassword"
              label="Şifreyi Onayla"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              className="auth-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaLock />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
            </Button>

            <div className="auth-links">
              <Typography className="auth-link-text" align="center">
                Zaten bir hesabınız var mı?{" "}
                <Button
                  onClick={() => navigate("/login")}
                  className="auth-link"
                >
                  Giriş Yap
                </Button>
              </Typography>
            </div>
          </form>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
    </div>
  );
};

export default Register;