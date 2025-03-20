// src/components/board/BoardColumn.js
import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { 
  Paper, Box, Typography, IconButton, Button, Menu, MenuItem, Divider
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import BoardCard from './BoardCard';

const BoardColumn = ({ 
  column, 
  onAddCard, 
  onEditColumn, 
  onDeleteColumn, 
  onDuplicateColumn,
  onEditCard, 
  onDeleteCard,
  onDuplicateCard,
  onArchiveCard,
  onAssignMembers,
  onManageLabels,
  filteredCards
}) => {
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState(null);

  const handleColumnMenuOpen = (event) => {
    event.stopPropagation();
    setColumnMenuAnchorEl(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchorEl(null);
  };

  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <Paper
          {...provided.droppableProps}
          ref={provided.innerRef}
          sx={{
            minWidth: 280,
            maxWidth: 280,
            bgcolor: snapshot.isDraggingOver ? 'secondary.light' : 'neutral.white',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Column Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'secondary.light', 
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {column.title}
            </Typography>
            <IconButton 
              size="small"
              onClick={handleColumnMenuOpen}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Column Menu */}
          <Menu
            anchorEl={columnMenuAnchorEl}
            open={Boolean(columnMenuAnchorEl)}
            onClose={handleColumnMenuClose}
          >
            <MenuItem onClick={() => {
              handleColumnMenuClose();
              onEditColumn(column);
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar Coluna
            </MenuItem>
            <MenuItem onClick={() => {
              handleColumnMenuClose();
              onDuplicateColumn(column);
            }}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Duplicar Coluna
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => {
                handleColumnMenuClose();
                onDeleteColumn(column);
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir Coluna
            </MenuItem>
          </Menu>
          
          {/* Column Content - Cards */}
          <Box sx={{ p: 1, flexGrow: 1 }}>
            {column.error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
                {column.error}
              </Alert>
            )}
            
            {filteredCards.map((card, index) => (
              <BoardCard
                key={card.id}
                card={card}
                index={index}
                columnId={column.id}
                onCardClick={() => onEditCard(card, column.id)}
                onDeleteCard={() => onDeleteCard(column.id, card)}
                onEditCard={() => onEditCard(card, column.id)}
                onDuplicateCard={() => onDuplicateCard(column.id, card)}
                onArchiveCard={() => onArchiveCard(column.id, card)}
                onAssignMembers={() => onAssignMembers(card, column.id)}
                onManageLabels={() => onManageLabels(card, column.id)}
              />
            ))}
            
            {provided.placeholder}
            
            {/* Add Card Button */}
            <Button
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => onAddCard(column.id)}
              sx={{ 
                justifyContent: 'flex-start', 
                color: 'text.secondary',
                '&:hover': { bgcolor: 'secondary.light' }
              }}
            >
              Adicionar Cartão
            </Button>
          </Box>
        </Paper>
      )}
    </Droppable>
  );
};

export default BoardColumn;