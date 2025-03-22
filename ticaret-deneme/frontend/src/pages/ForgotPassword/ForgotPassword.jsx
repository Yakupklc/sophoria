import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  InputAdornment,
  IconButton,
  Alert as MuiAlert,
  Snackbar,
  Paper,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import {
  FaEnvelope,
  FaArrowLeft,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../config/axiosConfig";
import "./ForgotPassword.css";

// Alert bileşeni
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// 6 haneli doğrulama kodu kutucukları için bileşen
const VerificationInput = ({ verificationCode, setVerificationCode }) => {
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef());

  const handleVerificationChange = (e, index) => {
    const value = e.target.value;
    if (value && /^[0-9]$/.test(value)) {
      const newVerificationCode = [...verificationCode];
      newVerificationCode[index] = value;
      setVerificationCode(newVerificationCode);
      if (index < 5 && value) {
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setVerificationCode(digits);
      inputRefs[5].current.focus();
    }
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center" className="verification-inputs">
      {verificationCode.map((digit, index) => (
        <TextField
          key={index}
          inputRef={inputRefs[index]}
          value={digit}
          onChange={(e) => handleVerificationChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          variant="outlined"
          inputProps={{
            maxLength: 1,
            className: "verification-input",
          }}
          sx={{
            width: "48px",
            height: "60px",
            "& input": { textAlign: "center", fontSize: "1.5rem" },
          }}
        />
      ))}
    </Stack>
  );
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(""));
  const [resetToken, setResetToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(""); // E-posta her değiştiğinde hata mesajını temizle
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setSnackbar({
        open: true,
        message: "Lütfen e-posta adresinizi girin",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: "Doğrulama kodu gönderiliyor...",
        severity: "info",
      });

      const response = await axiosInstance.post("/auth/forgot-password", { email });
      console.log("Forgot Password Response:", response.data);

      setSnackbar({
        open: true,
        message: response.data.message || "Doğrulama kodu e-posta adresinize gönderildi!",
        severity: "success",
      });
      setError(""); // Doğru e-posta girildiğinde hata mesajını temizle
      setStep(2);
    } catch (err) {
      console.error("Forgot Password Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      setError(errorMessage); // Yanlış e-posta için hata mesajı ayarla
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    const enteredCode = verificationCode.join("");
    if (enteredCode.length !== 6) {
      setSnackbar({
        open: true,
        message: "Lütfen 6 haneli doğrulama kodunu girin",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/verify-code", {
        email,
        code: enteredCode,
      });
      console.log("Verify Code Response:", response.data);

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setSnackbar({
          open: true,
          message: "Doğrulama başarılı!",
          severity: "success",
        });
        setError(""); // Doğru kod girildiğinde hata mesajını temizle
        setTimeout(() => setStep(3), 500);
      }
    } catch (err) {
      console.error("Verify Code Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || "Doğrulama kodu yanlış veya süresi dolmuş.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      setError(errorMessage); // Yanlış kod için farklı hata mesajı ayarla
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: "Şifreler eşleşmiyor",
        severity: "error",
      });
      return;
    }

    if (newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: "Şifre en az 8 karakter olmalıdır",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: "Şifreniz değiştiriliyor...",
        severity: "info",
      });

      const response = await axiosInstance.post("/auth/reset-password", {
        resetToken,
        newPassword,
      });
      console.log("Reset Password Response:", response.data);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: "Şifreniz başarıyla değiştirildi!",
          severity: "success",
        });
        setError(""); // Başarılı olursa hata mesajını temizle
        setStep(4);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Reset Password Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || "Şifre değiştirme başarısız oldu.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return <FaEnvelope size={30} className="forgot-password-icon" />;
      case 2: return <FaKey size={30} className="forgot-password-icon" />;
      case 3: return <FaLock size={30} className="forgot-password-icon" />;
      case 4: return <FaCheck size={30} className="success-icon" />;
      default: return <FaEnvelope size={30} className="forgot-password-icon" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Şifremi Unuttum";
      case 2: return "Doğrulama Kodu";
      case 3: return "Yeni Şifre Oluştur";
      case 4: return "Şifre Değiştirildi";
      default: return "Şifremi Unuttum";
    }
  };

  return (
    <Container disableGutters maxWidth={false}>
      <div className="forgot-password-container">
        <Paper elevation={3} className="forgot-password-paper">
          <div className="forgot-password-header">
            {getStepIcon()}
            <Typography component="h1" variant="h5">
              {getStepTitle()}
            </Typography>
          </div>

          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <Typography variant="body2" color="text.secondary" className="instructions">
                Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.
              </Typography>
              <TextField
                className="form-field"
                required
                fullWidth
                id="email"
                label="E-posta Adresi"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaEnvelope />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" style={{ marginRight: "8px" }} />
                    Gönderiliyor...
                  </>
                ) : (
                  "Doğrulama Kodu Gönder"
                )}
              </Button>
              <div className="login-link">
                <Typography variant="body2" color="text.secondary">
                  Şifrenizi hatırladınız mı?{" "}
                  <Button onClick={() => navigate("/login")} sx={{ textTransform: "none" }}>
                    Giriş Yap
                  </Button>
                </Typography>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerificationSubmit}>
              <Typography variant="body2" color="text.secondary" className="instructions">
                {email} adresine gönderilen 6 haneli doğrulama kodunu girin.
              </Typography>
              <VerificationInput
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="submit-button verification-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" style={{ marginRight: "8px" }} />
                    Doğrulanıyor...
                  </>
                ) : (
                  "Doğrula ve Devam Et"
                )}
              </Button>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                <Button
                  onClick={() => setStep(1)}
                  startIcon={<FaArrowLeft />}
                  sx={{ textTransform: "none" }}
                >
                  Geri Dön
                </Button>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  sx={{ textTransform: "none" }}
                >
                  Kodu Tekrar Gönder
                </Button>
              </Box>
            </form>
          )}

{step === 3 && (
  <form onSubmit={handlePasswordSubmit}>
    <Typography variant="body2" color="text.secondary" className="instructions">
      {email} hesabı için yeni bir şifre oluşturun.
    </Typography>
    {/* Gizli username alanı eklendi */}
    <input
      type="text"
      name="username"
      autoComplete="username"
      style={{ display: 'none' }}
      defaultValue={email}
    />
    <TextField
      className="form-field"
      required
      fullWidth
      name="newPassword"
      label="Yeni Şifre"
      type={showPassword ? "text" : "password"}
      id="newPassword"
      value={passwordData.newPassword}
      onChange={handlePasswordChange}
      autoComplete="new-password"
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
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
    <TextField
      className="form-field"
      required
      fullWidth
      name="confirmPassword"
      label="Şifreyi Tekrar Girin"
      type={showConfirmPassword ? "text" : "password"}
      id="confirmPassword"
      value={passwordData.confirmPassword}
      onChange={handlePasswordChange}
      autoComplete="new-password"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FaLock />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              edge="end"
            >
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
    <Button
      type="submit"
      fullWidth
      variant="contained"
      className="submit-button"
      disabled={loading}
    >
      {loading ? (
        <>
          <CircularProgress size={20} color="inherit" style={{ marginRight: "8px" }} />
          İşleniyor...
        </>
      ) : (
        "Şifremi Değiştir"
      )}
    </Button>
    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
      <Button
        onClick={() => setStep(2)}
        startIcon={<FaArrowLeft />}
        sx={{ textTransform: "none" }}
      >
        Geri Dön
      </Button>
    </Box>
  </form>
)}

          {step === 4 && (
            <div className="success-message">
              <Typography variant="body1" gutterBottom>
                Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
                className="login-button"
                startIcon={<FaArrowLeft />}
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          )}
        </Paper>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            "&.MuiAlert-filledSuccess": { backgroundColor: "#483D8B", color: "white" },
            "&.MuiAlert-filledError": { backgroundColor: "#8B0000", color: "white" },
            "&.MuiAlert-filledInfo": { backgroundColor: "#483D8B", color: "white" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgotPassword;