import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { AuthContext } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  FormHelperText,
} from '@mui/material';

const Login = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { language, toggleLanguage } = useContext(LanguageContext);
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError(language === 'ar' ? 'الرجاء إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }
    const result = await login(username, password);
    if (result.success) {
      setError('');
      navigate('/users');
    } else {
      setError(result.message);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: darkMode ? 'background.default' : '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        fontFamily: 'Tahoma, Arial, sans-serif',
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Stack direction="row" spacing={2} mb={4}>
        <Button variant="outlined" onClick={toggleLanguage}>
          {language === 'ar' ? 'English' : 'العربية'}
        </Button>
        <Button variant="outlined" onClick={toggleTheme}>
          {darkMode
            ? language === 'ar' ? 'الوضع الفاتح' : 'Light Mode'
            : language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
        </Button>
      </Stack>

      <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 360 }}>
        <Typography variant="h5" textAlign="center" mb={3}>
          {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label={language === 'ar' ? 'اسم المستخدم' : 'Username'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
            autoComplete="username"
            required
          />
          <TextField
            label={language === 'ar' ? 'كلمة المرور' : 'Password'}
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
            autoComplete="current-password"
            required
          />
          {error && (
            <FormHelperText error sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
              {error}
            </FormHelperText>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ fontSize: 16 }}
          >
            {language === 'ar' ? 'دخول' : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;