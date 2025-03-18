import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Página não encontrada
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          A página que você está procurando não existe ou foi movida.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/"
        >
          Voltar para o Dashboard
        </Button>
      </Box>
    </Container>
  );
}