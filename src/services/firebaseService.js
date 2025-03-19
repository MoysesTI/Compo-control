// src/services/firebaseService.js
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
         query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

/**
 * Serviço centralizado para operações do Firebase
 * Implementa padrões consistentes e tratamento de erros
 */
export const firebaseService = {
  // Função genérica para obter documento com tratamento de erros
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.warn(`Documento não encontrado: ${collectionName}/${docId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao obter documento ${collectionName}/${docId}:`, error);
      throw new Error(`Falha ao obter dados: ${error.message}`);
    }
  },

  // Função para obter coleção com query builder flexível
  async getCollection(collectionName, queryConstraints = []) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      console.error(`Erro ao obter coleção ${collectionName}:`, error);
      throw new Error(`Falha ao obter dados: ${error.message}`);
    }
  },

  // Função para criar ou atualizar documento com validação
  async setDocument(collectionName, docId, data, options = { merge: true }) {
    if (!data) {
      throw new Error('Dados inválidos para salvar no Firestore');
    }

    try {
      // Adiciona metadados para auditoria
      const enhancedData = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      // Se for um novo documento, adiciona createdAt
      if (!options.merge) {
        enhancedData.createdAt = serverTimestamp();
      }

      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, enhancedData, options);
      
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Erro ao salvar documento ${collectionName}/${docId}:`, error);
      throw new Error(`Falha ao salvar dados: ${error.message}`);
    }
  },

  // Função para atualizar campos específicos
  async updateDocument(collectionName, docId, data) {
    if (!data) {
      throw new Error('Dados inválidos para atualizar no Firestore');
    }

    try {
      const enhancedData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, enhancedData);
      
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Erro ao atualizar documento ${collectionName}/${docId}:`, error);
      throw new Error(`Falha ao atualizar dados: ${error.message}`);
    }
  },

  // Função para excluir documento com validação
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir documento ${collectionName}/${docId}:`, error);
      throw new Error(`Falha ao excluir dados: ${error.message}`);
    }
  },

  // Função para escutar mudanças em tempo real (importante para Kanban)
  subscribeToCollection(collectionName, queryConstraints = [], callback) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        
        callback(documents);
      }, (error) => {
        console.error(`Erro na assinatura de ${collectionName}:`, error);
        throw new Error(`Falha na assinatura: ${error.message}`);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Erro ao configurar assinatura para ${collectionName}:`, error);
      throw new Error(`Falha ao configurar assinatura: ${error.message}`);
    }
  },

  // Transações para operações atômicas (importante para arrastar e soltar)
  // Adicionar conforme necessário
};


export default firebaseService;