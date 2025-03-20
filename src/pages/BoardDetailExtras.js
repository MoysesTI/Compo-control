// ============= FUNCIONALIDADES ADICIONAIS PARA CARTÕES ===============

// 14. Método para duplicar um cartão
const handleDuplicateCard = async (card, columnId) => {
    if (!card) return;
    
    try {
      setProcessingAction(true);
      console.log(`Duplicating card: ${card.id}`);
      
      // Criar novo cartão com os mesmos dados + sufixo no título
      const duplicatedCardData = {
        ...card,
        title: `${card.title} (Cópia)`,
        id: undefined,  // Remover ID para criar um novo
        createdAt: undefined, // Será definido pelo servidor
        updatedAt: undefined  // Será definido pelo servidor
      };
      
      // Adicionar o cartão duplicado
      await cardService.addCard(
        boardId,
        columnId,
        duplicatedCardData,
        currentUser.uid
      );
      
      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: 'Cartão duplicado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error duplicating card:', error);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao duplicar cartão: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // 15. Método para duplicar uma coluna
  const handleDuplicateColumn = async (column) => {
    if (!column) return;
    
    try {
      setProcessingAction(true);
      console.log(`Duplicating column: ${column.id}`);
      
      // Criar nova coluna com os mesmos dados
      const newColumnId = await columnService.addColumn(
        boardId, 
        `${column.title} (Cópia)`, 
        currentUser.uid
      );
      
      // Replicar os cartões
      const cardsPromises = column.cards.map(async (card) => {
        const duplicatedCardData = {
          ...card,
          id: undefined,
          columnId: newColumnId,
          createdAt: undefined,
          updatedAt: undefined
        };
        
        await cardService.addCard(
          boardId,
          newColumnId,
          duplicatedCardData,
          currentUser.uid
        );
      });
      
      await Promise.all(cardsPromises);
      
      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: 'Coluna duplicada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error duplicating column:', error);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao duplicar coluna: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // 16. Método para arquivar um cartão (em vez de excluir)
  const handleArchiveCard = async (card, columnId) => {
    if (!card) return;
    
    try {
      setProcessingAction(true);
      console.log(`Archiving card: ${card.id}`);
      
      // Atualizar o cartão marcando como arquivado
      await cardService.updateCard(
        boardId,
        columnId,
        card.id,
        {
          archived: true,
          archivedAt: new Date().toISOString()
        }
      );
      
      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: 'Cartão arquivado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error archiving card:', error);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao arquivar cartão: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // 17. Método para restaurar um cartão arquivado
  const handleRestoreCard = async (card, columnId) => {
    if (!card) return;
    
    try {
      setProcessingAction(true);
      console.log(`Restoring card: ${card.id}`);
      
      // Atualizar o cartão removendo a marca de arquivado
      await cardService.updateCard(
        boardId,
        columnId,
        card.id,
        {
          archived: false,
          archivedAt: null
        }
      );
      
      // Recarregar dados
      await fetchBoardData();
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: 'Cartão restaurado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error restoring card:', error);
      setProcessingAction(false);
      
      setSnackbar({
        open: true,
        message: `Erro ao restaurar cartão: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // 18. Filtros e busca de cartões
  const handleFilterCards = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  const handleSearchCards = (searchTerm) => {
    setSearchQuery(searchTerm);
  };
  
  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };
  
  // 19. Aplicar filtros aos cartões
  const applyFiltersToCards = (cards) => {
    if (!cards) return [];
    
    // Aplicar busca
    let filteredCards = cards;
    
    // Pesquisa por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredCards = filteredCards.filter(card => 
        card.title.toLowerCase().includes(query) || 
        (card.description && card.description.toLowerCase().includes(query))
      );
    }
    
    // Filtrar por membros
    if (activeFilters.member) {
      filteredCards = filteredCards.filter(card => 
        card.assignedTo && card.assignedTo.includes(activeFilters.member)
      );
    }
    
    // Filtrar por etiquetas
    if (activeFilters.label) {
      filteredCards = filteredCards.filter(card => 
        card.labels && card.labels.includes(activeFilters.label)
      );
    }
    
    // Filtrar por status de arquivamento
    if (activeFilters.archived !== undefined) {
      filteredCards = filteredCards.filter(card => card.archived === activeFilters.archived);
    } else {
      // Por padrão, não mostrar cartões arquivados
      filteredCards = filteredCards.filter(card => !card.archived);
    }
    
    return filteredCards;
  };
  
  // ============= COMPONENTES ADICIONAIS ===============
  
  // 20. Componente para filtro e busca de cartões
  const CardFilterToolbar = ({ 
    onSearch, 
    onFilter, 
    onClearFilters, 
    searchQuery,
    activeFilters,
    labels,
    members
  }) => {
    const [anchorElFilter, setAnchorElFilter] = useState(null);
    
    const handleOpenFilterMenu = (event) => {
      setAnchorElFilter(event.currentTarget);
    };
    
    const handleCloseFilterMenu = () => {
      setAnchorElFilter(null);
    };
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 2, 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        {/* Campo de busca */}
        <TextField
          placeholder="Buscar cartões..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearch('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {/* Botão de filtro */}
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterMenu}
          color={Object.keys(activeFilters).length > 0 ? "primary" : "inherit"}
        >
          Filtros
          {Object.keys(activeFilters).length > 0 && (
            <Chip 
              size="small" 
              label={Object.keys(activeFilters).length} 
              sx={{ ml: 1 }} 
            />
          )}
        </Button>
        
        {/* Menu de filtros */}
        <Menu
          anchorEl={anchorElFilter}
          open={Boolean(anchorElFilter)}
          onClose={handleCloseFilterMenu}
          PaperProps={{
            sx: { width: 250 }
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filtrar por:</Typography>
          </MenuItem>
          
          <Divider />
          
          {/* Filtro por membros */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="member-filter-label">Membro</InputLabel>
              <Select
                labelId="member-filter-label"
                value={activeFilters.member || ''}
                onChange={(e) => {
                  onFilter('member', e.target.value || undefined);
                }}
                label="Membro"
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MenuItem>
          
          {/* Filtro por etiquetas */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="label-filter-label">Etiqueta</InputLabel>
              <Select
                labelId="label-filter-label"
                value={activeFilters.label || ''}
                onChange={(e) => {
                  onFilter('label', e.target.value || undefined);
                }}
                label="Etiqueta"
                displayEmpty
              >
                <MenuItem value="">Todas</MenuItem>
                {labels.map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MenuItem>
          
          {/* Filtro por arquivamento */}
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel id="archive-filter-label">Status</InputLabel>
              <Select
                labelId="archive-filter-label"
                value={activeFilters.archived !== undefined ? activeFilters.archived.toString() : 'undefined'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'undefined') {
                    onFilter('archived', undefined);
                  } else {
                    onFilter('archived', value === 'true');
                  }
                }}
                label="Status"
              >
                <MenuItem value="undefined">Ativos</MenuItem>
                <MenuItem value="true">Arquivados</MenuItem>
                <MenuItem value="false">Não arquivados</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
          
          <Divider />
          
          {/* Limpar filtros */}
          <MenuItem onClick={() => {
            onClearFilters();
            handleCloseFilterMenu();
          }}>
            <Typography color="primary">Limpar todos os filtros</Typography>
          </MenuItem>
        </Menu>
        
        {/* Botão para limpar filtros */}
        {(searchQuery || Object.keys(activeFilters).length > 0) && (
          <Button 
            variant="text" 
            size="small" 
            onClick={onClearFilters}
            startIcon={<ClearIcon />}
          >
            Limpar
          </Button>
        )}
      </Box>
    );
  };
  
  // 21. Componente de visualização de cartões arquivados
  const ArchivedCardsDialog = ({ open, onClose, cards, onRestore, onDelete }) => {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Cartões Arquivados</DialogTitle>
        <DialogContent>
          {cards.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum cartão arquivado.
              </Typography>
            </Box>
          ) : (
            <List>
              {cards.map((card) => (
                <ListItem
                  key={card.id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="Restaurar">
                        <IconButton edge="end" onClick={() => onRestore(card, card.columnId)}>
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir Permanentemente">
                        <IconButton edge="end" onClick={() => onDelete(card, card.columnId)}>
                          <DeleteForeverIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={card.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Coluna: {columns[card.columnId]?.title || 'Desconhecida'}
                        </Typography>
                        {card.archivedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Arquivado em: {new Date(card.archivedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Adicione estes states ao componente EnhancedBoardDetail:
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [archivedCardsDialogOpen, setArchivedCardsDialogOpen] = useState(false);
  
  // Obter todas as etiquetas usadas no quadro (para filtros)
  const getAllLabels = () => {
    const labels = new Set();
    Object.values(columns).forEach(column => {
      column.cards.forEach(card => {
        if (card.labels) {
          card.labels.forEach(label => labels.add(label));
        }
      });
    });
    return Array.from(labels);
  };
  
  // Obter todos os cartões arquivados
  const getArchivedCards = () => {
    const archivedCards = [];
    Object.values(columns).forEach(column => {
      column.cards.forEach(card => {
        if (card.archived) {
          archivedCards.push({...card, columnId: column.id});
        }
      });
    });
    return archivedCards;
  };
  
