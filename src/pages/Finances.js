import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import orcamentoService from '../services/orcamentoService';
import notaFiscalService from '../services/notaFiscalService';

// Importar o componente para importação de CSV/TXT
import CSVFinancialImporter from '../components/finances/CSVFinancialImporter';

// Componente para o formulário de orçamento
const OrcamentoForm = ({ open, onClose, onSave, initialData = null, isLoading }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    servico: '',
    descricao: '',
    dataValidade: '',
    itens: [],
    observacoes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Se tiver dados iniciais, preencher o formulário
      setFormData({
        cliente: initialData.cliente || '',
        servico: initialData.servico || '',
        descricao: initialData.descricao || '',
        dataValidade: initialData.dataValidade || '',
        itens: initialData.itens || [],
        observacoes: initialData.observacoes || ''
      });
    } else {
      // Se não tiver dados iniciais, resetar o formulário
      setFormData({
        cliente: '',
        servico: '',
        descricao: '',
        dataValidade: '',
        itens: [{
          id: Date.now().toString(),
          descricao: '',
          quantidade: 1,
          valorUnitario: 0
        }],
        observacoes: ''
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpar erro ao editar campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      descricao: '',
      quantidade: 1,
      valorUnitario: 0
    };
    setFormData({ ...formData, itens: [...formData.itens, newItem] });
  };

  const handleRemoveItem = (itemId) => {
    setFormData({ 
      ...formData, 
      itens: formData.itens.filter(item => item.id !== itemId) 
    });
  };

  const handleItemChange = (itemId, field, value) => {
    const updatedItens = formData.itens.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: field === 'descricao' ? value : Number(value) };
      }
      return item;
    });
    setFormData({ ...formData, itens: updatedItens });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cliente) newErrors.cliente = 'Cliente é obrigatório';
    if (!formData.servico) newErrors.servico = 'Serviço é obrigatório';
    
    // Validar itens
    if (formData.itens.length === 0) {
      newErrors.itens = 'Adicione pelo menos um item ao orçamento';
    } else {
      // Verificar se todos os itens têm descrição
      const hasEmptyDescription = formData.itens.some(item => !item.descricao.trim());
      if (hasEmptyDescription) {
        newErrors.itens = 'Todos os itens devem ter uma descrição';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Calcular valor total
      const valorTotal = formData.itens.reduce((total, item) => {
        return total + (item.quantidade * item.valorUnitario);
      }, 0);
      
      // Preparar objeto para salvar
      const dataToSave = {
        ...formData,
        valorTotal
      };
      
      onSave(dataToSave);
    }
  };

  const calcularValorItem = (item) => {
    return (item.quantidade || 0) * (item.valorUnitario || 0);
  };

  const calcularValorTotal = () => {
    return formData.itens.reduce((total, item) => {
      return total + calcularValorItem(item);
    }, 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Cliente"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.cliente}
              helperText={errors.cliente}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Serviço"
              name="servico"
              value={formData.servico}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.servico}
              helperText={errors.servico}
              select
            >
              <MenuItem value="Adesivação">Adesivação</MenuItem>
              <MenuItem value="Banner">Banner</MenuItem>
              <MenuItem value="Logo">Logo</MenuItem>
              <MenuItem value="Impressão Digital">Impressão Digital</MenuItem>
              <MenuItem value="Placas">Placas</MenuItem>
              <MenuItem value="Fachada">Fachada</MenuItem>
              <MenuItem value="Sinalização">Sinalização</MenuItem>
              <MenuItem value="Outros">Outros</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Data de Validade"
              name="dataValidade"
              type="date"
              value={formData.dataValidade}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Itens do Orçamento</Typography>
              <Button 
                startIcon={<AddIcon />} 
                variant="outlined" 
                onClick={handleAddItem}
                size="small"
              >
                Adicionar Item
              </Button>
            </Box>
            
            {errors.itens && (
              <Alert severity="error" sx={{ mb: 2 }}>{errors.itens}</Alert>
            )}
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right" width={100}>Qtd</TableCell>
                    <TableCell align="right" width={150}>Valor Unit.</TableCell>
                    <TableCell align="right" width={150}>Total</TableCell>
                    <TableCell align="center" width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TextField
                          value={item.descricao}
                          onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                          fullWidth
                          size="small"
                          placeholder="Descrição do item"
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)}
                          size="small"
                          inputProps={{ min: 1, style: { textAlign: 'right' } }}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.valorUnitario}
                          onChange={(e) => handleItemChange(item.id, 'valorUnitario', e.target.value)}
                          size="small"
                          inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="right">
                        R$ {calcularValorItem(item).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleRemoveItem(item.id)}
                          size="small"
                          color="error"
                          disabled={formData.itens.length === 1} // Não permitir remover o último item
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      Total do Orçamento:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      R$ {calcularValorTotal().toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Observações"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {initialData ? 'Atualizar' : 'Criar'} Orçamento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente para o formulário de nota fiscal
const NotaFiscalForm = ({ open, onClose, onSave, orcamentoId, isLoading }) => {
  const [formData, setFormData] = useState({
    numero: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    metodoPagamento: 'Transferência',
    observacoes: ''
  });
  const [errors, setErrors] = useState({});
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && orcamentoId) {
      setLoading(true);
      orcamentoService.getOrcamento(orcamentoId)
        .then(data => {
          setOrcamento(data);
          setFormData(prev => ({
            ...prev,
            cliente: data.cliente,
            servico: data.servico,
            valor: data.valorTotal,
            itens: data.itens
          }));
        })
        .catch(error => {
          console.error("Erro ao buscar dados do orçamento:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, orcamentoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpar erro ao editar campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.numero) newErrors.numero = 'Número da nota fiscal é obrigatório';
    if (!formData.dataEmissao) newErrors.dataEmissao = 'Data de emissão é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Preparar objeto para salvar
      const dataToSave = {
        ...formData,
        orcamentoId
      };
      
      onSave(dataToSave);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Gerar Nota Fiscal</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : orcamento ? (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Gerando nota fiscal para o orçamento #{orcamentoId} - {orcamento.cliente} - {orcamento.servico} - R$ {orcamento.valorTotal?.toFixed(2)}
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Número da Nota Fiscal"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.numero}
                helperText={errors.numero}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Data de Emissão"
                name="dataEmissao"
                type="date"
                value={formData.dataEmissao}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataEmissao}
                helperText={errors.dataEmissao}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Método de Pagamento"
                name="metodoPagamento"
                value={formData.metodoPagamento}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                <MenuItem value="Transferência">Transferência</MenuItem>
                <MenuItem value="Boleto">Boleto</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography color="error">Orçamento não encontrado</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading || loading || !orcamento}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Gerar Nota Fiscal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principal de Finanças
export default function Finances() {
  const { userProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [orcamentos, setOrcamentos] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para formulários
  const [orcamentoFormOpen, setOrcamentoFormOpen] = useState(false);
  const [notaFiscalFormOpen, setNotaFiscalFormOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState(null);
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState(null);
  
  // Estado para filtros
  const [orcamentoFilter, setOrcamentoFilter] = useState('all');
  const [notaFiscalFilter, setNotaFiscalFilter] = useState('all');
  
  // Estado para resumos financeiros
  const [orcamentosSummary, setOrcamentosSummary] = useState(null);
  const [notasFiscaisSummary, setNotasFiscaisSummary] = useState(null);
  
  // Estado para o resultado da importação
  const [importResult, setImportResult] = useState(null);
  
  // Verificar URL para determinar a aba inicial (útil para links diretos)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && !isNaN(parseInt(tabParam))) {
      setTabValue(parseInt(tabParam));
    }
  }, []);
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [tabValue]);

  // Carregar dados com base na aba atual
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (tabValue === 0) {
        // Buscar orçamentos com filtros
        const filters = {};
        
        // Aplicar filtro de status se não for "todos"
        if (orcamentoFilter !== 'all') {
          filters.status = orcamentoFilter;
        }
        
        // Adicionar o ID do usuário para otimizar busca
        if (userProfile?.id) {
          filters.userId = userProfile.id;
        }
        
        // Usar índice otimizado por status+dataCriacao
        const data = await orcamentoService.getOrcamentos(
          filters, 
          'dataCriacao', 
          'desc'
        );
        setOrcamentos(data);
        
        // Buscar resumo de orçamentos
        const summary = await orcamentoService.getOrcamentosSummary();
        setOrcamentosSummary(summary);
      } else if (tabValue === 1) {
        // Buscar notas fiscais com filtros
        const filters = {};
        
        // Aplicar filtro de status se não for "todos"
        if (notaFiscalFilter !== 'all') {
          filters.status = notaFiscalFilter;
        }
        
        // Usar índice otimizado por status+dataEmissao
        const data = await notaFiscalService.getNotasFiscais(
          filters, 
          'dataEmissao', 
          'desc'
        );
        setNotasFiscais(data);
        
        // Buscar resumo de notas fiscais
        const summary = await notaFiscalService.getNotasFiscaisSummary();
        setNotasFiscaisSummary(summary);
      } else if (tabValue === 2) {
        // Buscar dados para relatórios
        const orcSummary = await orcamentoService.getOrcamentosSummary();
        setOrcamentosSummary(orcSummary);
        
        const nfSummary = await notaFiscalService.getNotasFiscaisSummary();
        setNotasFiscaisSummary(nfSummary);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError(`Erro ao buscar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipulação de abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funções para formulário de orçamento
  const handleOpenOrcamentoForm = (orcamento = null) => {
    setSelectedOrcamento(orcamento);
    setOrcamentoFormOpen(true);
  };

  const handleCloseOrcamentoForm = () => {
    setOrcamentoFormOpen(false);
    setSelectedOrcamento(null);
  };

  const handleSaveOrcamento = async (orcamentoData) => {
    setLoading(true);
    try {
      if (selectedOrcamento) {
        // Atualizar orçamento existente
        await orcamentoService.updateOrcamento(selectedOrcamento.id, orcamentoData);
      } else {
        // Criar novo orçamento
        await orcamentoService.createOrcamento({
          ...orcamentoData,
          userId: userProfile.id
        });
      }
      
      handleCloseOrcamentoForm();
      fetchData(); // Recarregar dados
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err);
      setError(`Erro ao salvar orçamento: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funções para nota fiscal
  const handleOpenNotaFiscalForm = (orcamentoId) => {
    setSelectedOrcamentoId(orcamentoId);
    setNotaFiscalFormOpen(true);
  };

  const handleCloseNotaFiscalForm = () => {
    setNotaFiscalFormOpen(false);
    setSelectedOrcamentoId(null);
  };

  const handleSaveNotaFiscal = async (notaFiscalData) => {
    setLoading(true);
    try {
      await notaFiscalService.criarNotaFiscalFromOrcamento(
        selectedOrcamentoId, 
        notaFiscalData
      );
      
      handleCloseNotaFiscalForm();
      fetchData(); // Recarregar dados
    } catch (err) {
      console.error("Erro ao gerar nota fiscal:", err);
      setError(`Erro ao gerar nota fiscal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para aprovar/rejeitar orçamento
  const handleOrcamentoAction = async (orcamentoId, action, motivo = '') => {
    setLoading(true);
    try {
      if (action === 'aprovar') {
        await orcamentoService.approveOrcamento(orcamentoId);
      } else if (action === 'rejeitar') {
        await orcamentoService.rejectOrcamento(orcamentoId, motivo);
      } else if (action === 'excluir') {
        await orcamentoService.deleteOrcamento(orcamentoId);
      }
      
      fetchData(); // Recarregar dados
    } catch (err) {
      console.error(`Erro ao ${action} orçamento:`, err);
      setError(`Erro ao ${action} orçamento: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para marcar nota fiscal como paga
  const handleMarkNotaFiscalAsPaid = async (notaFiscalId) => {
    setLoading(true);
    try {
      await notaFiscalService.markNotaFiscalAsPaid(notaFiscalId, {
        metodoPagamento: 'Transferência', // Valor padrão
        dataPagamento: new Date()
      });
      
      fetchData(); // Recarregar dados
    } catch (err) {
      console.error(`Erro ao marcar nota fiscal como paga:`, err);
      setError(`Erro ao marcar nota fiscal como paga: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar orçamentos
  const filteredOrcamentos = () => {
    if (orcamentoFilter === 'all') return orcamentos;
    return orcamentos.filter(orcamento => orcamento.status === orcamentoFilter);
  };

  // Função para filtrar notas fiscais
  const filteredNotasFiscais = () => {
    if (notaFiscalFilter === 'all') return notasFiscais;
    return notasFiscais.filter(notaFiscal => notaFiscal.status === notaFiscalFilter);
  };

  // Função para formatar data
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    // Se for um timestamp do Firestore
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString('pt-BR');
    }
    
    // Se for uma string de data
    return new Date(dateValue).toLocaleDateString('pt-BR');
  };

  // Função para lidar com o resultado da importação de CSV
  const handleImportComplete = (result) => {
    setImportResult(result);
    // Após alguns segundos, limpar a mensagem de resultado
    setTimeout(() => {
      setImportResult(null);
    }, 5000);
    
    // Recarregar dados após a importação
    fetchData();
  };

  // Componente para status chip
  const StatusChip = ({ status }) => {
    let color, label;
    
    switch (status) {
      case 'Pendente':
        color = 'warning';
        label = 'Pendente';
        break;
      case 'Aprovado':
        color = 'success';
        label = 'Aprovado';
        break;
      case 'Rejeitado':
        color = 'error';
        label = 'Rejeitado';
        break;
      case 'Faturado':
        color = 'info';
        label = 'Faturado';
        break;
      case 'Emitida':
        color = 'warning';
        label = 'Emitida';
        break;
      case 'Paga':
        color = 'success';
        label = 'Paga';
        break;
      case 'Cancelada':
        color = 'error';
        label = 'Cancelada';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4">Finanças</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Botão de filtro */}
          {tabValue === 0 && (
            <TextField
              select
              size="small"
              value={orcamentoFilter}
              onChange={(e) => setOrcamentoFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              label="Filtrar por"
              InputProps={{
                startAdornment: <FilterIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="Pendente">Pendentes</MenuItem>
              <MenuItem value="Aprovado">Aprovados</MenuItem>
              <MenuItem value="Rejeitado">Rejeitados</MenuItem>
              <MenuItem value="Faturado">Faturados</MenuItem>
            </TextField>
          )}
          
          {tabValue === 1 && (
            <TextField
              select
              size="small"
              value={notaFiscalFilter}
              onChange={(e) => setNotaFiscalFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              label="Filtrar por"
              InputProps={{
                startAdornment: <FilterIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
              }}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="Emitida">Emitidas</MenuItem>
              <MenuItem value="Paga">Pagas</MenuItem>
              <MenuItem value="Cancelada">Canceladas</MenuItem>
            </TextField>
          )}
          
          {/* Botão de adicionar ou importar */}
          {tabValue === 0 && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenOrcamentoForm()}
            >
              Novo Orçamento
            </Button>
          )}
          
          {tabValue === 3 && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<CloudUploadIcon />}
              disabled
            >
              Importar Dados
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Mensagem de resultado da importação */}
      {importResult && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setImportResult(null)}
        >
          Importação concluída com sucesso! {importResult.count} {importResult.type === 'orcamentos' ? 'orçamentos' : 'notas fiscais'} importados.
        </Alert>
      )}
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Orçamentos" />
        <Tab label="Notas Fiscais" />
        <Tab label="Relatórios" />
        <Tab label="Importar Dados" />
      </Tabs>
      
      {/* Conteúdo da aba Orçamentos */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Serviço</TableCell>
                <TableCell align="right">Valor (R$)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredOrcamentos().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Nenhum orçamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrcamentos().map((orcamento) => (
                  <TableRow key={orcamento.id}>
                    <TableCell>{orcamento.id.substring(0, 6)}</TableCell>
                    <TableCell>{orcamento.cliente}</TableCell>
                    <TableCell>{orcamento.servico}</TableCell>
                    <TableCell align="right">
                      {orcamento.valorTotal?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={orcamento.status} />
                    </TableCell>
                    <TableCell>{formatDate(orcamento.dataCriacao)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {/* Ações dependem do status do orçamento */}
                        {orcamento.status === 'Pendente' && (
                          <>
                            <Tooltip title="Aprovar">
                              <IconButton 
                                color="success" 
                                size="small"
                                onClick={() => handleOrcamentoAction(orcamento.id, 'aprovar')}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rejeitar">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleOrcamentoAction(orcamento.id, 'rejeitar')}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {orcamento.status === 'Aprovado' && (
                          <Tooltip title="Gerar Nota Fiscal">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleOpenNotaFiscalForm(orcamento.id)}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Editar orçamento (apenas se pendente) */}
                        {orcamento.status === 'Pendente' && (
                          <Tooltip title="Editar">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleOpenOrcamentoForm(orcamento)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Imprimir (para qualquer status) */}
                        <Tooltip title="Imprimir">
                          <IconButton color="default" size="small">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Excluir (apenas se pendente) */}
                        {orcamento.status === 'Pendente' && (
                          <Tooltip title="Excluir">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleOrcamentoAction(orcamento.id, 'excluir')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Conteúdo da aba Notas Fiscais */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Valor (R$)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Emissão</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredNotasFiscais().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotasFiscais().map((notaFiscal) => (
                  <TableRow key={notaFiscal.id}>
                    <TableCell>{notaFiscal.numero}</TableCell>
                    <TableCell>{notaFiscal.cliente}</TableCell>
                    <TableCell align="right">
                      {notaFiscal.valor?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={notaFiscal.status} />
                    </TableCell>
                    <TableCell>{formatDate(notaFiscal.dataEmissao)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {/* Marcar como paga (se emitida) */}
                        {notaFiscal.status === 'Emitida' && (
                          <Tooltip title="Marcar como Paga">
                            <IconButton 
                              color="success" 
                              size="small"
                              onClick={() => handleMarkNotaFiscalAsPaid(notaFiscal.id)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Imprimir (para qualquer status) */}
                        <Tooltip title="Imprimir">
                          <IconButton color="default" size="small">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Conteúdo da aba Relatórios */}
      {tabValue === 2 && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Resumo financeiro */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Resumo Financeiro
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Orçamentos
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Total de Orçamentos:</Typography>
                          <Typography variant="body1" fontWeight="medium">{orcamentosSummary?.total || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Valor Total:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            R$ {orcamentosSummary?.valorTotal?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Pendentes:</Typography>
                          <Typography variant="body1" fontWeight="medium">{orcamentosSummary?.pendentes || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Aprovados:</Typography>
                          <Typography variant="body1" fontWeight="medium">{orcamentosSummary?.aprovados || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Valor Aprovado:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            R$ {orcamentosSummary?.valorAprovado?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Taxa de Aprovação:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {orcamentosSummary?.total ? 
                              ((orcamentosSummary.aprovados / orcamentosSummary.total) * 100).toFixed(1) : 
                              '0'}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Notas Fiscais
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Total de Notas:</Typography>
                          <Typography variant="body1" fontWeight="medium">{notasFiscaisSummary?.total || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Valor Total:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            R$ {notasFiscaisSummary?.valorTotal?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Emitidas (Pendentes):</Typography>
                          <Typography variant="body1" fontWeight="medium">{notasFiscaisSummary?.emitidas || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Pagas:</Typography>
                          <Typography variant="body1" fontWeight="medium">{notasFiscaisSummary?.pagas || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Valor Recebido:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            R$ {notasFiscaisSummary?.valorPago?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Valor a Receber:</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            R$ {notasFiscaisSummary?.valorPendente?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Observação sobre relatório completo */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Relatórios Avançados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Em breve: gráficos detalhados, análise de desempenho por cliente, serviço e período, exportação para Excel e PDF.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      {/* Conteúdo da aba Importar Dados */}
      {tabValue === 3 && (
        <Box>
          <CSVFinancialImporter onImportComplete={handleImportComplete} />
        </Box>
      )}
      
      {/* Formulário de Orçamento (Dialog) */}
      <OrcamentoForm 
        open={orcamentoFormOpen} 
        onClose={handleCloseOrcamentoForm} 
        onSave={handleSaveOrcamento}
        initialData={selectedOrcamento}
        isLoading={loading}
      />
      
      {/* Formulário de Nota Fiscal (Dialog) */}
      <NotaFiscalForm 
        open={notaFiscalFormOpen} 
        onClose={handleCloseNotaFiscalForm} 
        onSave={handleSaveNotaFiscal}
        orcamentoId={selectedOrcamentoId}
        isLoading={loading}
      />
    </Box>
  );
}