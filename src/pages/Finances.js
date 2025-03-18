import React from 'react';
import { Box, Typography, Tabs, Tab, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function Finances() {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data - futuramente será substituído por dados do Firebase
  const orçamentos = [
    { id: '1', cliente: 'Empresa A', serviço: 'Adesivação', valor: 1200.00, status: 'Aprovado', data: '10/03/2023' },
    { id: '2', cliente: 'Empresa B', serviço: 'Banner', valor: 850.00, status: 'Pendente', data: '15/03/2023' },
    { id: '3', cliente: 'Empresa C', serviço: 'Logo', valor: 2000.00, status: 'Aprovado', data: '18/03/2023' },
  ];

  const notasFiscais = [
    { id: '1', numero: 'NF-001', cliente: 'Empresa A', valor: 1200.00, status: 'Paga', data: '15/03/2023' },
    { id: '3', numero: 'NF-002', cliente: 'Empresa C', valor: 2000.00, status: 'Emitida', data: '20/03/2023' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Finanças</Typography>
        <Button variant="contained" color="primary">
          {tabValue === 0 ? 'Novo Orçamento' : 'Nova Nota Fiscal'}
        </Button>
      </Box>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Orçamentos" />
        <Tab label="Notas Fiscais" />
        <Tab label="Relatórios" />
      </Tabs>
      
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Serviço</TableCell>
                <TableCell align="right">Valor (R$)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orçamentos.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.cliente}</TableCell>
                  <TableCell>{row.serviço}</TableCell>
                  <TableCell align="right">{row.valor.toFixed(2)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.data}</TableCell>
                  <TableCell>
                    <Button size="small">Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Valor (R$)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notasFiscais.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.numero}</TableCell>
                  <TableCell>{row.cliente}</TableCell>
                  <TableCell align="right">{row.valor.toFixed(2)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.data}</TableCell>
                  <TableCell>
                    <Button size="small">Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Relatórios
          </Typography>
          <Typography>
            Em breve: Gráficos e relatórios de desempenho financeiro
          </Typography>
        </Paper>
      )}
    </Box>
  );
}