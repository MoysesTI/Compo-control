import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Paper,
  useTheme,
  useMediaQuery,
  Collapse,
  ListItemButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ViewKanban as BoardsIcon,
  AttachMoney as FinancesIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  StarBorder as StarBorderIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  PeopleAlt as PeopleIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { styled, alpha } from '@mui/material/styles';

// Componente de pesquisa estilizado
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// Largura do drawer (sidebar)
const drawerWidth = 260;

// Componente Drawer responsivo
const ResponsiveDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

export default function Layout({ children }) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [projectsOpen, setProjectsOpen] = useState(true);
  
  // Determinar se o usuário é um administrador
  const isAdmin = userProfile?.role === 'administrador';
  
  // Fechar drawer móvel quando a rota muda
  useEffect(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleToggleProjects = () => {
    setProjectsOpen(!projectsOpen);
  };

  // Itens recentes para o sidebar
  const recentProjects = [
    { name: 'Adesivação Loja ABC', color: theme.palette.info.main },
    { name: 'Banner Empresa XYZ', color: theme.palette.warning.main },
    { name: 'Logo Restaurante', color: theme.palette.success.main },
  ];

  // Conteúdo do drawer (sidebar)
  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
          py: 1.5,
          bgcolor: 'secondary.light',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main', 
              color: 'white',
              fontWeight: 'bold',
              mr: 1.5
            }}
          >
            C
          </Avatar>
          {(desktopDrawerOpen || mobileDrawerOpen) && (
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
              noWrap
            >
              Composição
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <IconButton onClick={() => setDesktopDrawerOpen(!desktopDrawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />
      
      {(desktopDrawerOpen || mobileDrawerOpen) && (
        <Box sx={{ p: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 2,
              bgcolor: 'neutral.light' 
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase placeholder="Pesquisar..." sx={{ ml: 1, flex: 1 }} />
          </Paper>
        </Box>
      )}
      
      <Box sx={{ px: 2 }}>
        <List component="nav" sx={{ p: 0 }}>
          {/* Dashboard - Apenas para administradores */}
          {isAdmin && (
            <ListItem 
              button 
              component={Link} 
              to="/"
              selected={location.pathname === '/'}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'secondary.light',
                }
              }}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              {(desktopDrawerOpen || mobileDrawerOpen) && (
                <ListItemText primary="Dashboard" />
              )}
            </ListItem>
          )}
          
          {/* Quadros - Todos os usuários */}
          <ListItem 
            button 
            component={Link} 
            to="/boards"
            selected={location.pathname.startsWith('/boards')}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '&:hover': {
                bgcolor: 'secondary.light',
              }
            }}
          >
            <ListItemIcon>
              <BoardsIcon />
            </ListItemIcon>
            {(desktopDrawerOpen || mobileDrawerOpen) && (
              <ListItemText primary="Quadros" />
            )}
          </ListItem>
          
          {/* Finanças - Apenas para administradores */}
          {isAdmin && (
            <ListItem 
              button 
              component={Link} 
              to="/finances"
              selected={location.pathname === '/finances'}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'secondary.light',
                }
              }}
            >
              <ListItemIcon>
                <FinancesIcon />
              </ListItemIcon>
              {(desktopDrawerOpen || mobileDrawerOpen) && (
                <ListItemText primary="Finanças" />
              )}
            </ListItem>
          )}
          
          {/* Equipe - Todos os usuários */}
          <ListItem 
            button 
            component={Link} 
            to="/team"
            selected={location.pathname === '/team'}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '&:hover': {
                bgcolor: 'secondary.light',
              }
            }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            {(desktopDrawerOpen || mobileDrawerOpen) && (
              <ListItemText primary="Equipe" />
            )}
          </ListItem>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Projetos recentes - Todos os usuários */}
          {(desktopDrawerOpen || mobileDrawerOpen) && (
            <>
              <ListItemButton 
                onClick={handleToggleProjects}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1,
                  py: 1,
                  '&:hover': {
                    bgcolor: 'secondary.light',
                  }
                }}
              >
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText primary="Projetos Recentes" />
                {projectsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              
              <Collapse in={projectsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {recentProjects.map((project, index) => (
                    <ListItemButton 
                      key={index}
                      sx={{ 
                        pl: 4, 
                        py: 0.75,
                        borderRadius: 2, 
                        ml: 2,
                        '&:hover': {
                          bgcolor: 'secondary.light',
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: project.color,
                          mr: 1.5
                        }} 
                      />
                      <ListItemText 
                        primary={project.name} 
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Perfil - Todos os usuários */}
          <ListItem 
            button 
            component={Link} 
            to="/profile"
            selected={location.pathname === '/profile'}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '&:hover': {
                bgcolor: 'secondary.light',
              }
            }}
          >
            <ListItemIcon>
              <ProfileIcon />
            </ListItemIcon>
            {(desktopDrawerOpen || mobileDrawerOpen) && (
              <ListItemText primary="Perfil" />
            )}
          </ListItem>
          
          {/* Configurações - Apenas para administradores */}
          {isAdmin && (
            <ListItem 
              button 
              component={Link} 
              to="/settings"
              selected={location.pathname === '/settings'}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'secondary.light',
                }
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              {(desktopDrawerOpen || mobileDrawerOpen) && (
                <ListItemText primary="Configurações" />
              )}
            </ListItem>
          )}
        </List>
      </Box>
      
      {(desktopDrawerOpen || mobileDrawerOpen) && (
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'secondary.light',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Avatar 
              alt={userProfile?.name} 
              src="/static/images/avatar/1.jpg" 
              sx={{ width: 36, height: 36, mr: 2 }}
            />
            <Box sx={{ overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>
                  {userProfile?.name || 'Usuário'}
                </Typography>
                {isAdmin && (
                  <Chip 
                    size="small" 
                    label="Admin" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.625rem',
                      bgcolor: 'primary.main',
                      color: 'white'
                    }} 
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap>
                {userProfile?.email}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'neutral.light', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          ...(isMobile ? {} : {
            ml: desktopDrawerOpen ? drawerWidth : theme.spacing(9),
            width: isMobile ? '100%' : `calc(100% - ${desktopDrawerOpen ? drawerWidth : theme.spacing(9)}px)`,
          }),
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDesktopDrawerOpen(!desktopDrawerOpen)}
              sx={{ 
                mr: 2,
                ...(desktopDrawerOpen && { display: 'none' })
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ display: { xs: 'block', sm: 'block' }, fontWeight: 'bold', color: 'primary.main' }}>
            {location.pathname === '/' ? 'Dashboard' : 
             location.pathname.startsWith('/boards') ? 'Quadros' :
             location.pathname === '/finances' ? 'Finanças' :
             location.pathname === '/team' ? 'Equipe' :
             location.pathname === '/profile' ? 'Perfil' :
             location.pathname === '/settings' ? 'Configurações' : 'Composição'}
          </Typography>
          
          {isAdmin && (
            <Chip 
              icon={<AdminIcon sx={{ color: 'white !important', fontSize: '0.875rem' }} />}
              label="Administrador" 
              size="small"
              sx={{ 
                ml: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: { xs: 'none', sm: 'flex' }
              }} 
            />
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Search sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              maxWidth: 300, 
              bgcolor: 'neutral.light', 
              borderRadius: 2,
              mr: 1
            }}>
              <SearchIconWrapper>
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Pesquisar..."
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>
            
            <Tooltip title="Notificações">
              <IconButton color="inherit" onClick={handleNotificationsOpen}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                sx: { width: 320, maxHeight: 400, borderRadius: 2, mt: 1 }
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'neutral.light' }}>
                <Typography variant="subtitle1" fontWeight="bold">Notificações</Typography>
              </Box>
              {[
                { title: 'Novo orçamento', message: 'Cliente XYZ solicitou um orçamento', time: '5 min atrás', adminOnly: true },
                { title: 'Tarefa concluída', message: 'Ana concluiu o design do banner', time: '2 horas atrás', adminOnly: false },
                { title: 'Prazo próximo', message: 'Adesivação do veículo vence amanhã', time: '5 horas atrás', adminOnly: false },
              ]
              .filter(item => isAdmin || !item.adminOnly)
              .map((item, index) => (
                <MenuItem key={index} onClick={handleNotificationsClose} sx={{ py: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                  </Box>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center' }}>
                <Typography variant="body2" color="primary">Ver todas</Typography>
              </MenuItem>
            </Menu>
            
            <Tooltip title="Perfil">
              <IconButton 
                color="inherit" 
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar 
                  alt={userProfile?.name} 
                  src="/static/images/avatar/1.jpg" 
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: { width: 220, borderRadius: 2, mt: 1 }
              }}
            >
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Avatar 
                  alt={userProfile?.name} 
                  src="/static/images/avatar/1.jpg" 
                  sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }}
                />
                <Typography variant="subtitle1">{userProfile?.name || 'Usuário'}</Typography>
                <Typography variant="body2" color="text.secondary">{userProfile?.email}</Typography>
                {isAdmin && (
                  <Chip 
                    label="Administrador" 
                    size="small" 
                    sx={{ 
                      mt: 1,
                      bgcolor: 'primary.main',
                      color: 'white'
                    }} 
                  />
                )}
              </Box>
              <Divider />
              <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <ProfileIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Perfil</ListItemText>
              </MenuItem>
              {isAdmin && (
                <MenuItem component={Link} to="/settings" onClick={handleProfileMenuClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configurações</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={() => { handleProfileMenuClose(); handleLogout(); }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sair</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer para telas móveis */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Drawer para telas desktop
        <ResponsiveDrawer
          variant="permanent"
          open={desktopDrawerOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
          }}
        >
          {drawerContent}
        </ResponsiveDrawer>
      )}
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          mt: 8,
          ml: { xs: 0, md: !desktopDrawerOpen ? 9 : 0 },
          width: { xs: '100%', md: `calc(100% - ${desktopDrawerOpen ? drawerWidth : theme.spacing(9)}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflowX: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}