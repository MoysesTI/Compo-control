// src/components/InitialAdminSetup.js
import React, { useState } from 'react';
import { Box, Button, TextField, Alert, Typography, Paper } from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function InitialAdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Adicionar ao Firestore como administrador
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: 'administrador',
        createdAt: new Date(),
      });
      
      setSuccess('Administrador criado com sucesso!');
    } catch (error) {
      setError('Erro ao criar administrador: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Configuração Inicial - Criar Administrador
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleCreateAdmin}>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Administrador'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}