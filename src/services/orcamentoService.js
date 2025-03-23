// src/services/orcamentoService.js

import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    writeBatch 
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  import { OrcamentoStatus, createOrcamento, updateOrcamento, deleteOrcamento, 
           approveOrcamento, rejectOrcamento, faturarOrcamento } from '../models/OrcamentoModel';
  
  const orcamentoService = {
    /**
     * Obter todos os orçamentos
     * @param {Object} filters - Filtros opcionais (status, cliente, etc.)
     * @param {string} sortField - Campo para ordenação
     * @param {string} sortDirection - Direção da ordenação ('asc' ou 'desc')
     * @returns {Promise<Array>} - Lista de orçamentos
     */
    getOrcamentos: async (filters = {}, sortField = 'dataCriacao', sortDirection = 'desc') => {
      try {
        console.log('Buscando orçamentos com filtros:', filters);
        
        // Construir query base
        const orcamentosRef = collection(db, 'orcamentos');
        let queryConstraints = [];
        
        // Vamos usar os índices de forma eficiente de acordo com a consulta
        
        // Otimização para uso de índices compostos (status + dataCriacao)
        if (filters.status && !filters.cliente && !filters.servico && !filters.userId && 
            (sortField === 'dataCriacao' || !filters.status)) {
          queryConstraints.push(where('status', '==', filters.status));
          
          // Usar o índice composto status + dataCriacao
          // Se não houver filtros adicionais, podemos usar o índice composto diretamente
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('dataCriacao', 'desc'));
            
            // Limitar resultados se especificado
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(orcamentosRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const orcamentos = [];
            querySnapshot.forEach((doc) => {
              orcamentos.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontrados ${orcamentos.length} orçamentos usando índice status+dataCriacao`);
            return orcamentos;
          }
        }
        
        // Otimização para uso de índices compostos (cliente + valorTotal)
        if (filters.cliente && !filters.status && !filters.servico && !filters.userId && 
            (sortField === 'valorTotal' || !sortField)) {
          // Usar busca por prefixo para o cliente (case-insensitive)
          const clienteLower = filters.cliente.toLowerCase();
          queryConstraints.push(where('clienteLowerCase', '>=', clienteLower));
          queryConstraints.push(where('clienteLowerCase', '<=', clienteLower + '\uf8ff'));
          
          // Usar o índice composto cliente + valorTotal
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('valorTotal', 'desc'));
            
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(orcamentosRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const orcamentos = [];
            querySnapshot.forEach((doc) => {
              orcamentos.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontrados ${orcamentos.length} orçamentos usando índice cliente+valorTotal`);
            return orcamentos;
          }
        }
        
        // Otimização para uso de índices compostos (servico + dataCriacao)
        if (filters.servico && !filters.status && !filters.cliente && !filters.userId) {
          queryConstraints.push(where('servico', '==', filters.servico));
          
          // Usar o índice composto servico + dataCriacao
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('dataCriacao', 'desc'));
            
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(orcamentosRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const orcamentos = [];
            querySnapshot.forEach((doc) => {
              orcamentos.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontrados ${orcamentos.length} orçamentos usando índice servico+dataCriacao`);
            return orcamentos;
          }
        }
        
        // Otimização para uso de índices compostos (userId + dataCriacao)
        if (filters.userId && !filters.status && !filters.cliente && !filters.servico) {
          queryConstraints.push(where('userId', '==', filters.userId));
          
          // Usar o índice composto userId + dataCriacao
          if (!filters.minValor && !filters.maxValor && !filters.dataInicio && !filters.dataFim) {
            queryConstraints.push(orderBy('dataCriacao', 'desc'));
            
            if (filters.limit) {
              queryConstraints.push(limit(parseInt(filters.limit)));
            }
            
            const q = query(orcamentosRef, ...queryConstraints);
            const querySnapshot = await getDocs(q);
            
            const orcamentos = [];
            querySnapshot.forEach((doc) => {
              orcamentos.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            console.log(`Encontrados ${orcamentos.length} orçamentos usando índice userId+dataCriacao`);
            return orcamentos;
          }
        }
        
        // Fallback para consultas genéricas (quando não conseguimos usar os índices compostos)
        // Adicionar filtros se existirem
        if (filters.status) {
          queryConstraints.push(where('status', '==', filters.status));
        }
        
        if (filters.cliente) {
          // Filtro case-insensitive usando startsWith e endsWith
          const clienteLower = filters.cliente.toLowerCase();
          queryConstraints.push(where('clienteLowerCase', '>=', clienteLower));
          queryConstraints.push(where('clienteLowerCase', '<=', clienteLower + '\uf8ff'));
        }
        
        if (filters.servico) {
          queryConstraints.push(where('servico', '==', filters.servico));
        }
        
        if (filters.userId) {
          queryConstraints.push(where('userId', '==', filters.userId));
        }
        
        if (filters.minValor) {
          queryConstraints.push(where('valorTotal', '>=', parseFloat(filters.minValor)));
        }
        
        if (filters.maxValor) {
          queryConstraints.push(where('valorTotal', '<=', parseFloat(filters.maxValor)));
        }
        
        if (filters.dataInicio) {
          const startDate = new Date(filters.dataInicio);
          startDate.setHours(0, 0, 0, 0);
          queryConstraints.push(where('dataCriacao', '>=', startDate));
        }
        
        if (filters.dataFim) {
          const endDate = new Date(filters.dataFim);
          endDate.setHours(23, 59, 59, 999);
          queryConstraints.push(where('dataCriacao', '<=', endDate));
        }
        
        // Adicionar ordenação
        queryConstraints.push(orderBy(sortField, sortDirection));
        
        // Limitar resultados se especificado
        if (filters.limit) {
          queryConstraints.push(limit(parseInt(filters.limit)));
        }
        
        // Executar a query
        const q = query(orcamentosRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        
        // Processar resultados
        const orcamentos = [];
        querySnapshot.forEach((doc) => {
          orcamentos.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Encontrados ${orcamentos.length} orçamentos (consulta genérica)`);
        return orcamentos;
      } catch (error) {
        console.error('Erro ao buscar orçamentos:', error);
        throw new Error(`Falha ao buscar orçamentos: ${error.message}`);
      }
    },
    
    /**
     * Obter um orçamento específico
     * @param {string} orcamentoId - ID do orçamento
     * @returns {Promise<Object>} - Dados do orçamento
     */
    getOrcamento: async (orcamentoId) => {
      try {
        console.log(`Buscando orçamento: ${orcamentoId}`);
        
        const orcamentoRef = doc(db, 'orcamentos', orcamentoId);
        const orcamentoSnap = await getDoc(orcamentoRef);
        
        if (!orcamentoSnap.exists()) {
          console.error(`Orçamento ${orcamentoId} não encontrado`);
          throw new Error('Orçamento não encontrado');
        }
        
        return {
          id: orcamentoSnap.id,
          ...orcamentoSnap.data()
        };
      } catch (error) {
        console.error(`Erro ao buscar orçamento ${orcamentoId}:`, error);
        throw new Error(`Falha ao buscar orçamento: ${error.message}`);
      }
    },
    
    /**
     * Obter resumo de orçamentos por status
     * @returns {Promise<Object>} - Contagem por status
     */
    getOrcamentosSummary: async () => {
      try {
        console.log('Gerando resumo de orçamentos');
        
        const orcamentosRef = collection(db, 'orcamentos');
        const snapshot = await getDocs(orcamentosRef);
        
        const summary = {
          total: 0,
          pendentes: 0,
          aprovados: 0,
          rejeitados: 0,
          faturados: 0,
          valorTotal: 0,
          valorAprovado: 0,
          valorFaturado: 0
        };
        
        snapshot.forEach((doc) => {
          const orcamento = doc.data();
          summary.total++;
          
          // Incrementar contagem por status
          switch (orcamento.status) {
            case OrcamentoStatus.PENDENTE:
              summary.pendentes++;
              break;
            case OrcamentoStatus.APROVADO:
              summary.aprovados++;
              summary.valorAprovado += orcamento.valorTotal || 0;
              break;
            case OrcamentoStatus.REJEITADO:
              summary.rejeitados++;
              break;
            case OrcamentoStatus.FATURADO:
              summary.faturados++;
              summary.valorFaturado += orcamento.valorTotal || 0;
              break;
          }
          
          // Somar valor total
          summary.valorTotal += orcamento.valorTotal || 0;
        });
        
        console.log('Resumo gerado:', summary);
        return summary;
      } catch (error) {
        console.error('Erro ao gerar resumo de orçamentos:', error);
        throw new Error(`Falha ao gerar resumo: ${error.message}`);
      }
    },
    
    /**
     * Obter resumo por tipo de serviço
     * @returns {Promise<Array>} - Resumo por serviço
     */
    getServicosSummary: async () => {
      try {
        console.log('Gerando resumo por serviço');
        
        const orcamentosRef = collection(db, 'orcamentos');
        const snapshot = await getDocs(orcamentosRef);
        
        const servicoMap = {};
        
        snapshot.forEach((doc) => {
          const orcamento = doc.data();
          const servico = orcamento.servico || 'Não especificado';
          
          if (!servicoMap[servico]) {
            servicoMap[servico] = {
              servico,
              quantidade: 0,
              valorTotal: 0,
              aprovados: 0,
              rejeitados: 0,
              pendentes: 0,
              faturados: 0
            };
          }
          
          servicoMap[servico].quantidade++;
          servicoMap[servico].valorTotal += orcamento.valorTotal || 0;
          
          // Incrementar contagem por status
          switch (orcamento.status) {
            case OrcamentoStatus.PENDENTE:
              servicoMap[servico].pendentes++;
              break;
            case OrcamentoStatus.APROVADO:
              servicoMap[servico].aprovados++;
              break;
            case OrcamentoStatus.REJEITADO:
              servicoMap[servico].rejeitados++;
              break;
            case OrcamentoStatus.FATURADO:
              servicoMap[servico].faturados++;
              break;
          }
        });
        
        // Converter mapa para array
        const servicosSummary = Object.values(servicoMap);
        
        // Ordenar por quantidade (decrescente)
        servicosSummary.sort((a, b) => b.valorTotal - a.valorTotal);
        
        console.log('Resumo por serviço gerado:', servicosSummary);
        return servicosSummary;
      } catch (error) {
        console.error('Erro ao gerar resumo por serviço:', error);
        throw new Error(`Falha ao gerar resumo por serviço: ${error.message}`);
      }
    },
    
    /**
     * Obter resumo por cliente
     * @returns {Promise<Array>} - Resumo por cliente
     */
    getClientesSummary: async () => {
      try {
        console.log('Gerando resumo por cliente');
        
        const orcamentosRef = collection(db, 'orcamentos');
        const snapshot = await getDocs(orcamentosRef);
        
        const clienteMap = {};
        
        snapshot.forEach((doc) => {
          const orcamento = doc.data();
          const cliente = orcamento.cliente || 'Não especificado';
          
          if (!clienteMap[cliente]) {
            clienteMap[cliente] = {
              cliente,
              quantidade: 0,
              valorTotal: 0,
              aprovados: 0,
              rejeitados: 0,
              pendentes: 0,
              faturados: 0
            };
          }
          
          clienteMap[cliente].quantidade++;
          clienteMap[cliente].valorTotal += orcamento.valorTotal || 0;
          
          // Incrementar contagem por status
          switch (orcamento.status) {
            case OrcamentoStatus.PENDENTE:
              clienteMap[cliente].pendentes++;
              break;
            case OrcamentoStatus.APROVADO:
              clienteMap[cliente].aprovados++;
              break;
            case OrcamentoStatus.REJEITADO:
              clienteMap[cliente].rejeitados++;
              break;
            case OrcamentoStatus.FATURADO:
              clienteMap[cliente].faturados++;
              break;
          }
        });
        
        // Converter mapa para array
        const clientesSummary = Object.values(clienteMap);
        
        // Ordenar por valor total (decrescente)
        clientesSummary.sort((a, b) => b.valorTotal - a.valorTotal);
        
        console.log('Resumo por cliente gerado:', clientesSummary);
        return clientesSummary;
      } catch (error) {
        console.error('Erro ao gerar resumo por cliente:', error);
        throw new Error(`Falha ao gerar resumo por cliente: ${error.message}`);
      }
    },
    
    // Re-exportar funções do modelo
    createOrcamento,
    updateOrcamento,
    deleteOrcamento,
    approveOrcamento,
    rejectOrcamento,
    faturarOrcamento,
    OrcamentoStatus
  };
  
  export default orcamentoService;