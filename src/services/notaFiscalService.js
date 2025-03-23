// src/services/notaFiscalService.js

import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  import { NotaFiscalStatus, createNotaFiscal, updateNotaFiscal, deleteNotaFiscal, 
           markNotaFiscalAsPaid, cancelNotaFiscal } from '../models/NotaFiscalModel';
  import orcamentoService from './orcamentoService';
  
  const notaFiscalService = {
    /**
     * Obter todas as notas fiscais
     * @param {Object} filters - Filtros opcionais (status, cliente, etc.)
     * @param {string} sortField - Campo para ordenação
     * @param {string} sortDirection - Direção da ordenação ('asc' ou 'desc')
     * @returns {Promise<Array>} - Lista de notas fiscais
     */
    getNotasFiscais: async (filters = {}, sortField = 'dataEmissao', sortDirection = 'desc') => {
      try {
        console.log('Buscando notas fiscais com filtros:', filters);
        
        // Construir query base
        const notasFiscaisRef = collection(db, 'notasFiscais');
        let queryConstraints = [];
        
        // Otimização para uso de índices compostos (status + dataEmissao)
        if (filters.status && !filters.cliente && !filters.orcamentoId && 
            (sortField === 'dataEmissao' || !sortField)) {
          queryConstraints.push(where('status', '==', filters.status));
          
          // Usar o índice composto status + dataEmissao
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('dataEmissao', 'desc'));
            
            // Limitar resultados se especificado
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(notasFiscaisRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const notasFiscais = [];
            querySnapshot.forEach((doc) => {
              notasFiscais.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontradas ${notasFiscais.length} notas fiscais usando índice status+dataEmissao`);
            return notasFiscais;
          }
        }
        
        // Otimização para uso de índices compostos (cliente + valor)
        if (filters.cliente && !filters.status && !filters.orcamentoId && 
            (sortField === 'valor' || !sortField)) {
          queryConstraints.push(where('cliente', '==', filters.cliente));
          
          // Usar o índice composto cliente + valor
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('valor', 'desc'));
            
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(notasFiscaisRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const notasFiscais = [];
            querySnapshot.forEach((doc) => {
              notasFiscais.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontradas ${notasFiscais.length} notas fiscais usando índice cliente+valor`);
            return notasFiscais;
          }
        }
        
        // Otimização para uso de índices compostos (orcamentoId + dataEmissao)
        if (filters.orcamentoId && !filters.status && !filters.cliente) {
          queryConstraints.push(where('orcamentoId', '==', filters.orcamentoId));
          
          // Usar o índice composto orcamentoId + dataEmissao
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('dataEmissao', 'desc'));
            
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(notasFiscaisRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const notasFiscais = [];
            querySnapshot.forEach((doc) => {
              notasFiscais.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontradas ${notasFiscais.length} notas fiscais usando índice orcamentoId+dataEmissao`);
            return notasFiscais;
          }
        }
        
        // Fallback para consultas genéricas
        // Adicionar filtros se existirem
        if (filters.status) {
          queryConstraints.push(where('status', '==', filters.status));
        }
        
        if (filters.cliente) {
          queryConstraints.push(where('cliente', '==', filters.cliente));
        }
        
        if (filters.orcamentoId) {
          queryConstraints.push(where('orcamentoId', '==', filters.orcamentoId));
        }
        
        if (filters.minValor) {
          queryConstraints.push(where('valor', '>=', parseFloat(filters.minValor)));
        }
        
        if (filters.maxValor) {
          queryConstraints.push(where('valor', '<=', parseFloat(filters.maxValor)));
        }
        
        if (filters.dataInicio) {
          const startDate = new Date(filters.dataInicio);
          startDate.setHours(0, 0, 0, 0);
          queryConstraints.push(where('dataEmissao', '>=', startDate));
        }
        
        if (filters.dataFim) {
          const endDate = new Date(filters.dataFim);
          endDate.setHours(23, 59, 59, 999);
          queryConstraints.push(where('dataEmissao', '<=', endDate));
        }
        
        // Adicionar ordenação
        queryConstraints.push(orderBy(sortField, sortDirection));
        
        // Limitar resultados se especificado
        if (filters.limit) {
          queryConstraints.push(limit(parseInt(filters.limit)));
        }
        
        // Executar a query
        const q = query(notasFiscaisRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        
        // Processar resultados
        const notasFiscais = [];
        querySnapshot.forEach((doc) => {
          notasFiscais.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Encontradas ${notasFiscais.length} notas fiscais (consulta genérica)`);
        return notasFiscais;
      } catch (error) {
        console.error('Erro ao buscar notas fiscais:', error);
        throw new Error(`Falha ao buscar notas fiscais: ${error.message}`);
      }
    },
    
    /**
     * Obter uma nota fiscal específica
     * @param {string} notaFiscalId - ID da nota fiscal
     * @returns {Promise<Object>} - Dados da nota fiscal
     */
    getNotaFiscal: async (notaFiscalId) => {
      try {
        console.log(`Buscando nota fiscal: ${notaFiscalId}`);
        
        const notaFiscalRef = doc(db, 'notasFiscais', notaFiscalId);
        const notaFiscalSnap = await getDoc(notaFiscalRef);
        
        if (!notaFiscalSnap.exists()) {
          console.error(`Nota fiscal ${notaFiscalId} não encontrada`);
          throw new Error('Nota fiscal não encontrada');
        }
        
        return {
          id: notaFiscalSnap.id,
          ...notaFiscalSnap.data()
        };
      } catch (error) {
        console.error(`Erro ao buscar nota fiscal ${notaFiscalId}:`, error);
        throw new Error(`Falha ao buscar nota fiscal: ${error.message}`);
      }
    },
    
    /**
     * Criar nota fiscal a partir de um orçamento
     * @param {string} orcamentoId - ID do orçamento
     * @param {Object} dadosAdicionais - Dados adicionais para a nota fiscal
     * @returns {Promise<Object>} - Nota fiscal criada
     */
    criarNotaFiscalFromOrcamento: async (orcamentoId, dadosAdicionais = {}) => {
      try {
        console.log(`Criando nota fiscal para orçamento: ${orcamentoId}`);
        
        // Buscar dados do orçamento
        const orcamento = await orcamentoService.getOrcamento(orcamentoId);
        
        if (!orcamento) {
          throw new Error('Orçamento não encontrado');
        }
        
        if (orcamento.status !== orcamentoService.OrcamentoStatus.APROVADO) {
          throw new Error('Apenas orçamentos aprovados podem gerar notas fiscais');
        }
        
        // Preparar dados para nota fiscal
        const notaFiscalData = {
          orcamentoId: orcamentoId,
          cliente: orcamento.cliente,
          valor: orcamento.valorTotal,
          itens: orcamento.itens,
          servico: orcamento.servico,
          status: NotaFiscalStatus.EMITIDA,
          dataEmissao: serverTimestamp(),
          ...dadosAdicionais
        };
        
        // Criar nota fiscal
        const notaFiscal = await createNotaFiscal(notaFiscalData);
        
        // Atualizar status do orçamento
        await orcamentoService.faturarOrcamento(orcamentoId, {
          notaFiscalId: notaFiscal.id,
          dataEmissao: notaFiscal.dataEmissao
        });
        
        console.log(`Nota fiscal criada com ID: ${notaFiscal.id}`);
        return notaFiscal;
      } catch (error) {
        console.error('Erro ao criar nota fiscal a partir de orçamento:', error);
        throw new Error(`Falha ao criar nota fiscal: ${error.message}`);
      }
    },
    
    /**
     * Obter resumo de notas fiscais por status
     * @returns {Promise<Object>} - Resumo de notas fiscais
     */
    getNotasFiscaisSummary: async () => {
      try {
        console.log('Gerando resumo de notas fiscais');
        
        const notasFiscaisRef = collection(db, 'notasFiscais');
        const snapshot = await getDocs(notasFiscaisRef);
        
        const summary = {
          total: 0,
          emitidas: 0,
          pagas: 0,
          canceladas: 0,
          valorTotal: 0,
          valorPago: 0,
          valorPendente: 0
        };
        
        snapshot.forEach((doc) => {
          const notaFiscal = doc.data();
          summary.total++;
          
          // Incrementar contagem por status
          switch (notaFiscal.status) {
            case NotaFiscalStatus.EMITIDA:
              summary.emitidas++;
              summary.valorPendente += notaFiscal.valor || 0;
              break;
            case NotaFiscalStatus.PAGA:
              summary.pagas++;
              summary.valorPago += notaFiscal.valor || 0;
              break;
            case NotaFiscalStatus.CANCELADA:
              summary.canceladas++;
              break;
          }
          
          // Somar valor total (exceto canceladas)
          if (notaFiscal.status !== NotaFiscalStatus.CANCELADA) {
            summary.valorTotal += notaFiscal.valor || 0;
          }
        });
        
        console.log('Resumo gerado:', summary);
        return summary;
      } catch (error) {
        console.error('Erro ao gerar resumo de notas fiscais:', error);
        throw new Error(`Falha ao gerar resumo: ${error.message}`);
      }
    },
    
    // Re-exportar funções do modelo
    createNotaFiscal,
    updateNotaFiscal,
    deleteNotaFiscal,
    markNotaFiscalAsPaid,
    cancelNotaFiscal,
    NotaFiscalStatus
  };
  
  export default notaFiscalService;