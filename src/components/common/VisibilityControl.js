import React from 'react';
import { 
  FormControlLabel, 
  Checkbox, 
  Box, 
  Typography, 
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';

/**
 * Component for controlling card visibility
 * 
 * @param {Object} props
 * @param {boolean} props.isPublic - Whether the card is visible to all team members
 * @param {Function} props.onChange - Callback when visibility changes
 * @param {boolean} props.disabled - Whether the control is disabled
 */
export default function VisibilityControl({ isPublic = true, onChange, disabled = false }) {
  const handleChange = (event) => {
    onChange(event.target.checked);
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
          Visibilidade do Cartão
        </Typography>
        <Tooltip title="Define quem pode ver este cartão. Se desativado, apenas membros atribuídos poderão visualizá-lo.">
          <IconButton size="small">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={handleChange}
              disabled={disabled}
              icon={<VisibilityOffIcon />}
              checkedIcon={<VisibilityIcon />}
            />
          }
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2">
                {isPublic ? 'Visível para todos' : 'Visível apenas para membros atribuídos'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isPublic 
                  ? 'Todos os membros do quadro podem ver este cartão' 
                  : 'Apenas os membros atribuídos podem ver este cartão'}
              </Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
}