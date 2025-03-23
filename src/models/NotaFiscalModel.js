// src/models/NotaFiscalModel.js

import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const NotaFiscalStatus = {
  EMITIDA: 'Emitida',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada'
};

export const createNotaFiscal = async (notaFiscalData) => {
  try {
    // Validar dados mínimos
    if (!notaFiscalData.orcamentoId) {
      throw new Error('ID do orçamento é obrigatório');
    }
    
    // Preparar cliente para busca case-insensitive
    const clienteLowerCase = notaFiscalData.cliente ? notaFiscalData.cliente.toLowerCase() : '';
    
    // Criar um campo de pesquisa combinando os campos relevantes
    const searchField = [
      notaFiscalData.numero || '',
      notaFiscalData.cliente || '',
      notaFiscalData.servico || '',
      notaFiscalData.orcamentoId || '',
      notaFiscalData.observacoes || ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Para otimização de relatórios, podemos extrair o mês e ano da emissão
    let mesEmissao, anoEmissao;
    if (notaFiscalData.dataEmissao) {
      const data = new Date(notaFiscalData.dataEmissao);
      mesEmissao = data.getMonth() + 1; // 1-12
      anoEmissao = data.getFullYear();
    } else {
      const agora = new Date();
      mesEmissao = agora.getMonth() + 1;
      anoEmissao = agora.getFullYear();
    }
    
    const notaWithTimestamps = {
      ...notaFiscalData,
      status: notaFiscalData.status || NotaFiscalStatus.EMITIDA,
      dataEmissao: notaFiscalData.dataEmissao || serverTimestamp(),
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      clienteLowerCase,
      searchField,
      mesEmissao,
      anoEmissao
    };

    const docRef = await addDoc(collection(db, 'notasFiscais'), notaWithTimestamps);
    return { id: docRef.id, ...notaWithTimestamps };
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    throw error;
  }
};

export const updateNotaFiscal = async (notaFiscalId, updatedData) => {
  try {
    const notaFiscalRef = doc(db, 'notasFiscais', notaFiscalId);
    const dataWithTimestamp = {
      ...updatedData,
      dataAtualizacao: serverTimestamp()
    };
    
    await updateDoc(notaFiscalRef, dataWithTimestamp);
    return { id: notaFiscalId, ...updatedData };
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    throw error;
  }
};

export const deleteNotaFiscal = async (notaFiscalId) => {
  try {
    const notaFiscalRef = doc(db, 'notasFiscais', notaFiscalId);
    await deleteDoc(notaFiscalRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    throw error;
  }
};

export const markNotaFiscalAsPaid = async (notaFiscalId, dadosPagamento) => {
  try {
    const notaFiscalRef = doc(db, 'notasFiscais', notaFiscalId);
    await updateDoc(notaFiscalRef, {
      status: NotaFiscalStatus.PAGA,
      dataPagamento: serverTimestamp(),
      metodoPagamento: dadosPagamento.metodoPagamento || '',
      numeroPagamento: dadosPagamento.numeroPagamento || '',
      observacoesPagamento: dadosPagamento.observacoes || '',
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao marcar nota fiscal como paga:', error);
    throw error;
  }
};

export const cancelNotaFiscal = async (notaFiscalId, motivoCancelamento) => {
  try {
    const notaFiscalRef = doc(db, 'notasFiscais', notaFiscalId);
    await updateDoc(notaFiscalRef, {
      status: NotaFiscalStatus.CANCELADA,
      dataCancelamento: serverTimestamp(),
      motivoCancelamento: motivoCancelamento || '',
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao cancelar nota fiscal:', error);
    throw error;
  }
};

// Função para formatar os dados da nota fiscal
export const formatNotaFiscal = (notaFiscal) => {
  if (!notaFiscal) return null;
  
  // Formatar datas se existirem
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    if (timestamp.toDate) { // Se for timestamp do Firestore
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return {
    ...notaFiscal,
    dataEmissaoFormatada: formatDate(notaFiscal.dataEmissao),
    dataPagamentoFormatada: formatDate(notaFiscal.dataPagamento),
    dataCancelamentoFormatada: formatDate(notaFiscal.dataCancelamento)
  };
};