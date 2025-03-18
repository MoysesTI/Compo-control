// src/pages/Unauthorized.js
import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { LockOutlined } from '@mui/icons-material';

export default function Unauthorized() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <LockOutlined sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          Acesso Restrito
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Você não tem permissão para acessar esta página. Este recurso é exclusivo para administradores do sistema.
        </Typography>
        
        <Button
          variant="contained"
          component={Link}
          to="/boards"
          sx={{ mt: 2 }}
        >
          Voltar para Quadros
        </Button>
      </Paper>
    </Container>
  );
}