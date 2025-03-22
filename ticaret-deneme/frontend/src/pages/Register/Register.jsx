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
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setSnackbar({
          open: true,
          message: "Kayıt işlemi devam ediyor...",
          severity: "info",
        });

        const response = await axiosInstance.post("/auth/register", {
          username: values.username,
          email: values.email,
          password: values.password,
        });

        if (response.data.token) {
          setSnackbar({
            open: true,
            message: "Kayıt başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...",
            severity: "success",
          });

          setTimeout(() => navigate("/login"), 1500);
        }
      } catch (err) {
        let errorMessage = "Kayıt işlemi başarısız oldu!";
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          if (err.response.data.message.includes("email")) {
            errorMessage = "Bu e-posta adresi zaten kullanılıyor!";
          } else if (err.response.data.message.includes("username")) {
            errorMessage = "Bu kullanıcı adı zaten kullanılıyor!";
          }
        }
        setError(errorMessage);
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      } finally {
        setLoading(false);
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
              type={showPassword ? "text" : "password"}
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