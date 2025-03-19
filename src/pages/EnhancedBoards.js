// src/pages/EnhancedDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, CardHeader, 
  IconButton, Divider, Avatar, LinearProgress, Skeleton, Chip,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Button, Menu, MenuItem, Badge, Tooltip, Alert, useTheme
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Today as TodayIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import firebaseService from '../services/firebaseService';
import { collection, query, orderBy, limit, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, differenceInDays, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function EnhancedDashboard() {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [favoriteBoards, setFavoriteBoards] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    pendingTasks: 0,
    activeProjects: 0,
    pendingQuotes: 0,
    completedTasks: 0
  });
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [tasksByTeamMember, setTasksByTeamMember] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Gerar cores para o gráfico
  const pieColors = useMemo(() => {
    return [
      theme.palette.primary.main,
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.info.main
    ];
  }, [theme]);

  // Carregar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch favorite boards
        const boardsQuery = query(
          collection(db, 'boards'),
          where('members', 'array-contains', userProfile?.id),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        
        const boardsSnapshot = await getDocs(boardsQuery);
        const boardsData = [];
        
        boardsSnapshot.forEach((doc) => {
          boardsData.push({ id: doc.id, ...doc.data() });
        });
        
        setFavoriteBoards(boardsData);
        
        // Fetch recent tasks across all boards
        let allTasks = [];
        
        for (const board of boardsData) {
          const columnsQuery = query(
            collection(db, `boards/${board.id}/columns`)
          );
          
          const columnsSnapshot = await getDocs(columnsQuery);
          
          for (const columnDoc of columnsSnapshot.docs) {
            const cardsQuery = query(
              collection(db, `boards/${board.id}/columns/${columnDoc.id}/cards`),
              orderBy('updatedAt', 'desc'),
              limit(10)
            );
            
            const cardsSnapshot = await getDocs(cardsQuery);
            
            cardsSnapshot.forEach((cardDoc) => {
              allTasks.push({
                id: cardDoc.id,
                boardId: board.id,
                boardTitle: board.title,
                columnId: columnDoc.id,
                columnTitle: columnDoc.data().title,
                ...cardDoc.data()
              });
            });
          }
        }
        
        // Sort by updated date and limit to 10
        allTasks.sort((a, b) => {
          const dateA = a.updatedAt?.toDate() || new Date(0);
          const dateB = b.updatedAt?.toDate() || new Date(0);
          return dateB - dateA;
        });
        
        setRecentTasks(allTasks.slice(0, 10));
        
        // Calculate statistics
        const pendingTasks = allTasks.filter(task => 
          task.columnTitle.toLowerCase() !== 'concluído' && 
          task.columnTitle.toLowerCase() !== 'done'
        ).length;
        
        const completedTasks = allTasks.filter(task => 
          task.columnTitle.toLowerCase() === 'concluído' || 
          task.columnTitle.toLowerCase() === 'done'
        ).length;
        
        const pendingQuotes = 0; // This would come from finances data
        
        setStats({
          pendingTasks,
          activeProjects: boardsData.length,
          pendingQuotes,
          completedTasks
        });
        
        // Tasks by status for chart
        const statusCounts = {};
        
        allTasks.forEach(task => {
          const status = task.columnTitle;
          if (!statusCounts[status]) {
            statusCounts[status] = 0;
          }
          statusCounts[status]++;
        });
        
        const statusData = Object.keys(statusCounts).map(status => ({
          name: status,
          value: statusCounts[status]
        }));
        
        setTasksByStatus(statusData);
        
        // Fetch team members
        const membersQuery = query(
          collection(db, 'users'),
          limit(10)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = [];
        
        membersSnapshot.forEach((doc) => {
          membersData.push({ id: doc.id, ...doc.data() });
        });
        
        setTeamMembers(membersData);
        
        // Tasks by team member
        const memberTaskCounts = {};
        
        allTasks.forEach(task => {
          if (task.members && task.members.length > 0) {
            task.members.forEach(memberId => {
              if (!memberTaskCounts[memberId]) {
                memberTaskCounts[memberId] = 0;
              }
              memberTaskCounts[memberId]++;
            });
          }
        });
        
        const memberTasks = membersData.map(member => ({
          name: member.name,
          tasks: memberTaskCounts[member.id] || 0
        })).sort((a, b) => b.tasks - a.tasks).slice(0, 5);
        
        setTasksByTeamMember(memberTasks);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile?.id) {
      fetchDashboardData();
      
      // Set up real-time listeners for important data
      // This would be expanded in a real implementation
      
      return () => {
        // Clean up any listeners
      };
    }
  }, [userProfile]);

  // Handlers para menus
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleFilterOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    handleFilterClose();
  };

  // Função para renderizar status das tarefas
  const getTaskStatusChip = (task) => {
    const status = task.columnTitle.toLowerCase();
    
    if (status === 'concluído' || status === 'done') {
      return (
        <Chip 
          label="Concluído" 
          size="small" 
          sx={{ bgcolor: 'success.main', color: 'white' }}
        />
      );
    } else if (status === 'em andamento' || status === 'doing' || status === 'in progress') {
      return (
        <Chip 
          label="Em Andamento" 
          size="small" 
          sx={{ bgcolor: 'info.main', color: 'white' }}
        />
      );
    } else if (status === 'a fazer' || status === 'to do') {
      return (
        <Chip 
          label="A Fazer" 
          size="small" 
          sx={{ bgcolor: 'warning.main', color: 'white' }}
        />
      );
    } else if (status === 'revisão' || status === 'review') {
      return (
        <Chip 
          label="Revisão" 
          size="small" 
          sx={{ bgcolor: 'secondary.main', color: 'white' }}
        />
      );
    } else {
      return (
        <Chip 
          label={task.columnTitle} 
          size="small" 
          sx={{ bgcolor: 'grey.500', color: 'white' }}
        />
      );
    }
  };
  
  // Função para calcular o progresso com base no prazo
  const getTaskProgress = (task) => {
    if (!task.dueDate) return 0;
    
    const now = new Date();
    const dueDate = typeof task.dueDate === 'string' 
      ? parseISO(task.dueDate) 
      : task.dueDate.toDate();
    
    if (task.columnTitle.toLowerCase() === 'concluído' || 
        task.columnTitle.toLowerCase() === 'done') {
      return 100;
    }
    
    if (isBefore(dueDate, now)) {
      return 100; // Atrasada
    }
    
    const totalDays = differenceInDays(
      dueDate,
      task.createdAt?.toDate() || now
    );
    
    if (totalDays <= 0) return 50;
    
    const daysLeft = differenceInDays(dueDate, now);
    const daysUsed = totalDays - daysLeft;
    
    // Cálculo de porcentagem inversa (quanto mais perto do prazo, mais completo)
    const progress = Math.max(0, Math.min(100, (daysUsed / totalDays) * 100));
    
    return progress;
  };
  
  // Função para formatar data
  const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' 
      ? parseISO(date) 
      : date.toDate ? date.toDate() : date;
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  };

  if (loading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Dashboard</Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar o dashboard: {error}
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        
        <Tooltip title="Filtrar">
          <IconButton 
            color="primary" 
            sx={{ mr: 1, bgcolor: 'secondary.light', borderRadius: 2 }}
            onClick={handleFilterOpen}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem 
            onClick={() => handlePeriodChange('day')}
            selected={selectedPeriod === 'day'}
          >
            Hoje
          </MenuItem>
          <MenuItem 
            onClick={() => handlePeriodChange('week')}
            selected={selectedPeriod === 'week'}
          >
            Esta Semana
          </MenuItem>
          <MenuItem 
            onClick={() => handlePeriodChange('month')}
            selected={selectedPeriod === 'month'}
          >
            Este Mês
          </MenuItem>
          <MenuItem 
            onClick={() => handlePeriodChange('all')}
            selected={selectedPeriod === 'all'}
          >
            Todos
          </MenuItem>
        </Menu>
        
        <Tooltip title="Adicionar">
          <IconButton 
            color="primary" 
            sx={{ bgcolor: 'secondary.light', borderRadius: 2 }}
            onClick={handleMenuOpen}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Novo Quadro</MenuItem>
          <MenuItem onClick={handleMenuClose}>Nova Tarefa</MenuItem>
          <MenuItem onClick={handleMenuClose}>Novo Projeto</MenuItem>
        </Menu>
      </Box>

      {/* Cards de estatísticas */}
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
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tarefas Pendentes</Typography>
              <Badge 
                color={stats.pendingTasks > 5 ? "error" : "info"} 
                variant="dot"
              />
            </Box>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.pendingTasks}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center' }}>
              <ArrowUpwardIcon 
                color="error" 
                fontSize="small" 
                sx={{ mr: 0.5 }} 
              />
              <Typography variant="body2" color="text.secondary">
                {stats.pendingTasks > 5 ? 'Atenção necessária' : 'Dentro do esperado'}
              </Typography>
            </Box>
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
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Projetos Ativos</Typography>
              <Badge 
                color="success" 
                variant="dot"
              />
            </Box>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.activeProjects}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center' }}>
              {stats.activeProjects > 0 ? (
                <>
                  <TodayIcon 
                    color="info" 
                    fontSize="small" 
                    sx={{ mr: 0.5 }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    Em andamento
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum no momento
                </Typography>
              )}
            </Box>
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
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Orçamentos Pendentes</Typography>
              <Badge 
                color={stats.pendingQuotes > 0 ? "warning" : "success"} 
                variant="dot"
              />
            </Box>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.pendingQuotes}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center' }}>
              {stats.pendingQuotes > 0 ? (
                <>
                  <AccessTimeIcon 
                    color="warning" 
                    fontSize="small" 
                    sx={{ mr: 0.5 }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    Aguardando aprovação
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum pendente
                </Typography>
              )}
            </Box>
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
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tarefas Concluídas</Typography>
              <Badge 
                color="success" 
                variant="dot"
              />
            </Box>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.completedTasks}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center' }}>
              <ArrowUpwardIcon 
                color="success" 
                fontSize="small" 
                sx={{ mr: 0.5 }} 
              />
              <Typography variant="body2" color="text.secondary">
                Este mês
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos e lista de tarefas */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: 'neutral.white',
            height: '100%'
          }}>
            <CardHeader
              title="Tarefas Recentes"
              action={
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title="Ver todas">
                    <IconButton component={Link} to="/boards">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              }
              sx={{ bgcolor: 'secondary.light', py: 2 }}
            />
            <CardContent sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
              {recentTasks.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nenhuma tarefa encontrada
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    component={Link}
                    to="/boards"
                  >
                    Criar Tarefa
                  </Button>
                </Box>
              ) : (
                <List>
                  {recentTasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <ListItem 
                        component={Link} 
                        to={`/boards/${task.boardId}`}
                        sx={{ 
                          py: 2,
                          px: 3,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            bgcolor: 'neutral.light'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Tooltip title={task.boardTitle}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {task.boardTitle.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                                {task.title}
                              </Typography>
                              {getTaskStatusChip(task)}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {task.description && task.description.length > 60
                                  ? `${task.description.substring(0, 60)}...`
                                  : task.description || "Sem descrição"}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                    {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
                                  </Typography>
                                  
                                  {task.members && task.members.length > 0 && (
                                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.625rem' } }}>
                                      {task.members.map((member, idx) => (
                                        <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                                          {typeof member === 'string' ? member.charAt(0) : 'U'}
                                        </Avatar>
                                      ))}
                                    </AvatarGroup>
                                  )}
                                </Box>
                                
                                <Typography variant="caption" color="text.secondary">
                                  {task.columnTitle}
                                </Typography>
                              </Box>
                              
                              <LinearProgress 
                                variant="determinate" 
                                value={getTaskProgress(task)} 
                                sx={{ 
                                  mt: 1,
                                  height: 6, 
                                  borderRadius: 3,
                                  bgcolor: 'neutral.light',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: 
                                      task.columnTitle.toLowerCase() === 'concluído' || task.columnTitle.toLowerCase() === 'done'
                                        ? 'success.main' 
                                        : getTaskProgress(task) === 100 
                                          ? 'error.main'
                                          : getTaskProgress(task) > 75
                                            ? 'warning.main'
                                            : 'info.main'
                                  }
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                overflow: 'hidden',
                bgcolor: 'neutral.white'
              }}>
                <CardHeader
                  title="Visão Geral de Tarefas"
                  sx={{ bgcolor: 'secondary.light', py: 2 }}
                />
                <CardContent sx={{ height: 240 }}>
                  {tasksByStatus.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhum dado disponível
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                overflow: 'hidden',
                bgcolor: 'neutral.white'
              }}>
                <CardHeader
                  title="Quadros Favoritos"
                  action={
                    <IconButton component={Link} to="/boards">
                      <VisibilityIcon />
                    </IconButton>
                  }
                  sx={{ bgcolor: 'secondary.light', py: 2 }}
                />
                <CardContent sx={{ p: 0 }}>
                  {favoriteBoards.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhum quadro favorito
                      </Typography>
                      <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        component={Link}
                        to="/boards"
                      >
                        Ver Quadros
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ py: 0 }}>
                      {favoriteBoards.slice(0, 5).map((board) => (
                        <React.Fragment key={board.id}>
                          <ListItem 
                            component={Link} 
                            to={`/boards/${board.id}`}
                            sx={{ 
                              py: 2,
                              px: 3, 
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': {
                                bgcolor: 'neutral.light'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: board.color || 'primary.main',
                                  color: 'white'
                                }}
                              >
                                {board.title.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={board.title}
                              secondary={formatDate(board.updatedAt)}
                            />
                            <ListItemSecondaryAction>
                              <IconButton edge="end">
                                {board.favorite ? (
                                  <StarIcon color="warning" />
                                ) : (
                                  <StarBorderIcon />
                                )}
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}