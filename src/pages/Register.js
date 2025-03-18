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
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function Register() {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Dentro do Register.js, adicionar:


// No componente Register
const { isAdmin } = useAuth();
const [role, setRole] = useState('funcionario');

// No formulário de registro, após os campos de senha
{isAdmin() && (
  <FormControl fullWidth margin="normal">
    <InputLabel id="role-select-label">Tipo de Usuário</InputLabel>
    <Select
      labelId="role-select-label"
      id="role-select"
      value={role}
      label="Tipo de Usuário"
      onChange={(e) => setRole(e.target.value)}
    >
      <MenuItem value="funcionario">Funcionário</MenuItem>
      <MenuItem value="administrador">Administrador</MenuItem>
    </Select>
  </FormControl>
)}

// E modificar a função handleSubmit para incluir o role
async function handleSubmit() {
  if (password !== confirmPassword) {
    setError('As senhas não coincidem');
    return;
  }
  
  try {
    setError('');
    setLoading(true);
    await signup(email, password, name, role); // Passar o role aqui
    navigate('/');
  } catch (error) {
    setError('Falha ao criar conta. ' + error.message);
    console.error(error);
  } finally {
    setLoading(false);
  }
}
  const { signup } = useAuth();
  const navigate = useNavigate();

  const steps = ['Informações Pessoais', 'Credenciais de Acesso'];

  const handleNext = () => {
    if (activeStep === 0 && !name.trim()) {
      setError('Por favor, preencha seu nome');
      return;
    }
    
    if (activeStep === 1) {
      handleSubmit();
      return;
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  async function handleSubmit() {
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/');
    } catch (error) {
      setError('Falha ao criar conta. ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
      <Container component="main" maxWidth="sm">
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
              sx={{ mb: 4 }}
            >
              Cadastre-se no sistema
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" sx={{ width: '100%' }}>
              {activeStep === 0 ? (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Nome Completo"
                    name="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
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
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirmar Senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleToggleConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 3 }}
                  />
                </>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                {activeStep > 0 ? (
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                  >
                    Voltar
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                  >
                    Login
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : activeStep === steps.length - 1 ? (
                    'Cadastrar'
                  ) : (
                    'Próximo'
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}