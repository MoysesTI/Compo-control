// src/models/OrcamentoModel.js

import { collection, addDoc, updateDoc, deleteDoc, doc,getDoc,   serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const OrcamentoStatus = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  FATURADO: 'Faturado'
};

export const createOrcamento = async (orcamentoData) => {
  try {
    // Preparar cliente para busca case-insensitive
    const clienteLowerCase = orcamentoData.cliente ? orcamentoData.cliente.toLowerCase() : '';
    
    // Calcular o valor total baseado nos itens
    const valorTotal = calcularValorTotal(orcamentoData.itens || []);
    
    // Armazenar o primeiro item como resumo para facilitar visualização em listagens
    const primeiroItem = orcamentoData.itens && orcamentoData.itens.length > 0 
      ? orcamentoData.itens[0].descricao 
      : '';
    
    // Criar um campo de pesquisa combinando os campos relevantes
    // Isso facilita pesquisas de texto completo no futuro
    const searchField = [
      orcamentoData.cliente || '',
      orcamentoData.servico || '',
      primeiroItem,
      orcamentoData.descricao || ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    const orcamentoWithTimestamps = {
      ...orcamentoData,
      status: orcamentoData.status || OrcamentoStatus.PENDENTE,
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      valorTotal,
      clienteLowerCase,
      primeiroItem,
      searchField
    };

    const docRef = await addDoc(collection(db, 'orcamentos'), orcamentoWithTimestamps);
    return { id: docRef.id, ...orcamentoWithTimestamps };
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }
};

export const updateOrcamento = async (orcamentoId, updatedData) => {
  try {
    // Recalcular o valor total se os itens forem atualizados
    let dataToUpdate = { ...updatedData };
    
    // Atualizar campos derivados para manter consistência com os índices
    let fieldsToUpdate = {};
    
    // Atualizar cliente e clienteLowerCase
    if (updatedData.cliente !== undefined) {
      fieldsToUpdate.cliente = updatedData.cliente;
      fieldsToUpdate.clienteLowerCase = updatedData.cliente.toLowerCase();
    }
    
    // Recalcular valor total se os itens foram atualizados
    if (updatedData.itens) {
      fieldsToUpdate.valorTotal = calcularValorTotal(updatedData.itens);
      
      // Atualizar o primeiro item para resumo
      if (updatedData.itens.length > 0) {
        fieldsToUpdate.primeiroItem = updatedData.itens[0].descricao;
      }
    }
    
    // Atualizar o campo de pesquisa se algum dos campos relevantes foi alterado
    if (updatedData.cliente !== undefined || 
        updatedData.servico !== undefined || 
        updatedData.descricao !== undefined || 
        updatedData.itens) {
      
      // Precisamos obter o documento atual para mesclá-lo com as atualizações
      const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
      const orcamentoSnap = await getDoc(orcamentoRef);
      
      if (orcamentoSnap.exists()) {
        const orcamentoActual = orcamentoSnap.data();
        
        // Mesclar dados atuais com as atualizações
        const mergedData = {
          ...orcamentoActual,
          ...updatedData,
          ...fieldsToUpdate
        };
        
        // Reconstruir o campo de pesquisa
        fieldsToUpdate.searchField = [
          mergedData.cliente || '',
          mergedData.servico || '',
          mergedData.primeiroItem || '',
          mergedData.descricao || ''
        ].filter(Boolean).join(' ').toLowerCase();
      }
    }
    
    // Mesclar dados de atualização com campos derivados
    const finalData = {
      ...dataToUpdate,
      ...fieldsToUpdate,
      dataAtualizacao: serverTimestamp()
    };
    
    const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
    await updateDoc(orcamentoRef, finalData);
    
    return { 
      id: orcamentoId, 
      ...updatedData,
      ...fieldsToUpdate
    };
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    throw error;
  }
};

export const deleteOrcamento = async (orcamentoId) => {
  try {
    const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
    await deleteDoc(orcamentoRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    throw error;
  }
};

export const approveOrcamento = async (orcamentoId) => {
  try {
    const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
    await updateDoc(orcamentoRef, {
      status: OrcamentoStatus.APROVADO,
      dataAprovacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    throw error;
  }
};

export const rejectOrcamento = async (orcamentoId, motivo) => {
  try {
    const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
    await updateDoc(orcamentoRef, {
      status: OrcamentoStatus.REJEITADO,
      motivoRejeicao: motivo || '',
      dataRejeicao: serverTimestamp(),
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao rejeitar orçamento:', error);
    throw error;
  }
};

export const faturarOrcamento = async (orcamentoId, dadosNota) => {
  try {
    const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
    await updateDoc(orcamentoRef, {
      status: OrcamentoStatus.FATURADO,
      dadosNota,
      dataFaturamento: serverTimestamp(),
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao faturar orçamento:', error);
    throw error;
  }
};

// Função para calcular o valor total dos itens do orçamento
export const calcularValorTotal = (itens = []) => {
  return itens.reduce((total, item) => {
    const valorItem = (item.quantidade || 0) * (item.valorUnitario || 0);
    return total + valorItem;
  }, 0);
};

// Função para criar um item de orçamento padrão (para adicionar ao orçamento)
export const criarItemOrcamento = () => {
  return {
    id: Date.now().toString(),
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
    valorTotal: 0
  };
};

// Obter dados formatados para front-end
export const formatOrcamento = (orcamento) => {
  if (!orcamento) return null;
  
  // Formatar datas se existirem
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    if (timestamp.toDate) { // Se for timestamp do Firestore
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return {
    ...orcamento,
    dataFormatada: formatDate(orcamento.dataCriacao),
    dataAprovacaoFormatada: formatDate(orcamento.dataAprovacao),
    dataRejeicaoFormatada: formatDate(orcamento.dataRejeicao),
    dataFaturamentoFormatada: formatDate(orcamento.dataFaturamento),
    // Garantir que valorTotal esteja formatado
    valorTotal: typeof orcamento.valorTotal === 'number' ? orcamento.valorTotal : 0
  };
};