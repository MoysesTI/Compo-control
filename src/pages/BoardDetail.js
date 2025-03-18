import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  TextField, 
  Avatar, 
  AvatarGroup, 
  Chip, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Divider,
  Grid,
  FormControlLabel,
  Checkbox,
  OutlinedInput,
  ListItemText
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDocument, useCollection, firestoreService } from '../hooks/firebase-hooks';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, addDoc, getDocs, where, query } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Estado para armazenar os dados do quadro
  const [columns, setColumns] = useState({});
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  
  // Estados para manipulação de interface
  const [anchorEl, setAnchorEl] = useState(null);
  const [cardMenuAnchorEl, setCardMenuAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCard, setAddingCard] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editCardDialog, setEditCardDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para notificações
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado do card em edição
  const [editingCard, setEditingCard] = useState({
    id: '',
    title: '',
    description: '',
    dueDate: '',
    labels: [],
    members: [],
    status: 'Pendente',
    priority: 'Média'
  });
  
  // Obter dados do quadro do Firestore
  const { 
    document: board,
    loading: boardLoading,
    error: boardError
  } = useDocument('boards', id);
  
  // Obter usuários da equipe para adicionar a cards
  const {
    documents: teamMembers,
    loading: teamLoading
  } = useCollection('users');
  
  // Converter os dados do documento para o formato usado pelo componente
  useEffect(() => {
    if (board) {
      setBoardTitle(board.title || 'Quadro sem título');
      setBoardDescription(board.description || '');
      
      // Se o board tem colunas predefinidas, use-as
      if (board.columns && Array.isArray(board.columns)) {
        const columnsObject = {};
        board.columns.forEach(column => {
          columnsObject[column.id] = {
            ...column,
            cards: column.cards || []
          };
        });
        setColumns(columnsObject);
      } else {
        // Caso não tenha colunas, criar layout padrão
        setColumns({
          'col-1': {
            id: 'col-1',
            title: 'A Fazer',
            cards: []
          },
          'col-2': {
            id: 'col-2',
            title: 'Em Andamento',
            cards: []
          },
          'col-3': {
            id: 'col-3',
            title: 'Revisão',
            cards: []
          },
          'col-4': {
            id: 'col-4',
            title: 'Concluído',
            cards: []
          }
        });
      }
    }
  }, [board]);
  
  // Exibir erro se não carregar o quadro
  useEffect(() => {
    if (boardError) {
      setError(boardError);
      setSnackbar({
        open: true,
        message: `Erro ao carregar quadro: ${boardError}`,
        severity: 'error'
      });
    }
  }, [boardError]);
  
  // Carregar cards do quadro do Firestore
  useEffect(() => {
    const loadCards = async () => {
      if (!id) return;
      
      try {
        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where('boardId', '==', id));
        const querySnapshot = await getDocs(q);
        
        const cardsData = [];
        querySnapshot.forEach((doc) => {
          cardsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Distribuir os cards para suas colunas correspondentes
        const updatedColumns = { ...columns };
        
        cardsData.forEach(card => {
          const columnId = card.columnId || 'col-1'; // 'col-1' é o default se não tiver coluna definida
          
          if (updatedColumns[columnId]) {
            if (!updatedColumns[columnId].cards) {
              updatedColumns[columnId].cards = [];
            }
            
            // Evitar duplicação de cards
            const cardExists = updatedColumns[columnId].cards.some(c => c.id === card.id);
            if (!cardExists) {
              updatedColumns[columnId].cards.push(card);
            }
          }
        });
        
        setColumns(updatedColumns);
      } catch (error) {
        console.error('Erro ao carregar cards:', error);
        setError(`Erro ao carregar cards: ${error.message}`);
      }
    };
    
    if (Object.keys(columns).length > 0) {
      loadCards();
    }
  }, [id, Object.keys(columns).length]);
  
  // Handlers da interface
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCardMenuOpen = (event, card) => {
    event.stopPropagation();
    setCardMenuAnchorEl(event.currentTarget);
    setSelectedCard(card);
  };
  
  const handleCardMenuClose = () => {
    setCardMenuAnchorEl(null);
  };
  
  // Adicionar nova lista (coluna)
  const handleAddList = async () => {
    if (newListTitle.trim() === '') return;
    
    const newColumnId = `col-${Date.now()}`;
    const newColumn = {
      id: newColumnId,
      title: newListTitle,
      cards: []
    };
    
    try {
      setLoading(true);
      
      // Atualizar estado local
      const updatedColumns = {
        ...columns,
        [newColumnId]: newColumn
      };
      setColumns(updatedColumns);
      
      // Atualizar no Firebase
      const boardRef = doc(db, 'boards', id);
      
      // Converter para o formato de array que o Firestore espera
      const columnsArray = Object.values(updatedColumns);
      
      await updateDoc(boardRef, {
        columns: columnsArray,
        updatedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Lista adicionada com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao adicionar lista:', error);
      setSnackbar({
        open: true,
        message: `Erro ao adicionar lista: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setNewListTitle('');
      setAddingList(false);
    }
  };
  
  // Adicionar novo card
  const handleAddCard = async (columnId) => {
    if (newCardTitle.trim() === '') return;
    
    const newCard = {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      description: '',
      boardId: id,
      columnId: columnId,
      status: 'Pendente',
      priority: 'Média',
      labels: [],
      members: [userProfile?.id], // Adicionar o criador como membro por padrão
      progress: 0,
      dueDate: '',
      createdBy: userProfile?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: 0,
      attachments: 0
    };
    
    try {
      setLoading(true);
      
      // Adicionar ao Firestore
      const docRef = await addDoc(collection(db, 'cards'), newCard);
      
      // Atualizar ID do card com o ID gerado pelo Firestore
      const cardWithId = {
        ...newCard,
        id: docRef.id
      };
      
      // Atualizar estado local
      const updatedColumns = { ...columns };
      if (!updatedColumns[columnId].cards) {
        updatedColumns[columnId].cards = [];
      }
      updatedColumns[columnId].cards.push(cardWithId);
      setColumns(updatedColumns);
      
      setSnackbar({
        open: true,
        message: 'Card adicionado com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao adicionar card:', error);
      setSnackbar({
        open: true,
        message: `Erro ao adicionar card: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setNewCardTitle('');
      setAddingCard(null);
    }
  };
  
  // Abrir diálogo de edição de card
  const handleEditCardOpen = (card) => {
    setEditingCard({
      ...card,
      dueDate: card.dueDate || ''
    });
    setEditCardDialog(true);
    handleCardMenuClose();
  };
  
  // Atualizar card
  const handleUpdateCard = async () => {
    try {
      setLoading(true);
      
      // Atualizar no Firestore
      const cardRef = doc(db, 'cards', editingCard.id);
      await updateDoc(cardRef, {
        ...editingCard,
        updatedAt: new Date().toISOString()
      });
      
      // Atualizar estado local
      const updatedColumns = { ...columns };
      Object.keys(updatedColumns).forEach(colId => {
        const cardIndex = updatedColumns[colId].cards.findIndex(c => c.id === editingCard.id);
        if (cardIndex !== -1) {
          updatedColumns[colId].cards[cardIndex] = {
            ...updatedColumns[colId].cards[cardIndex],
            ...editingCard,
            updatedAt: new Date().toISOString()
          };
        }
      });
      
      setColumns(updatedColumns);
      setEditCardDialog(false);
      
      setSnackbar({
        open: true,
        message: 'Card atualizado com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao atualizar card:', error);
      setSnackbar({
        open: true,
        message: `Erro ao atualizar card: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir diálogo de confirmação para excluir card
  const handleDeleteCardConfirm = () => {
    setDeleteConfirmDialog(true);
    handleCardMenuClose();
  };
  
  // Excluir card
  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    
    try {
      setLoading(true);
      
      // Excluir do Firestore
      await deleteDoc(doc(db, 'cards', selectedCard.id));
      
      // Atualizar estado local
      const updatedColumns = { ...columns };
      Object.keys(updatedColumns).forEach(colId => {
        updatedColumns[colId].cards = updatedColumns[colId].cards.filter(
          card => card.id !== selectedCard.id
        );
      });
      
      setColumns(updatedColumns);
      setDeleteConfirmDialog(false);
      
      setSnackbar({
        open: true,
        message: 'Card excluído com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir card:', error);
      setSnackbar({
        open: true,
        message: `Erro ao excluir card: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSelectedCard(null);
    }
  };
  
  // Gerenciar o arrastar e soltar
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Encontrar card que está sendo arrastado
    let draggedCard = null;
    Object.keys(columns).forEach(colId => {
      columns[colId].cards.forEach(card => {
        if (card.id === draggableId) {
          draggedCard = { ...card };
        }
      });
    });
    
    if (!draggedCard) return;
    
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    try {
      // Atualizar estado local
      const newColumns = { ...columns };
      
      // Remover da coluna de origem
      newColumns[source.droppableId] = {
        ...sourceColumn,
        cards: sourceColumn.cards.filter(card => card.id !== draggableId)
      };
      
      // Adicionar à coluna de destino na posição correta
      const destCards = Array.from(destColumn.cards);
      destCards.splice(destination.index, 0, {
        ...draggedCard,
        columnId: destination.droppableId,
        updatedAt: new Date().toISOString()
      });
      
      newColumns[destination.droppableId] = {
        ...destColumn,
        cards: destCards
      };
      
      setColumns(newColumns);
      
      // Atualizar no Firebase
      const cardRef = doc(db, 'cards', draggableId);
      await updateDoc(cardRef, {
        columnId: destination.droppableId,
        updatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao mover card:', error);
      setSnackbar({
        open: true,
        message: `Erro ao mover card: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // Input change handler para o card em edição
  const handleEditCardChange = (e) => {
    const { name, value } = e.target;
    setEditingCard(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle label selection (multiple)
  const handleLabelChange = (event) => {
    const { value } = event.target;
    setEditingCard(prev => ({
      ...prev,
      labels: value
    }));
  };
  
  // Handle member selection (multiple)
  const handleMemberChange = (event) => {
    const { value } = event.target;
    setEditingCard(prev => ({
      ...prev,
      members: value
    }));
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
  
  // Opções de status
  const statusOptions = [
    'Pendente',
    'Em andamento',
    'Revisão',
    'Concluído'
  ];
  
  // Opções de prioridade
  const priorityOptions = [
    'Baixa',
    'Média',
    'Alta',
    'Urgente'
  ];
  
  // Opções de labels
  const labelOptions = [
    'Design',
    'Urgente',
    'Orçamento',
    'Produção',
    'Revisão',
    'Concluído'
  ];

  return (
    <Box sx={{ padding: 3 }}>
      {boardLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              {boardTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
              {boardDescription}
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
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
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
                        <Typography variant="body2" color="text.secondary">
                          {column.cards ? column.cards.length : 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ p: 1, flexGrow: 1 }}>
                        {column.cards && column.cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleEditCardOpen(card)}
                                sx={{
                                  p: 2,
                                  mb: 2,
                                  borderRadius: 2,
                                  boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                                  bgcolor: 'white',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
                                  },
                                  position: 'relative'
                                }}
                              >
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => handleCardMenuOpen(e, card)}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                
                                <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {card.labels && card.labels.map((label, idx) => (
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
                                  
                                  {card.priority && (
                                    <Chip
                                      label={card.priority}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: 
                                          card.priority === 'Urgente' ? '#F44336' :
                                          card.priority === 'Alta' ? '#FF9800' :
                                          card.priority === 'Média' ? '#2196F3' : 
                                          '#4CAF50',
                                        color: 'white'
                                      }}
                                    />
                                  )}
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
                                  {card.members && card.members.length > 0 && (
                                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                                      {card.members.map((memberId, idx) => {
                                        const member = teamMembers.find(user => user.id === memberId);
                                        return (
                                          <Tooltip key={idx} title={member?.name || 'Usuário'}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                              {member?.name ? member.name.charAt(0) : "U"}
                                            </Avatar>
                                          </Tooltip>
                                        );
                                      })}
                                    </AvatarGroup>
                                  )}
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {card.dueDate && (
                                      <Tooltip title="Data de Vencimento">
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                                          <Typography variant="caption">
                                            {new Date(card.dueDate).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    )}
                                    
                                    {card.comments > 0 && (
                                      <Tooltip title={`${card.comments} comentários`}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                          <CommentIcon fontSize="small" sx={{ fontSize: 16 }} />
                                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {card.comments}
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    )}
                                    
                                    {card.attachments > 0 && (
                                      <Tooltip title={`${card.attachments} anexos`}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                          <AttachFileIcon fontSize="small" sx={{ fontSize: 16 }} />
                                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {card.attachments}
                                          </Typography>
                                        </Box>
                                      </Tooltip>
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
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} /> : null}
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
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} /> : null}
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
          
          {/* Menu de ações do card */}
          <Menu
            anchorEl={cardMenuAnchorEl}
            open={Boolean(cardMenuAnchorEl)}
            onClose={handleCardMenuClose}
          >
            <MenuItem onClick={() => handleEditCardOpen(selectedCard)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleDeleteCardConfirm} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </Menu>
          
          {/* Diálogo de edição de card */}
          <Dialog 
            open={editCardDialog} 
            onClose={() => setEditCardDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Editar Card</DialogTitle>
            <DialogContent>
              <TextField
                margin="normal"
                fullWidth
                label="Título"
                name="title"
                value={editingCard.title}
                onChange={handleEditCardChange}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Descrição"
                name="description"
                value={editingCard.description}
                onChange={handleEditCardChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Data de Vencimento"
                    name="dueDate"
                    type="date"
                    value={editingCard.dueDate}
                    onChange={handleEditCardChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={editingCard.status || 'Pendente'}
                      label="Status"
                      onChange={handleEditCardChange}
                    >
                      {statusOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                    <InputLabel id="priority-label">Prioridade</InputLabel>
                    <Select
                      labelId="priority-label"
                      name="priority"
                      value={editingCard.priority || 'Média'}
                      label="Prioridade"
                      onChange={handleEditCardChange}
                    >
                      {priorityOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                    <InputLabel id="labels-label">Etiquetas</InputLabel>
                    <Select
                      labelId="labels-label"
                      multiple
                      value={editingCard.labels || []}
                      onChange={handleLabelChange}
                      input={<OutlinedInput label="Etiquetas" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={value} 
                              size="small"
                              sx={{ 
                                bgcolor: getLabelColor(value),
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {labelOptions.map(label => (
                        <MenuItem key={label} value={label}>
                          <Checkbox checked={(editingCard.labels || []).indexOf(label) > -1} />
                          <ListItemText primary={label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Membros Responsáveis
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="members-label">Membros</InputLabel>
                <Select
                  labelId="members-label"
                  multiple
                  value={editingCard.members || []}
                  onChange={handleMemberChange}
                  input={<OutlinedInput label="Membros" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((memberId) => {
                        const member = teamMembers.find(user => user.id === memberId);
                        return (
                          <Chip 
                            key={memberId} 
                            label={member?.name || 'Usuário'} 
                            size="small"
                            avatar={<Avatar>{member?.name ? member.name.charAt(0) : "U"}</Avatar>}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {teamMembers.map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      <Checkbox checked={(editingCard.members || []).indexOf(member.id) > -1} />
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                        {member.name ? member.name.charAt(0) : "U"}
                      </Avatar>
                      <ListItemText primary={member.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditCardDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleUpdateCard}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Salvar
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo de confirmação para excluir card */}
          <Dialog
            open={deleteConfirmDialog}
            onClose={() => setDeleteConfirmDialog(false)}
          >
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Typography>
                  Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteCard} 
                color="error"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Snackbar para mensagens */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity} 
              sx={{ width: '100%' }}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}