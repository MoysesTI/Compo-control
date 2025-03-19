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
     * @returns {Promise<Array>} - Array of columns
     */
    getColumns: async (boardId) => {
      try {
        console.log(`Fetching columns for board: ${boardId}`);
        const columnsRef = collection(db, "boards", boardId, "columns");
        const columnsQuery = query(columnsRef, orderBy("order"));
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
        throw error;
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: userId || boardSnap.data().createdBy || 'system'
          });
        }
        
        await batch.commit();
        console.log(`Default columns initialized for board: ${boardId}`);
      } catch (error) {
        console.error("Error initializing default columns:", error);
        throw error;
      }
    },
    
    /**
     * Add a column to a board
     * @param {string} boardId - Board ID
     * @param {string} title - Column title
     * @param {string} userId - User ID
     * @returns {Promise<string>} - New column ID
     */
    addColumn: async (boardId, title, userId) => {
      try {
        console.log(`Adding column "${title}" to board: ${boardId}`);
        const columnsRef = collection(db, "boards", boardId, "columns");
        
        // Get current column count for order
        const columnsSnapshot = await getDocs(columnsRef);
        const order = columnsSnapshot.size;
        
        const newColumnRef = await addDoc(columnsRef, {
          title,
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        });
        
        console.log(`Column added with ID: ${newColumnRef.id}`);
        return newColumnRef.id;
      } catch (error) {
        console.error("Error adding column:", error);
        throw error;
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
        throw error;
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
        
        cardsSnapshot.docs.forEach(cardDoc => {
          const cardRef = doc(db, "boards", boardId, "columns", columnId, "cards", cardDoc.id);
          batch.delete(cardRef);
        });
        
        // Delete the column itself
        const columnRef = doc(db, "boards", boardId, "columns", columnId);
        batch.delete(columnRef);
        
        await batch.commit();
        console.log(`Column ${columnId} and its cards deleted successfully`);
        
        // Reorder remaining columns
        await columnService.reorderColumns(boardId);
      } catch (error) {
        console.error("Error deleting column:", error);
        throw error;
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
        const columnsQuery = query(columnsRef, orderBy("order"));
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
        throw error;
      }
    }
  };
  
  export default columnService;