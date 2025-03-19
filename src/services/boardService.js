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
    orderBy, 
    serverTimestamp,
    writeBatch
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  import columnService from './columnService';
  
  /**
   * Valida se os dados do quadro estão completos e corretos
   * @param {Object} boardData - Dados do quadro
   * @returns {Object} - { isValid, errors }
   */
  const validateBoardData = (boardData) => {
    const errors = {};
    
    // Título é obrigatório
    if (!boardData.title || boardData.title.trim() === '') {
      errors.title = 'O título é obrigatório';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Serviço para gerenciamento de quadros
   */
  const boardService = {
    /**
     * Obter todos os quadros
     * @param {string} userId - ID do usuário para filtrar (opcional)
     * @param {boolean} favoritesOnly - Buscar apenas favoritos (opcional)
     * @returns {Promise<Array>} - Array de quadros
     */
    getBoards: async (userId = null, favoritesOnly = false) => {
      try {
        console.log(`Fetching boards. User filter: ${userId}, Favorites only: ${favoritesOnly}`);
        
        const boardsRef = collection(db, "boards");
        let boardsQuery;
        
        if (userId) {
          if (favoritesOnly) {
            boardsQuery = query(
              boardsRef,
              where("members", "array-contains", userId),
              where("favorite", "==", true),
              orderBy("updatedAt", "desc")
            );
          } else {
            boardsQuery = query(
              boardsRef,
              where("members", "array-contains", userId),
              orderBy("updatedAt", "desc")
            );
          }
        } else {
          boardsQuery = query(boardsRef, orderBy("updatedAt", "desc"));
        }
        
        const boardsSnapshot = await getDocs(boardsQuery);
        const boards = boardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`Retrieved ${boards.length} boards`);
        return boards;
      } catch (error) {
        console.error("Error getting boards:", error);
        throw new Error(`Falha ao carregar quadros: ${error.message}`);
      }
    },
    
    /**
     * Obter um quadro específico
     * @param {string} boardId - ID do quadro
     * @returns {Promise<Object>} - Dados do quadro
     */
    getBoard: async (boardId) => {
      try {
        console.log(`Fetching board: ${boardId}`);
        
        const boardRef = doc(db, "boards", boardId);
        const boardSnap = await getDoc(boardRef);
        
        if (!boardSnap.exists()) {
          console.error(`Board ${boardId} not found`);
          throw new Error("Quadro não encontrado");
        }
        
        console.log(`Board ${boardId} retrieved`);
        return { id: boardSnap.id, ...boardSnap.data() };
      } catch (error) {
        console.error(`Error getting board ${boardId}:`, error);
        throw new Error(`Falha ao carregar o quadro: ${error.message}`);
      }
    },
    
    /**
     * Criar um novo quadro
     * @param {Object} boardData - Dados do quadro
     * @param {string} userId - ID do usuário que está criando
     * @returns {Promise<string>} - ID do novo quadro
     */
    createBoard: async (boardData, userId) => {
      try {
        console.log(`Creating new board: ${boardData.title}`);
        
        // Validate board data
        const validation = validateBoardData(boardData);
        if (!validation.isValid) {
          console.error(`Board validation failed:`, validation.errors);
          throw new Error(`Dados do quadro inválidos: ${Object.values(validation.errors).join(', ')}`);
        }
        
        // Ensure essential fields
        const boardWithDefaults = {
          ...boardData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
          members: [userId],
          favorite: false,
          ...(boardData.color ? {} : { color: '#2E78D2' }) // Default color if not provided
        };
        
        // Add board to Firestore
        const boardsRef = collection(db, "boards");
        const newBoardRef = await addDoc(boardsRef, boardWithDefaults);
        
        console.log(`Board created with ID: ${newBoardRef.id}`);
        
        // Initialize default columns
        await columnService.initializeDefaultColumns(newBoardRef.id, userId);
        
        return newBoardRef.id;
      } catch (error) {
        console.error("Error creating board:", error);
        throw new Error(`Falha ao criar quadro: ${error.message}`);
      }
    },
    
    /**
     * Atualizar um quadro
     * @param {string} boardId - ID do quadro
     * @param {Object} boardData - Dados atualizados
     * @returns {Promise<void>}
     */
    updateBoard: async (boardId, boardData) => {
      try {
        console.log(`Updating board ${boardId}`);
        
        // Check if board exists
        const boardRef = doc(db, "boards", boardId);
        const boardSnap = await getDoc(boardRef);
        
        if (!boardSnap.exists()) {
          console.error(`Board ${boardId} not found`);
          throw new Error("Quadro não encontrado");
        }
        
        // Update board
        await updateDoc(boardRef, {
          ...boardData,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Board ${boardId} updated`);
      } catch (error) {
        console.error(`Error updating board ${boardId}:`, error);
        throw new Error(`Falha ao atualizar quadro: ${error.message}`);
      }
    },
    
    /**
     * Marcar/desmarcar um quadro como favorito
     * @param {string} boardId - ID do quadro
     * @param {boolean} isFavorite - Estado de favorito
     * @returns {Promise<void>}
     */
    toggleFavorite: async (boardId, isFavorite) => {
      try {
        console.log(`Setting board ${boardId} favorite status to: ${isFavorite}`);
        
        const boardRef = doc(db, "boards", boardId);
        await updateDoc(boardRef, {
          favorite: isFavorite,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Board ${boardId} favorite status updated`);
      } catch (error) {
        console.error(`Error toggling favorite for board ${boardId}:`, error);
        throw new Error(`Falha ao atualizar status de favorito: ${error.message}`);
      }
    },
    
    /**
     * Adicionar membro a um quadro
     * @param {string} boardId - ID do quadro
     * @param {string} memberId - ID do membro
     * @param {string} memberName - Nome do membro
     * @returns {Promise<void>}
     */
    addMember: async (boardId, memberId, memberName) => {
      try {
        console.log(`Adding member ${memberId} to board ${boardId}`);
        
        const boardRef = doc(db, "boards", boardId);
        
        // Check if board exists
        const boardSnap = await getDoc(boardRef);
        if (!boardSnap.exists()) {
          console.error(`Board ${boardId} not found`);
          throw new Error("Quadro não encontrado");
        }
        
        // Check if member is already in the board
        const boardData = boardSnap.data();
        if (boardData.members && boardData.members.includes(memberId)) {
          console.log(`Member ${memberId} already in board ${boardId}`);
          return;
        }
        
        // Update the board with the new member
        await updateDoc(boardRef, {
          members: [...(boardData.members || []), memberId],
          memberNames: [...(boardData.memberNames || []), memberName],
          updatedAt: serverTimestamp()
        });
        
        console.log(`Member ${memberId} added to board ${boardId}`);
      } catch (error) {
        console.error(`Error adding member to board ${boardId}:`, error);
        throw new Error(`Falha ao adicionar membro: ${error.message}`);
      }
    },
    
    /**
     * Remover membro de um quadro
     * @param {string} boardId - ID do quadro
     * @param {string} memberId - ID do membro
     * @param {string} memberName - Nome do membro
     * @returns {Promise<void>}
     */
    removeMember: async (boardId, memberId, memberName) => {
      try {
        console.log(`Removing member ${memberId} from board ${boardId}`);
        
        const boardRef = doc(db, "boards", boardId);
        
        // Check if board exists
        const boardSnap = await getDoc(boardRef);
        if (!boardSnap.exists()) {
          console.error(`Board ${boardId} not found`);
          throw new Error("Quadro não encontrado");
        }
        
        const boardData = boardSnap.data();
        
        // Update the board removing the member
        await updateDoc(boardRef, {
          members: (boardData.members || []).filter(id => id !== memberId),
          memberNames: (boardData.memberNames || []).filter(name => name !== memberName),
          updatedAt: serverTimestamp()
        });
        
        console.log(`Member ${memberId} removed from board ${boardId}`);
      } catch (error) {
        console.error(`Error removing member from board ${boardId}:`, error);
        throw new Error(`Falha ao remover membro: ${error.message}`);
      }
    },
    
    /**
     * Excluir um quadro
     * @param {string} boardId - ID do quadro
     * @returns {Promise<void>}
     */
    deleteBoard: async (boardId) => {
      try {
        console.log(`Deleting board ${boardId}`);
        
        // First, get all columns
        const columnsRef = collection(db, "boards", boardId, "columns");
        const columnsSnapshot = await getDocs(columnsRef);
        
        if (columnsSnapshot.empty) {
          // If no columns, just delete the board
          await deleteDoc(doc(db, "boards", boardId));
          console.log(`Board ${boardId} deleted (no columns)`);
          return;
        }
        
        // Use a batch to delete all columns and their cards
        const batch = writeBatch(db);
        
        // For each column, get its cards and delete them
        for (const columnDoc of columnsSnapshot.docs) {
          const cardsRef = collection(db, "boards", boardId, "columns", columnDoc.id, "cards");
          const cardsSnapshot = await getDocs(cardsRef);
          
          // Delete all cards in this column
          cardsSnapshot.docs.forEach(cardDoc => {
            const cardRef = doc(db, "boards", boardId, "columns", columnDoc.id, "cards", cardDoc.id);
            batch.delete(cardRef);
          });
          
          // Delete the column
          const columnRef = doc(db, "boards", boardId, "columns", columnDoc.id);
          batch.delete(columnRef);
        }
        
        // Delete the board itself
        const boardRef = doc(db, "boards", boardId);
        batch.delete(boardRef);
        
        // Commit the batch
        await batch.commit();
        
        console.log(`Board ${boardId} and all its contents deleted`);
      } catch (error) {
        console.error(`Error deleting board ${boardId}:`, error);
        throw new Error(`Falha ao excluir quadro: ${error.message}`);
      }
    }
  };
  
  export default boardService;