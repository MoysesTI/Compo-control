import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
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
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import CardDeletionHandler from "../components/board/CardDeletionHandler";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function BoardDetail() {
  const [deletingCard, setDeletingCard] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // State for board and columns
  const [boardData, setBoardData] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for UI controls
  const [anchorEl, setAnchorEl] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCard, setAddingCard] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  // State for card editing
  const [editCardData, setEditCardData] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State for member assignment
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignMembersDialogOpen, setAssignMembersDialogOpen] = useState(false);
  const [currentCardForMembers, setCurrentCardForMembers] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublic, setIsPublic] = useState(true);

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Card menu state
  const [cardMenuAnchorEl, setCardMenuAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Load board data and team members on component mount
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true);

        // Fetch board data
        const boardRef = doc(db, "boards", id);
        const boardSnap = await getDoc(boardRef);

        if (!boardSnap.exists()) {
          setError("Board not found");
          setLoading(false);
          return;
        }

        const board = { id: boardSnap.id, ...boardSnap.data() };
        setBoardData(board);

        // Fetch columns
        const columnsRef = collection(db, "boards", id, "columns");
        const columnsSnapshot = await getDocs(columnsRef);

        const columnsData = {};

        // For each column, fetch its cards
        const columnsPromises = columnsSnapshot.docs.map(async (columnDoc) => {
          const column = { id: columnDoc.id, ...columnDoc.data() };

          // Fetch cards for this column
          const cardsRef = collection(
            db,
            "boards",
            id,
            "columns",
            columnDoc.id,
            "cards"
          );
          let cardsQuery;

          // If not an admin, filter cards by visibility or assignment
          if (userProfile?.role !== "admin") {
            cardsQuery = query(
              cardsRef,
              where("visibility", "in", ["public", "private"])
            );
          } else {
            cardsQuery = cardsRef;
          }

          const cardsSnapshot = await getDocs(cardsQuery);

          // Filter cards based on visibility and assignment
          const cards = cardsSnapshot.docs
            .map((cardDoc) => ({ id: cardDoc.id, ...cardDoc.data() }))
            .filter(
              (card) =>
                card.visibility === "public" ||
                (card.visibility === "private" &&
                  card.assignedTo?.includes(currentUser.uid))
            );

          columnsData[columnDoc.id] = {
            ...column,
            cards: cards,
          };
        });

        await Promise.all(columnsPromises);

        // Sort columns by order
        setColumns(columnsData);

        // Fetch team members
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeamMembers(usersData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching board data:", error);
        setError("Failed to load board data. Please try again.");
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [id, currentUser, userProfile]);

  // Board menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

  // Add new list (column)
  const handleAddList = async () => {
    if (newListTitle.trim() === "") return;

    try {
      // Get the number of existing columns for ordering
      const columnsCount = Object.keys(columns).length;

      // Add new column to Firestore
      const columnsRef = collection(db, "boards", id, "columns");
      const newColumnRef = await addDoc(columnsRef, {
        title: newListTitle,
        order: columnsCount,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });

      // Update state
      const newColumnId = newColumnRef.id;
      const newColumn = {
        id: newColumnId,
        title: newListTitle,
        order: columnsCount,
        cards: [],
      };

      setColumns({
        ...columns,
        [newColumnId]: newColumn,
      });

      // Reset form
      setNewListTitle("");
      setAddingList(false);

      // Show success message
      setSnackbar({
        open: true,
        message: "Lista adicionada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding list:", error);
      setSnackbar({
        open: true,
        message: "Erro ao adicionar lista. Tente novamente.",
        severity: "error",
      });
    }
  };

  // Add new card
  const handleAddCard = async (columnId) => {
    if (newCardTitle.trim() === "") return;

    try {
      // Add new card to Firestore
      const cardsRef = collection(
        db,
        "boards",
        id,
        "columns",
        columnId,
        "cards"
      );
      const newCardRef = await addDoc(cardsRef, {
        title: newCardTitle,
        description: "",
        labels: [],
        members: [],
        assignedTo: [],
        visibility: "public",
        comments: 0,
        attachments: 0,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
      });

      // Update state
      const newCard = {
        id: newCardRef.id,
        title: newCardTitle,
        description: "",
        labels: [],
        members: [],
        assignedTo: [],
        visibility: "public",
        comments: 0,
        attachments: 0,
      };

      const column = columns[columnId];
      const updatedColumn = {
        ...column,
        cards: [...column.cards, newCard],
      };

      setColumns({
        ...columns,
        [columnId]: updatedColumn,
      });

      // Reset form
      setNewCardTitle("");
      setAddingCard(null);

      // Show success message
      setSnackbar({
        open: true,
        message: "Cartão adicionado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding card:", error);
      setSnackbar({
        open: true,
        message: "Erro ao adicionar cartão. Tente novamente.",
        severity: "error",
      });
    }
  };

  // Edit card handlers
  const handleEditCardOpen = (card, columnId) => {
    setEditCardData({ ...card, columnId });
    setEditDialogOpen(true);
    handleCardMenuClose();
  };

  const handleEditCardClose = () => {
    setEditCardData(null);
    setEditDialogOpen(false);
  };

  const handleEditCardSave = async () => {
    if (!editCardData || !editCardData.title.trim()) {
      setSnackbar({
        open: true,
        message: "O título do cartão não pode estar vazio.",
        severity: "error",
      });
      return;
    }

    try {
      const { id: cardId, columnId, ...cardData } = editCardData;

      // Update card in Firestore
      const cardRef = doc(
        db,
        "boards",
        id,
        "columns",
        columnId,
        "cards",
        cardId
      );
      await updateDoc(cardRef, {
        ...cardData,
        updatedAt: serverTimestamp(),
      });

      // Update state
      const column = columns[columnId];
      const updatedCards = column.cards.map((card) =>
        card.id === cardId ? { ...card, ...cardData } : card
      );

      const updatedColumn = {
        ...column,
        cards: updatedCards,
      };

      setColumns({
        ...columns,
        [columnId]: updatedColumn,
      });

      // Close dialog and show success message
      handleEditCardClose();
      setSnackbar({
        open: true,
        message: "Cartão atualizado com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating card:", error);
      setSnackbar({
        open: true,
        message: "Erro ao atualizar cartão. Tente novamente.",
        severity: "error",
      });
    }
  };

  // Delete card
  const handleDeleteCard = async () => {
    if (!selectedCard) return;

    try {
      const { id: cardId, columnId } = selectedCard;

      // Delete card from Firestore
      const cardRef = doc(
        db,
        "boards",
        id,
        "columns",
        columnId,
        "cards",
        cardId
      );
      await deleteDoc(cardRef);

      // Update state
      const column = columns[columnId];
      const updatedCards = column.cards.filter((card) => card.id !== cardId);

      const updatedColumn = {
        ...column,
        cards: updatedCards,
      };

      setColumns({
        ...columns,
        [columnId]: updatedColumn,
      });

      // Close menu and show success message
      handleCardMenuClose();
      setSnackbar({
        open: true,
        message: "Cartão excluído com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      setSnackbar({
        open: true,
        message: "Erro ao excluir cartão. Tente novamente.",
        severity: "error",
      });
    }
  };

  // Assign members handlers
  const handleAssignMembersOpen = (card, columnId) => {
    setCurrentCardForMembers({ ...card, columnId });
    setSelectedMembers(card.assignedTo || []);
    setIsPublic(card.visibility === "public");
    setAssignMembersDialogOpen(true);
    handleCardMenuClose();
  };

  const handleAssignMembersClose = () => {
    setCurrentCardForMembers(null);
    setSelectedMembers([]);
    setAssignMembersDialogOpen(false);
  };

  const handleMemberSelectionChange = (event) => {
    const { value } = event.target;
    setSelectedMembers(value);
  };

  const handleVisibilityChange = (event) => {
    setIsPublic(event.target.checked);
  };

  const handleAssignMembersSave = async () => {
    if (!currentCardForMembers) return;

    try {
      const { id: cardId, columnId } = currentCardForMembers;

      // Get member names for display
      const memberNames = selectedMembers.map((memberId) => {
        const member = teamMembers.find((m) => m.id === memberId);
        return member ? member.name : "Unknown";
      });

      // Update card in Firestore
      const cardRef = doc(
        db,
        "boards",
        id,
        "columns",
        columnId,
        "cards",
        cardId
      );
      await updateDoc(cardRef, {
        assignedTo: selectedMembers,
        members: memberNames,
        visibility: isPublic ? "public" : "private",
        updatedAt: serverTimestamp(),
      });

      // Update state
      const column = columns[columnId];
      const updatedCards = column.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              assignedTo: selectedMembers,
              members: memberNames,
              visibility: isPublic ? "public" : "private",
            }
          : card
      );

      const updatedColumn = {
        ...column,
        cards: updatedCards,
      };

      setColumns({
        ...columns,
        [columnId]: updatedColumn,
      });

      // Close dialog and show success message
      handleAssignMembersClose();
      setSnackbar({
        open: true,
        message: "Membros atribuídos com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error assigning members:", error);
      setSnackbar({
        open: true,
        message: "Erro ao atribuir membros. Tente novamente.",
        severity: "error",
      });
    }
  };
// 3. Adicione esta função para iniciar a exclusão de um cartão
const handleDeleteCardClick = (columnId, card) => {
  setDeletingColumn(columnId);
  setDeletingCard(card);
};

// 4. Adicione esta função para cancelar a exclusão
const handleCancelCardDeletion = () => {
  setDeletingColumn(null);
  setDeletingCard(null);
};

// 5. Adicione esta função para lidar com o sucesso da exclusão
const handleCardDeletionSuccess = () => {
  // Se você estiver usando estado local para os cartões, atualize-o aqui
  // Por exemplo, remova o cartão excluído do estado
  if (deletingCard && deletingColumn) {
    setColumns(prevColumns => ({
      ...prevColumns,
      [deletingColumn]: {
        ...prevColumns[deletingColumn],
        cards: prevColumns[deletingColumn].cards.filter(card => card.id !== deletingCard.id)
      }
    }));
  }
  
  // Limpe os estados de exclusão
  setDeletingColumn(null);
  setDeletingCard(null);
};

  // Drag and drop handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    try {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const draggedCard = sourceColumn.cards.find(
        (card) => card.id === draggableId
      );

      if (source.droppableId === destination.droppableId) {
        // Reordering in the same column
        const newCards = Array.from(sourceColumn.cards);
        newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, draggedCard);

        const newColumn = {
          ...sourceColumn,
          cards: newCards,
        };

        // Update state first for responsiveness
        setColumns({
          ...columns,
          [source.droppableId]: newColumn,
        });

        // Then update Firestore
        const batch = writeBatch(db);

        // Update each card with its new position
        newCards.forEach((card, index) => {
          const cardRef = doc(
            db,
            "boards",
            id,
            "columns",
            source.droppableId,
            "cards",
            card.id
          );
          batch.update(cardRef, { order: index });
        });

        await batch.commit();
      } else {
        // Moving to another column
        const sourceCards = Array.from(sourceColumn.cards);
        sourceCards.splice(source.index, 1);

        const destCards = Array.from(destColumn.cards);
        destCards.splice(destination.index, 0, draggedCard);

        // Update state first for responsiveness
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

        // Move the card to a new collection in Firestore
        const sourceCardRef = doc(
          db,
          "boards",
          id,
          "columns",
          source.droppableId,
          "cards",
          draggableId
        );
        const sourceCardSnapshot = await getDoc(sourceCardRef);

        if (sourceCardSnapshot.exists()) {
          const cardData = sourceCardSnapshot.data();

          // Add card to destination column
          const destCardsRef = collection(
            db,
            "boards",
            id,
            "columns",
            destination.droppableId,
            "cards"
          );
          const newCardRef = await addDoc(destCardsRef, {
            ...cardData,
            updatedAt: serverTimestamp(),
          });

          // Delete card from source column
          await deleteDoc(sourceCardRef);
        }
      }
    } catch (error) {
      console.error("Error during drag and drop:", error);
      setSnackbar({
        open: true,
        message: "Erro ao mover cartão. Tente novamente.",
        severity: "error",
      });
    }
  };

  // Helper function for label colors
  const getLabelColor = (label) => {
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 100px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/boards")}
        >
          Voltar para Quadros
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "primary.dark" }}
        >
          {boardData?.title || `Quadro: Projeto ${id}`}
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
          <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
            Arquivar Quadro
          </MenuItem>
        </Menu>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 2,
          minHeight: "calc(100vh - 200px)",
        }}
      >
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
                    bgcolor: snapshot.isDraggingOver
                      ? "secondary.light"
                      : "neutral.white",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
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
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ p: 1, flexGrow: 1 }}>
                    {column.cards.map((card, index) => (
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
                            <Box
                              sx={{ position: "absolute", top: 8, right: 8 }}
                            >
                              {card.visibility === "private" ? (
                                <VisibilityOffIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                              ) : (
                                <VisibilityIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                              )}
                            </Box>

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
                                    label={label}
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
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, pr: 5 }}
                            >
                              {card.title}
                            </Typography>
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
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
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
                            bgcolor: "white",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                            },
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddCard(column.id)}
                            sx={{ bgcolor: "primary.main", color: "white" }}
                          >
                            Adicionar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setAddingCard(null);
                              setNewCardTitle("");
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
                          justifyContent: "flex-start",
                          color: "text.secondary",
                          "&:hover": { bgcolor: "secondary.light" },
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
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddList}
                  sx={{ bgcolor: "primary.main", color: "white" }}
                >
                  Adicionar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setAddingList(false);
                    setNewListTitle("");
                  }}
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
                onClick={() => setAddingList(true)}
                sx={{ color: "text.secondary" }}
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
            handleEditCardOpen(selectedCard, selectedCard?.columnId)
          }
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar Cartão
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleAssignMembersOpen(selectedCard, selectedCard?.columnId)
          }
        >
          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
          Atribuir Membros
        </MenuItem>
        <MenuItem onClick={() => handleDeleteCardClick(column.id, card)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Edit Card Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCardClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Cartão</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={editCardData?.title || ""}
            onChange={(e) =>
              setEditCardData({ ...editCardData, title: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descrição"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editCardData?.description || ""}
            onChange={(e) =>
              setEditCardData({ ...editCardData, description: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Data de Entrega"
            type="date"
            fullWidth
            variant="outlined"
            value={editCardData?.dueDate || ""}
            onChange={(e) =>
              setEditCardData({ ...editCardData, dueDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCardClose}>Cancelar</Button>
          <Button
            onClick={handleEditCardSave}
            variant="contained"
            sx={{ bgcolor: "primary.main", color: "white" }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Members Dialog */}
      <Dialog
        open={assignMembersDialogOpen}
        onClose={handleAssignMembersClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Atribuir Membros</DialogTitle>
        <DialogContent>
          <FormControl sx={{ mt: 2, width: "100%" }}>
            <InputLabel id="assign-members-label">Membros</InputLabel>
            <Select
              labelId="assign-members-label"
              multiple
              value={selectedMembers}
              onChange={handleMemberSelectionChange}
              input={<OutlinedInput label="Membros" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const member = teamMembers.find((m) => m.id === value);
                    return (
                      <Chip
                        key={value}
                        label={member ? member.name : "Unknown"}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
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

          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={handleVisibilityChange}
                name="public"
              />
            }
            label="Visível para todos (se desativado, apenas membros atribuídos poderão ver)"
            sx={{ mt: 2, display: "block" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignMembersClose}>Cancelar</Button>
          <Button
            onClick={handleAssignMembersSave}
            variant="contained"
            sx={{ bgcolor: "primary.main", color: "white" }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
{/* No final do seu componente BoardDetail, dentro do retorno JSX */}
<CardDeletionHandler
  open={cardToDelete !== null}
  onClose={handleCancelCardDeletion}
  boardId={boardId}
  columnId={columnIdOfCardToDelete}
  cardId={cardToDelete?.id}
  cardTitle={cardToDelete?.title}
  onSuccess={handleCardDeletionSuccess}
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
    </Box>
  );
}
