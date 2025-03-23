/**
 * Utilitário para inicializar as coleções do módulo financeiro (orçamentos e notas fiscais)
 */

import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  writeBatch,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { OrcamentoStatus } from '../models/OrcamentoModel';
import { NotaFiscalStatus } from '../models/NotaFiscalModel';

/**
 * Verifica e cria as coleções necessárias para o módulo financeiro
 * @param {string} userId - ID do usuário administrador
 */
export const setupFinancesCollection = async (userId) => {
  try {
    console.log("Inicializando coleções do módulo financeiro...");
    
    // Verificar se já existem documentos nas coleções
    const orcamentosRef = collection(db, 'orcamentos');
    const orcamentosSnap = await getDocs(query(orcamentosRef, where('userId', '==', userId), limit(1)));
    
    const notasFiscaisRef = collection(db, 'notasFiscais');
    const notasFiscaisSnap = await getDocs(query(notasFiscaisRef, where('userId', '==', userId), limit(1)));
    
    // Se já existirem documentos, não precisamos criar exemplos
    if (!orcamentosSnap.empty || !notasFiscaisSnap.empty) {
      console.log("Coleções do módulo financeiro já foram inicializadas.");
      return;
    }
    
    // Criar orçamentos de exemplo
    const batch = writeBatch(db);
    
    // Orçamento 1 - Adesivação
    const orcamento1 = {
      cliente: 'Empresa ABC',
      clienteLowerCase: 'empresa abc',
      servico: 'Adesivação',
      descricao: 'Adesivação completa para frota de veículos',
      status: OrcamentoStatus.PENDENTE,
      valorTotal: 2500.00,
      itens: [
        {
          id: '1',
          descricao: 'Adesivo para lateral do veículo - 1.5m x 0.8m',
          quantidade: 10,
          valorUnitario: 150.00
        },
        {
          id: '2',
          descricao: 'Adesivo para capô - 0.8m x 0.6m',
          quantidade: 5,
          valorUnitario: 100.00
        },
        {
          id: '3',
          descricao: 'Aplicação',
          quantidade: 1,
          valorUnitario: 500.00
        }
      ],
      primeiroItem: 'Adesivo para lateral do veículo - 1.5m x 0.8m',
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias a partir de hoje
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      userId: userId,
      observacoes: 'Cliente solicitou orçamento com urgência'
    };
    
    // Orçamento 2 - Banner aprovado
    const orcamento2 = {
      cliente: 'Loja XYZ',
      clienteLowerCase: 'loja xyz',
      servico: 'Banner',
      descricao: 'Banners para campanha promocional',
      status: OrcamentoStatus.APROVADO,
      valorTotal: 1200.00,
      itens: [
        {
          id: '1',
          descricao: 'Banner em lona 440g - 3m x 1m',
          quantidade: 4,
          valorUnitario: 180.00
        },
        {
          id: '2',
          descricao: 'Banner em lona 440g - 2m x 1m',
          quantidade: 6,
          valorUnitario: 120.00
        },
        {
          id: '3',
          descricao: 'Acabamento com ilhós',
          quantidade: 10,
          valorUnitario: 15.00
        }
      ],
      primeiroItem: 'Banner em lona 440g - 3m x 1m',
      dataValidade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 dias a partir de hoje
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      dataAprovacao: serverTimestamp(),
      userId: userId,
      observacoes: 'Aprovado pelo cliente via email em 10/03/2023'
    };
    
    // Orçamento 3 - Logo já faturado
    const orcamento3 = {
      cliente: 'Restaurante Sabor',
      clienteLowerCase: 'restaurante sabor',
      servico: 'Logo',
      descricao: 'Criação de logotipo para restaurante',
      status: OrcamentoStatus.FATURADO,
      valorTotal: 1800.00,
      itens: [
        {
          id: '1',
          descricao: 'Criação de logotipo - pacote completo',
          quantidade: 1,
          valorUnitario: 1500.00
        },
        {
          id: '2',
          descricao: 'Arquivo fonte em vetor (AI, EPS)',
          quantidade: 1,
          valorUnitario: 300.00
        }
      ],
      primeiroItem: 'Criação de logotipo - pacote completo',
      dataValidade: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 dias atrás
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      dataAprovacao: serverTimestamp(),
      dataFaturamento: serverTimestamp(),
      userId: userId,
      observacoes: 'Cliente muito satisfeito com o resultado'
    };
    
    // Adicionar orçamentos ao batch
    const orcamento1Ref = doc(orcamentosRef);
    batch.set(orcamento1Ref, orcamento1);
    
    const orcamento2Ref = doc(orcamentosRef);
    batch.set(orcamento2Ref, orcamento2);
    
    const orcamento3Ref = doc(orcamentosRef);
    batch.set(orcamento3Ref, orcamento3);
    
    // Nota fiscal para o orçamento faturado
    const notaFiscal1 = {
      numero: 'NF-001',
      cliente: 'Restaurante Sabor',
      clienteLowerCase: 'restaurante sabor',
      orcamentoId: orcamento3Ref.id,
      valor: 1800.00,
      status: NotaFiscalStatus.PAGA,
      dataEmissao: serverTimestamp(),
      dataPagamento: serverTimestamp(),
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      userId: userId,
      metodoPagamento: 'Transferência',
      mesEmissao: new Date().getMonth() + 1,
      anoEmissao: new Date().getFullYear(),
      observacoes: 'Pagamento realizado no dia da emissão'
    };
    
    // Nota fiscal para o orçamento aprovado, mas ainda não paga
    const notaFiscal2 = {
      numero: 'NF-002',
      cliente: 'Loja XYZ',
      clienteLowerCase: 'loja xyz',
      orcamentoId: orcamento2Ref.id,
      valor: 1200.00,
      status: NotaFiscalStatus.EMITIDA,
      dataEmissao: serverTimestamp(),
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      userId: userId,
      metodoPagamento: 'Boleto',
      mesEmissao: new Date().getMonth() + 1,
      anoEmissao: new Date().getFullYear(),
      observacoes: 'Aguardando pagamento do cliente - vencimento em 15 dias'
    };
    
    // Adicionar notas fiscais ao batch
    const notaFiscal1Ref = doc(notasFiscaisRef);
    batch.set(notaFiscal1Ref, notaFiscal1);
    
    const notaFiscal2Ref = doc(notasFiscaisRef);
    batch.set(notaFiscal2Ref, notaFiscal2);
    
    // Atualizar links entre orçamentos e notas fiscais
    batch.update(orcamento3Ref, {
      notaFiscalId: notaFiscal1Ref.id
    });
    
    batch.update(orcamento2Ref, {
      notaFiscalId: notaFiscal2Ref.id
    });
    
    // Commit do batch
    await batch.commit();
    
    console.log("Coleções do módulo financeiro inicializadas com sucesso!");
    return {
      orcamentos: [orcamento1Ref.id, orcamento2Ref.id, orcamento3Ref.id],
      notasFiscais: [notaFiscal1Ref.id, notaFiscal2Ref.id]
    };
  } catch (error) {
    console.error("Erro ao inicializar coleções do módulo financeiro:", error);
    throw error;
  }
};

export default setupFinancesCollection;