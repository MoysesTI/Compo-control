// src/pages/Team.js
import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Avatar, Button, Chip, Card, CardContent, Divider, IconButton } from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, Chat as ChatIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Team() {
  const { isAdmin } = useAuth();
  const [team, setTeam] = useState([
    { 
      id: '1', 
      name: 'Ana Silva', 
      role: 'Designer', 
      email: 'ana@composicao.com', 
      phone: '(11) 91234-5678', 
      avatar: '', 
      projects: ['Banner XYZ', 'Logo Restaurante'],
      status: 'online'
    },
    { 
      id: '2', 
      name: 'Carlos Santos', 
      role: 'Instalador', 
      email: 'carlos@composicao.com', 
      phone: '(11) 91234-5679', 
      avatar: '', 
      projects: ['Adesivação Empresa ABC'],
      status: 'offline'
    },
    { 
      id: '3', 
      name: 'Juliana Alves', 
      role: 'Atendimento', 
      email: 'juliana@composicao.com', 
      phone: '(11) 91234-5680', 
      avatar: '', 
      projects: ['Orçamentos Pendentes'],
      status: 'away'
    },
    { 
      id: '4', 
      name: 'Roberto Oliveira', 
      role: 'Administrador', 
      email: 'roberto@composicao.com', 
      phone: '(11) 91234-5681', 
      avatar: '', 
      projects: ['Gestão Geral'],
      status: 'online'
    },
  ]);
  
  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success.main';
      case 'offline': return 'text.disabled';
      case 'away': return 'warning.main';
      default: return 'info.main';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Equipe
        </Typography>
        {isAdmin() && (
          <Button 
            variant="contained" 
            color="primary"
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            Adicionar Membro
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {team.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <CardContent sx={{ p: 0, flexGrow: 1 }}>
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  bgcolor: 'secondary.light',
                  position: 'relative',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: getStatusColor(member.status),
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      border: '2px solid white'
                    }} 
                  />
                  
                  {isAdmin() && (
                    <IconButton 
                      size="small" 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                  
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mb: 2, 
                      bgcolor: 'primary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {member.name}
                  </Typography>
                  <Chip 
                    label={member.role} 
                    size="small" 
                    sx={{ 
                      bgcolor: member.role === 'Administrador' ? 'primary.main' : 'primary.light',
                      color: 'white'
                    }} 
                  />
                </Box>
                
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2">{member.email}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2">{member.phone}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Projetos Ativos
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {member.projects.map((project, idx) => (
                      <Chip 
                        key={idx} 
                        label={project} 
                        size="small" 
                        sx={{ bgcolor: 'secondary.light' }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  startIcon={<ChatIcon />} 
                  variant="outlined" 
                  size="small"
                  sx={{ color: 'primary.main', borderColor: 'primary.main' }}
                >
                  Enviar Mensagem
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}