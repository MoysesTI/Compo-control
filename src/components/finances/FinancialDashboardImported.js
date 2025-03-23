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
  LineChart,
  Line
} from 'recharts';
import Papa from 'papaparse';

const FinancialDashboardImported = () => {
  const [data, setData] = useState([]);
  const [periodData, setPeriodData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalOrcamentos: 0,
    totalNotas: 0,
    totalAprovados: 0,
    totalPagos: 0,
    valorOrcamentos: 0,
    valorNotas: 0,
    taxaAprovacao: 0,
    taxaConversao: 0
  });

  // Simular carregamento de arquivo CSV
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Em um ambiente real, você usaria:
        // const response = await window.fs.readFile('dados_financeiros.csv', { encoding: 'utf8' });
        
        // Para demonstração, vamos usar um arquivo simulado
        const response = await fetch('/api/financial-data');
        const csvContent = await response.text();
        
        Papa.parse(csvContent, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.data) {
              const validData = results.data.filter(item => item.data && item.valor);
              setData(validData);
              processData(validData);
            }
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Erro ao processar CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };

    // Função para processar dados do CSV
    const processData = (data) => {
      // Calcular dados por período (mês ou trimestre)
      const byPeriod = {};
      const byService = {};
      const byStatus = {};
      
      let totalOrcamentos = 0;
      let totalNotas = 0;
      let totalAprovados = 0;
      let totalPagos = 0;
      let valorOrcamentos = 0;
      let valorNotas = 0;
      
      data.forEach(item => {
        // Processar por período
        const key = `${item.ano}-${item.mes.toString().padStart(2, '0')}`;
        if (!byPeriod[key]) {
          byPeriod[key] = {
            name: getPeriodName(item.mes, item.ano),
            orcamentos: 0,
            notas: 0,
            margem: 0
          };
        }
        
        // Processar por tipo de serviço
        if (!byService[item.servico]) {
          byService[item.servico] = {
            name: item.servico,
            value: 0
          };
        }
        
        // Processar por status
        if (!byStatus[item.status]) {
          byStatus[item.status] = {
            name: item.status,
            value: 0
          };
        }
        
        // Incrementar contadores
        if (item.tipo === 'orcamento') {
          byPeriod[key].orcamentos += item.valor;
          byService[item.servico].value += item.valor;
          byStatus[item.status].value += 1;
          
          totalOrcamentos++;
          valorOrcamentos += item.valor;
          
          if (item.status === 'Aprovado' || item.status === 'Faturado') {
            totalAprovados++;
          }
        } else if (item.tipo === 'notaFiscal') {
          byPeriod[key].notas += item.valor;
          
          totalNotas++;
          valorNotas += item.valor;
          
          if (item.status === 'Paga') {
            totalPagos++;
          }
        }
        
        // Calcular margem (simulação simples)
        byPeriod[key].margem = byPeriod[key].notas - (byPeriod[key].orcamentos * 0.7);
      });
      
      // Converter para arrays
      const periodArray = Object.values(byPeriod).sort((a, b) => {
        const aKey = a.name.split('/');
        const bKey = b.name.split('/');
        
        if (aKey[1] !== bKey[1]) return aKey[1] - bKey[1];
        return aKey[0] - bKey[0];
      });
      
      const serviceArray = Object.values(byService)
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
        
      const statusArray = Object.values(byStatus)
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
      
      // Definir dados processados
      setPeriodData(periodArray);
      setServiceData(serviceArray);
      setStatusData(statusArray);
      
      // Calcular métricas de resumo
      const taxaAprovacao = totalOrcamentos > 0 ? (totalAprovados / totalOrcamentos) * 100 : 0;
      const taxaConversao = totalAprovados > 0 ? (totalNotas / totalAprovados) * 100 : 0;
      
      setSummary({
        totalOrcamentos,
        totalNotas,
        totalAprovados,
        totalPagos,
        valorOrcamentos,
        valorNotas,
        taxaAprovacao,
        taxaConversao
      });
    };
    
    fetchData();
  }, []);

  // Funções auxiliares
  const getPeriodName = (month, year) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[month-1]}/${year}`;
  };
  
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
  
  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#48C9B0', '#EC7063'];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Dashboard Financeiro (Dados Importados)</h2>
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
            <div className="w-12 h-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Processando dados importados...</p>
          </div>
        ) : (
          <>
            {/* Resumo dos principais indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.taxaAprovacao.toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-1 bg-blue-600 rounded-full" 
                    style={{width: `${summary.taxaAprovacao}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {summary.taxaConversao.toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-1 bg-cyan-600 rounded-full" 
                    style={{width: `${summary.taxaConversao}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Valor Total (Orçamentos)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(summary.valorOrcamentos)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalOrcamentos} orçamentos no período
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Valor Total (Notas)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.valorNotas)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalNotas} notas no período
                </p>
              </div>
            </div>
            
            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              {/* Gráfico de barras - Comparação mensal */}
              <div className="md:col-span-8">
                <h3 className="text-md font-medium mb-2 text-gray-700">
                  Comparativo Financeiro
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={periodData}
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
                        data={serviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Segunda linha de gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Gráfico de linha - Tendência temporal */}
              <div className="md:col-span-8">
                <h3 className="text-md font-medium mb-2 text-gray-700">
                  Evolução Financeira
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={periodData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="orcamentos" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="notas" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="margem" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Gráfico de pizza - Status */}
              <div className="md:col-span-4">
                <h3 className="text-md font-medium mb-2 text-gray-700">
                  Status dos Orçamentos
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboardImported;