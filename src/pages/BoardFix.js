// src/pages/BoardFix.js
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Paper 
} from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Componente para diagnosticar e corrigir quadros vazios
 * Adicione este componente temporariamente à sua aplicação
 */
export default function BoardFix() {
  const [boardId, setBoardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Extrair o ID do quadro da URL
  const extractBoardId = () => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    if (id) {
      setBoardId(id);
      return id;
    }
    return null;
  };
  
  // Verificar a estrutura do quadro
  const checkBoard = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const id = boardId || extractBoardId();
      if (!id) {
        setResult({
          success: false,
          message: 'ID do quadro não encontrado. Por favor, insira manualmente.'
        });
        return;
      }
      
      const boardRef = doc(db, 'boards', id);
      const boardSnap = await getDoc(boardRef);
      
      if (!boardSnap.exists()) {
        setResult({
          success: false,
          message: 'Quadro não encontrado no Firebase. Verifique se o ID está correto.'
        });
        return;
      }
      
      const boardData = boardSnap.data();
      console.log('Dados do quadro:', boardData);
      
      // Verificar se o quadro tem colunas
      if (!boardData.columns || !Array.isArray(boardData.columns) || boardData.columns.length === 0) {
        setResult({
          success: false,
          message: 'O quadro não tem colunas definidas. Clique em "Corrigir Quadro" para adicionar as colunas padrão.',
          needsFixing: true,
          boardData
        });
      } else {
        setResult({
          success: true,
          message: `O quadro tem ${boardData.columns.length} colunas definidas.`,
          boardData
        });
      }
    } catch (error) {
      console.error('Erro ao verificar quadro:', error);
      setResult({
        success: false,
        message: `Erro ao verificar quadro: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Corrigir o quadro adicionando colunas padrão
  const fixBoard = async () => {
    if (!result || !result.boardData) return;
    
    setLoading(true);
    
    try {
      const id = boardId || extractBoardId();
      const boardRef = doc(db, 'boards', id);
      
      // Definir colunas padrão
      const defaultColumns = [
        {
          id: 'col-1',
          title: 'A Fazer',
          cards: []
        },
        {
          id: 'col-2',
          title: 'Em Andamento',
          cards: []
        },
        {
          id: 'col-3',
          title: 'Revisão',
          cards: []
        },
        {
          id: 'col-4',
          title: 'Concluído',
          cards: []
        }
      ];
      
      // Atualizar o documento
      await updateDoc(boardRef, {
        columns: defaultColumns
      });
      
      setResult({
        success: true,
        message: 'Quadro corrigido com sucesso! As colunas padrão foram adicionadas. Recarregue a página para ver as mudanças.',
        fixed: true
      });
    } catch (error) {
      console.error('Erro ao corrigir quadro:', error);
      setResult({
        success: false,
        message: `Erro ao corrigir quadro: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Ferramenta de Diagnóstico de Quadro
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          ID do Quadro Atual: {boardId || 'Não detectado'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={checkBoard}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Verificar Quadro'}
          </Button>
          
          {result && result.needsFixing && (
            <Button
              variant="contained"
              color="secondary"
              onClick={fixBoard}
              disabled={loading}
            >
              Corrigir Quadro
            </Button>
          )}
          
          {result && result.fixed && (
            <Button
              variant="contained"
              color="success"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          )}
        </Box>
      </Paper>
      
      {result && (
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 3 }}>
          {result.message}
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>
        Instruções:
      </Typography>
      <ol>
        <li>Clique em "Verificar Quadro" para diagnosticar o problema</li>
        <li>Se necessário, clique em "Corrigir Quadro" para adicionar as colunas padrão</li>
        <li>Recarregue a página após a correção</li>
      </ol>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        Esta é uma ferramenta temporária de diagnóstico. Você pode removê-la após corrigir o problema.
      </Alert>
    </Box>
  );
}