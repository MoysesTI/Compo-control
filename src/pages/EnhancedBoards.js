import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Snackbar,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Backdrop
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon, 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import boardService from '../services/boardService';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

export default function EnhancedBoards() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  // State for boards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boardsList, setBoardsList] = useState([]);
  
  // State for UI controls
  const [openNewBoardDialog, setOpenNewBoardDialog] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('#2E78D2'); // Azul por padrão
  const [boardMenuAnchorEl, setBoardMenuAnchorEl] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Color options
  const colorOptions = [
    { name: 'Azul', value: '#2E78D2' },
    { name: 'Verde', value: '#4CAF50' },
    { name: 'Vermelho', value: '#F44336' },
    { name: 'Amarelo', value: '#FFC107' },
    { name: 'Roxo', value: '#9C27B0' },
    { name: 'Laranja', value: '#FF9800' },
    { name: 'Bege', value: '#E8DCC5' },
  ];

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching boards');
      const boards = await boardService.getBoards(currentUser.uid);
      
      setBoardsList(boards);
      console.log(`Loaded ${boards.length} boards`);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching boards:', error);
      setError(`Falha ao carregar quadros: ${error.message}`);
      setLoading(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao carregar quadros: ${error.message}`,
        severity: 'error'
      });
    }
  }, [currentUser.uid]);

  // Load boards on component mount
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Handle new board dialog
  const handleOpenNewBoardDialog = () => {
    setNewBoardTitle('');
    setOpenNewBoardDialog(true);
  };

  const handleCloseNewBoardDialog = () => {
    setOpenNewBoardDialog(false);
  };

  const handleCreateBoard = async () => {
    if (newBoardTitle.trim() === '') {
      setSnackbar({
        open: true,
        message: 'O título do quadro não pode estar vazio',
        severity: 'error'
      });
      return;
    }
    
    try {
      setProcessingAction(true);
      console.log(`Creating new board: ${newBoardTitle}`);
      
      const boardData = {
        title: newBoardTitle,
        description: `Quadro criado em ${new Date().toLocaleDateString()}`,
        color: newBoardColor,
        memberNames: [userProfile?.name || 'Usuário']
      };
      
      const newBoardId = await boardService.createBoard(boardData, currentUser.uid);
      
      // Close dialog and reset form
      handleCloseNewBoardDialog();
      setProcessingAction(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Quadro criado com sucesso!',
        severity: 'success'
      });
      
      // Navigate to the new board
      navigate(`/boards/${newBoardId}`);
    } catch (error) {
      console.error('Error creating board:', error);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao criar quadro: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Board menu handlers
  const handleBoardMenuOpen = (event, board) => {
    setBoardMenuAnchorEl(event.currentTarget);
    setSelectedBoard(board);
  };

  const handleBoardMenuClose = () => {
    setBoardMenuAnchorEl(null);
    setSelectedBoard(null);
  };

  // Toggle board as favorite
  const handleToggleFavorite = async (id, currentState) => {
    try {
      console.log(`Toggling favorite for board ${id} to: ${!currentState}`);
      
      // Optimistic update
      setBoardsList(boardsList.map(board => 
        board.id === id ? { ...board, favorite: !currentState } : board
      ));
      
      // Update in Firebase
      await boardService.toggleFavorite(id, !currentState);
      
      setSnackbar({
        open: true,
        message: !currentState 
          ? 'Quadro adicionado aos favoritos!' 
          : 'Quadro removido dos favoritos!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update
      setBoardsList(boardsList.map(board => 
        board.id === id ? { ...board, favorite: currentState } : board
      ));
      
      setSnackbar({
        open: true,
        message: `Erro ao alterar favorito: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Delete board
  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true);
    handleBoardMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBoard) return;
    
    try {
      setProcessingAction(true);
      console.log(`Deleting board: ${selectedBoard.id}`);
      
      await boardService.deleteBoard(selectedBoard.id);
      
      // Update state
      setBoardsList(boardsList.filter(board => board.id !== selectedBoard.id));
      
      setConfirmDeleteOpen(false);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: 'Quadro excluído com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting board:', error);
      setConfirmDeleteOpen(false);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao excluir quadro: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Ordenar os quadros: favoritos primeiro, depois alfabeticamente
  const sortedBoards = [...boardsList].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.title.localeCompare(b.title);
  });

  // Filtered lists
  const favoriteBoards = sortedBoards.filter(board => board.favorite);
  const regularBoards = sortedBoards.filter(board => !board.favorite);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
            Quadros
          </Typography>
          <Skeleton variant="rectangular" width={150} height={40} />
        </Box>
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          <Skeleton width={150} />
        </Typography>
        
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error && boardsList.length === 0) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchBoards}>
              Tentar Novamente
            </Button>
          }
        >
          {error}
        </Alert>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenNewBoardDialog}
        >
          Novo Quadro
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Quadros
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenNewBoardDialog}
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Novo Quadro
        </Button>
      </Box>
      
      {/* Error banner if there was an error but we still have boards */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchBoards}>
              Tentar Novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Quadros favoritos */}
      {favoriteBoards.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ color: '#FFC107', mr: 1 }} /> 
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
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    height: 8, 
                    width: '100%', 
                    bgcolor: board.color || '#2E78D2'
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
                      onClick={() => handleToggleFavorite(board.id, board.favorite)}
                      sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                    >
                      {board.favorite ? 
                        <StarIcon fontSize="small" sx={{ color: '#FFC107' }} /> : 
                        <StarBorderIcon fontSize="small" />
                      }
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleBoardMenuOpen(e, board)}
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
                      {board.memberNames?.map((member, idx) => (
                        <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                          {typeof member === 'string' ? member.charAt(0) : '?'}
                        </Avatar>
                      ))}
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
      
      {/* Todos os quadros */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {favoriteBoards.length > 0 ? 'Todos os Quadros' : 'Meus Quadros'}
        </Typography>
        
        {regularBoards.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {boardsList.length === 0 ? 
                'Você não tem nenhum quadro ainda.' : 
                'Todos os seus quadros estão nos favoritos.'}
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleOpenNewBoardDialog}
            >
              Criar Primeiro Quadro
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {regularBoards.map((board) => (
              <Grid item xs={12} sm={6} md={4} key={board.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    height: 8, 
                    width: '100%', 
                    bgcolor: board.color || '#2E78D2'
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
                      onClick={() => handleToggleFavorite(board.id, board.favorite)}
                      sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                    >
                      {board.favorite ? 
                        <StarIcon fontSize="small" sx={{ color: '#FFC107' }} /> : 
                        <StarBorderIcon fontSize="small" />
                      }
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleBoardMenuOpen(e, board)}
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
                      {board.memberNames?.map((member, idx) => (
                        <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                          {typeof member === 'string' ? member.charAt(0) : '?'}
                        </Avatar>
                      ))}
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
      
      {/* Board Menu */}
      <Menu
        anchorEl={boardMenuAnchorEl}
        open={Boolean(boardMenuAnchorEl)}
        onClose={handleBoardMenuClose}
      >
        <MenuItem component={Link} to={`/boards/${selectedBoard?.id}`} onClick={handleBoardMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Abrir
        </MenuItem>
        <MenuItem onClick={() => {
          handleToggleFavorite(selectedBoard?.id, selectedBoard?.favorite);
          handleBoardMenuClose();
        }}>
          {selectedBoard?.favorite ? 
            <> 
              <StarBorderIcon fontSize="small" sx={{ mr: 1 }} />
              Remover dos Favoritos
            </> : 
            <>
              <StarIcon fontSize="small" sx={{ mr: 1, color: '#FFC107' }} />
              Adicionar aos Favoritos
            </>
          }
        </MenuItem>
        <MenuItem onClick={handleBoardMenuClose}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Compartilhar
        </MenuItem>
        <MenuItem onClick={handleBoardMenuClose}>
          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
          Gerenciar Membros
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
      
      {/* New Board Dialog */}
      <Dialog 
        open={openNewBoardDialog} 
        onClose={handleCloseNewBoardDialog}
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Criar Novo Quadro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título do Quadro"
            fullWidth
            variant="outlined"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            error={newBoardTitle.trim() === ''}
            helperText={newBoardTitle.trim() === '' ? 'O título é obrigatório' : ''}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined">
            <InputLabel id="board-color-label">Cor</InputLabel>
            <Select
              labelId="board-color-label"
              value={newBoardColor}
              onChange={(e) => setNewBoardColor(e.target.value)}
              label="Cor"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: selected,
                      mr: 1,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} 
                  />
                  {colorOptions.find(c => c.value === selected)?.name || 'Cor'}
                </Box>
              )}
            >
              {colorOptions.map((color) => (
                <MenuItem key={color.value} value={color.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%', 
                        bgcolor: color.value,
                        mr: 1,
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} 
                    />
                    {color.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewBoardDialog} disabled={processingAction}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateBoard}
            variant="contained"
            disabled={newBoardTitle.trim() === '' || processingAction}
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            {processingAction ? <CircularProgress size={24} /> : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Quadro"
        message={`Tem certeza que deseja excluir o quadro "${selectedBoard?.title}"? Esta ação não pode ser desfeita e todos os cartões serão perdidos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        severity="error"
      />
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Processing indicator */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={processingAction}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}