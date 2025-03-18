import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Button, IconButton, TextField, Avatar, AvatarGroup, Chip, Menu, MenuItem } from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function BoardDetail() {
  const { id } = useParams();
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState({
    'col-1': {
      id: 'col-1',
      title: 'A Fazer',
      cards: [
        { 
          id: 'card-1', 
          title: 'Design de banner promocional', 
          description: 'Criar banner para campanha de inverno',
          labels: ['Design', 'Urgente'],
          members: ['Maria', 'João'],
          dueDate: '2023-08-15',
          comments: 3,
          attachments: 2
        },
        { 
          id: 'card-2', 
          title: 'Orçamento para adesivação', 
          description: 'Preparar orçamento para cliente XYZ',
          labels: ['Orçamento'],
          members: ['Ana'],
          dueDate: '2023-08-18',
          comments: 1,
          attachments: 0
        }
      ]
    },
    'col-2': {
      id: 'col-2',
      title: 'Em Andamento',
      cards: [
        { 
          id: 'card-3', 
          title: 'Produção de placas de sinalização', 
          description: 'Produzir 5 placas para Empresa ABC',
          labels: ['Produção'],
          members: ['Carlos', 'Paulo'],
          dueDate: '2023-08-20',
          comments: 5,
          attachments: 1
        }
      ]
    },
    'col-3': {
      id: 'col-3',
      title: 'Revisão',
      cards: [
        { 
          id: 'card-4', 
          title: 'Revisão de arte para banner', 
          description: 'Verificar cores e dimensões do banner',
          labels: ['Revisão', 'Design'],
          members: ['Maria', 'Ana'],
          dueDate: '2023-08-12',
          comments: 8,
          attachments: 3
        }
      ]
    },
    'col-4': {
      id: 'col-4',
      title: 'Concluído',
      cards: [
        { 
          id: 'card-5', 
          title: 'Criação de logotipo', 
          description: 'Desenvolver logo para Restaurante Delícia',
          labels: ['Design', 'Concluído'],
          members: ['João'],
          dueDate: '2023-08-05',
          comments: 12,
          attachments: 4
        }
      ]
    }
  });
  
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCard, setAddingCard] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddList = () => {
    if (newListTitle.trim() === '') return;
    
    const newColumnId = `col-${Date.now()}`;
    const newColumn = {
      id: newColumnId,
      title: newListTitle,
      cards: []
    };
    
    setColumns({
      ...columns,
      [newColumnId]: newColumn
    });
    
    setNewListTitle('');
    setAddingList(false);
  };

  const handleAddCard = (columnId) => {
    if (newCardTitle.trim() === '') return;
    
    const newCard = {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      description: '',
      labels: [],
      members: [],
      comments: 0,
      attachments: 0
    };
    
    const column = columns[columnId];
    const updatedColumn = {
      ...column,
      cards: [...column.cards, newCard]
    };
    
    setColumns({
      ...columns,
      [columnId]: updatedColumn
    });
    
    setNewCardTitle('');
    setAddingCard(null);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const draggedCard = sourceColumn.cards.find(card => card.id === draggableId);
    
    if (source.droppableId === destination.droppableId) {
      // Reordenar na mesma coluna
      const newCards = Array.from(sourceColumn.cards);
      newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, draggedCard);
      
      const newColumn = {
        ...sourceColumn,
        cards: newCards
      };
      
      setColumns({
        ...columns,
        [source.droppableId]: newColumn
      });
    } else {
      // Mover para outra coluna
      const sourceCards = Array.from(sourceColumn.cards);
      sourceCards.splice(source.index, 1);
      
      const destCards = Array.from(destColumn.cards);
      destCards.splice(destination.index, 0, draggedCard);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          cards: sourceCards
        },
        [destination.droppableId]: {
          ...destColumn,
          cards: destCards
        }
      });
    }
  };

  // Função para escolher cor com base no label
  const getLabelColor = (label) => {
    switch (label) {
      case 'Design':
        return '#2E78D2'; // Azul principal
      case 'Urgente':
        return '#F44336'; // Vermelho
      case 'Orçamento':
        return '#4CAF50'; // Verde
      case 'Produção':
        return '#FFC107'; // Amarelo
      case 'Revisão':
        return '#9C27B0'; // Roxo
      case 'Concluído':
        return '#4CAF50'; // Verde
      default:
        return '#E8DCC5'; // Bege padrão
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Quadro: Projeto {id}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="primary" onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Editar Quadro</MenuItem>
          <MenuItem onClick={handleMenuClose}>Compartilhar</MenuItem>
          <MenuItem onClick={handleMenuClose}>Configurações</MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>Arquivar Quadro</MenuItem>
        </Menu>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 'calc(100vh - 200px)' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          {Object.values(columns).map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <Paper
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    minWidth: 280,
                    maxWidth: 280,
                    bgcolor: snapshot.isDraggingOver ? 'secondary.light' : 'neutral.white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'secondary.light', 
                    borderTopLeftRadius: 8, 
                    borderTopRightRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {column.title}
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ p: 1, flexGrow: 1 }}>
                    {column.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              p: 2,
                              mb: 2,
                              borderRadius: 2,
                              boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                              bgcolor: 'white',
                              '&:hover': {
                                boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
                              }
                            }}
                          >
                            <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {card.labels.map((label, idx) => (
                                <Chip
                                  key={idx}
                                  label={label}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: getLabelColor(label),
                                    color: 'white'
                                  }}
                                />
                              ))}
                            </Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              {card.title}
                            </Typography>
                            {card.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                {card.description.length > 80 
                                  ? `${card.description.substring(0, 80)}...` 
                                  : card.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                                {card.members.map((member, idx) => (
                                  <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                                    {member.charAt(0)}
                                  </Avatar>
                                ))}
                              </AvatarGroup>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {card.dueDate && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="caption">
                                      {new Date(card.dueDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                )}
                                {card.comments > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                    <CommentIcon fontSize="small" sx={{ fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                      {card.comments}
                                    </Typography>
                                  </Box>
                                )}
                                {card.attachments > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                    <AttachFileIcon fontSize="small" sx={{ fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                      {card.attachments}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {addingCard === column.id ? (
                      <Box sx={{ p: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          variant="outlined"
                          placeholder="Digite o título do cartão..."
                          size="small"
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          autoFocus
                          sx={{ 
                            mb: 1,
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleAddCard(column.id)}
                            sx={{ bgcolor: 'primary.main', color: 'white' }}
                          >
                            Adicionar
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => {
                              setAddingCard(null);
                              setNewCardTitle('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Button
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => setAddingCard(column.id)}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          color: 'text.secondary',
                          '&:hover': { bgcolor: 'secondary.light' }
                        }}
                      >
                        Adicionar Cartão
                      </Button>
                    )}
                  </Box>
                </Paper>
              )}
            </Droppable>
          ))}
          
          {addingList ? (
            <Paper sx={{ 
              minWidth: 280, 
              maxWidth: 280, 
              p: 2, 
              bgcolor: 'neutral.white',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Digite o título da lista..."
                size="small"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={handleAddList}
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                >
                  Adicionar
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setAddingList(false);
                    setNewListTitle('');
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ 
              minWidth: 280, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              p: 2,
              bgcolor: 'rgba(255,255,255,0.6)',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'secondary.light'
            }}>
              <Button 
                startIcon={<AddIcon />} 
                onClick={() => setAddingList(true)}
                sx={{ color: 'text.secondary' }}
              >
                Adicionar Lista
              </Button>
            </Paper>
          )}
        </DragDropContext>
      </Box>
    </Box>
  );
}