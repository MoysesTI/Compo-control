import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  CircularProgress,
  Grid,
  Avatar,
  Checkbox,
  ListItemText,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Componente para adicionar ou editar cards
const CardForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  columnId, 
  boardId, 
  teamMembers, 
  initialData = null,
  loading
}) => {
  const { userProfile } = useAuth();
  
  // Estado inicial do card
  const defaultCardData = {
    title: '',
    description: '',
    client: '',
    dueDate: '',
    status: 'Pendente',
    priority: 'Média',
    labels: [],
    members: userProfile ? [userProfile.id] : [], // Adiciona o usuário atual como membro por padrão
    progress: 0,
    columnId: columnId, // Importante: garante que o card tenha a coluna associada
    boardId: boardId    // Importante: garante que o card tenha o quadro associado
  };

  // Usar dados iniciais se fornecidos, caso contrário usar padrão
  const [formData, setFormData] = useState(
    initialData ? 
    {
      ...initialData,
      columnId: initialData.columnId || columnId, // Garante que sempre terá columnId
      boardId: initialData.boardId || boardId     // Garante que sempre terá boardId
    } : 
    defaultCardData
  );
  
  // Atualizar formData quando props mudam
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        columnId: initialData.columnId || columnId,
        boardId: initialData.boardId || boardId
      });
    } else {
      setFormData({
        ...defaultCardData,
        columnId,
        boardId
      });
    }
  }, [initialData, columnId, boardId, userProfile]);
  
  // Opções para selects
  const statusOptions = ['Pendente', 'Em andamento', 'Revisão', 'Concluído'];
  const priorityOptions = ['Baixa', 'Média', 'Alta', 'Urgente'];
  const labelOptions = ['Design', 'Urgente', 'Orçamento', 'Produção', 'Revisão', 'Concluído'];

  // Handler para mudanças nos campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para mudanças em selects múltiplos
  const handleMultipleChange = (event, fieldName) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handler para submissão
  const handleSubmit = () => {
    // Verificar se o título está preenchido
    if (!formData.title.trim()) {
      return;
    }
    
    // Garantir que boardId e columnId estão definidos
    const cardData = {
      ...formData,
      boardId: boardId,
      columnId: columnId
    };
    
    console.log('Enviando card para criação/atualização:', cardData);
    
    // Enviar para o componente pai
    onSubmit(cardData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Card' : 'Adicionar Novo Card'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Título"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          autoFocus
          variant="outlined"
          error={!formData.title.trim()}
          helperText={!formData.title.trim() ? "Título é obrigatório" : ""}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Cliente"
          name="client"
          value={formData.client}
          onChange={handleChange}
          variant="outlined"
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Descrição"
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={3}
          variant="outlined"
        />
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data de Entrega"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Prioridade</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Prioridade"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Etiquetas</InputLabel>
              <Select
                multiple
                name="labels"
                value={formData.labels || []}
                onChange={(e) => handleMultipleChange(e, 'labels')}
                input={<OutlinedInput label="Etiquetas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {labelOptions.map(label => (
                  <MenuItem key={label} value={label}>
                    <Checkbox checked={(formData.labels || []).indexOf(label) > -1} />
                    <ListItemText primary={label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
          <InputLabel>Membros Responsáveis</InputLabel>
          <Select
            multiple
            name="members"
            value={formData.members || []}
            onChange={(e) => handleMultipleChange(e, 'members')}
            input={<OutlinedInput label="Membros Responsáveis" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((memberId) => {
                  const member = teamMembers.find(m => m.id === memberId);
                  return (
                    <Chip 
                      key={memberId} 
                      label={member?.name || 'Usuário'} 
                      avatar={
                        <Avatar>
                          {member?.name ? member.name.charAt(0) : 'U'}
                        </Avatar>
                      }
                    />
                  );
                })}
              </Box>
            )}
          >
            {teamMembers.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                <Checkbox checked={(formData.members || []).indexOf(member.id) > -1} />
                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                  {member.name ? member.name.charAt(0) : 'U'}
                </Avatar>
                <ListItemText primary={member.name || 'Usuário'} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Informações de depuração (visíveis apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" component="div">
              Debug Info:
            </Typography>
            <Typography variant="caption" component="div">
              Board ID: {boardId}
            </Typography>
            <Typography variant="caption" component="div">
              Column ID: {columnId}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !formData.title.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {initialData ? 'Atualizar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CardForm;