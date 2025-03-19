// src/components/common/ConfirmationDialog.js
import React from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Slide
} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Componente de diálogo de confirmação reutilizável
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.open - Se o diálogo está aberto
 * @param {string} props.title - Título do diálogo
 * @param {string|React.ReactNode} props.content - Conteúdo do diálogo
 * @param {Function} props.onConfirm - Função chamada ao confirmar
 * @param {Function} props.onCancel - Função chamada ao cancelar
 * @param {string} props.confirmText - Texto do botão de confirmação
 * @param {string} props.cancelText - Texto do botão de cancelar
 * @param {string} props.confirmColor - Cor do botão de confirmação ('primary', 'error', etc)
 * @param {boolean} props.fullWidth - Se o diálogo deve ocupar a largura completa
 * @param {string} props.maxWidth - Largura máxima do diálogo ('xs', 'sm', 'md', etc)
 */
function ConfirmationDialog({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
  fullWidth = true,
  maxWidth = 'xs'
}) {
  // Usando React.useCallback para evitar recriações desnecessárias
  const handleConfirm = React.useCallback(() => {
    if (onConfirm) onConfirm();
  }, [onConfirm]);

  const handleCancel = React.useCallback(() => {
    if (onCancel) onCancel();
  }, [onCancel]);

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleCancel}
      aria-describedby="alert-dialog-slide-description"
      fullWidth={fullWidth}
      maxWidth={maxWidth}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      
      <DialogContent>
        {typeof content === 'string' ? (
          <DialogContentText id="alert-dialog-slide-description">
            {content}
          </DialogContentText>
        ) : (
          content
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color={confirmColor} variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;