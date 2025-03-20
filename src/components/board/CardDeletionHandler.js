// src/components/board/CardDeletionHandler.js
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogContentText,
  DialogActions, 
  Button, 
  Snackbar, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import cardService from '../../services/cardService';

/**
 * Componente para lidar com exclusão de cartões com diálogo de confirmação
 */
const CardDeletionHandler = ({ 
  open, 
  onClose, 
  boardId, 
  columnId, 
  cardId, 
  cardTitle,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Função para excluir o cartão
  const handleDeleteCard = async () => {
    // Se não temos as informações necessárias, não prossiga
    if (!boardId || !columnId || !cardId) {
      setError('Informações incompletas para excluir o cartão.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chama o serviço de exclusão de cartão
      await cardService.deleteCard(boardId, columnId, cardId);
      
      // Exibe mensagem de sucesso
      setSnackbar({
        open: true,
        message: 'Cartão excluído com sucesso',
        severity: 'success'
      });
      
      // Fecha o diálogo
      onClose();
      
      // Chama o callback de sucesso, se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Erro ao excluir cartão:', err);
      setError(err.message || 'Erro ao excluir cartão');
      
      setSnackbar({
        open: true,
        message: `Erro ao excluir cartão: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Lidar com fechamento do snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <>
      {/* Diálogo de confirmação */}
      <Dialog 
        open={open} 
        onClose={() => !loading && onClose()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Excluir Cartão</DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o cartão "{cardTitle}"? Esta ação não pode ser desfeita.
          </DialogContentText>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteCard} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CardDeletionHandler;