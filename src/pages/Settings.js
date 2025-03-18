import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  CircularProgress, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Snackbar,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Refresh as RefreshIcon, 
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../hooks/firebase-hooks';

export default function Settings() {
  const { userProfile, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    defaultView: 'cards',
    cardsPerPage: 12,
    compactMode: false,
    showCompleted: true,
    theme: 'light'
  });
  
  // User preferences
  const [userPreferences, setUserPreferences] = useState({
    defaultBoard: '',
    startPage: 'dashboard',
    showWelcomeScreen: true,
    showTutorials: true
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGeneralChange = (event) => {
    const { name, value, checked } = event.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleDisplayChange = (event) => {
    const { name, value, checked } = event.target;
    setDisplaySettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handlePreferencesChange = (event) => {
    const { name, value, checked } = event.target;
    setUserPreferences(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save user preferences to Firestore
      if (userProfile?.id) {
        await firestoreService.updateDocument('users', userProfile.id, {
          settings: {
            general: generalSettings,
            display: displaySettings,
            preferences: userPreferences
          },
          updatedAt: new Date().toISOString()
        });
        
        setSnackbar({
          open: true,
          message: 'Configurações salvas com sucesso!',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao salvar configurações: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setGeneralSettings({
      notifications: true,
      emailAlerts: true,
      darkMode: false,
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    });
    
    setDisplaySettings({
      defaultView: 'cards',
      cardsPerPage: 12,
      compactMode: false,
      showCompleted: true,
      theme: 'light'
    });
    
    setUserPreferences({
      defaultBoard: '',
      startPage: 'dashboard',
      showWelcomeScreen: true,
      showTutorials: true
    });
    
    setSnackbar({
      open: true,
      message: 'Configurações redefinidas para os valores padrão',
      severity: 'info'
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Configurações
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleResetSettings}
          >
            Redefinir
          </Button>
          <Button 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveSettings}
            disabled={loading}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Salvar Alterações
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            bgcolor: 'neutral.light', 
            '& .MuiTabs-indicator': { height: 3 }
          }}
        >
          <Tab label="Geral" />
          <Tab label="Aparência" />
          <Tab label="Preferências" />
          <Tab label="Notificações" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* General Settings */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Configurações Gerais</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generalSettings.notifications}
                          onChange={handleGeneralChange}
                          name="notifications"
                          color="primary"
                        />
                      }
                      label="Ativar notificações"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Receba alertas sobre atividades e prazos importantes
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generalSettings.emailAlerts}
                          onChange={handleGeneralChange}
                          name="emailAlerts"
                          color="primary"
                        />
                      }
                      label="Alertas por email"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Receba emails com atualizações de seus projetos
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generalSettings.darkMode}
                          onChange={handleGeneralChange}
                          name="darkMode"
                          color="primary"
                        />
                      }
                      label="Modo escuro"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Alterna entre os temas claro e escuro
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="language-label">Idioma</InputLabel>
                    <Select
                      labelId="language-label"
                      name="language"
                      value={generalSettings.language}
                      label="Idioma"
                      onChange={handleGeneralChange}
                    >
                      <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                      <MenuItem value="en-US">English (US)</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="timezone-label">Fuso Horário</InputLabel>
                    <Select
                      labelId="timezone-label"
                      name="timezone"
                      value={generalSettings.timezone}
                      label="Fuso Horário"
                      onChange={handleGeneralChange}
                    >
                      <MenuItem value="America/Sao_Paulo">Brasília (GMT-3)</MenuItem>
                      <MenuItem value="America/New_York">New York (GMT-5/4)</MenuItem>
                      <MenuItem value="Europe/London">London (GMT+0/+1)</MenuItem>
                      <MenuItem value="Europe/Paris">Paris (GMT+1/+2)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Display Settings */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Configurações de Aparência</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="default-view-label">Visualização Padrão</InputLabel>
                    <Select
                      labelId="default-view-label"
                      name="defaultView"
                      value={displaySettings.defaultView}
                      label="Visualização Padrão"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="cards">Cartões</MenuItem>
                      <MenuItem value="list">Lista</MenuItem>
                      <MenuItem value="board">Quadro</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="cards-per-page-label">Cartões por Página</InputLabel>
                    <Select
                      labelId="cards-per-page-label"
                      name="cardsPerPage"
                      value={displaySettings.cardsPerPage}
                      label="Cartões por Página"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value={8}>8 cartões</MenuItem>
                      <MenuItem value={12}>12 cartões</MenuItem>
                      <MenuItem value={16}>16 cartões</MenuItem>
                      <MenuItem value={24}>24 cartões</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displaySettings.compactMode}
                          onChange={handleDisplayChange}
                          name="compactMode"
                          color="primary"
                        />
                      }
                      label="Modo compacto"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Mostrar mais informações em menos espaço
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displaySettings.showCompleted}
                          onChange={handleDisplayChange}
                          name="showCompleted"
                          color="primary"
                        />
                      }
                      label="Mostrar tarefas concluídas"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Exibir ou ocultar tarefas já concluídas
                    </Typography>
                  </Box>
                  
                  <FormControl fullWidth>
                    <InputLabel id="theme-label">Tema</InputLabel>
                    <Select
                      labelId="theme-label"
                      name="theme"
                      value={displaySettings.theme}
                      label="Tema"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="light">Claro</MenuItem>
                      <MenuItem value="dark">Escuro</MenuItem>
                      <MenuItem value="system">Conforme sistema</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* User Preferences */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Preferências do Usuário</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="start-page-label">Página Inicial</InputLabel>
                    <Select
                      labelId="start-page-label"
                      name="startPage"
                      value={userPreferences.startPage}
                      label="Página Inicial"
                      onChange={handlePreferencesChange}
                    >
                      <MenuItem value="dashboard">Dashboard</MenuItem>
                      <MenuItem value="boards">Quadros</MenuItem>
                      <MenuItem value="team">Equipe</MenuItem>
                      <MenuItem value="finances">Finanças</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="default-board-label">Quadro Padrão</InputLabel>
                    <Select
                      labelId="default-board-label"
                      name="defaultBoard"
                      value={userPreferences.defaultBoard}
                      label="Quadro Padrão"
                      onChange={handlePreferencesChange}
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      <MenuItem value="1">Adesivação</MenuItem>
                      <MenuItem value="2">Impressão</MenuItem>
                      <MenuItem value="3">Banners e Logos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userPreferences.showWelcomeScreen}
                          onChange={handlePreferencesChange}
                          name="showWelcomeScreen"
                          color="primary"
                        />
                      }
                      label="Mostrar tela de boas-vindas"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Exibir tela de boas-vindas ao iniciar
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userPreferences.showTutorials}
                          onChange={handlePreferencesChange}
                          name="showTutorials"
                          color="primary"
                        />
                      }
                      label="Mostrar tutoriais"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Exibir dicas e tutoriais ao navegar pelo sistema
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Notifications Settings */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Configurações de Notificações</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Personalize como e quando deseja receber notificações sobre suas atividades e projetos.
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Notificações por Email
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Relatórios semanais"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Receba um resumo semanal de suas atividades
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Prazos próximos"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Alertas de tarefas com vencimento em até 48h
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Novos comentários"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Avisos quando alguém comentar em suas tarefas
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Atualizações de projetos"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Atualizações sobre mudanças em projetos que você participa
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Notificações no Sistema
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Alertas em tempo real"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Receba notificações instantâneas no sistema
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked
                          color="primary"
                        />
                      }
                      label="Sons de notificação"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Reproduzir sons ao receber novas notificações
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}