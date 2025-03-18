// src/pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  Avatar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Check as CheckIcon, 
  Clear as ClearIcon
} from '@mui/icons-material';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';

export default function UserManagement() {
  const { isAdmin, signup } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('funcionario');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersArray = [];
      querySnapshot.forEach((doc) => {
        usersArray.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersArray);
    });

    return () => unsubscribe();
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
    setName('');
    setEmail('');
    setPassword('');
    setRole('funcionario');
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCreateUser = async () => {
    if (!name || !email || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signup(email, password, name, role);
      setSuccess('Usuário criado com sucesso!');
      handleClose();
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    return role === 'administrador' ? 'primary' : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Gerenciamento de Usuários
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleClickOpen}
          sx={{ bgcolor: 'primary.main', color: 'white' }}
        >
          Novo Usuário
        </Button>
      </Box>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'secondary.light' }}>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: user.role === 'administrador' ? 'primary.main' : 'secondary.main',
                        mr: 2,
                        width: 36,
                        height: 36
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                    {user.name}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role === 'administrador' ? 'Administrador' : 'Funcionário'} 
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.createdAt?.toDate().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Nome Completo"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Senha"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}