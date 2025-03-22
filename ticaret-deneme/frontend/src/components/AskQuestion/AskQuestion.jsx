import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextareaAutosize,
  Button,
  Stack,
  IconButton,
  Alert as MuiAlert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { X } from 'lucide-react';
import './AskQuestion.css';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const AskQuestion = ({ isOpen, onClose, onSubmit, productId }) => {
  const [question, setQuestion] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);
    setError(''); // Hata mesajını sıfırla

    // question’ın boş olmadığını kontrol et
    if (!question || question.trim() === '') {
      setError('Lütfen bir soru girin.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(question.trim()); // Boşlukları temizle ve gönder
      setQuestion('');
      setSubmissionStatus('success');
    } catch (error) {
      setSubmissionStatus('error');
      console.error('Soru gönderme hatası:', error.message);
      setError(error.message || 'Soru gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => onClose(), 3000); // 3 saniye sonra modal kapanır
    }
  };

  const handleCloseSnackbar = () => {
    setSubmissionStatus(null);
    setError(''); // Snackbar kapandığında hata mesajını sıfırla
  };

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <Paper elevation={4} className="question-modal">
        <div className="modal-header">
          <Typography variant="h5" component="h3" className="modal-title">
            Satıcıya Soru Sor
          </Typography>
          <IconButton className="close-button" onClick={onClose} aria-label="Close">
            <X size={24} />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit} className="modal-content">
          <Stack spacing={1.5}>
            <TextareaAutosize
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Sorunuzu yazın..."
              required
              minRows={3}
              maxRows={4} // Daha kompakt bir boyut
              className={`question-input ${error ? 'error' : ''}`} // Hata varsa stil ekle
              aria-label="Soru girişi"
            />
            {error && (
              <Typography variant="caption" color="error" sx={{ marginTop: '-8px' }}>
                {error}
              </Typography>
            )}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                className="cancel-button"
                onClick={onClose}
                disabled={isSubmitting}
                sx={{ textTransform: 'none', borderRadius: '10px' }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                className="submit-button"
                disabled={isSubmitting}
                sx={{ textTransform: 'none', borderRadius: '10px' }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={20} color="inherit" style={{ marginRight: '8px' }} />
                    Gönderiliyor...
                  </>
                ) : (
                  'Gönder'
                )}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={submissionStatus === 'success' || submissionStatus === 'error'}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={submissionStatus === 'success' ? 'success' : 'error'}
          sx={{
            width: '100%',
            '&.MuiAlert-filledSuccess': { backgroundColor: '#483D8B', color: 'white' },
            '&.MuiAlert-filledError': { backgroundColor: '#8B0000', color: 'white' },
          }}
        >
          {submissionStatus === 'success' 
            ? 'Sorunuz başarıyla gönderildi!' 
            : 'Soru gönderilirken bir hata oluştu.'}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AskQuestion;