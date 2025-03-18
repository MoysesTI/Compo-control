// src/services/cardService.js
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    getDoc
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  
  /**
   * Serviço para gerenciamento de cards
   */
  export const cardService = {
    /**
     * Busca todos os cards de um quadro específico
     * @param {string} boardId - ID do quadro
     */
    async getCardsByBoardId(boardId) {
      try {
        console.log(`Buscando cards para o quadro: ${boardId}`);
        
        if (!boardId) {
          console.error('boardId não fornecido para getCardsByBoardId');
          return [];
        }
        
        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where('boardId', '==', boardId));
        
        console.log('Executando query para buscar cards...');
        const querySnapshot = await getDocs(q);
        
        const cards = [];
        querySnapshot.forEach((doc) => {
          cards.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Encontrados ${cards.length} cards para o quadro ${boardId}`);
        return cards;
      } catch (error) {
        console.error('Erro ao buscar cards:', error);
        throw error;
      }
    },
    
    /**
     * Cria um novo card
     * @param {Object} cardData - Dados do card
     */
    async createCard(cardData) {
      try {
        console.log('Criando novo card com dados:', cardData);
        
        if (!cardData.boardId) {
          throw new Error('boardId é obrigatório para criar um card');
        }
        
        if (!cardData.columnId) {
          throw new Error('columnId é obrigatório para criar um card');
        }
        
        // Validar se o quadro existe
        const boardRef = doc(db, 'boards', cardData.boardId);
        const boardSnapshot = await getDoc(boardRef);
        
        if (!boardSnapshot.exists()) {
          throw new Error(`Quadro com ID ${cardData.boardId} não encontrado`);
        }
        
        // Adicionar timestamps e valores padrão
        const cardWithTimestamps = {
          ...cardData,
          attachments: cardData.attachments || 0,
          comments: cardData.comments || 0,
          progress: cardData.progress || 0,
          status: cardData.status || 'Pendente',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'cards'), cardWithTimestamps);
        console.log(`Card criado com ID: ${docRef.id}`);
        
        // Recuperar o card criado para garantir que temos os dados completos
        const newCardSnapshot = await getDoc(docRef);
        
        // Retornar o card com seu ID
        return {
          id: docRef.id,
          ...newCardSnapshot.data()
        };
      } catch (error) {
        console.error('Erro ao criar card:', error);
        throw error;
      }
    },
    
    /**
     * Atualiza um card existente
     * @param {string} cardId - ID do card
     * @param {Object} cardData - Novos dados do card
     */
    async updateCard(cardId, cardData) {
      try {
        console.log(`Atualizando card ${cardId} com dados:`, cardData);
        
        const cardRef = doc(db, 'cards', cardId);
        
        // Verificar se o card existe
        const cardSnapshot = await getDoc(cardRef);
        if (!cardSnapshot.exists()) {
          throw new Error(`Card com ID ${cardId} não encontrado`);
        }
        
        const updatedData = {
          ...cardData,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(cardRef, updatedData);
        console.log(`Card ${cardId} atualizado com sucesso`);
        
        // Recuperar o card atualizado
        const updatedCardSnapshot = await getDoc(cardRef);
        
        return {
          id: cardId,
          ...updatedCardSnapshot.data()
        };
      } catch (error) {
        console.error('Erro ao atualizar card:', error);
        throw error;
      }
    },
    
    /**
     * Exclui um card
     * @param {string} cardId - ID do card
     */
    async deleteCard(cardId) {
      try {
        console.log(`Excluindo card com ID: ${cardId}`);
        
        const cardRef = doc(db, 'cards', cardId);
        
        // Verificar se o card existe
        const cardSnapshot = await getDoc(cardRef);
        if (!cardSnapshot.exists()) {
          throw new Error(`Card com ID ${cardId} não encontrado`);
        }
        
        await deleteDoc(cardRef);
        console.log(`Card ${cardId} excluído com sucesso`);
        
        return true;
      } catch (error) {
        console.error('Erro ao excluir card:', error);
        throw error;
      }
    },
    
    /**
     * Move um card para outra coluna
     * @param {string} cardId - ID do card
     * @param {string} newColumnId - ID da nova coluna
     */
    async moveCard(cardId, newColumnId) {
      try {
        console.log(`Movendo card ${cardId} para coluna ${newColumnId}`);
        
        const cardRef = doc(db, 'cards', cardId);
        
        // Verificar se o card existe
        const cardSnapshot = await getDoc(cardRef);
        if (!cardSnapshot.exists()) {
          throw new Error(`Card com ID ${cardId} não encontrado`);
        }
        
        await updateDoc(cardRef, {
          columnId: newColumnId,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Card ${cardId} movido para coluna ${newColumnId} com sucesso`);
        return true;
      } catch (error) {
        console.error('Erro ao mover card:', error);
        throw error;
      }
    }
  };
  
  export default cardService;