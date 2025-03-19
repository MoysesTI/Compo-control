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
  
  /**
   * Card data validator
   * @param {Object} cardData - Card data to validate
   * @returns {Object} - { isValid, errors }
   */
  const validateCardData = (cardData) => {
    const errors = {};
    
    // Title is required
    if (!cardData.title || cardData.title.trim() === '') {
      errors.title = 'O título é obrigatório';
    }
    
    // Validate due date format if present
    if (cardData.dueDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
      if (!dateRegex.test(cardData.dueDate)) {
        errors.dueDate = 'Formato de data inválido';
      }
    }
    
    // Check visibility
    if (cardData.visibility && cardData.visibility !== 'public' && cardData.visibility !== 'private') {
      errors.visibility = 'Visibilidade deve ser "public" ou "private"';
    }
    
    // If private, it should have assigned members
    if (cardData.visibility === 'private' && 
        (!cardData.assignedTo || cardData.assignedTo.length === 0)) {
      errors.assignedTo = 'Cartões privados devem ter membros atribuídos';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Service for card operations with enhanced error handling
   */
  export const cardService = {
    /**
     * Get cards for a column
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {string} userId - User ID for filtering (optional)
     * @param {boolean} isAdmin - Whether the user is admin (optional)
     * @returns {Promise<Array>} - Array of cards
     */
    getCards: async (boardId, columnId, userId = null, isAdmin = false) => {
      try {
        console.log(`Fetching cards for column: ${columnId} in board: ${boardId}`);
        const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
        let cardsQuery;
        
        cardsQuery = query(cardsRef, orderBy("order", "asc"));
        
        const cardsSnapshot = await getDocs(cardsQuery);
        
        // Filter cards based on visibility and assignment
        let cards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (!isAdmin && userId) {
          cards = cards.filter(card => 
            card.visibility === 'public' || 
            (card.visibility === 'private' && card.assignedTo?.includes(userId))
          );
        }
        
        console.log(`Retrieved ${cards.length} cards for column: ${columnId}`);
        return cards;
      } catch (error) {
        console.error(`Error getting cards for column ${columnId}:`, error);
        throw new Error(`Falha ao carregar cartões: ${error.message}`);
      }
    },
    
    /**
     * Get a specific card
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {string} cardId - Card ID
     * @returns {Promise<Object>} - Card data
     */
    getCard: async (boardId, columnId, cardId) => {
      try {
        console.log(`Fetching card ${cardId} from column: ${columnId} in board: ${boardId}`);
        const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
        const cardSnapshot = await getDoc(cardRef);
        
        if (!cardSnapshot.exists()) {
          console.error(`Card ${cardId} not found`);
          throw new Error(`Cartão não encontrado`);
        }
        
        return { id: cardSnapshot.id, ...cardSnapshot.data() };
      } catch (error) {
        console.error(`Error getting card ${cardId}:`, error);
        throw new Error(`Falha ao carregar o cartão: ${error.message}`);
      }
    },
    
    /**
     * Add a card to a column
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {Object} cardData - Card data
     * @param {string} userId - User ID who is creating the card
     * @returns {Promise<string>} - New card ID
     */
    addCard: async (boardId, columnId, cardData, userId) => {
      try {
        console.log(`Adding card to column ${columnId} in board: ${boardId}`);
        
        if (!userId) {
          console.error('User ID not provided');
          throw new Error('ID de usuário não fornecido');
        }
        
        // Verify board exists
        try {
          const boardRef = doc(db, "boards", boardId);
          const boardSnapshot = await getDoc(boardRef);
          
          if (!boardSnapshot.exists()) {
            console.error(`Board ${boardId} not found`);
            throw new Error(`Quadro não encontrado`);
          }
        } catch (boardError) {
          console.error('Error checking board:', boardError);
          throw new Error(`Erro ao verificar quadro: ${boardError.message}`);
        }
        
        // Verify column exists
        try {
          const columnRef = doc(db, "boards", boardId, "columns", columnId);
          const columnSnapshot = await getDoc(columnRef);
          
          if (!columnSnapshot.exists()) {
            console.error(`Column ${columnId} not found`);
            throw new Error(`Coluna não encontrada`);
          }
        } catch (columnError) {
          console.error('Error checking column:', columnError);
          throw new Error(`Erro ao verificar coluna: ${columnError.message}`);
        }
        
        // Ensure minimal card data
        const cardWithDefaults = {
          title: '',
          description: '',
          labels: [],
          members: [],
          assignedTo: [],
          visibility: 'public',
          comments: 0,
          attachments: 0,
          ...cardData,
          boardId,
          columnId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        };
        
        // Validate card data
        const validation = validateCardData(cardWithDefaults);
        if (!validation.isValid) {
          console.error(`Card validation failed:`, validation.errors);
          throw new Error(`Dados do cartão inválidos: ${Object.values(validation.errors).join(', ')}`);
        }
        
        // Get current card count for order
        const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
        const cardsSnapshot = await getDocs(cardsRef);
        const order = cardsSnapshot.size;
        
        // Add card to Firestore
        try {
          const newCardRef = await addDoc(cardsRef, {
            ...cardWithDefaults,
            order
          });
          
          console.log(`Card added with ID: ${newCardRef.id}`);
          return newCardRef.id;
        } catch (addError) {
          console.error('Error adding card to Firestore:', addError);
          if (addError.code === 'permission-denied') {
            throw new Error('Permissões ausentes ou insuficientes. Tente fazer login novamente.');
          }
          throw new Error(`Erro ao adicionar cartão ao Firestore: ${addError.message}`);
        }
      } catch (error) {
        console.error("Error adding card:", error);
        throw new Error(`Falha ao adicionar cartão: ${error.message}`);
      }
    },
    
    /**
     * Update a card
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {string} cardId - Card ID
     * @param {Object} cardData - Updated card data
     * @returns {Promise<void>}
     */
    updateCard: async (boardId, columnId, cardId, cardData) => {
      try {
        console.log(`Updating card ${cardId} in column ${columnId}`);
        
        // Check if card exists
        const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
        const cardSnapshot = await getDoc(cardRef);
        
        if (!cardSnapshot.exists()) {
          console.error(`Card ${cardId} not found`);
          throw new Error(`Cartão não encontrado`);
        }
        
        // Prepare update data
        const updateData = {
          ...cardData,
          updatedAt: serverTimestamp()
        };
        
        // Validate card data
        const validation = validateCardData({
          ...cardSnapshot.data(),
          ...updateData
        });
        
        if (!validation.isValid) {
          console.error(`Card validation failed:`, validation.errors);
          throw new Error(`Dados do cartão inválidos: ${Object.values(validation.errors).join(', ')}`);
        }
        
        // Update card in Firestore
        await updateDoc(cardRef, updateData);
        console.log(`Card ${cardId} updated successfully`);
      } catch (error) {
        console.error(`Error updating card ${cardId}:`, error);
        throw new Error(`Falha ao atualizar cartão: ${error.message}`);
      }
    },
    
    /**
     * Delete a card
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {string} cardId - Card ID
     * @returns {Promise<void>}
     */
    deleteCard: async (boardId, columnId, cardId) => {
      try {
        console.log(`Deleting card ${cardId} from column ${columnId}`);
        
        // Check if card exists
        const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
        const cardSnapshot = await getDoc(cardRef);
        
        if (!cardSnapshot.exists()) {
          console.error(`Card ${cardId} not found`);
          throw new Error(`Cartão não encontrado`);
        }
        
        // Delete card from Firestore
        await deleteDoc(cardRef);
        console.log(`Card ${cardId} deleted successfully`);
        
        // Reorder remaining cards
        await cardService.reorderCards(boardId, columnId);
      } catch (error) {
        console.error(`Error deleting card ${cardId}:`, error);
        throw new Error(`Falha ao excluir cartão: ${error.message}`);
      }
    },
    
    /**
     * Reorder cards in a column
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @returns {Promise<void>}
     */
    reorderCards: async (boardId, columnId) => {
      try {
        console.log(`Reordering cards in column ${columnId}`);
        const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
        const cardsQuery = query(cardsRef, orderBy("order", "asc"));
        const cardsSnapshot = await getDocs(cardsQuery);
        
        const batch = writeBatch(db);
        
        cardsSnapshot.docs.forEach((cardDoc, index) => {
          const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardDoc.id);
          batch.update(cardRef, { order: index });
        });
        
        await batch.commit();
        console.log(`Cards reordered in column ${columnId}`);
      } catch (error) {
        console.error(`Error reordering cards in column ${columnId}:`, error);
        throw new Error(`Falha ao reordenar cartões: ${error.message}`);
      }
    },
    
    /**
     * Move a card from one column to another
     * @param {string} boardId - Board ID
     * @param {string} sourceColumnId - Source column ID
     * @param {string} destColumnId - Destination column ID
     * @param {string} cardId - Card ID
     * @param {number} destIndex - Destination index
     * @returns {Promise<void>}
     */
    moveCard: async (boardId, sourceColumnId, destColumnId, cardId, destIndex) => {
      try {
        console.log(`Moving card ${cardId} from column ${sourceColumnId} to column ${destColumnId}`);
        
        // Get card data
        const cardRef = doc(db, "boards", boardId, "columns", sourceColumnId, "cards", cardId);
        const cardSnapshot = await getDoc(cardRef);
        
        if (!cardSnapshot.exists()) {
          console.error(`Card ${cardId} not found`);
          throw new Error(`Cartão não encontrado`);
        }
        
        const cardData = cardSnapshot.data();
        
        // Add card to destination column
        const destCardsRef = collection(db, "boards", boardId, "columns", destColumnId, "cards");
        const newCardRef = await addDoc(destCardsRef, {
          ...cardData,
          columnId: destColumnId,
          order: destIndex,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Card created in destination column with ID: ${newCardRef.id}`);
        
        // Delete card from source column
        await deleteDoc(cardRef);
        console.log(`Card deleted from source column`);
        
        // Reorder cards in both columns
        await cardService.reorderCards(boardId, sourceColumnId);
        await cardService.reorderCards(boardId, destColumnId);
      } catch (error) {
        console.error(`Error moving card ${cardId}:`, error);
        throw new Error(`Falha ao mover cartão: ${error.message}`);
      }
    },
    
    /**
     * Assign members to a card
     * @param {string} boardId - Board ID
     * @param {string} columnId - Column ID
     * @param {string} cardId - Card ID
     * @param {Array} memberIds - Array of member IDs
     * @param {Array} memberNames - Array of member names
     * @param {string} visibility - Card visibility ('public' or 'private')
     * @returns {Promise<void>}
     */
    assignMembers: async (boardId, columnId, cardId, memberIds, memberNames, visibility) => {
      try {
        console.log(`Assigning members to card ${cardId}`);
        
        // Check if card exists
        const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
        const cardSnapshot = await getDoc(cardRef);
        
        if (!cardSnapshot.exists()) {
          console.error(`Card ${cardId} not found`);
          throw new Error(`Cartão não encontrado`);
        }
        
        // Validate visibility and membership
        if (visibility === 'private' && memberIds.length === 0) {
          console.error(`Cannot set a card to private without assigning members`);
          throw new Error(`Cartões privados devem ter membros atribuídos`);
        }
        
        // Update card in Firestore
        await updateDoc(cardRef, {
          assignedTo: memberIds,
          members: memberNames,
          visibility,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Members assigned to card ${cardId} successfully`);
      } catch (error) {
        console.error(`Error assigning members to card ${cardId}:`, error);
        throw new Error(`Falha ao atribuir membros: ${error.message}`);
      }
    }
  };
  
  export default cardService;