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
  Paper,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../config/axiosConfig";
import "./Login.css";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Geçerli bir e-posta adresi girin")
    .required("E-posta gereklidir"),
  password: Yup.string()
    .min(6, "Şifre en az 6 karakter olmalıdır")
    .required("Şifre gereklidir"),
});

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      // Formun varsayılan davranışını tamamen engelle
      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.post("/auth/login", {
          email: values.email,
          password: values.password,
        });

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);

          const userData = {
            ...response.data.user,
            isLoggedIn: true,
            loginTime: new Date().toISOString(),
          };

          if (rememberMe) {
            localStorage.setItem("currentUser", JSON.stringify(userData));
            sessionStorage.removeItem("currentUser");
          } else {
            sessionStorage.setItem("currentUser", JSON.stringify(userData));
            localStorage.removeItem("currentUser");
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
          navigate("/");
        }
      } catch (err) {
        let errorMessage = "E-posta adresi veya şifre hatalı!";
        if (err.response?.status === 404) {
          errorMessage = "Bu e-posta adresi ile kayıtlı bir hesap bulunamadı!";
        } else if (err.response?.status === 400) {
          errorMessage = "Lütfen tüm alanları doldurun!";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = "Bir hata oluştu, lütfen tekrar deneyin.";
        }

        console.error("Login Error:", err.response ? err.response.data : err.message);
        setError(errorMessage);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-wrapper">
      <Container className="auth-container" disableGutters maxWidth={false}>
        <Paper className="auth-paper">
          <div className="auth-header">
            <Typography variant="h4" className="auth-title">
              SOPHORIA
            </Typography>
            <Typography variant="subtitle1" className="auth-subtitle">
              Hesabınıza Giriş Yapın
            </Typography>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit(e);
            }}
            className="auth-form"
          >
            {/* Hata mesajını formun altına kırmızı Alert ile gösteriyoruz (ForgotPassword gibi) */}
            {error && (
              <Alert
                severity="error"
                className="auth-error"
                sx={{
                  backgroundColor: "#ffebee", // Hafif kırmızı arka plan
                  color: "#d32f2f", // Koyu kırmızı metin
                  fontSize: "0.9rem",
                  borderRadius: "10px",
                  marginBottom: "1rem",
                  fontFamily: "'Roboto', sans-serif",
                  padding: "0.5rem 1rem",
                  opacity: 1, // Tamamen görünür
                  transition: "opacity 0.5s ease-in-out", // Daha uzun bir geçiş
                  zIndex: 1000, // Üstte kalmasını sağla
                }}
              >
                {error}
              </Alert>
            )}

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
              autoComplete="current-password"
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
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <div className="auth-options">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label="Beni Hatırla"
                className="remember-me"
              />
              <Button
                onClick={() => navigate("/forgot-password")}
                className="forgot-password"
              >
                Şifremi Unuttum
              </Button>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>

            <div className="auth-links">
              <Typography className="auth-link-text" align="center">
                Hesabınız yok mu?{" "}
                <Button
                  onClick={() => navigate("/register")}
                  className="auth-link"
                >
                  Kayıt Ol
                </Button>
              </Typography>
            </div>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;