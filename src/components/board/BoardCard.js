// src/components/board/BoardCard.js
import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  AvatarGroup, 
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
  Label as LabelIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';

/**
 * Componente de cartão para quadros Kanban com menu de contexto
 */
const BoardCard = ({ 
  card, 
  index, 
  columnId,
  onCardClick,
  onDeleteCard,
  onDuplicateCard,
  onArchiveCard,
  onEditCard,
  onAssignMembers,
  onManageLabels
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Abrir menu de contexto
  const handleMenuOpen = (event) => {
    event.stopPropagation(); // Impede a propagação do clique
    setAnchorEl(event.currentTarget);
  };
  
  // Fechar menu de contexto
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Lidar com clique para editar
  const handleEdit = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onEditCard) onEditCard();
  };
  
  // Lidar com clique para excluir
  const handleDelete = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onDeleteCard) onDeleteCard();
  };
  
  // Lidar com clique para duplicar
  const handleDuplicate = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onDuplicateCard) onDuplicateCard();
  };
  
  // Lidar com clique para arquivar
  const handleArchive = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onArchiveCard) onArchiveCard();
  };
  
  // Lidar com clique em atribuir membros
  const handleAssignMembers = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onAssignMembers) onAssignMembers();
  };
  
  // Lidar com clique em gerenciar etiquetas
  const handleManageLabels = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (onManageLabels) onManageLabels();
  };

  // Função para obter cor da etiqueta
  const getLabelColor = (label) => {
    if (label.color) return label.color;
    
    // Cores padrão para labels
    switch (label.text?.toLowerCase() || label.toLowerCase()) {
      case 'design':
        return '#2E78D2'; // Azul principal
      case 'urgente':
        return '#F44336'; // Vermelho
      case 'orçamento':
        return '#4CAF50'; // Verde
      case 'produção':
        return '#FFC107'; // Amarelo
      case 'revisão':
        return '#9C27B0'; // Roxo
      case 'concluído':
        return '#4CAF50'; // Verde
      default:
        return '#E8DCC5'; // Bege padrão
    }
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
            bgcolor: 'white',
            '&:hover': {
              boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
            },
            position: 'relative',
            cursor: 'pointer',
            opacity: card.archived ? 0.6 : 1
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onCardClick) onCardClick();
          }}
        >
          {/* Visibility indicator */}
          <Tooltip title={card.visibility === 'private' ? 'Visível apenas para membros atribuídos' : 'Visível para todos'}>
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              {card.visibility === 'private' ? (
                <VisibilityOffIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              ) : (
                <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              )}
            </Box>
          </Tooltip>
          
          {/* Menu de contexto */}
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              right: 32,
              opacity: 0.6,
              '&:hover': { opacity: 1 }
            }}
            onClick={handleMenuOpen}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleDuplicate}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Duplicar
            </MenuItem>
            <MenuItem onClick={handleAssignMembers}>
              <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
              Atribuir Membros
            </MenuItem>
            <MenuItem onClick={handleManageLabels}>
              <LabelIcon fontSize="small" sx={{ mr: 1 }} />
              Etiquetas
            </MenuItem>
            <MenuItem onClick={handleArchive}>
              <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
              Arquivar
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </Menu>
          
          {/* Etiquetas */}
          <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {card.labels && card.labels.map((label, idx) => (
              <Chip
                key={idx}
                label={label.text || label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: getLabelColor(label),
                  color: 'white'
                }}
              />
            ))}
          </Box>
          
          {/* Título */}
          <Typography variant="subtitle2" sx={{ mb: 1, pr: 5 }}>
            {card.title}
          </Typography>
          
          {/* Descrição */}
          {card.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {card.description.length > 80 
                ? `${card.description.substring(0, 80)}...` 
                : card.description}
            </Typography>
          )}
          
          {/* Rodapé */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Membros */}
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
              {card.members && card.members.map((member, idx) => (
                <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                  {typeof member === 'string' ? member.charAt(0) : 'U'}
                </Avatar>
              ))}
            </AvatarGroup>
            
            {/* Badges */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Data de vencimento */}
              {card.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                  <Typography variant="caption">
                    {new Date(card.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              
              {/* Comentários */}
              {card.comments > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <CommentIcon fontSize="small" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {card.comments}
                  </Typography>
                </Box>
              )}
              
              {/* Anexos */}
              {card.attachments > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <AttachFileIcon fontSize="small" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {card.attachments}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Draggable>
  );
};

export default BoardCard;