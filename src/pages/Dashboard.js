import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader, IconButton, Divider, Avatar, LinearProgress } from '@mui/material';
import { MoreVert as MoreVertIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState({
    pendingTasks: 0,
    activeProjects: 0,
    pendingQuotes: 0,
    completedTasks: 0
  });

  useEffect(() => {
    // Aqui iremos adicionar os dados reais quando o Firestore estiver configurado
    // Por enquanto, usamos dados de exemplo
    setRecentTasks([
      { id: '1', title: 'Design de banner', client: 'Loja ABC', dueDate: '2023-08-15', status: 'Em andamento', progress: 75 },
      { id: '2', title: 'Adesivação de veículo', client: 'Empresa XYZ', dueDate: '2023-08-18', status: 'Pendente', progress: 30 },
      { id: '3', title: 'Criação de logo', client: 'Restaurante Delícia', dueDate: '2023-08-10', status: 'Concluído', progress: 100 },
    ]);

    setStats({
      pendingTasks: 8,
      activeProjects: 4,
      pendingQuotes: 3,
      completedTasks: 12
    });
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="primary" size="large" sx={{ bgcolor: 'secondary.light', borderRadius: 2 }}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light'
          }}>
            <Typography variant="subtitle2" color="text.secondary">Tarefas Pendentes</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.pendingTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats.pendingTasks > 5 ? 'Atenção necessária' : 'Dentro do esperado'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light'
          }}>
            <Typography variant="subtitle2" color="text.secondary">Projetos Ativos</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.activeProjects}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats.activeProjects > 0 ? 'Em andamento' : 'Nenhum no momento'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light'
          }}>
            <Typography variant="subtitle2" color="text.secondary">Orçamentos Pendentes</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.pendingQuotes}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats.pendingQuotes > 0 ? 'Aguardando aprovação' : 'Nenhum pendente'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            height: '100%',
            bgcolor: 'neutral.white',
            border: '1px solid',
            borderColor: 'neutral.light'
          }}>
            <Typography variant="subtitle2" color="text.secondary">Tarefas Concluídas</Typography>
            <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
              {stats.completedTasks}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Este mês
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tarefas recentes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: 'neutral.white'
          }}>
            <CardHeader
              title="Tarefas Recentes"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ bgcolor: 'secondary.light', py: 2 }}
            />
            <CardContent sx={{ p: 0 }}>
              {recentTasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        py: 0.5, 
                        px: 1.5, 
                        borderRadius: 5, 
                        bgcolor: 
                          task.status === 'Concluído' ? 'accent.success' : 
                          task.status === 'Em andamento' ? 'accent.info' : 
                          'accent.warning',
                        color: 'white',
                      }}>
                        {task.status}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Cliente: {task.client}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={task.progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 5,
                            bgcolor: 'neutral.light',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 
                                task.progress === 100 ? 'accent.success' : 
                                task.progress > 50 ? 'accent.info' : 
                                'accent.warning'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {task.progress}%
                      </Typography>
                    </Box>
                  </Box>
                  {index < recentTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Seção de membros da equipe */}
        <Grid item xs={12} md={5}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: 'neutral.white',
            height: '100%'
          }}>
            <CardHeader
              title="Equipe"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ bgcolor: 'secondary.light', py: 2 }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Dados de exemplo para a equipe */}
                {[
                  { id: '1', name: 'Ana Silva', role: 'Designer', tasks: 5, avatar: '' },
                  { id: '2', name: 'Carlos Santos', role: 'Instalador', tasks: 3, avatar: '' },
                  { id: '3', name: 'Juliana Alves', role: 'Atendimento', tasks: 2, avatar: '' },
                ].map((member) => (
                  <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{member.role}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      py: 0.5, 
                      px: 1.5, 
                      borderRadius: 5, 
                      bgcolor: 'primary.light',
                      color: 'white',
                    }}>
                      {member.tasks} tarefas
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}