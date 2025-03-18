import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Avatar, AvatarGroup, Menu, MenuItem, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { Add as AddIcon, MoreVert as MoreVertIcon, Star, StarBorder } from '@mui/icons-material';

export default function Boards() {
  const [openDialog, setOpenDialog] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [boardsList, setBoardsList] = useState([
    { 
      id: '1', 
      title: 'Adesivação', 
      description: 'Projetos de adesivação para veículos e fachadas',
      favorite: true,
      members: ['Ana', 'João', 'Maria', 'Carlos'],
      color: '#2E78D2' // Azul
    },
    { 
      id: '2', 
      title: 'Impressão', 
      description: 'Projetos de impressão digital em lona e papel',
      favorite: false,
      members: ['Ana', 'José'],
      color: '#4CAF50' // Verde
    },
    { 
      id: '3', 
      title: 'Banner e Logos', 
      description: 'Criação de banners e logos para empresas',
      favorite: true,
      members: ['Maria', 'Paulo', 'Júlia'],
      color: '#E8DCC5' // Bege
    },
    { 
      id: '4', 
      title: 'Peças de Acrílico', 
      description: 'Produção de peças e displays em acrílico',
      favorite: false,
      members: ['Carlos'],
      color: '#FFC107' // Amarelo
    },
    { 
      id: '5', 
      title: 'MDF e PVC', 
      description: 'Trabalhos em MDF e PVC para stands e expositores',
      favorite: false,
      members: ['João', 'Ana', 'Carlos', 'Paulo'],
      color: '#F44336' // Vermelho
    },
  ]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewBoardTitle('');
  };

  const handleCreateBoard = () => {
    if (newBoardTitle.trim() === '') return;
    
    const newBoard = {
      id: `${boardsList.length + 1}`,
      title: newBoardTitle,
      description: 'Novo projeto',
      favorite: false,
      members: [],
      color: '#2E78D2' // Azul por padrão
    };
    
    setBoardsList([...boardsList, newBoard]);
    handleCloseDialog();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleFavorite = (id) => {
    setBoardsList(boardsList.map(board => 
      board.id === id ? { ...board, favorite: !board.favorite } : board
    ));
  };

  // Ordenar os quadros: favoritos primeiro, depois alfabeticamente
  const sortedBoards = [...boardsList].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.title.localeCompare(b.title);
  });

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
      
      {/* Quadros favoritos */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Star sx={{ color: '#FFC107', mr: 1 }} /> 
          Favoritos
        </Typography>
        <Grid container spacing={3}>
          {sortedBoards.filter(board => board.favorite).map((board) => (
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
                    onClick={() => toggleFavorite(board.id)}
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
                    {board.members.map((member, idx) => (
                      <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                        {member.charAt(0)}
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
      
      {/* Todos os quadros */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Todos os Quadros
        </Typography>
        <Grid container spacing={3}>
          {sortedBoards.filter(board => !board.favorite).map((board) => (
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
                    onClick={() => toggleFavorite(board.id)}
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
                    {board.members.map((member, idx) => (
                      <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                        {member.charAt(0)}
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
      
      {/* Diálogo para criar novo quadro */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleCreateBoard}
            variant="contained"
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}