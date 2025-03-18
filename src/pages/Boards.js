import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  IconButton, 
  Avatar, 
  AvatarGroup, 
  Menu, 
  MenuItem, 
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Snackbar,
  Tooltip,
  Paper
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon, 
  Star, 
  StarBorder,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  arrayUnion, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Boards() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [newBoard, setNewBoard] = useState({
    title: '',
    description: '',
    color: '#2E78D2',
    members: []
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorMenuAnchorEl, setColorMenuAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [boardTemplates, setBoardTemplates] = useState(false);
  const [boards, setBoards] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Color palette options
  const colorOptions = [
    { name: 'Azul', value: '#2E78D2' },
    { name: 'Verde', value: '#4CAF50' },
    { name: 'Vermelho', value: '#F44336' },
    { name: 'Amarelo', value: '#FFC107' },
    { name: 'Roxo', value: '#9C27B0' },
    { name: 'Laranja', value: '#FF9800' },
    { name: 'Turquesa', value: '#00BCD4' },
    { name: 'Cinza', value: '#607D8B' }
  ];

  // Carregar quadros
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Certifique-se de que temos um usuário logado
        if (!userProfile?.id) {
          setBoards([]);
          setLoading(false);
          return;
        }
        
        // Consulta: quadros onde o usuário atual é membro
        const boardsRef = collection(db, 'boards');
        const boardsQuery = query(
          boardsRef, 
          where('members', 'array-contains', userProfile.id),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(boardsQuery);
        const boardsList = [];
        
        querySnapshot.forEach((doc) => {
          boardsList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setBoards(boardsList);
      } catch (err) {
        console.error("Erro ao carregar quadros:", err);
        
        // Verificar se o erro é relacionado a um índice faltando
        if (err.message.includes('index')) {
          setError(`É necessário criar um índice no Firebase. Acesse o link: ${err.message.split('https://')[1].split(' ')[0]}`);
        } else {
          setError(`Erro ao carregar quadros: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoards();
  }, [userProfile]);
  
  // Carregar membros da equipe
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const membersList = [];
        
        querySnapshot.forEach((doc) => {
          membersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setTeamMembers(membersList);
      } catch (err) {
        console.error("Erro ao carregar membros da equipe:", err);
      }
    };
    
    fetchTeamMembers();
  }, []);
  
  // Filter and search boards
  const filteredBoards = boards
    .filter(board => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        board.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        board.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply type filter
      const matchesType = filterType === 'all' || 
        (filterType === 'favorite' && board.favorite) ||
        (filterType === 'my' && board.createdBy === userProfile?.id);
      
      return matchesSearch && matchesType;
    });

  // Sort boards: favorites first, then most recently updated
  const sortedBoards = [...filteredBoards].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    
    // Garantir que datas são comparáveis
    const dateA = a.updatedAt ? (a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt)) : new Date(0);
    const dateB = b.updatedAt ? (b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt)) : new Date(0);
    
    return dateB - dateA;
  });

  // Separate favorite and non-favorite boards
  const favoriteBoards = sortedBoards.filter(board => board.favorite);
  const otherBoards = sortedBoards.filter(board => !board.favorite);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewBoard({
      title: '',
      description: '',
      color: '#2E78D2',
      members: []
    });
    setSelectedMembers([]);
    setBoardTemplates(false);
  };

  const handleCreateBoard = async () => {
    if (newBoard.title.trim() === '') {
      setSnackbar({
        open: true,
        message: 'O título do quadro é obrigatório',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Add current user to members if not already included
      const members = [...selectedMembers];
      if (userProfile && !members.includes(userProfile.id)) {
        members.push(userProfile.id);
      }
      
      const newBoardData = {
        title: newBoard.title,
        description: newBoard.description || 'Novo projeto',
        color: newBoard.color,
        favorite: false,
        members,
        createdBy: userProfile?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Create template columns if template is enabled
      if (boardTemplates) {
        newBoardData.columns = [
          {
            id: 'col-1',
            title: 'A Fazer',
            cards: []
          },
          {
            id: 'col-2',
            title: 'Em Andamento',
            cards: []
          },
          {
            id: 'col-3',
            title: 'Revisão',
            cards: []
          },
          {
            id: 'col-4',
            title: 'Concluído',
            cards: []
          }
        ];
      }
      
      const boardRef = await addDoc(collection(db, 'boards'), newBoardData);
      
      // Redirecionar para o novo quadro
      setSnackbar({
        open: true,
        message: 'Quadro criado com sucesso!',
        severity: 'success'
      });
      
      handleCloseDialog();
      
      // Navegar para o novo quadro após um breve momento
      setTimeout(() => {
        navigate(`/boards/${boardRef.id}`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      setSnackbar({
        open: true,
        message: `Erro ao criar quadro: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleColorMenuOpen = (event) => {
    setColorMenuAnchorEl(event.currentTarget);
  };

  const handleColorMenuClose = () => {
    setColorMenuAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    setNewBoard({
      ...newBoard,
      color
    });
    handleColorMenuClose();
  };

  const toggleFavorite = async (id, currentStatus) => {
    try {
      const boardRef = doc(db, 'boards', id);
      await updateDoc(boardRef, {
        favorite: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      // Atualizar localmente
      setBoards(prevBoards => 
        prevBoards.map(board => 
          board.id === id ? {...board, favorite: !currentStatus} : board
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      setSnackbar({
        open: true,
        message: `Erro ao atualizar favorito: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleMemberChange = (event) => {
    const { value } = event.target;
    setSelectedMembers(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBoard(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Quadros
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
          Novo Quadro
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
            placeholder="Buscar quadros..."
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
            onClick={() => setFilterType('all')}
            color={filterType === 'all' ? 'primary' : 'default'}
            variant={filterType === 'all' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Favoritos" 
            icon={<Star fontSize="small" />}
            onClick={() => setFilterType('favorite')}
            color={filterType === 'favorite' ? 'primary' : 'default'}
            variant={filterType === 'favorite' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Meus Quadros" 
            onClick={() => setFilterType('my')}
            color={filterType === 'my' ? 'primary' : 'default'}
            variant={filterType === 'my' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Quadros favoritos */}
          {favoriteBoards.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Star sx={{ color: '#FFC107', mr: 1 }} /> 
                Favoritos
              </Typography>
              <Grid container spacing={3}>
                {favoriteBoards.map((board) => (
                  <Grid item xs={12} sm={6} md={4} key={board.id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)' 
                      },
                      bgcolor: 'white'
                    }}>
                      <Box sx={{ 
                        height: 8, 
                        width: '100%', 
                        bgcolor: board.color 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        display: 'flex',
                        gap: 0.5
                      }}>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleFavorite(board.id, board.favorite)}
                          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          {board.favorite ? 
                            <Star fontSize="small" sx={{ color: '#FFC107' }} /> : 
                            <StarBorder fontSize="small" />
                          }
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={handleMenuOpen}
                          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                          {board.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {board.description}
                        </Typography>
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                          {(board.members || []).map((memberId, idx) => {
                            const memberUser = teamMembers.find(user => user.id === memberId);
                            return (
                              <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                                {memberUser ? memberUser.name?.charAt(0) : "U"}
                              </Avatar>
                            );
                          })}
                        </AvatarGroup>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/boards/${board.id}`}
                          sx={{ color: 'primary.main' }}
                        >
                          Abrir
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Todos os quadros (não favoritos) */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {filterType === 'all' ? 'Todos os Quadros' : 
               filterType === 'my' ? 'Meus Quadros' : 'Outros Quadros'}
            </Typography>
            
            {otherBoards.length === 0 ? (
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center', 
                bgcolor: 'neutral.light',
                borderRadius: 2
              }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {searchTerm ? 
                    'Nenhum quadro encontrado com este termo de busca.' : 
                    'Nenhum quadro disponível.'}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleOpenDialog}
                >
                  Criar Novo Quadro
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {otherBoards.map((board) => (
                  <Grid item xs={12} sm={6} md={4} key={board.id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)' 
                      },
                      bgcolor: 'white'
                    }}>
                      <Box sx={{ 
                        height: 8, 
                        width: '100%', 
                        bgcolor: board.color 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        display: 'flex',
                        gap: 0.5
                      }}>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleFavorite(board.id, board.favorite)}
                          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          {board.favorite ? 
                            <Star fontSize="small" sx={{ color: '#FFC107' }} /> : 
                            <StarBorder fontSize="small" />
                          }
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={handleMenuOpen}
                          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                          {board.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {board.description}
                        </Typography>
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                          {(board.members || []).map((memberId, idx) => {
                            const memberUser = teamMembers.find(user => user.id === memberId);
                            return (
                              <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                                {memberUser ? memberUser.name?.charAt(0) : "U"}
                              </Avatar>
                            );
                          })}
                        </AvatarGroup>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/boards/${board.id}`}
                          sx={{ color: 'primary.main' }}
                        >
                          Abrir
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </>
      )}
      
      {/* Menu de opções para os cartões */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Editar</MenuItem>
        <MenuItem onClick={handleMenuClose}>Compartilhar</MenuItem>
        <MenuItem onClick={handleMenuClose}>Duplicar</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>Arquivar</MenuItem>
      </Menu>
      
      {/* Color Menu */}
      <Menu
        anchorEl={colorMenuAnchorEl}
        open={Boolean(colorMenuAnchorEl)}
        onClose={handleColorMenuClose}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {colorOptions.map((color) => (
            <Tooltip title={color.name} key={color.value}>
              <Box
                onClick={() => handleColorSelect(color.value)}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  bgcolor: color.value,
                  cursor: 'pointer',
                  border: color.value === newBoard.color ? '2px solid black' : '2px solid transparent',
                  '&:hover': {
                    boxShadow: '0 0 0 2px rgba(0,0,0,0.2)'
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Menu>
      
      {/* Diálogo para criar novo quadro */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Criar Novo Quadro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Título do Quadro"
            fullWidth
            variant="outlined"
            value={newBoard.title}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Descrição"
            fullWidth
            variant="outlined"
            value={newBoard.description}
            onChange={handleInputChange}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Cor do Quadro:
            </Typography>
            <Box
              onClick={handleColorMenuOpen}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: newBoard.color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.2)'
                }
              }}
            >
              <ColorLensIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
          </Box>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="members-select-label">Membros</InputLabel>
            <Select
              labelId="members-select-label"
              id="members-select"
              multiple
              value={selectedMembers}
              onChange={handleMemberChange}
              input={<OutlinedInput label="Membros" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((memberId) => {
                    const member = teamMembers.find(user => user.id === memberId);
                    return (
                      <Chip 
                        key={memberId} 
                        label={member ? member.name : memberId}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {teamMembers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {user.name ? user.name.charAt(0) : 'U'}
                    </Avatar>
                    <Typography>{user.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mt: 2,
            p: 2,
            bgcolor: 'secondary.light',
            borderRadius: 2
          }}>
            <FormControl>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                Usar modelo de quadro padrão?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Cria automaticamente colunas: A Fazer, Em Andamento, Revisão, Concluído
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button 
                  variant={boardTemplates ? "contained" : "outlined"} 
                  size="small"
                  onClick={() => setBoardTemplates(true)}
                >
                  Sim
                </Button>
                <Button 
                  variant={!boardTemplates ? "contained" : "outlined"} 
                  size="small"
                  onClick={() => setBoardTemplates(false)}
                >
                  Não
                </Button>
              </Box>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleCreateBoard}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}