import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useCollection, firestoreService } from '../hooks/firebase-hooks';
import { useAuth } from '../contexts/AuthContext';

export default function Team() {
  const { userProfile } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get team members with real-time updates
  const { 
    documents: teamMembers, 
    loading: membersLoading, 
    error: membersError 
  } = useCollection('users');

  // Role options
  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'designer', label: 'Designer' },
    { value: 'production', label: 'Produção' },
    { value: 'sales', label: 'Vendas' },
    { value: 'member', label: 'Membro' }
  ];

  // Department options
  const departments = [
    { value: 'design', label: 'Design' },
    { value: 'production', label: 'Produção' },
    { value: 'sales', label: 'Vendas' },
    { value: 'admin', label: 'Administrativo' },
    { value: 'management', label: 'Gerência' }
  ];

  // Filter and search members
  const filteredMembers = teamMembers
    .filter(member => {
      // Filter by role if not "all"
      if (filter !== 'all' && member.role !== filter) {
        return false;
      }
      
      // Search by name or email
      if (searchTerm && !member.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !member.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewMember({
      name: '',
      email: '',
      phone: '',
      role: 'member',
      department: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateMember = async () => {
    if (!newMember.name || !newMember.email) {
      setSnackbar({
        open: true,
        message: 'Nome e email são obrigatórios',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      // First check if user already exists
      const existingUsers = teamMembers.filter(
        member => member.email.toLowerCase() === newMember.email.toLowerCase()
      );
      
      if (existingUsers.length > 0) {
        throw new Error('Este email já está cadastrado');
      }
      
      // Create new team member
      await firestoreService.addDocument('users', {
        ...newMember,
        createdBy: userProfile?.id,
        createdAt: new Date().toISOString(),
        active: true,
        tasksCount: 0
      });
      
      setSnackbar({
        open: true,
        message: 'Membro adicionado com sucesso!',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao adicionar membro: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditMember = () => {
    // Implement edit functionality
    handleMenuClose();
    // Placeholder for edit functionality
    setSnackbar({
      open: true,
      message: 'Função de edição será implementada em breve',
      severity: 'info'
    });
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    handleMenuClose();
    
    try {
      await firestoreService.updateDocument('users', selectedMember.id, {
        active: false,
        updatedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Membro desativado com sucesso',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao desativar membro: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Get color based on role
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#F44336'; // Red
      case 'manager':
        return '#9C27B0'; // Purple
      case 'designer':
        return '#2196F3'; // Blue
      case 'production':
        return '#FF9800'; // Orange
      case 'sales':
        return '#4CAF50'; // Green
      default:
        return '#607D8B'; // Gray
    }
  };
  
  // Get label for role
  const getRoleLabel = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : 'Membro';
  };
  
  // Get label for department
  const getDepartmentLabel = (deptValue) => {
    const dept = departments.find(d => d.value === deptValue);
    return dept ? dept.label : 'Não especificado';
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Equipe
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Adicionar Membro
        </Button>
      </Box>
      
      {/* Search and Filter Bar */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 4, 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Paper sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2, 
          py: 0.5,
          borderRadius: 2,
          flexGrow: 1,
          maxWidth: 300
        }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <TextField
            variant="standard"
            placeholder="Buscar membros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ disableUnderline: true }}
            fullWidth
          />
          {searchTerm && (
            <IconButton size="small" onClick={() => setSearchTerm('')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="Todos" 
            onClick={() => handleFilterChange('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Designers" 
            onClick={() => handleFilterChange('designer')}
            color={filter === 'designer' ? 'primary' : 'default'}
            variant={filter === 'designer' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Produção" 
            onClick={() => handleFilterChange('production')}
            color={filter === 'production' ? 'primary' : 'default'}
            variant={filter === 'production' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Administradores" 
            onClick={() => handleFilterChange('admin')}
            color={filter === 'admin' ? 'primary' : 'default'}
            variant={filter === 'admin' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>
      
      {membersError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Erro ao carregar membros: {membersError}
        </Alert>
      )}
      
      {membersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredMembers.length === 0 ? (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'neutral.light',
              borderRadius: 2
            }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm ? 
                  'Nenhum membro encontrado com este termo de busca.' : 
                  'Nenhum membro disponível.'}
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleOpenDialog}
              >
                Adicionar Membro
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredMembers.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)' 
                    }
                  }}>
                    <Box sx={{ 
                      height: 6, 
                      width: '100%', 
                      bgcolor: getRoleColor(member.role)
                    }} />
                    <CardContent sx={{ position: 'relative', pt: 3 }}>
                      <Box sx={{ position: 'absolute', top: 8, right: 0 }}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, member)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            mb: 2,
                            bgcolor: getRoleColor(member.role),
                            fontSize: '2rem'
                          }}
                        >
                          {member.name ? member.name.charAt(0) : "U"}
                        </Avatar>
                        <Typography variant="h6" align="center">
                          {member.name || "Usuário"}
                        </Typography>
                        <Chip 
                          label={getRoleLabel(member.role)}
                          size="small"
                          sx={{ 
                            mt: 1, 
                            bgcolor: getRoleColor(member.role),
                            color: 'white'
                          }}
                        />
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap>
                            {member.email}
                          </Typography>
                        </Box>
                        
                        {member.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {member.phone}
                            </Typography>
                          </Box>
                        )}
                        
                        {member.department && (
                          <Typography variant="body2" color="text.secondary">
                            Departamento: {getDepartmentLabel(member.department)}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Chip 
                          label={`${member.tasksCount || 0} tarefas atribuídas`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Member Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMember}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteMember} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Desativar
        </MenuItem>
      </Menu>
      
      {/* Add Member Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Novo Membro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nome Completo"
            type="text"
            fullWidth
            variant="outlined"
            value={newMember.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newMember.email}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="phone"
            label="Telefone"
            type="tel"
            fullWidth
            variant="outlined"
            value={newMember.phone}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel id="role-select-label">Função</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  name="role"
                  value={newMember.role}
                  label="Função"
                  onChange={handleInputChange}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel id="department-select-label">Departamento</InputLabel>
                <Select
                  labelId="department-select-label"
                  id="department-select"
                  name="department"
                  value={newMember.department}
                  label="Departamento"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.value} value={dept.value}>{dept.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleCreateMember}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}