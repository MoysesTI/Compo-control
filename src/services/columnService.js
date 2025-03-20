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
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Default column structure to initialize boards
 */
const DEFAULT_COLUMNS = [
  { title: 'A Fazer', order: 0 },
  { title: 'Em Andamento', order: 1 },
  { title: 'Revisão', order: 2 },
  { title: 'Concluído', order: 3 }
];

/**
 * Service for column operations
 */
export const columnService = {
  /**
   * Get all columns for a board
   * @param {string} boardId - Board ID
   * @param {boolean} includeArchived - Whether to include archived columns
   * @returns {Promise<Array>} - Array of columns
   */
  getColumns: async (boardId, includeArchived = false) => {
    try {
      console.log(`Fetching columns for board: ${boardId}`);
      const columnsRef = collection(db, "boards", boardId, "columns");
      let columnsQuery;
      console.log(columnsQuery)
      if (!includeArchived) {
        columnsQuery = query(
          columnsRef, 
          where("archived", "==", false),
          orderBy("order")
        );
      } else {
        columnsQuery = query(columnsRef, orderBy("order"));
      }
      
      const columnsSnapshot = await getDocs(columnsQuery);
      
      // Check if columns exist
      if (columnsSnapshot.empty) {
        console.log(`No columns found for board: ${boardId}. Initializing default columns.`);
        // Initialize default columns
        await columnService.initializeDefaultColumns(boardId);
        
        // Fetch columns again
        const newColumnsSnapshot = await getDocs(columnsQuery);
        return newColumnsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      return columnsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting columns:", error);
      throw new Error(`Falha ao carregar colunas: ${error.message}`);
    }
  },
  
  /**
   * Get archived columns for a board
   * @param {string} boardId - Board ID
   * @returns {Promise<Array>} - Array of archived columns
   */
  getArchivedColumns: async (boardId) => {
    try {
      console.log(`Fetching archived columns for board: ${boardId}`);
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(
        columnsRef, 
        where("archived", "==", true),
        orderBy("archivedAt", "desc")
      );
      
      const columnsSnapshot = await getDocs(columnsQuery);
      return columnsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting archived columns:", error);
      throw new Error(`Falha ao carregar colunas arquivadas: ${error.message}`);
    }
  },
  
  /**
   * Initialize default columns for a board
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID who is initializing the columns
   * @returns {Promise<void>}
   */
  initializeDefaultColumns: async (boardId, userId = null) => {
    try {
      console.log(`Initializing default columns for board: ${boardId}`);
      const columnsRef = collection(db, "boards", boardId, "columns");
      
      // Check if board exists
      const boardRef = doc(db, "boards", boardId);
      const boardSnap = await getDoc(boardRef);
      
      if (!boardSnap.exists()) {
        throw new Error(`Board with ID ${boardId} does not exist.`);
      }
      
      const batch = writeBatch(db);
      
      // Create default columns
      for (const column of DEFAULT_COLUMNS) {
        const newColumnRef = doc(columnsRef);
        batch.set(newColumnRef, {
          ...column,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId || boardSnap.data().createdBy || 'system'
        });
      }
      
      await batch.commit();
      console.log(`Default columns initialized for board: ${boardId}`);
    } catch (error) {
      console.error("Error initializing default columns:", error);
      throw new Error(`Falha ao inicializar colunas: ${error.message}`);
    }
  },
  
  /**
   * Add a column to a board
   * @param {string} boardId - Board ID
   * @param {string} title - Column title
   * @param {string} userId - User ID
   * @param {number} wipLimit - Work-in-progress limit (optional)
   * @returns {Promise<string>} - New column ID
   */
  addColumn: async (boardId, title, userId, wipLimit = null) => {
    try {
      console.log(`Adding column "${title}" to board: ${boardId}`);
      const columnsRef = collection(db, "boards", boardId, "columns");
      
      // Get current column count for order
      const columnsSnapshot = await getDocs(columnsRef);
      const order = columnsSnapshot.size;
      
      const newColumnRef = await addDoc(columnsRef, {
        title,
        order,
        archived: false,
        wipLimit: wipLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      });
      
      console.log(`Column added with ID: ${newColumnRef.id}`);
      return newColumnRef.id;
    } catch (error) {
      console.error("Error adding column:", error);
      throw new Error(`Falha ao adicionar coluna: ${error.message}`);
    }
  },
  
  /**
   * Update a column
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {Object} columnData - Updated column data
   * @returns {Promise<void>}
   */
  updateColumn: async (boardId, columnId, columnData) => {
    try {
      console.log(`Updating column ${columnId} in board: ${boardId}`);
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      await updateDoc(columnRef, {
        ...columnData,
        updatedAt: serverTimestamp()
      });
      console.log(`Column ${columnId} updated successfully`);
    } catch (error) {
      console.error("Error updating column:", error);
      throw new Error(`Falha ao atualizar coluna: ${error.message}`);
    }
  },
  
  /**
   * Delete a column
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @returns {Promise<void>}
   */
  deleteColumn: async (boardId, columnId) => {
    try {
      console.log(`Deleting column ${columnId} from board: ${boardId}`);
      
      // First delete all cards in this column
      const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
      const cardsSnapshot = await getDocs(cardsRef);
      
      const batch = writeBatch(db);
      
      // Delete all subcollections for each card (comments, checklists, etc.)
      for (const cardDoc of cardsSnapshot.docs) {
        const cardId = cardDoc.id;
        
        // Delete comments
        const commentsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments");
        const commentsSnapshot = await getDocs(commentsRef);
        
        commentsSnapshot.docs.forEach(commentDoc => {
          batch.delete(doc(db, "boards", boardId, "columns", columnId, "cards", cardId, "comments", commentDoc.id));
        });
        
        // Delete checklists
        const checklistsRef = collection(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists");
        const checklistsSnapshot = await getDocs(checklistsRef);
        
        checklistsSnapshot.docs.forEach(checklistDoc => {
          batch.delete(doc(db, "boards", boardId, "columns", columnId, "cards", cardId, "checklists", checklistDoc.id));
        });
        
        // Delete the card
        batch.delete(doc(db, "boards", boardId, "columns", columnId, "cards", cardId));
      }
      
      // Delete the column itself
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      batch.delete(columnRef);
      
      await batch.commit();
      console.log(`Column ${columnId} and its cards deleted successfully`);
      
      // Reorder remaining columns
      await columnService.reorderColumns(boardId);
    } catch (error) {
      console.error("Error deleting column:", error);
      throw new Error(`Falha ao excluir coluna: ${error.message}`);
    }
  },
  
  /**
   * Reorder columns
   * @param {string} boardId - Board ID
   * @returns {Promise<void>}
   */
  reorderColumns: async (boardId) => {
    try {
      console.log(`Reordering columns for board: ${boardId}`);
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(
        columnsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const columnsSnapshot = await getDocs(columnsQuery);
      
      const batch = writeBatch(db);
      
      columnsSnapshot.docs.forEach((columnDoc, index) => {
        const columnRef = doc(db, "boards", boardId, "columns", columnDoc.id);
        batch.update(columnRef, { order: index });
      });
      
      await batch.commit();
      console.log(`Columns reordered for board: ${boardId}`);
    } catch (error) {
      console.error("Error reordering columns:", error);
      throw new Error(`Falha ao reordenar colunas: ${error.message}`);
    }
  },
  
  /**
   * Move a column to a new position
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {number} newPosition - New position index
   * @returns {Promise<void>}
   */
  moveColumn: async (boardId, columnId, newPosition) => {
    try {
      console.log(`Moving column ${columnId} to position ${newPosition}`);
      
      // Get all active columns
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(
        columnsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const columnsSnapshot = await getDocs(columnsQuery);
      const columns = columnsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Find the column to move
      const columnIndex = columns.findIndex(col => col.id === columnId);
      if (columnIndex === -1) {
        throw new Error(`Column ${columnId} not found`);
      }
      
      // Reorder columns array
      const columnToMove = columns.splice(columnIndex, 1)[0];
      columns.splice(newPosition, 0, columnToMove);
      
      // Update all column positions
      const batch = writeBatch(db);
      
      columns.forEach((column, index) => {
        const columnRef = doc(db, "boards", boardId, "columns", column.id);
        batch.update(columnRef, { 
          order: index,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`Column ${columnId} moved to position ${newPosition} successfully`);
    } catch (error) {
      console.error(`Error moving column ${columnId}:`, error);
      throw new Error(`Falha ao mover coluna: ${error.message}`);
    }
  },
  
  /**
   * Archive a column
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} userId - User ID who is archiving the column
   * @returns {Promise<void>}
   */
  archiveColumn: async (boardId, columnId, userId) => {
    try {
      console.log(`Archiving column ${columnId}`);
      
      // Check if column exists
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      const columnSnapshot = await getDoc(columnRef);
      
      if (!columnSnapshot.exists()) {
        throw new Error(`Column ${columnId} not found`);
      }
      
      // Archive the column
      await updateDoc(columnRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: userId,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Column ${columnId} archived successfully`);
      
      // Reorder remaining columns
      await columnService.reorderColumns(boardId);
    } catch (error) {
      console.error(`Error archiving column ${columnId}:`, error);
      throw new Error(`Falha ao arquivar coluna: ${error.message}`);
    }
  },
  
  /**
   * Restore an archived column
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @param {string} userId - User ID who is restoring the column
   * @returns {Promise<void>}
   */
  restoreColumn: async (boardId, columnId, userId) => {
    try {
      console.log(`Restoring column ${columnId}`);
      
      // Check if column exists
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      const columnSnapshot = await getDoc(columnRef);
      
      if (!columnSnapshot.exists()) {
        throw new Error(`Column ${columnId} not found`);
      }
      
      // Get current column count for order
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(
        columnsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const columnsSnapshot = await getDocs(columnsQuery);
      const order = columnsSnapshot.size;
      
      // Restore the column
      await updateDoc(columnRef, {
        archived: false,
        archivedAt: null,
        archivedBy: null,
        restoredAt: serverTimestamp(),
        restoredBy: userId,
        order: order,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Column ${columnId} restored successfully`);
    } catch (error) {
      console.error(`Error restoring column ${columnId}:`, error);
      throw new Error(`Falha ao restaurar coluna: ${error.message}`);
    }
  },
  
  /**
   * Duplicate a column with all its cards
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID to duplicate
   * @param {string} userId - User ID who is duplicating the column
   * @returns {Promise<string>} - New column ID
   */
  duplicateColumn: async (boardId, columnId, userId) => {
    try {
      console.log(`Duplicating column ${columnId}`);
      
      // Get original column data
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      const columnSnapshot = await getDoc(columnRef);
      
      if (!columnSnapshot.exists()) {
        throw new Error(`Column ${columnId} not found`);
      }
      
      const columnData = columnSnapshot.data();
      
      // Get current column count for order
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(
        columnsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const columnsSnapshot = await getDocs(columnsQuery);
      const order = columnsSnapshot.size;
      
      // Create duplicate column
      const newColumnRef = await addDoc(columnsRef, {
        title: `${columnData.title} (Cópia)`,
        order,
        archived: false,
        wipLimit: columnData.wipLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      });
      
      const newColumnId = newColumnRef.id;
      console.log(`Column duplicated with new ID: ${newColumnId}`);
      
      // Duplicate all cards from the original column
      const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
      const cardsQuery = query(
        cardsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const cardsSnapshot = await getDocs(cardsQuery);
      
      // Create batch for faster processing
      const batch = writeBatch(db);
      let cardIndex = 0;
      
      // First pass: create all cards
      const newCardIds = {};
      
      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();
        const originalCardId = cardDoc.id;
        
        // Create new card with similar data but new metadata
        const newCardRef = doc(collection(db, "boards", boardId, "columns", newColumnId, "cards"));
        newCardIds[originalCardId] = newCardRef.id;
        
        batch.set(newCardRef, {
          ...cardData,
          title: cardData.title,
          order: cardIndex++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        });
      }
      
      await batch.commit();
      console.log(`Duplicated ${Object.keys(newCardIds).length} cards in column ${newColumnId}`);
      
      // Second pass: duplicate all subcollections
      for (const cardDoc of cardsSnapshot.docs) {
        const originalCardId = cardDoc.id;
        const newCardId = newCardIds[originalCardId];
        
        if (!newCardId) continue;
        
        // Copy checklists
        const checklistsRef = collection(db, "boards", boardId, "columns", columnId, "cards", originalCardId, "checklists");
        const checklistsSnapshot = await getDocs(checklistsRef);
        
        for (const checklistDoc of checklistsSnapshot.docs) {
          const checklistData = checklistDoc.data();
          await addDoc(
            collection(db, "boards", boardId, "columns", newColumnId, "cards", newCardId, "checklists"),
            {
              ...checklistData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          );
        }
        
        // Don't copy comments to the duplicated cards
      }
      
      console.log(`Column ${columnId} duplicated successfully to ${newColumnId}`);
      return newColumnId;
    } catch (error) {
      console.error(`Error duplicating column ${columnId}:`, error);
      throw new Error(`Falha ao duplicar coluna: ${error.message}`);
    }
  },
  
  /**
   * Check if a column is at WIP limit
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @returns {Promise<boolean>} - True if column is at WIP limit
   */
  checkWipLimit: async (boardId, columnId) => {
    try {
      // Get column data
      const columnRef = doc(db, "boards", boardId, "columns", columnId);
      const columnSnapshot = await getDoc(columnRef);
      
      if (!columnSnapshot.exists()) {
        throw new Error(`Column ${columnId} not found`);
      }
      
      const columnData = columnSnapshot.data();
      const wipLimit = columnData.wipLimit;
      
      // If no WIP limit is set, column is not at limit
      if (!wipLimit) {
        return false;
      }
      
      // Count active cards in the column
      const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
      const cardsQuery = query(cardsRef, where("archived", "==", false));
      const cardsSnapshot = await getDocs(cardsQuery);
      
      const cardCount = cardsSnapshot.size;
      
      return cardCount >= wipLimit;
    } catch (error) {
      console.error(`Error checking WIP limit for column ${columnId}:`, error);
      throw new Error(`Falha ao verificar limite WIP: ${error.message}`);
    }
  },
  
  /**
   * Get all cards from a column
   * @param {string} boardId - Board ID
   * @param {string} columnId - Column ID
   * @returns {Promise<Array>} - Array of cards
   */
  getColumnCards: async (boardId, columnId) => {
    try {
      console.log(`Getting cards for column ${columnId}`);
      
      // Get all cards from the column
      const cardsRef = collection(db, "boards", boardId, "columns", columnId, "cards");
      const cardsQuery = query(
        cardsRef, 
        where("archived", "==", false),
        orderBy("order")
      );
      const cardsSnapshot = await getDocs(cardsQuery);
      
      return cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting cards for column ${columnId}:`, error);
      throw new Error(`Falha ao obter cartões da coluna: ${error.message}`);
    }
  },

  /**
   * Get a column by title
   * @param {string} boardId - Board ID
   * @param {string} title - Column title
   * @returns {Promise<Object|null>} - Column data or null if not found
   */
  getColumnByTitle: async (boardId, title) => {
    try {
      console.log(`Getting column with title "${title}" in board ${boardId}`);
      
      const columnsRef = collection(db, "boards", boardId, "columns");
      const columnsQuery = query(columnsRef, where("title", "==", title), limit(1));
      const columnsSnapshot = await getDocs(columnsQuery);
      
      if (columnsSnapshot.empty) {
        return null;
      }
      
      const doc = columnsSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting column with title "${title}":`, error);
      throw new Error(`Falha ao buscar coluna por título: ${error.message}`);
    }
  }
};

export default columnService;