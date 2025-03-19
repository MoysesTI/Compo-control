import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Componente de diálogo de confirmação melhorado
 * 
 * @param {Object} props
 * @param {boolean} props.open - Se o diálogo está aberto
 * @param {Function} props.onClose - Callback quando o diálogo é fechado
 * @param {Function} props.onConfirm - Callback quando a ação é confirmada
 * @param {string} props.title - Título do diálogo
 * @param {string} props.message - Mensagem do diálogo
 * @param {string} props.confirmText - Texto do botão de confirmação
 * @param {string} props.cancelText - Texto do botão de cancelamento
 * @param {string} props.confirmButtonVariant - Variante do botão de confirmação ('contained', 'outlined', etc)
 * @param {string} props.cancelButtonVariant - Variante do botão de cancelamento ('text', 'outlined', etc)
 * @param {string} props.confirmButtonColor - Cor do botão de confirmação ('primary', 'error', etc)
 * @param {string} props.type - Tipo de confirmação ('delete', 'warning', 'info')
 * @param {boolean} props.fullWidth - Se o diálogo ocupa a largura total
 * @param {boolean} props.loading - Se está carregando (desabilita botões)
 */
export default function ImprovedConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonVariant = 'contained',
  cancelButtonVariant = 'outlined',
  confirmButtonColor = 'error', 
  type = 'warning',
  fullWidth = false, 
  loading = false
}) {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <ErrorIcon color="error" fontSize="large" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="large" />;
      case 'info':
        return <InfoIcon color="info" fontSize="large" />;
      default:
        return <WarningIcon color="warning" fontSize="large" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'delete':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title" sx={{ pb: 0, pr: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIcon()}
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          variant={cancelButtonVariant}
          disabled={loading}
        >
          {cancelText}
        </Button>
        
        <Button 
          onClick={onConfirm} 
          variant={confirmButtonVariant}
          color={confirmButtonColor}
          disabled={loading}
          autoFocus
        >
          {loading ? 'Processando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}