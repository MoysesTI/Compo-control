import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import MemberSelector from '../common/MemberSelector';
import VisibilityControl from '../common/VisibilityControl';

/**
 * Component for assigning members to a card
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onSave - Callback with members and visibility settings
 * @param {Object} props.card - Card data
 * @param {Array} props.teamMembers - Array of team members
 * @param {boolean} props.processing - Whether an operation is in progress
 */
export default function MemberAssignmentDialog({ 
  open, 
  onClose, 
  onSave, 
  card, 
  teamMembers = [],
  processing = false
}) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [memberNames, setMemberNames] = useState([]);

  // Initialize state when card changes
  useEffect(() => {
    if (card) {
      setSelectedMembers(card.assignedTo || []);
      setIsPublic(card.visibility === 'public');
      
      // Get member names for display
      updateMemberNames(card.assignedTo || []);
    }
  }, [card, teamMembers]);

  // Update member names when selection changes
  const updateMemberNames = (memberIds) => {
    const names = memberIds.map(memberId => {
      const member = teamMembers.find(m => m.id === memberId);
      return member ? member.name : 'Unknown';
    });
    
    setMemberNames(names);
  };

  // Handle member selection change
  const handleMemberChange = (value) => {
    setSelectedMembers(value);
    updateMemberNames(value);
  };

  // Handle visibility change
  const handleVisibilityChange = (value) => {
    setIsPublic(value);
  };

  // Handle save
  const handleSave = () => {
    // Validate: if private, must have assigned members
    if (!isPublic && selectedMembers.length === 0) {
      // Could show an error message here
      return;
    }
    
    onSave(selectedMembers, memberNames, isPublic ? 'public' : 'private');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="member-assignment-dialog-title"
    >
      <DialogTitle id="member-assignment-dialog-title">
        Atribuir Membros ao Cartão
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            Selecione os membros que serão atribuídos ao cartão
          </Typography>
          
          <MemberSelector
            value={selectedMembers}
            onChange={handleMemberChange}
            members={teamMembers}
            label="Membros"
            disabled={processing}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <VisibilityControl
          isPublic={isPublic}
          onChange={handleVisibilityChange}
          disabled={processing}
        />
        
        {!isPublic && selectedMembers.length === 0 && (
          <Typography 
            variant="body2" 
            color="error" 
            sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <VisibilityOffIcon fontSize="small" />
            Cartões privados devem ter pelo menos um membro atribuído
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          disabled={processing}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={(!isPublic && selectedMembers.length === 0) || processing}
          startIcon={processing && <CircularProgress size={16} />}
        >
          {processing ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}