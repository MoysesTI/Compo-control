// src/components/ErrorBoundary.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Erro capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, m: 2, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #f44336' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Algo deu errado
          </Typography>
          <Typography variant="body1" gutterBottom>
            O aplicativo encontrou um erro inesperado. Por favor, atualize a página ou entre em contato com o suporte.
          </Typography>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Recarregar página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;