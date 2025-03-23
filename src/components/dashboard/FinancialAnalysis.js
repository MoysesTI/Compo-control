import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Dados de exemplo para demonstração
const mockFinancialData = {
  // Dados para gráfico de barras - Comparação mensal
  monthlyComparison: [
    { name: 'Jan', orcamentos: 12800, notas: 10500, margem: 4200 },
    { name: 'Fev', orcamentos: 9800, notas: 7800, margem: 3100 },
    { name: 'Mar', orcamentos: 14500, notas: 13200, margem: 5300 },
    { name: 'Abr', orcamentos: 10300, notas: 9100, margem: 3600 },
    { name: 'Mai', orcamentos: 11500, notas: 10800, margem: 4300 },
    { name: 'Jun', orcamentos: 15800, notas: 14200, margem: 5700 }
  ],
  
  // Dados para gráfico de pizza - Tipos de serviço
  serviceTypes: [
    { name: 'Adesivação', value: 35 },
    { name: 'Banner', value: 25 },
    { name: 'Logo', value: 15 },
    { name: 'Placas', value: 18 },
    { name: 'Outros', value: 7 }
  ],
  
  // Dados para métricas de desempenho
  performance: {
    aprovacaoMedia: 72, // 72% dos orçamentos são aprovados
    diasRecebimento: 18.5, // Média de dias para receber pagamento
    valorMedioOrcamento: 1250, // Valor médio dos orçamentos
    novasOportunidades: 14 // Novos clientes no mês
  }
};

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

// Componente principal de análise financeira
const FinancialAnalysis = () => {
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simular carregamento de dados do Firebase
  useEffect(() => {
    setIsLoading(true);
    // Em um cenário real, você buscaria dados do Firebase aqui
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  }, [period]);
  
  const handleChangePeriod = (newPeriod) => {
    setPeriod(newPeriod);
  };
  
  // Formatador para valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Renderizar a análise financeira
  return (
    <div className="w-full mb-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Análise Financeira</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleChangePeriod('month')}
              className={`px-3 py-1 text-sm rounded-md ${period === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => handleChangePeriod('quarter')}
              className={`px-3 py-1 text-sm rounded-md ${period === 'quarter' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
            >
              Trimestre
            </button>
            <button 
              onClick={() => handleChangePeriod('year')}
              className={`px-3 py-1 text-sm rounded-md ${period === 'year' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
            >
              Ano
            </button>
          </div>
        </div>
        
        <div className="h-px w-full bg-gray-200 mb-6"></div>
        
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mb-4 relative overflow-hidden">
              <div className="absolute h-full bg-blue-500 animate-pulse" style={{width: '60%'}}></div>
            </div>
            <p className="text-gray-500 text-sm">Carregando dados financeiros...</p>
          </div>
        ) : (
          <>
            {/* Resumo dos principais indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockFinancialData.performance.aprovacaoMedia}%
                </p>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-1 bg-blue-600 rounded-full" 
                    style={{width: `${mockFinancialData.performance.aprovacaoMedia}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Dias para Recebimento</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {mockFinancialData.performance.diasRecebimento}
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  -2.3 dias vs. mês anterior
                </span>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Valor Médio (Orçamento)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(mockFinancialData.performance.valorMedioOrcamento)}
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  +8.5% vs. período anterior
                </span>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Novos Clientes</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockFinancialData.performance.novasOportunidades}
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Aumento de 22%
                </span>
              </div>
            </div>
            
            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Gráfico de barras - Comparação mensal */}
              <div className="md:col-span-8">
                <h3 className="text-md font-medium mb-2 text-gray-700">
                  Comparativo {period === 'month' ? 'Mensal' : period === 'quarter' ? 'Trimestral' : 'Anual'}
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockFinancialData.monthlyComparison}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="orcamentos" name="Orçamentos" fill="#8884d8" />
                      <Bar dataKey="notas" name="Notas Fiscais" fill="#82ca9d" />
                      <Bar dataKey="margem" name="Margem" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Gráfico de pizza - Tipos de serviço */}
              <div className="md:col-span-4">
                <h3 className="text-md font-medium mb-2 text-gray-700">
                  Distribuição por Serviço
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockFinancialData.serviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockFinancialData.serviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Nota sobre dados */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-xs">
                * Os dados são atualizados em tempo real com base nas transações registradas no sistema.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialAnalysis;