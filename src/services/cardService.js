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
  writeBatch,
  arrayUnion,
  deleteField
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
   * @param {Object} filters - Filters to apply (optional)
   * @returns {Promise<Array>} - Array of cards
   */
  getCards: async (boardId, columnId, userId = null, isAdmin = false, filters = null) => {
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
      
      // Apply additional filters if provided
      if (filters) {
        // Filter by archived status
        if (filters.archived !== undefined) {
          cards = cards.filter(card => Boolean(card.archived) === Boolean(filters.archived));
        } else {
          // By default, exclude archived cards
          cards = cards.filter(card => !card.archived);
        }
        
        // Filter by labels
        if (filters.labels && filters.labels.length > 0) {
          cards = cards.filter(card => 
            card.labels && card.labels.some(label => 
              filters.labels.some(filterLabel => 
                (filterLabel.id && label.id === filterLabel.id) ||
                (label.text === filterLabel.text && label.color === filterLabel.color)
              )
            )
          );
        }
        
        // Filter by members
        if (filters.members && filters.members.length > 0) {
          cards = cards.filter(card => 
            card.assignedTo && card.assignedTo.some(memberId => 
              filters.members.includes(memberId)
            )
          );
        }
        
        // Filter by due date
        if (filters.dueDate) {
          const now = new Date();
          
          switch (filters.dueDate) {
            case 'overdue':
              cards = cards.filter(card => {
                if (!card.dueDate) return false;
                const dueDate = new Date(card.dueDate);
                return dueDate < now && !card.completed;
              });
              break;
            case 'today':
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              cards = cards.filter(card => {
                if (!card.dueDate) return false;
                const dueDate = new Date(card.dueDate);
                return dueDate >= today && dueDate < tomorrow;
              });
              break;
            case 'week':
              const nextWeek = new Date(now);
              nextWeek.setDate(now.getDate() + 7);
              
              cards = cards.filter(card => {
                if (!card.dueDate) return false;
                const dueDate = new Date(card.dueDate);
                return dueDate >= now && dueDate <= nextWeek;
              });
              break;
            case 'no-date':
              cards = cards.filter(card => !card.dueDate);
              break;
          }
        }
        
        // Text search
        if (filters.search && filters.search.trim() !== '') {
          const searchLower = filters.search.toLowerCase();
          cards = cards.filter(card =>
            (card.title && card.title.toLowerCase().includes(searchLower)) ||
            (card.description && card.description.toLowerCase().includes(searchLower))
          );
        }
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
        archived: false,
        completed: false,
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
      
      // First delete all child collections (comments, checklists, etc.)
      // For checklist items
      const checklistsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists");
      const checklistsSnapshot = await getDocs(checklistsRef);
      const batch = writeBatch(db);
      
      checklistsSnapshot.docs.forEach(checklistDoc => {
        batch.delete(doc(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists", checklistDoc.id));
      });
      
      // For comments
      const commentsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments");
      const commentsSnapshot = await getDocs(commentsRef);
      
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(doc(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments", commentDoc.id));
      });
      
      // Commit batch deletion of child collections
      if (checklistsSnapshot.docs.length > 0 || commentsSnapshot.docs.length > 0) {
        await batch.commit();
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
      
      // Copy all subcollections (comments, checklists) to the new card
      await cardService.copyCardSubcollections(
        boardId, sourceColumnId, cardId, 
        boardId, destColumnId, newCardRef.id
      );
      
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
   * Copy all subcollections from one card to another
   * @param {string} sourceBoardId - Source board ID
   * @param {string} sourceColumnId - Source column ID
   * @param {string} sourceCardId - Source card ID
   * @param {string} destBoardId - Destination board ID
   * @param {string} destColumnId - Destination column ID
   * @param {string} destCardId - Destination card ID
   * @returns {Promise<void>}
   */
  copyCardSubcollections: async (
    sourceBoardId, sourceColumnId, sourceCardId,
    destBoardId, destColumnId, destCardId
  ) => {
    try {
      // Copy checklists
      const checklistsRef = collection(db, "boards", sourceBoardId, "columns", sourceColumnId, "cards", sourceCardId, "checklists");
      const checklistsSnapshot = await getDocs(checklistsRef);
      
      for (const checklistDoc of checklistsSnapshot.docs) {
        const checklistData = checklistDoc.data();
        await addDoc(
          collection(db, "boards", destBoardId, "columns", destColumnId, "cards", destCardId, "checklists"),
          {
            ...checklistData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        );
      }
      
      // Copy comments
      const commentsRef = collection(db, "boards", sourceBoardId, "columns", sourceColumnId, "cards", sourceCardId, "comments");
      const commentsSnapshot = await getDocs(commentsRef);
      
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();
        await addDoc(
          collection(db, "boards", destBoardId, "columns", destColumnId, "cards", destCardId, "comments"),
          {
            ...commentData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        );
      }
    } catch (error) {
      console.error(`Error copying card subcollections:`, error);
      throw new Error(`Falha ao copiar subcoleções do cartão: ${error.message}`);
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
  },
  
  /**
   * Duplicate a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID to duplicate
   * @param {string} userId - User ID who is duplicating the card
   * @returns {Promise<string>} - New card ID
   */
  duplicateCard: async (boardId, columnId, cardId, userId) => {
    try {
      console.log(`Duplicating card ${cardId} in column ${columnId}`);
      
      // Get original card data
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      const cardData = cardSnapshot.data();
      
      // Get current card count for order
      const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
      const cardsSnapshot = await getDocs(cardsRef);
      const order = cardsSnapshot.size;
      
      // Create duplicate card
      const newCardData = {
        ...cardData,
        title: `${cardData.title} (Cópia)`,
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      };
      
      // Remove any IDs or unique identifiers that shouldn't be duplicated
      delete newCardData.id;
      
      // Add duplicate card to Firestore
      const newCardRef = await addDoc(cardsRef, newCardData);
      const newCardId = newCardRef.id;
      
      // Copy subcollections
      await cardService.copyCardSubcollections(
        boardId, columnId, cardId,
        boardId, columnId, newCardId
      );
      
      console.log(`Card duplicated with new ID: ${newCardId}`);
      return newCardId;
    } catch (error) {
      console.error(`Error duplicating card ${cardId}:`, error);
      throw new Error(`Falha ao duplicar cartão: ${error.message}`);
    }
  },
  
  /**
   * Archive a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID who is archiving the card
   * @returns {Promise<void>}
   */
  archiveCard: async (boardId, columnId, cardId, userId) => {
    try {
      console.log(`Archiving card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Update card as archived
      await updateDoc(cardRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: userId,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Card ${cardId} archived successfully`);
    } catch (error) {
      console.error(`Error archiving card ${cardId}:`, error);
      throw new Error(`Falha ao arquivar cartão: ${error.message}`);
    }
  },
  
  /**
   * Restore an archived card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID who is restoring the card
   * @returns {Promise<void>}
   */
  restoreCard: async (boardId, columnId, cardId, userId) => {
    try {
      console.log(`Restoring archived card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Remove archived flags
      await updateDoc(cardRef, {
        archived: false,
        archivedAt: deleteField(),
        archivedBy: deleteField(),
        restoredAt: serverTimestamp(),
        restoredBy: userId,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Card ${cardId} restored successfully`);
    } catch (error) {
      console.error(`Error restoring card ${cardId}:`, error);
      throw new Error(`Falha ao restaurar cartão: ${error.message}`);
    }
  },
  
  /**
   * Add a comment to a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} comment - Comment text
   * @param {string} userId - User ID who is adding the comment
   * @param {string} userName - Name of the user
   * @returns {Promise<string>} - Comment ID
   */
  addComment: async (boardId, columnId, cardId, comment, userId, userName) => {
    try {
      console.log(`Adding comment to card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Create comment
      const commentsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments");
      const newCommentRef = await addDoc(commentsRef, {
        text: comment,
        userId,
        userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update comment count on card
      await updateDoc(cardRef, {
        comments: (cardSnapshot.data().comments || 0) + 1,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Comment added to card ${cardId} with ID: ${newCommentRef.id}`);
      return newCommentRef.id;
    } catch (error) {
      console.error(`Error adding comment to card ${cardId}:`, error);
      throw new Error(`Falha ao adicionar comentário: ${error.message}`);
    }
  },
  
  /**
   * Get comments for a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {number} limit - Maximum number of comments to return
   * @returns {Promise<Array>} - Array of comments
   */
  getComments: async (boardId, columnId, cardId, limit = 50) => {
    try {
      console.log(`Getting comments for card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Get comments
      const commentsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments");
      const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"), limit(limit));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      return commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting comments for card ${cardId}:`, error);
      throw new Error(`Falha ao obter comentários: ${error.message}`);
    }
  },
  
  /**
   * Add a checklist to a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} title - Checklist title
   * @param {Array} items - Array of checklist items
   * @param {string} userId - User ID who is adding the checklist
   * @returns {Promise<string>} - Checklist ID
   */
  addChecklist: async (boardId, columnId, cardId, title, items, userId) => {
    try {
      console.log(`Adding checklist to card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Format checklist items
      const formattedItems = (items || []).map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: item,
        completed: false,
        order: index
      }));
      
      // Create checklist
      const checklistsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists");
      const newChecklistRef = await addDoc(checklistsRef, {
        title: title || "Checklist",
        items: formattedItems,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      });
      
      // Update card with checklist reference
      await updateDoc(cardRef, {
        updatedAt: serverTimestamp(),
        hasChecklists: true
      });
      
      console.log(`Checklist added to card ${cardId} with ID: ${newChecklistRef.id}`);
      return newChecklistRef.id;
    } catch (error) {
      console.error(`Error adding checklist to card ${cardId}:`, error);
      throw new Error(`Falha ao adicionar checklist: ${error.message}`);
    }
  },
  
  /**
   * Update a checklist item
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<void>}
   */
  updateChecklistItem: async (boardId, columnId, cardId, checklistId, itemId, itemData) => {
    try {
      console.log(`Updating checklist item ${itemId} in checklist ${checklistId}`);
      
      // Get checklist
      const checklistRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists", checklistId);
      const checklistSnapshot = await getDoc(checklistRef);
      
      if (!checklistSnapshot.exists()) {
        console.error(`Checklist ${checklistId} not found`);
        throw new Error(`Checklist não encontrada`);
      }
      
      const checklist = checklistSnapshot.data();
      const items = checklist.items || [];
      
      // Find and update the item
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...itemData };
        }
        return item;
      });
      
      // Update the checklist
      await updateDoc(checklistRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
      
      // Update card completion status if needed
      if (itemData.completed !== undefined) {
        const allItems = updatedItems.length;
        const completedItems = updatedItems.filter(item => item.completed).length;
        const progress = Math.round((completedItems / allItems) * 100);
        
        await updateDoc(doc(db, "boards", boardId, "columns", columnId, "cards", cardId), {
          checklistProgress: progress,
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Checklist item ${itemId} updated successfully`);
    } catch (error) {
      console.error(`Error updating checklist item ${itemId}:`, error);
      throw new Error(`Falha ao atualizar item de checklist: ${error.message}`);
    }
  },
  
  /**
   * Get checklists for a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Array>} - Array of checklists
   */
  getChecklists: async (boardId, columnId, cardId) => {
    try {
      console.log(`Getting checklists for card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      // Get checklists
      const checklistsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists");
      const checklistsQuery = query(checklistsRef, orderBy("createdAt", "asc"));
      const checklistsSnapshot = await getDocs(checklistsQuery);
      
      return checklistsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting checklists for card ${cardId}:`, error);
      throw new Error(`Falha ao obter checklists: ${error.message}`);
    }
  },
  
  /**
   * Add or update a label on a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {Object} label - Label data
   * @returns {Promise<void>}
   */
  addLabel: async (boardId, columnId, cardId, label) => {
    try {
      console.log(`Adding label to card ${cardId}`);
      
      if (!label || !label.text || !label.color) {
        throw new Error('Dados da etiqueta inválidos');
      }
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      const cardData = cardSnapshot.data();
      const labels = cardData.labels || [];
      
      // Check if label already exists
      const labelExists = labels.some(existingLabel => 
        (existingLabel.id && existingLabel.id === label.id) ||
        (existingLabel.text === label.text && existingLabel.color === label.color)
      );
      
      if (!labelExists) {
        // Add the label
        await updateDoc(cardRef, {
          labels: arrayUnion(label),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Label added to card ${cardId} successfully`);
    } catch (error) {
      console.error(`Error adding label to card ${cardId}:`, error);
      throw new Error(`Falha ao adicionar etiqueta: ${error.message}`);
    }
  },
  
  /**
   * Remove a label from a card
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {Object} label - Label to remove
   * @returns {Promise<void>}
   */
  removeLabel: async (boardId, columnId, cardId, label) => {
    try {
      console.log(`Removing label from card ${cardId}`);
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      const cardData = cardSnapshot.data();
      const labels = cardData.labels || [];
      
      // Filter out the label to remove
      const updatedLabels = labels.filter(existingLabel => 
        !(existingLabel.id === label.id || 
          (existingLabel.text === label.text && existingLabel.color === label.color))
      );
      
      // Update card with new labels array
      await updateDoc(cardRef, {
        labels: updatedLabels,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Label removed from card ${cardId} successfully`);
    } catch (error) {
      console.error(`Error removing label from card ${cardId}:`, error);
      throw new Error(`Falha ao remover etiqueta: ${error.message}`);
    }
  },
  
  /**
   * Share a card with another user
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} cardId - Card ID
   * @param {string} userEmail - Email of user to share with
   * @returns {Promise<void>}
   */
  shareCard: async (boardId, columnId, cardId, userEmail) => {
    try {
      console.log(`Sharing card ${cardId} with user ${userEmail}`);
      
      // Check if the user exists
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("email", "==", userEmail));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error(`Usuário com email ${userEmail} não encontrado`);
      }
      
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if card exists
      const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardId);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.error(`Card ${cardId} not found`);
        throw new Error(`Cartão não encontrado`);
      }
      
      const cardData = cardSnapshot.data();
      
      // Add user to card members if not already there
      const assignedTo = cardData.assignedTo || [];
      const members = cardData.members || [];
      
      if (!assignedTo.includes(userId)) {
        assignedTo.push(userId);
      }
      
      if (!members.includes(userData.name)) {
        members.push(userData.name);
      }
      
      // Update card with new members
      await updateDoc(cardRef, {
        assignedTo,
        members,
        updatedAt: serverTimestamp()
      });
      
      // Add user to board members if not already there
      const boardRef = doc(db, "boards", boardId);
      const boardSnapshot = await getDoc(boardRef);
      
      if (boardSnapshot.exists()) {
        const boardData = boardSnapshot.data();
        const boardMembers = boardData.members || [];
        
        if (!boardMembers.includes(userId)) {
          await updateDoc(boardRef, {
            members: arrayUnion(userId),
            updatedAt: serverTimestamp()
          });
        }
      }
      
      console.log(`Card ${cardId} shared with user ${userEmail} successfully`);
    } catch (error) {
      console.error(`Error sharing card ${cardId} with user ${userEmail}:`, error);
      throw new Error(`Falha ao compartilhar cartão: ${error.message}`);
    }
  }
};

export default cardService;