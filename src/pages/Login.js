import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Falha ao fazer login. Verifique suas credenciais.');
      console.error(error);
    }
    
    setLoading(false);
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        background: 'linear-gradient(120deg, #E8DCC5 0%, #FFFFFF 100%)'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'white'
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                mb: 1 
              }}
            >
              Composição
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Sistema de gestão de projetos
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Entrar"
                )}
              </Button>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary.main">
                    Não tem uma conta? Cadastre-se
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}