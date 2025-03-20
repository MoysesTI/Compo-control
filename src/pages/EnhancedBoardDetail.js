import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Skeleton,
  Tooltip,
  Backdrop,
  InputAdornment,
  ListItem,
  ListItemText,
  List,
  FormControl,
  InputLabel,
  Select,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Archive as ArchiveIcon,
  ContentCopy as ContentCopyIcon,
  FilterAlt as FilterAltIcon,
  List as ListIcon,
  Label as LabelIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import CardEditor from "../components/board/CardEditor";
import ConfirmationDialog from "../components/common/ConfirmationDialog";
import MemberSelector from "../components/common/MemberSelector";
import cardService from "../services/cardService";
import columnService from "../services/columnService";
import boardService from "../services/boardService";
import CardDeletionHandler from "../components/board/CardDeletionHandler";
export default function EnhancedBoardDetail() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [deletingCard, setDeletingCard] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null);
  // State for board and columns
  const [boardData, setBoardData] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);

  // State for UI controls
  const [boardMenuAnchorEl, setBoardMenuAnchorEl] = useState(null);
  const [cardMenuAnchorEl, setCardMenuAnchorEl] = useState(null);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingCard, setAddingCard] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // State for dialogs
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignMembersDialogOpen, setAssignMembersDialogOpen] = useState(false);

  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // State for additional features
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [deleteColumnDialogOpen, setDeleteColumnDialogOpen] = useState(false);
  const [shareBoardDialogOpen, setShareBoardDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [archivedCardsDialogOpen, setArchivedCardsDialogOpen] = useState(false);
  const [manageLabelsDialogOpen, setManageLabelsDialogOpen] = useState(false);

  // Fetch board data and team members
  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Fetching board data for board: ${boardId}`);

      // Fetch board data
      const boardRef = doc(db, "boards", boardId);
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        setError("Quadro não encontrado");
        setLoading(false);
        return;
      }

      const board = { id: boardSnap.id, ...boardSnap.data() };
      setBoardData(board);
      console.log("Board data loaded:", board.title);

      // Fetch columns with auto-initialization
      const columnsData = await columnService.getColumns(boardId);
      const formattedColumns = {};

      // Fetch cards for each column
      const columnsPromises = columnsData.map(async (column) => {
        try {
          // Fetch cards
          const cards = await cardService.getCards(
            boardId,
            column.id,
            currentUser.uid,
            userProfile?.role === "admin"
          );

          formattedColumns[column.id] = {
            ...column,
            cards,
          };
        } catch (error) {
          console.error(`Error fetching cards for column ${column.id}:`, error);
          formattedColumns[column.id] = {
            ...column,
            cards: [],
            error: error.message,
          };
        }
      });

      await Promise.all(columnsPromises);

      // Sort columns by order
      setColumns(formattedColumns);
      console.log(`Loaded ${Object.keys(formattedColumns).length} columns`);

      // Fetch team members
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeamMembers(usersData);
      console.log(`Loaded ${usersData.length} team members`);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching board data:", error);
      setError(`Falha ao carregar o quadro: ${error.message}`);
      setLoading(false);

      setSnackbar({
        open: true,
        message: `Erro ao carregar o quadro: ${error.message}`,
        severity: "error",
      });
    }
  }, [boardId, currentUser, userProfile]);

  // Load board data on component mount
  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Board menu handlers
  const handleBoardMenuOpen = (event) => {
    setBoardMenuAnchorEl(event.currentTarget);
  };

  const handleBoardMenuClose = () => {
    setBoardMenuAnchorEl(null);
  };

  // Card menu handlers
  const handleCardMenuOpen = (event, card, columnId) => {
    event.stopPropagation();
    setCardMenuAnchorEl(event.currentTarget);
    setSelectedCard({ ...card, columnId });
  };

  const handleCardMenuClose = () => {
    setCardMenuAnchorEl(null);
    setSelectedCard(null);
  };

  // Add new column
  const handleAddColumn = async () => {
    if (newColumnTitle.trim() === "") return;

    try {
      setProcessingAction(true);
      console.log(`Adding new column: ${newColumnTitle}`);

      // Add column to Firestore
      await columnService.addColumn(boardId, newColumnTitle, currentUser.uid);

      // Refresh data
      await fetchBoardData();

      // Reset form
      setNewColumnTitle("");
      setAddingColumn(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Coluna adicionada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding column:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao adicionar coluna: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Add new card
  const handleAddCardClick = (columnId) => {
    setCardToEdit(null);
    setAddingCard(columnId);
    setCardEditorOpen(true);
  };

  // Edit card
  const handleEditCardClick = (card, columnId) => {
    setCardToEdit({ ...card, columnId });
    setCardEditorOpen(true);
    handleCardMenuClose();
  };

  // Delete card dialog
  const handleDeleteCardClick = (card, columnId) => {
    setDeletingCard(card);
    setDeletingColumn(columnId);
    handleCardMenuClose();
  };
  const handleCancelCardDeletion = () => {
    setDeletingCard(null);
    setDeletingColumn(null);
  };

  const handleCardDeletionSuccess = () => {
    // Update local state to remove the deleted card
    if (deletingCard && deletingColumn) {
      setColumns((prevColumns) => ({
        ...prevColumns,
        [deletingColumn]: {
          ...prevColumns[deletingColumn],
          cards: prevColumns[deletingColumn].cards.filter(
            (card) => card.id !== deletingCard.id
          ),
        },
      }));
    }

    // Clear deletion states
    setDeletingCard(null);
    setDeletingColumn(null);
  };
  // Assign members dialog
  const handleAssignMembersClick = () => {
    setAssignMembersDialogOpen(true);
    handleCardMenuClose();
  };

  // Save card (create or update)
  const handleSaveCard = async (cardData, columnId) => {
    try {
      setProcessingAction(true);

      if (cardToEdit) {
        // Update existing card
        console.log(`Updating card: ${cardToEdit.id}`);
        await cardService.updateCard(
          boardId,
          columnId,
          cardToEdit.id,
          cardData
        );

        setSnackbar({
          open: true,
          message: "Cartão atualizado com sucesso!",
          severity: "success",
        });
      } else {
        // Create new card
        console.log(`Creating new card in column: ${columnId}`);
        await cardService.addCard(boardId, columnId, cardData, currentUser.uid);

        setSnackbar({
          open: true,
          message: "Cartão criado com sucesso!",
          severity: "success",
        });
      }

      // Refresh data
      await fetchBoardData();
      setProcessingAction(false);
    } catch (error) {
      console.error("Error saving card:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao salvar cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Delete card
  const handleDeleteCardConfirm = async () => {
    if (!selectedCard) return;

    try {
      setProcessingAction(true);
      console.log(`Deleting card: ${selectedCard.id}`);

      await cardService.deleteCard(
        boardId,
        selectedCard.columnId,
        selectedCard.id
      );

      // Refresh data
      await fetchBoardData();
      setDeleteDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Cartão excluído com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      setDeleteDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao excluir cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Assign members
  const handleAssignMembers = async (memberIds, memberNames, visibility) => {
    if (!selectedCard) return;

    try {
      setProcessingAction(true);
      console.log(`Assigning members to card: ${selectedCard.id}`);

      await cardService.assignMembers(
        boardId,
        selectedCard.columnId,
        selectedCard.id,
        memberIds,
        memberNames,
        visibility
      );

      // Refresh data
      await fetchBoardData();
      setAssignMembersDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Membros atribuídos com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error assigning members:", error);
      setAssignMembersDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao atribuir membros: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    try {
      setProcessingAction(true);
      console.log(
        `Moving card ${draggableId} from column ${source.droppableId} to ${destination.droppableId}`
      );

      // Update state optimistically for better UX
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const draggedCard = sourceColumn.cards.find(
        (card) => card.id === draggableId
      );

      if (source.droppableId === destination.droppableId) {
        // Reordering in same column
        const newCards = Array.from(sourceColumn.cards);
        newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, draggedCard);

        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            cards: newCards,
          },
        });
      } else {
        // Moving to another column
        const sourceCards = Array.from(sourceColumn.cards);
        sourceCards.splice(source.index, 1);

        const destCards = Array.from(destColumn.cards);
        destCards.splice(destination.index, 0, {
          ...draggedCard,
          columnId: destination.droppableId,
        });

        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            cards: sourceCards,
          },
          [destination.droppableId]: {
            ...destColumn,
            cards: destCards,
          },
        });
      }

      // Update in Firebase
      await cardService.moveCard(
        boardId,
        source.droppableId,
        destination.droppableId,
        draggableId,
        destination.index
      );

      // No need to refresh data as we've already updated the state
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Cartão movido com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error during drag and drop:", error);
      setProcessingAction(false);

      // Refresh data to revert to correct state
      await fetchBoardData();

      setSnackbar({
        open: true,
        message: `Erro ao mover cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Get label color
  const getLabelColor = (label) => {
    // Primeiro, verificar se temos etiquetas personalizadas
    if (boardData?.labels) {
      const customLabel = boardData.labels.find(
        (l) => l.name === label || l.id === label
      );
      if (customLabel) {
        return customLabel.color;
      }
    }

    // Fallback para cores padrão
    switch (label) {
      case "Design":
        return "#2E78D2"; // Azul principal
      case "Urgente":
        return "#F44336"; // Vermelho
      case "Orçamento":
        return "#4CAF50"; // Verde
      case "Produção":
        return "#FFC107"; // Amarelo
      case "Revisão":
        return "#9C27B0"; // Roxo
      case "Concluído":
        return "#4CAF50"; // Verde
      default:
        return "#E8DCC5"; // Bege padrão
    }
  };

  // Close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Métodos para editar/excluir quadro
  const handleEditBoard = () => {
    setEditBoardDialogOpen(true);
    handleBoardMenuClose();
  };

  const handleDeleteBoard = () => {
    setDeleteBoardDialogOpen(true);
    handleBoardMenuClose();
  };

  const handleDeleteBoardConfirm = async () => {
    if (!boardData) return;

    try {
      setProcessingAction(true);
      console.log(`Deleting board: ${boardId}`);

      await boardService.deleteBoard(boardId);

      setDeleteBoardDialogOpen(false);
      setProcessingAction(false);

      // Mostrar mensagem de sucesso
      setSnackbar({
        open: true,
        message: "Quadro excluído com sucesso!",
        severity: "success",
      });

      // Navegar de volta para a lista de quadros
      navigate("/boards");
    } catch (error) {
      console.error("Error deleting board:", error);
      setDeleteBoardDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao excluir quadro: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleSaveBoardEdit = async (updatedBoardData) => {
    try {
      setProcessingAction(true);
      console.log(`Updating board: ${boardId}`);

      await boardService.updateBoard(boardId, updatedBoardData);

      // Atualizar dados locais
      setBoardData({ ...boardData, ...updatedBoardData });

      setEditBoardDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Quadro atualizado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating board:", error);
      setEditBoardDialogOpen(false);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao atualizar quadro: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Métodos para gerenciar colunas
  const handleEditColumn = (column) => {
    setSelectedColumn(column);
    setEditColumnDialogOpen(true);
  };

  const handleSaveColumnEdit = async (updatedColumnData) => {
    if (!selectedColumn) return;

    try {
      setProcessingAction(true);
      console.log(`Updating column: ${selectedColumn.id}`);

      await columnService.updateColumn(
        boardId,
        selectedColumn.id,
        updatedColumnData
      );

      // Atualizar dados locais
      const updatedColumns = { ...columns };
      updatedColumns[selectedColumn.id] = {
        ...columns[selectedColumn.id],
        ...updatedColumnData,
      };
      setColumns(updatedColumns);

      setEditColumnDialogOpen(false);
      setSelectedColumn(null);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Coluna atualizada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating column:", error);
      setEditColumnDialogOpen(false);
      setSelectedColumn(null);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao atualizar coluna: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDeleteColumn = (column) => {
    setSelectedColumn(column);
    setDeleteColumnDialogOpen(true);
  };

  const handleDeleteColumnConfirm = async () => {
    if (!selectedColumn) return;

    try {
      setProcessingAction(true);
      console.log(`Deleting column: ${selectedColumn.id}`);

      await columnService.deleteColumn(boardId, selectedColumn.id);

      // Atualizar dados locais
      const updatedColumns = { ...columns };
      delete updatedColumns[selectedColumn.id];
      setColumns(updatedColumns);

      setDeleteColumnDialogOpen(false);
      setSelectedColumn(null);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Coluna excluída com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting column:", error);
      setDeleteColumnDialogOpen(false);
      setSelectedColumn(null);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao excluir coluna: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Compartilhar quadro
  const handleShareBoard = () => {
    setShareBoardDialogOpen(true);
    handleBoardMenuClose();
  };

  // Método para duplicar um cartão
  const handleDuplicateCard = async (card, columnId) => {
    if (!card) return;

    try {
      setProcessingAction(true);
      console.log(`Duplicating card: ${card.id}`);

      // Criar novo cartão com os mesmos dados + sufixo no título
      const duplicatedCardData = {
        ...card,
        title: `${card.title} (Cópia)`,
        id: undefined, // Remover ID para criar um novo
        createdAt: undefined, // Será definido pelo servidor
        updatedAt: undefined, // Será definido pelo servidor
      };

      // Adicionar o cartão duplicado
      await cardService.addCard(
        boardId,
        columnId,
        duplicatedCardData,
        currentUser.uid
      );

      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Cartão duplicado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error duplicating card:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao duplicar cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Método para duplicar uma coluna
  const handleDuplicateColumn = async (column) => {
    if (!column) return;

    try {
      setProcessingAction(true);
      console.log(`Duplicating column: ${column.id}`);

      // Criar nova coluna com os mesmos dados
      const newColumnId = await columnService.addColumn(
        boardId,
        `${column.title} (Cópia)`,
        currentUser.uid
      );

      // Replicar os cartões
      const cardsPromises = column.cards.map(async (card) => {
        const duplicatedCardData = {
          ...card,
          id: undefined,
          columnId: newColumnId,
          createdAt: undefined,
          updatedAt: undefined,
        };

        await cardService.addCard(
          boardId,
          newColumnId,
          duplicatedCardData,
          currentUser.uid
        );
      });

      await Promise.all(cardsPromises);

      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Coluna duplicada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error duplicating column:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao duplicar coluna: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Método para arquivar um cartão (em vez de excluir)
  const handleArchiveCard = async (card, columnId) => {
    if (!card) return;

    try {
      setProcessingAction(true);
      console.log(`Archiving card: ${card.id}`);

      // Atualizar o cartão marcando como arquivado
      await cardService.updateCard(boardId, columnId, card.id, {
        archived: true,
        archivedAt: new Date().toISOString(),
      });

      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Cartão arquivado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error archiving card:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao arquivar cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Método para restaurar um cartão arquivado
  const handleRestoreCard = async (card, columnId) => {
    if (!card) return;

    try {
      setProcessingAction(true);
      console.log(`Restoring card: ${card.id}`);

      // Atualizar o cartão removendo a marca de arquivado
      await cardService.updateCard(boardId, columnId, card.id, {
        archived: false,
        archivedAt: null,
      });

      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Cartão restaurado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error restoring card:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao restaurar cartão: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Filtros e busca de cartões
  const handleFilterCards = (filterType, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSearchCards = (searchTerm) => {
    setSearchQuery(searchTerm);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  // Aplicar filtros aos cartões
  const applyFiltersToCards = (cards) => {
    if (!cards) return [];

    // Aplicar busca
    let filteredCards = cards;

    // Pesquisa por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredCards = filteredCards.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          (card.description && card.description.toLowerCase().includes(query))
      );
    }

    // Filtrar por membros
    if (activeFilters.member) {
      filteredCards = filteredCards.filter(
        (card) =>
          card.assignedTo && card.assignedTo.includes(activeFilters.member)
      );
    }

    // Filtrar por etiquetas
    if (activeFilters.label) {
      filteredCards = filteredCards.filter(
        (card) => card.labels && card.labels.includes(activeFilters.label)
      );
    }

    // Filtrar por status de arquivamento
    if (activeFilters.archived !== undefined) {
      filteredCards = filteredCards.filter(
        (card) => card.archived === activeFilters.archived
      );
    } else {
      // Por padrão, não mostrar cartões arquivados
      filteredCards = filteredCards.filter((card) => !card.archived);
    }

    return filteredCards;
  };

  // Gerenciar etiquetas
  const handleManageLabels = () => {
    setManageLabelsDialogOpen(true);
    handleBoardMenuClose();
  };

  const handleCreateLabel = async (labelName, color) => {
    try {
      setProcessingAction(true);
      console.log(`Creating new label: ${labelName}`);

      // Pegar dados atuais do quadro
      const boardData = await boardService.getBoard(boardId);
      const labels = boardData.labels || [];

      // Verificar se label já existe
      if (labels.some((label) => label.name === labelName)) {
        throw new Error("Já existe uma etiqueta com este nome");
      }

      // Adicionar nova etiqueta
      const newLabel = {
        id: `label-${Date.now()}`,
        name: labelName,
        color: color || "#2E78D2",
        createdAt: new Date().toISOString(),
      };

      const updatedLabels = [...labels, newLabel];

      await boardService.updateBoard(boardId, {
        labels: updatedLabels,
      });

      // Atualizar dados locais
      setBoardData({
        ...boardData,
        labels: updatedLabels,
      });

      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Etiqueta criada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating label:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao criar etiqueta: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleEditLabel = async (labelId, updates) => {
    try {
      setProcessingAction(true);
      console.log(`Editing label: ${labelId}`);

      // Pegar dados atuais do quadro
      const boardData = await boardService.getBoard(boardId);
      const labels = boardData.labels || [];

      // Encontrar etiqueta
      const labelIndex = labels.findIndex((label) => label.id === labelId);
      if (labelIndex === -1) {
        throw new Error("Etiqueta não encontrada");
      }

      // Atualizar etiqueta
      labels[labelIndex] = {
        ...labels[labelIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await boardService.updateBoard(boardId, {
        labels: labels,
      });

      // Atualizar dados locais
      setBoardData({
        ...boardData,
        labels: labels,
      });

      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Etiqueta atualizada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error editing label:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao editar etiqueta: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      setProcessingAction(true);
      console.log(`Deleting label: ${labelId}`);

      // Pegar dados atuais do quadro
      const boardData = await boardService.getBoard(boardId);
      const labels = boardData.labels || [];

      // Filtrar etiquetas
      const updatedLabels = labels.filter((label) => label.id !== labelId);

      await boardService.updateBoard(boardId, {
        labels: updatedLabels,
      });

      // Atualizar dados locais
      setBoardData({
        ...boardData,
        labels: updatedLabels,
      });

      // Precisamos também remover esta etiqueta de todos os cartões
      await removeDeletedLabelFromCards(labelId);

      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: "Etiqueta removida com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting label:", error);
      setProcessingAction(false);

      setSnackbar({
        open: true,
        message: `Erro ao remover etiqueta: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Função auxiliar para remover etiqueta excluída de todos os cartões
  const removeDeletedLabelFromCards = async (labelId) => {
    // Iterar por todas as colunas e cartões
    for (const columnId in columns) {
      const column = columns[columnId];
      for (const card of column.cards) {
        if (card.labels && card.labels.includes(labelId)) {
          // Remover etiqueta do cartão
          const updatedLabels = card.labels.filter((id) => id !== labelId);
          await cardService.updateCard(boardId, columnId, card.id, {
            labels: updatedLabels,
          });
        }
      }
    }

    // Recarregar dados
    await fetchBoardData();
  };

  // Obter todas as etiquetas usadas no quadro (para filtros)
  const getAllLabels = () => {
    // Primeiro verificar etiquetas personalizadas do quadro
    if (boardData?.labels && boardData.labels.length > 0) {
      return boardData.labels.map((label) => label.name);
    }

    // Se não houver, coletar das etiquetas usadas nos cartões
    const labels = new Set();
    Object.values(columns).forEach((column) => {
      column.cards.forEach((card) => {
        if (card.labels) {
          card.labels.forEach((label) => labels.add(label));
        }
      });
    });
    return Array.from(labels);
  };

  // Obter todos os cartões arquivados
  const getArchivedCards = () => {
    const archivedCards = [];
    Object.values(columns).forEach((column) => {
      column.cards.forEach((card) => {
        if (card.archived) {
          archivedCards.push({ ...card, columnId: column.id });
        }
      });
    });
    return archivedCards;
  };

  // Componente para filtro e busca de cartões
  const CardFilterToolbar = ({
    onSearch,
    onFilter,
    onClearFilters,
    searchQuery,
    activeFilters,
    labels,
    members,
  }) => {
    const [anchorElFilter, setAnchorElFilter] = useState(null);

    const handleOpenFilterMenu = (event) => {
      setAnchorElFilter(event.currentTarget);
    };

    const handleCloseFilterMenu = () => {
      setAnchorElFilter(null);
    };

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        {/* Campo de busca */}
        <TextField
          placeholder="Buscar cartões..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearch("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Botão de filtro */}
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterMenu}
          color={Object.keys(activeFilters).length > 0 ? "primary" : "inherit"}
        >
          Filtros
          {Object.keys(activeFilters).length > 0 && (
            <Chip
              size="small"
              label={Object.keys(activeFilters).length}
              sx={{ ml: 1 }}
            />
          )}
        </Button>

        {/* Menu de filtros */}
        <Menu
          anchorEl={anchorElFilter}
          open={Boolean(anchorElFilter)}
          onClose={handleCloseFilterMenu}
          PaperProps={{
            sx: { width: 250 },
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filtrar por:</Typography>
          </MenuItem>

          <Divider />

          {/* Filtro por membros */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="member-filter-label">Membro</InputLabel>
              <Select
                labelId="member-filter-label"
                value={activeFilters.member || ""}
                onChange={(e) => {
                  onFilter("member", e.target.value || undefined);
                }}
                label="Membro"
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MenuItem>

          {/* Filtro por etiquetas */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="label-filter-label">Etiqueta</InputLabel>
              <Select
                labelId="label-filter-label"
                value={activeFilters.label || ""}
                onChange={(e) => {
                  onFilter("label", e.target.value || undefined);
                }}
                label="Etiqueta"
                displayEmpty
              >
                <MenuItem value="">Todas</MenuItem>
                {labels.map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MenuItem>

          {/* Filtro por arquivamento */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="archive-filter-label">Status</InputLabel>
              <Select
                labelId="archive-filter-label"
                value={
                  activeFilters.archived !== undefined
                    ? activeFilters.archived.toString()
                    : "undefined"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "undefined") {
                    onFilter("archived", undefined);
                  } else {
                    onFilter("archived", value === "true");
                  }
                }}
                label="Status"
              >
                <MenuItem value="undefined">Ativos</MenuItem>
                <MenuItem value="true">Arquivados</MenuItem>
                <MenuItem value="false">Não arquivados</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>

          <Divider />

          {/* Limpar filtros */}
          <MenuItem
            onClick={() => {
              onClearFilters();
              handleCloseFilterMenu();
            }}
          >
            <Typography color="primary">Limpar todos os filtros</Typography>
          </MenuItem>
        </Menu>

        {/* Botão para limpar filtros */}
        {(searchQuery || Object.keys(activeFilters).length > 0) && (
          <Button
            variant="text"
            size="small"
            onClick={onClearFilters}
            startIcon={<ClearIcon />}
          >
            Limpar
          </Button>
        )}
      </Box>
    );
  };

  // Componente de visualização de cartões arquivados
  const ArchivedCardsDialog = ({
    open,
    onClose,
    cards,
    onRestore,
    onDelete,
  }) => {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Cartões Arquivados</DialogTitle>
        <DialogContent>
          {cards.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                Nenhum cartão arquivado.
              </Typography>
            </Box>
          ) : (
            <List>
              {cards.map((card) => (
                <ListItem
                  key={card.id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="Restaurar">
                        <IconButton
                          edge="end"
                          onClick={() => onRestore(card, card.columnId)}
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir Permanentemente">
                        <IconButton
                          edge="end"
                          onClick={() => onDelete(card, card.columnId)}
                        >
                          <DeleteForeverIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={card.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Coluna:{" "}
                          {columns[card.columnId]?.title || "Desconhecida"}
                        </Typography>
                        {card.archivedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Arquivado em:{" "}
                            {new Date(card.archivedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Componente para gerenciar etiquetas personalizadas
  const ManageLabelsDialog = ({
    open,
    onClose,
    labels = [],
    onCreateLabel,
    onEditLabel,
    onDeleteLabel,
    loading,
  }) => {
    const [newLabelName, setNewLabelName] = useState("");
    const [newLabelColor, setNewLabelColor] = useState("#2E78D2");
    const [editingLabel, setEditingLabel] = useState(null);

    const colorOptions = [
      { name: "Azul", value: "#2E78D2" },
      { name: "Verde", value: "#4CAF50" },
      { name: "Vermelho", value: "#F44336" },
      { name: "Amarelo", value: "#FFC107" },
      { name: "Roxo", value: "#9C27B0" },
      { name: "Laranja", value: "#FF9800" },
    ];

    const handleAddLabel = () => {
      if (!newLabelName.trim()) return;

      onCreateLabel(newLabelName, newLabelColor);
      setNewLabelName("");
      setNewLabelColor("#2E78D2");
    };

    const handleStartEdit = (label) => {
      setEditingLabel({
        ...label,
        newName: label.name,
        newColor: label.color,
      });
    };

    const handleSaveEdit = () => {
      if (!editingLabel || !editingLabel.newName.trim()) return;

      onEditLabel(editingLabel.id, {
        name: editingLabel.newName,
        color: editingLabel.newColor,
      });

      setEditingLabel(null);
    };

    const handleCancelEdit = () => {
      setEditingLabel(null);
    };

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Gerenciar Etiquetas</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Etiquetas disponíveis
          </Typography>

          <List>
            {labels.map((label) => (
              <ListItem
                key={label.id}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleStartEdit(label)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => onDeleteLabel(label.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "4px",
                    bgcolor: label.color,
                    mr: 2,
                  }}
                />
                <ListItemText primary={label.name} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Formulário de edição */}
          {editingLabel && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Editar Etiqueta
              </Typography>

              <TextField
                fullWidth
                label="Nome da Etiqueta"
                value={editingLabel.newName}
                onChange={(e) =>
                  setEditingLabel({
                    ...editingLabel,
                    newName: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Cor</InputLabel>
                <Select
                  value={editingLabel.newColor}
                  onChange={(e) =>
                    setEditingLabel({
                      ...editingLabel,
                      newColor: e.target.value,
                    })
                  }
                  label="Cor"
                >
                  {colorOptions.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "4px",
                            bgcolor: color.value,
                            mr: 1,
                          }}
                        />
                        {color.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button onClick={handleCancelEdit}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={!editingLabel.newName.trim() || loading}
                >
                  Salvar
                </Button>
              </Box>
            </Box>
          )}

          {/* Formulário para nova etiqueta */}
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Nova Etiqueta
          </Typography>

          <TextField
            fullWidth
            label="Nome da Etiqueta"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Cor</InputLabel>
            <Select
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              label="Cor"
            >
              {colorOptions.map((color) => (
                <MenuItem key={color.value} value={color.value}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "4px",
                        bgcolor: color.value,
                        mr: 1,
                      }}
                    />
                    {color.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleAddLabel}
            disabled={!newLabelName.trim() || loading}
          >
            Adicionar Etiqueta
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Componente para Dialog de edição do quadro
  const BoardEditDialog = ({ open, onClose, onSave, boardData, loading }) => {
    const [title, setTitle] = useState(boardData?.title || "");
    const [description, setDescription] = useState(
      boardData?.description || ""
    );
    const [color, setColor] = useState(boardData?.color || "#2E78D2");

    useEffect(() => {
      if (boardData) {
        setTitle(boardData.title || "");
        setDescription(boardData.description || "");
        setColor(boardData.color || "#2E78D2");
      }
    }, [boardData]);

    const handleSave = () => {
      if (!title.trim()) return;

      onSave({
        title: title.trim(),
        description: description.trim(),
        color,
      });
    };

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Editar Quadro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descrição"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="color-label">Cor</InputLabel>
            <Select
              labelId="color-label"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              label="Cor"
            >
              <MenuItem value="#2E78D2">Azul</MenuItem>
              <MenuItem value="#4CAF50">Verde</MenuItem>
              <MenuItem value="#F44336">Vermelho</MenuItem>
              <MenuItem value="#FFC107">Amarelo</MenuItem>
              <MenuItem value="#9C27B0">Roxo</MenuItem>
              <MenuItem value="#FF9800">Laranja</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!title.trim() || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
<CardDeletionHandler
  open={deletingCard !== null}
  onClose={handleCancelCardDeletion}
  boardId={boardId}
  columnId={deletingColumn}
  cardId={deletingCard?.id}
  cardTitle={deletingCard?.title}
  onSuccess={handleCardDeletionSuccess}
/>
  // Componente para Dialog de edição de coluna
  const ColumnEditDialog = ({ open, onClose, onSave, column, loading }) => {
    const [title, setTitle] = useState(column?.title || "");

    useEffect(() => {
      if (column) {
        setTitle(column.title || "");
      }
    }, [column]);

    const handleSave = () => {
      if (!title.trim()) return;

      onSave({
        title: title.trim(),
      });
    };

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Editar Coluna</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!title.trim() || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Componente para Dialog de compartilhamento
  const ShareBoardDialog = ({
    open,
    onClose,
    boardData,
    teamMembers,
    loading,
  }) => {
    const [selectedMembers, setSelectedMembers] = useState(
      boardData?.members || []
    );

    useEffect(() => {
      if (boardData) {
        setSelectedMembers(boardData.members || []);
      }
    }, [boardData]);

    const handleShare = async () => {
      try {
        setProcessingAction(true);

        // Pegar nomes dos membros selecionados
        const memberNames = selectedMembers.map((memberId) => {
          const member = teamMembers.find((m) => m.id === memberId);
          return member ? member.name : "Desconhecido";
        });

        await boardService.updateBoard(boardId, {
          members: selectedMembers,
          memberNames,
        });

        // Atualizar dados locais
        setBoardData({
          ...boardData,
          members: selectedMembers,
          memberNames,
        });

        onClose();
        setProcessingAction(false);

        setSnackbar({
          open: true,
          message: "Quadro compartilhado com sucesso!",
          severity: "success",
        });
      } catch (error) {
        console.error("Error sharing board:", error);
        setProcessingAction(false);

        setSnackbar({
          open: true,
          message: `Erro ao compartilhar quadro: ${error.message}`,
          severity: "error",
        });
      }
    };

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Compartilhar Quadro</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Escolha os membros que terão acesso a este quadro:
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="members-label">Membros</InputLabel>
            <Select
              labelId="members-label"
              multiple
              value={selectedMembers}
              onChange={(e) => setSelectedMembers(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const member = teamMembers.find((m) => m.id === value);
                    return (
                      <Chip
                        key={value}
                        label={member ? member.name : "Desconhecido"}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {teamMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  <Checkbox checked={selectedMembers.indexOf(member.id) > -1} />
                  <ListItemText
                    primary={member.name}
                    secondary={member.email}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Os membros selecionados poderão ver e editar este quadro.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleShare} variant="contained" disabled={loading}>
            {loading ? "Compartilhando..." : "Compartilhar"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>

        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper
              key={i}
              sx={{
                minWidth: 280,
                maxWidth: 280,
                height: 400,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: "secondary.light",
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              >
                <Skeleton variant="text" width={120} />
              </Box>
              <Box sx={{ p: 2 }}>
                {[1, 2, 3].map((j) => (
                  <Skeleton
                    key={j}
                    variant="rounded"
                    width="100%"
                    height={80}
                    sx={{ mb: 2 }}
                  />
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/boards")}
            >
              Voltar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Board Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "primary.dark" }}
        >
          {boardData?.title || `Quadro: ${boardId}`}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="primary" onClick={handleBoardMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={boardMenuAnchorEl}
          open={Boolean(boardMenuAnchorEl)}
          onClose={handleBoardMenuClose}
        >
          <MenuItem onClick={handleEditBoard}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar Quadro
          </MenuItem>
          <MenuItem onClick={handleShareBoard}>
            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
            Compartilhar
          </MenuItem>
          <MenuItem onClick={handleManageLabels}>
            <LabelIcon fontSize="small" sx={{ mr: 1 }} />
            Gerenciar Etiquetas
          </MenuItem>
          <MenuItem
            onClick={() => {
              setArchivedCardsDialogOpen(true);
              handleBoardMenuClose();
            }}
          >
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            Ver Cartões Arquivados
          </MenuItem>
          <MenuItem onClick={handleDeleteBoard} sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Excluir Quadro
          </MenuItem>
        </Menu>
      </Box>

      {/* Barra de Filtros */}
      <CardFilterToolbar
        onSearch={handleSearchCards}
        onFilter={handleFilterCards}
        onClearFilters={handleClearFilters}
        searchQuery={searchQuery}
        activeFilters={activeFilters}
        labels={getAllLabels()}
        members={teamMembers}
      />

      {/* Kanban Board */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 2,
          minHeight: "calc(100vh - 250px)",
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          {Object.values(columns)
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided, snapshot) => (
                  <Paper
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{
                      minWidth: 280,
                      maxWidth: 280,
                      bgcolor: snapshot.isDraggingOver
                        ? "secondary.light"
                        : "neutral.white",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Column Header */}
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "secondary.light",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {column.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setSelectedColumn(column);
                          setColumnMenuAnchorEl(e.currentTarget);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Column Content */}
                    <Box sx={{ p: 1, flexGrow: 1 }}>
                      {/* Error message if cards failed to load */}
                      {column.error && (
                        <Alert
                          severity="error"
                          sx={{ mb: 2, fontSize: "0.8rem" }}
                        >
                          {column.error}
                        </Alert>
                      )}

                      {/* Cards */}
                      {applyFiltersToCards(column.cards).map((card, index) => (
                        <Draggable
                          key={card.id}
                          draggableId={card.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                boxShadow: snapshot.isDragging
                                  ? "0 5px 10px rgba(0,0,0,0.2)"
                                  : "0 1px 3px rgba(0,0,0,0.1)",
                                bgcolor: "white",
                                "&:hover": {
                                  boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                                },
                                position: "relative",
                              }}
                            >
                              {/* Visibility indicator */}
                              <Tooltip
                                title={
                                  card.visibility === "private"
                                    ? "Visível apenas para membros atribuídos"
                                    : "Visível para todos"
                                }
                              >
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                  }}
                                >
                                  {card.visibility === "private" ? (
                                    <VisibilityOffIcon
                                      sx={{
                                        fontSize: 16,
                                        color: "text.secondary",
                                      }}
                                    />
                                  ) : (
                                    <VisibilityIcon
                                      sx={{
                                        fontSize: 16,
                                        color: "text.secondary",
                                      }}
                                    />
                                  )}
                                </Box>
                              </Tooltip>

                              {/* Card menu button */}
                              <IconButton
                                size="small"
                                sx={{ position: "absolute", top: 4, right: 32 }}
                                onClick={(e) =>
                                  handleCardMenuOpen(e, card, column.id)
                                }
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>

                              {/* Card Labels */}
                              <Box
                                sx={{
                                  mb: 1.5,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {card.labels &&
                                  card.labels.map((label, idx) => (
                                    <Chip
                                      key={idx}
                                      label={
                                        boardData?.labels
                                          ? boardData.labels.find(
                                              (l) => l.id === label
                                            )?.name || label
                                          : label
                                      }
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.7rem",
                                        bgcolor: getLabelColor(label),
                                        color: "white",
                                      }}
                                    />
                                  ))}
                              </Box>

                              {/* Card Title */}
                              <Typography
                                variant="subtitle2"
                                sx={{ mb: 1, pr: 5 }}
                              >
                                {card.title}
                              </Typography>

                              {/* Card Description */}
                              {card.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1.5 }}
                                >
                                  {card.description.length > 80
                                    ? `${card.description.substring(0, 80)}...`
                                    : card.description}
                                </Typography>
                              )}

                              {/* Card Footer */}
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                {/* Assigned Members */}
                                <AvatarGroup
                                  max={3}
                                  sx={{
                                    "& .MuiAvatar-root": {
                                      width: 24,
                                      height: 24,
                                      fontSize: "0.75rem",
                                    },
                                  }}
                                >
                                  {card.members &&
                                    card.members.map((member, idx) => (
                                      <Avatar
                                        key={idx}
                                        sx={{ bgcolor: "primary.main" }}
                                      >
                                        {typeof member === "string"
                                          ? member.charAt(0)
                                          : "?"}
                                      </Avatar>
                                    ))}
                                </AvatarGroup>

                                {/* Card Metadata */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  {card.dueDate && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <AccessTimeIcon
                                        fontSize="small"
                                        sx={{ mr: 0.5, fontSize: 16 }}
                                      />
                                      <Typography variant="caption">
                                        {new Date(
                                          card.dueDate
                                        ).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  )}
                                  {card.comments > 0 && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <CommentIcon
                                        fontSize="small"
                                        sx={{ fontSize: 16 }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ ml: 0.5 }}
                                      >
                                        {card.comments}
                                      </Typography>
                                    </Box>
                                  )}
                                  {card.attachments > 0 && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <AttachFileIcon
                                        fontSize="small"
                                        sx={{ fontSize: 16 }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ ml: 0.5 }}
                                      >
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

                      {/* Add Card Button */}
                      <Button
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => handleAddCardClick(column.id)}
                        sx={{
                          justifyContent: "flex-start",
                          color: "text.secondary",
                          "&:hover": { bgcolor: "secondary.light" },
                        }}
                      >
                        Adicionar Cartão
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Droppable>
            ))}

          {/* Add Column Form */}
          {addingColumn ? (
            <Paper
              sx={{
                minWidth: 280,
                maxWidth: 280,
                p: 2,
                bgcolor: "neutral.white",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Digite o título da lista..."
                size="small"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddColumn}
                  disabled={!newColumnTitle.trim() || processingAction}
                  sx={{ bgcolor: "primary.main", color: "white" }}
                >
                  Adicionar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setAddingColumn(false);
                    setNewColumnTitle("");
                  }}
                  disabled={processingAction}
                >
                  Cancelar
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper
              sx={{
                minWidth: 280,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                bgcolor: "rgba(255,255,255,0.6)",
                borderRadius: 2,
                border: "2px dashed",
                borderColor: "secondary.light",
              }}
            >
              <Button
                startIcon={<AddIcon />}
                onClick={() => setAddingColumn(true)}
                sx={{ color: "text.secondary" }}
                disabled={processingAction}
              >
                Adicionar Lista
              </Button>
            </Paper>
          )}
        </DragDropContext>
      </Box>

      {/* Card Menu */}
      <Menu
        anchorEl={cardMenuAnchorEl}
        open={Boolean(cardMenuAnchorEl)}
        onClose={handleCardMenuClose}
      >
        <MenuItem
          onClick={() =>
            handleEditCardClick(selectedCard, selectedCard?.columnId)
          }
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar Cartão
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleDuplicateCard(selectedCard, selectedCard?.columnId)
          }
        >
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicar Cartão
        </MenuItem>
        <MenuItem onClick={handleAssignMembersClick}>
          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
          Atribuir Membros
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleArchiveCard(selectedCard, selectedCard?.columnId)
          }
        >
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Arquivar Cartão
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleDeleteCardClick(selectedCard, selectedCard?.columnId)
          }
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir Cartão
        </MenuItem>
      </Menu>

      {/* Column Menu */}
      <Menu
        anchorEl={columnMenuAnchorEl}
        open={Boolean(columnMenuAnchorEl)}
        onClose={() => {
          setColumnMenuAnchorEl(null);
          setSelectedColumn(null);
        }}
      >
        <MenuItem
          onClick={() => {
            handleEditColumn(selectedColumn);
            setColumnMenuAnchorEl(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar Coluna
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDuplicateColumn(selectedColumn);
            setColumnMenuAnchorEl(null);
          }}
        >
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicar Coluna
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteColumn(selectedColumn);
            setColumnMenuAnchorEl(null);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir Coluna
        </MenuItem>
      </Menu>

      {/* Card Editor Dialog */}
      <CardEditor
        open={cardEditorOpen}
        onClose={() => {
          setCardEditorOpen(false);
          setCardToEdit(null);
          setAddingCard(null);
        }}
        onSave={handleSaveCard}
        cardData={cardToEdit}
        columnId={cardToEdit?.columnId || addingCard}
        teamMembers={teamMembers}
        boardLabels={boardData?.labels}
      />

      {/* Delete Card Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCardConfirm}
        title="Excluir Cartão"
        message={`Tem certeza que deseja excluir o cartão "${selectedCard?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Assign Members Dialog */}
      {selectedCard && (
        <Dialog
          open={assignMembersDialogOpen}
          onClose={() => setAssignMembersDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Atribuir Membros ao Cartão
            </Typography>

            <MemberSelector
              value={selectedCard.assignedTo || []}
              onChange={(selectedMembers) => {
                // Get member names for selected IDs
                const memberNames = selectedMembers.map((memberId) => {
                  const member = teamMembers.find((m) => m.id === memberId);
                  return member ? member.name : "Unknown";
                });

                handleAssignMembers(
                  selectedMembers,
                  memberNames,
                  selectedCard.visibility || "public"
                );
              }}
              members={teamMembers}
              label="Selecione os membros"
              disabled={processingAction}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
                gap: 1,
              }}
            >
              <Button
                onClick={() => setAssignMembersDialogOpen(false)}
                disabled={processingAction}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={processingAction}
              >
                {processingAction ? "Salvando..." : "Salvar"}
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}

      {/* Dialog para editar quadro */}
      <BoardEditDialog
        open={editBoardDialogOpen}
        onClose={() => setEditBoardDialogOpen(false)}
        onSave={handleSaveBoardEdit}
        boardData={boardData}
        loading={processingAction}
      />

      {/* Dialog para confirmar exclusão do quadro */}
      <ConfirmationDialog
        open={deleteBoardDialogOpen}
        onClose={() => setDeleteBoardDialogOpen(false)}
        onConfirm={handleDeleteBoardConfirm}
        title="Excluir Quadro"
        message={`Tem certeza que deseja excluir o quadro "${boardData?.title}"? Esta ação não pode ser desfeita e todos os cartões serão excluídos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Dialog para editar coluna */}
      <ColumnEditDialog
        open={editColumnDialogOpen}
        onClose={() => {
          setEditColumnDialogOpen(false);
          setSelectedColumn(null);
        }}
        onSave={handleSaveColumnEdit}
        column={selectedColumn}
        loading={processingAction}
      />

      {/* Dialog para confirmar exclusão da coluna */}
      <ConfirmationDialog
        open={deleteColumnDialogOpen}
        onClose={() => {
          setDeleteColumnDialogOpen(false);
          setSelectedColumn(null);
        }}
        onConfirm={handleDeleteColumnConfirm}
        title="Excluir Coluna"
        message={`Tem certeza que deseja excluir a coluna "${selectedColumn?.title}"? Esta ação não pode ser desfeita e todos os cartões desta coluna serão excluídos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        severity="error"
      />

      {/* Dialog para compartilhar quadro */}
      <ShareBoardDialog
        open={shareBoardDialogOpen}
        onClose={() => setShareBoardDialogOpen(false)}
        boardData={boardData}
        teamMembers={teamMembers}
        loading={processingAction}
      />

      {/* Dialog para gerenciar etiquetas */}
      <ManageLabelsDialog
        open={manageLabelsDialogOpen}
        onClose={() => setManageLabelsDialogOpen(false)}
        labels={boardData?.labels || []}
        onCreateLabel={handleCreateLabel}
        onEditLabel={handleEditLabel}
        onDeleteLabel={handleDeleteLabel}
        loading={processingAction}
      />

      {/* Dialog de Cartões Arquivados */}
      <ArchivedCardsDialog
        open={archivedCardsDialogOpen}
        onClose={() => setArchivedCardsDialogOpen(false)}
        cards={getArchivedCards()}
        onRestore={handleRestoreCard}
        onDelete={(card, columnId) => {
          setSelectedCard({ ...card, columnId });
          setDeleteDialogOpen(true);
          setArchivedCardsDialogOpen(false);
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Processing indicator */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={processingAction}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
