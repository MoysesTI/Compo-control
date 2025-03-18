import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import Dashboard from './pages/Dashboard';
import Boards from './pages/Boards';
import BoardDetail from './pages/BoardDetail';
import Finances from './pages/Finances';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Team from './pages/Team';

// Componentes de layout
import PrivateRoute from './components/layout/PrivateRoute';
import Layout from './components/layout/Layout';

// Criar tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      light: '#5C9CE5', // Azul claro
      main: '#2E78D2',   // Azul principal
      dark: '#1A5FB5',   // Azul escuro
      contrastText: '#fff',
    },
    secondary: {
      light: '#F5EFE0', // Bege claro
      main: '#E8DCC5',   // Bege principal
      dark: '#D0BC9D',   // Bege escuro
      contrastText: '#333',
    },
    success: {
      light: '#A5D6A7',
      main: '#4CAF50',
      dark: '#388E3C',
    },
    warning: {
      light: '#FFE082',
      main: '#FFC107',
      dark: '#FFA000',
    },
    error: {
      light: '#EF9A9A',
      main: '#F44336',
      dark: '#D32F2F',
    },
    info: {
      light: '#81D4FA',
      main: '#03A9F4',
      dark: '#0288D1',
    },
    neutral: {
      light: '#F7F7F7',
      main: '#EFEFEF',
      dark: '#D9D9D9',
      white: '#FFFFFF',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          maxWidth: 400,
          '& .MuiPaper-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            
            {/* Rotas privadas */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/boards" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Boards />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/boards/:id" 
              element={
                <PrivateRoute>
                  <Layout>
                    <BoardDetail />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/finances" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Finances />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/team" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Team />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              } 
            />
            
            {/* Página de 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;