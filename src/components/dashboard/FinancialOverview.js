import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

// Componente para resumo financeiro
const FinancialOverview = ({ period, onChangePeriod }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    orcamentos: {
      total: 0,
      pendentes: 0,
      aprovados: 0,
      faturados: 0,
      valorTotal: 0,
      valorAprovado: 0
    },
    notasFiscais: {
      total: 0,
      emitidas: 0,
      pagas: 0,
      valorTotal: 0,
      valorPago: 0
    }
  });
  
  // Funções para calcular datas de filtro
  const getDateRange = (periodType) => {
    const now = new Date();
    
    switch(periodType) {
      case 'day':
        return { 
          start: startOfDay(now), 
          end: endOfDay(now),
          label: 'Hoje'
        };
      case 'week':
        return { 
          start: startOfWeek(now, { weekStartsOn: 1 }), 
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: 'Esta Semana'
        };
      case 'month':
        return { 
          start: startOfMonth(now), 
          end: endOfMonth(now),
          label: 'Este Mês'
        };
      case 'year':
        return { 
          start: startOfYear(now), 
          end: endOfYear(now),
          label: 'Este Ano'
        };
      case 'last30days':
        return { 
          start: subDays(now, 30), 
          end: now,
          label: 'Últimos 30 dias'
        };
      default:
        return { 
          start: startOfMonth(now), 
          end: endOfMonth(now),
          label: 'Este Mês'
        };
    }
  };
  
  // Carregar dados financeiros com base no período selecionado
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange(period);
        
        // Consultar orçamentos no período
        const orcamentosRef = collection(db, 'orcamentos');
        const orcamentosQuery = query(
          orcamentosRef,
          where('dataCriacao', '>=', start),
          where('dataCriacao', '<=', end),
          orderBy('dataCriacao', 'desc')
        );
        
        const orcamentosSnapshot = await getDocs(orcamentosQuery);
        
        // Consultar notas fiscais no período
        const notasFiscaisRef = collection(db, 'notasFiscais');
        const notasFiscaisQuery = query(
          notasFiscaisRef,
          where('dataEmissao', '>=', start),
          where('dataEmissao', '<=', end),
          orderBy('dataEmissao', 'desc')
        );
        
        const notasFiscaisSnapshot = await getDocs(notasFiscaisQuery);
        
        // Processar dados de orçamentos
        let orcamentosTotal = 0;
        let orcamentosPendentes = 0;
        let orcamentosAprovados = 0;
        let orcamentosFaturados = 0;
        let orcamentosValorTotal = 0;
        let orcamentosValorAprovado = 0;
        
        orcamentosSnapshot.forEach(doc => {
          const orcamento = doc.data();
          orcamentosTotal++;
          orcamentosValorTotal += orcamento.valorTotal || 0;
          
          switch(orcamento.status) {
            case 'Pendente':
              orcamentosPendentes++;
              break;
            case 'Aprovado':
              orcamentosAprovados++;
              orcamentosValorAprovado += orcamento.valorTotal || 0;
              break;
            case 'Faturado':
              orcamentosFaturados++;
              break;
            default:
              break;
          }
        });
        
        // Processar dados de notas fiscais
        let notasTotal = 0;
        let notasEmitidas = 0;
        let notasPagas = 0;
        let notasValorTotal = 0;
        let notasValorPago = 0;
        
        notasFiscaisSnapshot.forEach(doc => {
          const notaFiscal = doc.data();
          notasTotal++;
          
          if (notaFiscal.status !== 'Cancelada') {
            notasValorTotal += notaFiscal.valor || 0;
          }
          
          switch(notaFiscal.status) {
            case 'Emitida':
              notasEmitidas++;
              break;
            case 'Paga':
              notasPagas++;
              notasValorPago += notaFiscal.valor || 0;
              break;
            default:
              break;
          }
        });
        
        // Atualizar estado com os dados processados
        setSummaryData({
          orcamentos: {
            total: orcamentosTotal,
            pendentes: orcamentosPendentes,
            aprovados: orcamentosAprovados,
            faturados: orcamentosFaturados,
            valorTotal: orcamentosValorTotal,
            valorAprovado: orcamentosValorAprovado
          },
          notasFiscais: {
            total: notasTotal,
            emitidas: notasEmitidas,
            pagas: notasPagas,
            valorTotal: notasValorTotal,
            valorPago: notasValorPago
          }
        });
        
      } catch (err) {
        console.error('Erro ao carregar dados financeiros:', err);
        setError('Erro ao carregar dados financeiros. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [period]);
  
  // Renderizar o resumo financeiro
  return (
    <div className="w-full mb-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Resumo Financeiro</h2>
          <div className="flex">
            <select
              value={period}
              onChange={(e) => onChangePeriod(e.target.value)}
              className="block px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="day">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="last30days">Últimos 30 dias</option>
              <option value="year">Este Ano</option>
            </select>
          </div>
        </div>
        
        <div className="h-px w-full bg-gray-200 mb-4"></div>
        
        {error ? (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Resumo de Orçamentos */}
            <div className="md:col-span-6">
              <h3 className="text-lg font-medium text-blue-700 mb-2">Orçamentos</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Total de Orçamentos:</p>
                  <p className="font-bold text-lg">
                    {summaryData.orcamentos.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total:</p>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summaryData.orcamentos.valorTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aprovados:</p>
                  <p className="font-bold text-lg text-green-600">
                    {summaryData.orcamentos.aprovados}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Aprovado:</p>
                  <p className="font-bold text-lg text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summaryData.orcamentos.valorAprovado)}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="mt-1 mb-1">
                    <p className="text-sm text-gray-600 mb-1">
                      Taxa de Aprovação: {summaryData.orcamentos.total ? 
                        Math.round((summaryData.orcamentos.aprovados / summaryData.orcamentos.total) * 100) : 0}%
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-600 rounded-full"
                        style={{width: `${summaryData.orcamentos.total ? 
                          (summaryData.orcamentos.aprovados / summaryData.orcamentos.total) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resumo de Notas Fiscais */}
            <div className="md:col-span-6">
              <h3 className="text-lg font-medium text-cyan-700 mb-2">Notas Fiscais</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Total de Notas:</p>
                  <p className="font-bold text-lg">
                    {summaryData.notasFiscais.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total:</p>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summaryData.notasFiscais.valorTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notas Pagas:</p>
                  <p className="font-bold text-lg text-green-600">
                    {summaryData.notasFiscais.pagas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Recebido:</p>
                  <p className="font-bold text-lg text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summaryData.notasFiscais.valorPago)}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="mt-1 mb-1">
                    <p className="text-sm text-gray-600 mb-1">
                      Taxa de Recebimento: {summaryData.notasFiscais.total ? 
                        Math.round((summaryData.notasFiscais.pagas / summaryData.notasFiscais.total) * 100) : 0}%
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-cyan-600 rounded-full"
                        style={{width: `${summaryData.notasFiscais.total ? 
                          (summaryData.notasFiscais.pagas / summaryData.notasFiscais.total) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resumo de Margem */}
            <div className="col-span-12">
              <div className="h-px w-full bg-gray-200 my-3"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    Margem {getDateRange(period).label}
                  </h3>
                  <p className="text-2xl font-bold text-purple-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(summaryData.notasFiscais.valorPago - (summaryData.orcamentos.valorTotal * 0.7))}
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor recebido menos custos estimados
                  </p>
                </div>
                <div className="mt-3 md:mt-0">
                  <a 
                    href="/finances?tab=2" 
                    className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Ver Relatórios
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="w-12 h-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialOverview;