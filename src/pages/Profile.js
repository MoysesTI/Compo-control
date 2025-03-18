import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Avatar, Divider, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Implementar atualização de perfil
    setMessage('Perfil atualizado com sucesso!');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('As senhas não coincidem');
    }
    // Implementar mudança de senha
    setMessage('Senha alterada com sucesso!');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Perfil do Usuário
      </Typography>
      
      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              alt={userProfile?.name}
              src="/static/images/avatar/1.jpg"
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h6">{userProfile?.name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {userProfile?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cargo: {userProfile?.role || 'Usuário'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações Pessoais
            </Typography>
            
            <Box component="form" onSubmit={handleProfileUpdate}>
              <TextField
                fullWidth
                margin="normal"
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Atualizar Perfil
              </Button>
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Alterar Senha
            </Typography>
            
            <Box component="form" onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                margin="normal"
                label="Senha Atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Nova Senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Alterar Senha
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}