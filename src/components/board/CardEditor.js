import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Divider,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import {
  Close as CloseIcon,
  Label as LabelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MemberSelector from '../common/MemberSelector';
import VisibilityControl from '../common/VisibilityControl';

// Predefined label options with colors
const labelOptions = [
  { name: 'Design', color: '#2E78D2' },
  { name: 'Urgente', color: '#F44336' },
  { name: 'Orçamento', color: '#4CAF50' },
  { name: 'Produção', color: '#FFC107' },
  { name: 'Revisão', color: '#9C27B0' },
  { name: 'Concluído', color: '#4CAF50' }
];

/**
 * Card editor component for creating and editing cards
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onSave - Callback when card is saved
 * @param {Object} props.cardData - Card data for editing (null for new card)
 * @param {Object} props.columnId - Column ID
 * @param {Array} props.teamMembers - Array of team members
 */
export default function CardEditor({ 
  open, 
  onClose, 
  onSave, 
  cardData = null, 
  columnId,
  teamMembers = []
}) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  
  // Set initial form values when editing
  useEffect(() => {
    if (cardData) {
      setTitle(cardData.title || '');
      setDescription(cardData.description || '');
      setDueDate(cardData.dueDate || '');
      setLabels(cardData.labels || []);
      setAssignedTo(cardData.assignedTo || []);
      setIsPublic(cardData.visibility === 'public');
    } else {
      // Default values for new card
      setTitle('');
      setDescription('');
      setDueDate('');
      setLabels([]);
      setAssignedTo([]);
      setIsPublic(true);
    }
  }, [cardData]);

  // Reset form on close
  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setLabels([]);
    setAssignedTo([]);
    setIsPublic(true);
    setNewLabel('');
    onClose();
  };

  // Handle save
  const handleSave = () => {
    if (!title.trim()) {
      // Could add validation error here
      return;
    }
    
    // Get member names for display
    const memberNames = assignedTo.map(memberId => {
      const member = teamMembers.find(m => m.id === memberId);
      return member ? member.name : 'Unknown';
    });
    
    const updatedCardData = {
      ...cardData,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      labels,
      assignedTo,
      members: memberNames,
      visibility: isPublic ? 'public' : 'private'
    };
    
    onSave(updatedCardData, columnId);
    handleClose();
  };

  // Handle adding a new label
  const handleAddLabel = () => {
    if (newLabel && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel('');
    }
  };

  // Handle removing a label
  const handleRemoveLabel = (labelToRemove) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  // Handle label select change
  const handleLabelChange = (event) => {
    const { value } = event.target;
    if (!labels.includes(value)) {
      setLabels([...labels, value]);
    }
    setNewLabel('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {cardData ? 'Editar Cartão' : 'Novo Cartão'}
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              autoFocus
              margin="dense"
              label="Título"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Descrição"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Data de Entrega"
              type="date"
              fullWidth
              variant="outlined"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Etiquetas
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 1 }}>
                <FormControl size="small" fullWidth sx={{ mr: 1 }}>
                  <InputLabel id="label-select-label">Adicionar etiqueta</InputLabel>
                  <Select
                    labelId="label-select-label"
                    value={newLabel}
                    onChange={handleLabelChange}
                    input={<OutlinedInput label="Adicionar etiqueta" />}
                    displayEmpty
                  >
                    {labelOptions.map((label) => (
                      <MenuItem 
                        key={label.name} 
                        value={label.name}
                        disabled={labels.includes(label.name)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              bgcolor: label.color,
                              mr: 1 
                            }} 
                          />
                          {label.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <IconButton onClick={handleAddLabel} disabled={!newLabel}>
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {labels.map((label, index) => {
                  const labelOption = labelOptions.find(opt => opt.name === label) || { color: '#E8DCC5' };
                  return (
                    <Chip
                      key={index}
                      label={label}
                      onDelete={() => handleRemoveLabel(label)}
                      sx={{
                        bgcolor: labelOption.color,
                        color: 'white'
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Membros
              </Typography>
              
              <MemberSelector
                value={assignedTo}
                onChange={setAssignedTo}
                members={teamMembers}
                label="Atribuir a"
              />
              
              <VisibilityControl 
                isPublic={isPublic} 
                onChange={setIsPublic} 
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          sx={{ bgcolor: 'primary.main', color: 'white' }}
        >
          {cardData ? 'Salvar Alterações' : 'Criar Cartão'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}