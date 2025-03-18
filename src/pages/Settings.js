// src/pages/Settings.js
import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardHeader, Switch, FormControlLabel, Divider, TextField, Button } from '@mui/material';

export default function Settings() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 4 }}>
        Configurações
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configurações Gerais
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel 
              control={<Switch defaultChecked />} 
              label="Notificações por e-mail"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <FormControlLabel 
              control={<Switch defaultChecked />} 
              label="Notificações no sistema"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <FormControlLabel 
              control={<Switch />} 
              label="Modo escuro"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <FormControlLabel 
              control={<Switch defaultChecked />} 
              label="Som de notificações"
              sx={{ mb: 2, display: 'block' }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configurações de Segurança
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel 
              control={<Switch defaultChecked />} 
              label="Autenticação em duas etapas"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <FormControlLabel 
              control={<Switch />} 
              label="Login por biometria"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <Typography variant="subtitle2" gutterBottom>
              Tempo de sessão inativa
            </Typography>
            <TextField
              select
              fullWidth
              defaultValue="30"
              variant="outlined"
              SelectProps={{
                native: true,
              }}
              sx={{ mb: 3 }}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
            </TextField>
            
            <Button variant="contained" color="primary">
              Salvar Alterações
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configurações do Sistema
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Configurações de Usuário" />
                  <CardContent>
                    <FormControlLabel 
                      control={<Switch defaultChecked />} 
                      label="Registro de usuários ativo"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    
                    <FormControlLabel 
                      control={<Switch defaultChecked />} 
                      label="Aprovação de registro necessária"
                      sx={{ mb: 2, display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Backup e Restauração" />
                  <CardContent>
                    <Button variant="outlined" sx={{ mr: 2, mb: 2 }}>
                      Backup Manual
                    </Button>
                    <Button variant="outlined" color="secondary" sx={{ mb: 2 }}>
                      Restaurar
                    </Button>
                    
                    <FormControlLabel 
                      control={<Switch defaultChecked />} 
                      label="Backup automático diário"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">
                Salvar Todas as Configurações
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}