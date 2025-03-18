import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton, 
  Divider, 
  Avatar, 
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, firestoreService } from '../hooks/firebase-hooks';
import { Link } from 'react-router-dom';
import { where } from 'firebase/firestore';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    client: '',
    dueDate: '',
    description: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Get tasks with real-time updates
  const queryConstraints = filterStatus !== 'all' 
    ? [where('status', '==', filterStatus)]
    : [];
    
  const { 
    documents: tasks, 
    loading: tasksLoading, 
    error: tasksError 
  } = useCollection('tasks', queryConstraints, 'dueDate');

  // Get team members
  const { 
    documents: teamMembers, 
    loading: teamLoading 
  } = useCollection('users');

  // Get project statistics
  const { 
    documents: stats 
  } = useCollection('statistics');

  // Filter and search tasks
  const filteredTasks = tasks
    .filter(task => {
      if (searchTerm === '') return true;
      return (
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Sort by due date (closest first)
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  // Calculate statistics
  const calculatedStats = {
    pendingTasks: tasks.filter(task => task.status === 'Pendente').length,
    inProgressTasks: tasks.filter(task => task.status === 'Em andamento').length,
    completedTasks: tasks.filter(task => task.status === 'Concluído').length,
    totalTasks: tasks.length,
    overdueCount: tasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'Concluído'
    ).length
  };

  // Handle menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  // Handle new task dialog
  const handleDialogOpen = () => {
    setTaskDialogOpen(true);
  };

  const handleDialogClose = () => {
    setTaskDialogOpen(false);
    setNewTask({
      title: '',
      client: '',
      dueDate: '',
      description: ''
    });
    setErrorMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.client || !newTask.dueDate) {
      setErrorMessage('Por favor, preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await firestoreService.addDocument('tasks', {
        ...newTask,
        status: 'Pendente',
        progress: 0,
        assignedTo: [],
        comments: 0,
        attachments: 0,
        userId: userProfile.id
      });
      handleDialogClose();
    } catch (error) {
      setErrorMessage('Erro ao criar tarefa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Concluído':
        return { 
          color: 'success.main', 
          bgcolor: 'success.light',
          icon: <CheckCircleIcon fontSize="small" />
        };
      case 'Em andamento':
        return { 
          color: 'info.main', 
          bgcolor: 'info.light',
          icon: <RefreshIcon fontSize="small" />
        };
      case 'Atrasado':
        return { 
          color: 'error.main', 
          bgcolor: 'error.light',
          icon: <ErrorIcon fontSize="small" />
        };
      default:
        return { 
          color: 'warning.main', 
          bgcolor: 'warning.light',
          icon: <WarningIcon fontSize="small" />
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Search Box */}
        <Paper sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2, 
          py: 0.5, 
          mr: 2, 
          borderRadius: 2,
          width: { xs: '100%', sm: 'auto' },
          maxWidth: 300
        }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <TextField
            variant="standard"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ disableUnderline: true }}
            fullWidth
          />
        </Paper>
        
        {/* Filter Button */}
        <Tooltip title="Filtrar">
          <IconButton 
            onClick={handleMenuOpen} 
            sx={{ mr: 1, bgcolor: 'secondary.light', borderRadius: 2 }}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        
        {/* Add Task Button */}
        <Tooltip title="Adicionar Tarefa">
          <IconButton 
            onClick={handleDialogOpen} 
            color="primary" 
            size="large" 
            sx={{ bgcolor: 'secondary.light', borderRadius: 2 }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        
        {/* Filter Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem 
            onClick={() => handleFilterChange('all')}
            selected={filterStatus === 'all'}
          >
            Todas as tarefas
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('Pendente')}
            selected={filterStatus === 'Pendente'}
          >
            Pendentes
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('Em andamento')}
            selected={filterStatus === 'Em andamento'}
          >
            Em andamento
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('Concluído')}
            selected={filterStatus === 'Concluído'}
          >
            Concluídas
          </MenuItem>
        </Menu>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">Tarefas Pendentes</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {calculatedStats.pendingTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {calculatedStats.pendingTasks > 5 ? 'Atenção necessária' : 'Dentro do esperado'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">Em Andamento</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {calculatedStats.inProgressTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Progresso ativo
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">Tarefas Atrasadas</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: calculatedStats.overdueCount > 0 ? 'error.main' : 'primary.dark' }}>
              {calculatedStats.overdueCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {calculatedStats.overdueCount > 0 ? 'Atenção urgente necessária' : 'Sem atrasos'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">Tarefas Concluídas</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {calculatedStats.completedTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Este mês
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Tasks List */}
        <Grid item xs={12} md={7}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: 'neutral.white',
            minHeight: 400
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Tarefas Recentes</Typography>
                  {tasksLoading && (
                    <CircularProgress size={20} sx={{ ml: 2 }} />
                  )}
                </Box>
              }
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ bgcolor: 'secondary.light', py: 2 }}
            />
            <CardContent sx={{ p: 0 }}>
              {tasksError && (
                <Box sx={{ p: 2, color: 'error.main' }}>
                  Erro ao carregar tarefas: {tasksError}
                </Box>
              )}
              
              {!tasksLoading && filteredTasks.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  {searchTerm ? 
                    'Nenhuma tarefa encontrada com este termo de busca.' : 
                    'Nenhuma tarefa disponível.'}
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={handleDialogOpen}
                    sx={{ mt: 2 }}
                  >
                    Adicionar Tarefa
                  </Button>
                </Box>
              )}
              
              {filteredTasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      transition: 'background-color 0.2s', 
                      '&:hover': { bgcolor: 'neutral.light' },
                      cursor: 'pointer'
                    }}
                    component={Link}
                    to={`/boards/${task.boardId || '1'}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {task.title}
                      </Typography>
                      <Chip
                        icon={getStatusInfo(task.status).icon}
                        label={task.status}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusInfo(task.status).bgcolor,
                          color: getStatusInfo(task.status).color,
                          fontWeight: 'medium'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Cliente: {task.client}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        Vencimento: {formatDate(task.dueDate)}
                      </Typography>
                      
                      {/* Assigned team members */}
                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <Box sx={{ display: 'flex', ml: 'auto' }}>
                          <Avatar
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              fontSize: '0.75rem',
                              bgcolor: 'primary.main'
                            }}
                          >
                            {task.assignedTo[0].substring(0, 1)}
                          </Avatar>
                          {task.assignedTo.length > 1 && (
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              +{task.assignedTo.length - 1}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={task.progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 5,
                            bgcolor: 'neutral.light',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 
                                task.progress === 100 ? 'success.main' : 
                                task.progress > 50 ? 'info.main' : 
                                'warning.main'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {task.progress}%
                      </Typography>
                    </Box>
                  </Box>
                  {index < filteredTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} md={5}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: 'neutral.white',
            height: '100%',
            minHeight: 400
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Equipe</Typography>
                  {teamLoading && (
                    <CircularProgress size={20} sx={{ ml: 2 }} />
                  )}
                </Box>
              }
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ bgcolor: 'secondary.light', py: 2 }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {teamMembers.map((member) => (
                  <Box 
                    key={member.id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1,
                      borderRadius: 2,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'neutral.light' }
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {member.name ? member.name.charAt(0) : "U"}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{member.name || "Usuário"}</Typography>
                      <Typography variant="body2" color="text.secondary">{member.role || "Colaborador"}</Typography>
                    </Box>
                    <Chip
                      label={`${member.tasksCount || 0} tarefas`}
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    />
                  </Box>
                ))}
                
                {!teamLoading && teamMembers.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Nenhum membro da equipe disponível.
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Task Dialog */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Tarefa</DialogTitle>
        <DialogContent>
          {errorMessage && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{errorMessage}</Alert>
            </Box>
          )}
          
          <TextField
            margin="dense"
            name="title"
            label="Título da Tarefa"
            type="text"
            fullWidth
            variant="outlined"
            value={newTask.title}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            name="client"
            label="Cliente"
            type="text"
            fullWidth
            variant="outlined"
            value={newTask.client}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="dueDate"
            label="Data de Vencimento"
            type="date"
            fullWidth
            variant="outlined"
            value={newTask.dueDate}
            onChange={handleInputChange}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Descrição"
            type="text"
            fullWidth
            variant="outlined"
            value={newTask.description}
            onChange={handleInputChange}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDialogClose}>Cancelar</Button>
          <Button 
            onClick={handleCreateTask} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Criar Tarefa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}