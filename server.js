const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Configuração do servidor Express
const app = express();
const server = http.createServer(app);

// Configuração do servidor WebSocket
const wss = new WebSocket.Server({ server });

// Armazenar todas as conexões ativas
const clients = new Set();

// Manipular conexões WebSocket
wss.on('connection', (ws) => {
  // Adicionar cliente à lista
  clients.add(ws);
  console.log('Novo cliente conectado');

  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Bem-vindo ao chat!!!',
    timestamp: new Date().toISOString()
  }));

  // Notificar outros usuários sobre novo participante
  broadcastMessage({
    type: 'system',
    message: 'Um novo usuário entrou no chat',
    timestamp: new Date().toISOString()
  }, ws);

  // Lidar com mensagens recebidas
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensagem recebida:', data);
      
      // Adicionar timestamp à mensagem
      data.timestamp = new Date().toISOString();
      
      // Encaminhar a mensagem para todos os clientes
      broadcastMessage(data, ws);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  // Lidar com desconexão do cliente
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Cliente desconectado');
    
    // Notificar outros sobre a saída do usuário
    broadcastMessage({
      type: 'system',
      message: 'Um usuário saiu do chat',
      timestamp: new Date().toISOString()
    });
  });
});

// Função para enviar mensagem para todos os clientes
function broadcastMessage(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach(client => {
    // Verificar se o cliente está ativo e não é o remetente
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});