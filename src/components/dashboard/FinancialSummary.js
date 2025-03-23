import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payments as PaymentsIcon,
  Receipt as ReceiptIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon
} from '@mui/icons-material';
import orcamentoService from '../../services/orcamentoService';
import notaFiscalService from '../../services/notaFiscalService';
import { Link } from 'react-router-dom';

// Componente para o Card de Resumo
const SummaryCard = ({ title, value, subtitle, icon, trend, color, isLoading = false }) => {
  return (
    <Card sx={{ 
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 'none',
      borderRadius: 2,
      '&:hover': {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        transform: 'translateY(-2px)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
      }
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            bgcolor: `${color}.100`, 
            borderRadius: '50%', 
            p: 1, 
            display: 'flex',
            mr: 1.5
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        {isLoading ? (
          <CircularProgress size={24} sx={{ my: 1 }} />
        ) : (
          <Typography variant="h5" fontWeight="bold" sx={{ my: 1 }}>
            {typeof value === 'number' && value.toString().includes('.') ? 
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
              value}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {trend && (
            <Chip 
              icon={trend > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />} 
              label={`${Math.abs(trend)}%`} 
              size="small"
              color={trend > 0 ? 'success' : 'error'}
              sx={{ mr: 1, height: 24 }}
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente principal
const FinancialSummary = () => {
  const [orcamentosSummary, setOrcamentosSummary] = useState(null);
  const [notasFiscaisSummary, setNotasFiscaisSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar dados de orçamentos e notas fiscais em paralelo
        const [orcData, nfData] = await Promise.all([
          orcamentoService.getOrcamentosSummary(),
          notaFiscalService.getNotasFiscaisSummary()
        ]);
        
        setOrcamentosSummary(orcData);
        setNotasFiscaisSummary(nfData);
      } catch (err) {
        console.error("Erro ao buscar dados financeiros:", err);
        setError(`Falha ao carregar resumo financeiro: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calcular taxa de conversão orçamentos -> notas fiscais
  const getTaxaConversao = () => {
    if (!orcamentosSummary || !orcamentosSummary.total) return 0;
    
    return ((orcamentosSummary.faturados / orcamentosSummary.total) * 100).toFixed(1);
  };

  // Calcular taxa de pagamento de notas fiscais
  const getTaxaPagamento = () => {
    if (!notasFiscaisSummary || !notasFiscaisSummary.total) return 0;
    
    return ((notasFiscaisSummary.pagas / notasFiscaisSummary.total) * 100).toFixed(1);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Resumo Financeiro
        </Typography>
        <Box component={Link} to="/finances" sx={{ textDecoration: 'none' }}>
          <Chip 
            label="Ver Detalhes" 
            size="small" 
            color="primary" 
            variant="outlined" 
            clickable
          />
        </Box>
      </Box>
      
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {/* Valor total de orçamentos */}
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Orçamentos Aprovados"
              value={orcamentosSummary?.valorAprovado || 0}
              subtitle={`${orcamentosSummary?.aprovados || 0} orçamentos ativos`}
              icon={<AssignmentTurnedInIcon sx={{ color: 'success.main' }} />}
              color="success"
              isLoading={loading}
            />
          </Grid>
          
          {/* Valor a receber */}
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="A Receber"
              value={notasFiscaisSummary?.valorPendente || 0}
              subtitle={`${notasFiscaisSummary?.emitidas || 0} notas pendentes`}
              icon={<ReceiptIcon sx={{ color: 'warning.main' }} />}
              color="warning"
              isLoading={loading}
            />
          </Grid>
          
          {/* Valor recebido */}
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Recebido"
              value={notasFiscaisSummary?.valorPago || 0}
              subtitle={`${notasFiscaisSummary?.pagas || 0} notas pagas`}
              icon={<PaymentsIcon sx={{ color: 'info.main' }} />}
              color="info"
              isLoading={loading}
            />
          </Grid>
          
          {/* Taxa de conversão */}
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Taxa de Conversão"
              value={`${getTaxaConversao()}%`}
              subtitle="Orçamentos -> Faturados"
              icon={<TrendingUpIcon sx={{ color: 'primary.main' }} />}
              color="primary"
              isLoading={loading}
            />
          </Grid>
          
          {/* Métricas adicionais */}
          <Grid item xs={12}>
            <Card sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              borderRadius: 2
            }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Desempenho Financeiro
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Orçamentos */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Orçamentos Aprovados</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {orcamentosSummary?.aprovados || 0}/{orcamentosSummary?.total || 0}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={orcamentosSummary?.total ? 
                          (orcamentosSummary.aprovados / orcamentosSummary.total) * 100 : 0
                        }
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  {/* Notas Fiscais */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Notas Fiscais Pagas</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {notasFiscaisSummary?.pagas || 0}/{notasFiscaisSummary?.total || 0}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={notasFiscaisSummary?.total ? 
                          (notasFiscaisSummary.pagas / notasFiscaisSummary.total) * 100 : 0
                        }
                        color="success"
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FinancialSummary;