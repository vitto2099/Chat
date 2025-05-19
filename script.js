// Elementos do DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('username');
const sendButton = document.getElementById('sendButton');
const connectionStatus = document.getElementById('connectionStatus');

// Configuração do WebSocket
let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 segundos

// Iniciar conexão
connectToWebSocket();

// Função para conectar ao WebSocket
function connectToWebSocket() {
    // Usar o host atual, mas com WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Para desenvolvimento local, pode usar este endereço:
    const wsUrl = `${protocol}//${window.location.hostname}:3000`;
    
    updateConnectionStatus('connecting', 'Conectando...');
    
    socket = new WebSocket(wsUrl);
    
    // Eventos do WebSocket
    socket.onopen = onSocketOpen;
    socket.onmessage = onSocketMessage;
    socket.onclose = onSocketClose;
    socket.onerror = onSocketError;
}

// Manipulador para abertura da conexão
function onSocketOpen() {
    console.log('Conectado ao servidor WebSocket');
    updateConnectionStatus('connected', 'Conectado');
    reconnectAttempts = 0;
}

// Manipulador para recebimento de mensagens
function onSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        displayMessage(data);
    } catch (error) {
        console.error('Erro ao processar mensagem recebida:', error);
    }
}

// Manipulador para fechamento da conexão
function onSocketClose() {
    updateConnectionStatus('disconnected', 'Desconectado');
    
    // Tentar reconectar automaticamente
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        updateConnectionStatus('connecting', `Reconectando (${reconnectAttempts}/${maxReconnectAttempts})...`);
        
        setTimeout(connectToWebSocket, reconnectDelay);
    } else {
        updateConnectionStatus('disconnected', 'Falha na conexão. Recarregue a página.');
    }
}

// Manipulador para erros de conexão
function onSocketError(error) {
    console.error('Erro na conexão WebSocket:', error);
    updateConnectionStatus('disconnected', 'Erro na conexão');
}

// Atualizar o status da conexão
function updateConnectionStatus(state, message) {
    connectionStatus.textContent = message;
    connectionStatus.className = 'connection-status ' + state;
}

// Enviar mensagem
function sendMessage() {
    const username = usernameInput.value.trim() || 'Anônimo';
    const message = messageInput.value.trim();
    
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        const data = {
            type: 'user',
            username: username,
            message: message
        };
        
        socket.send(JSON.stringify(data));
        messageInput.value = '';
        
        // Exibir a mensagem enviada localmente
        displayMessage({
            ...data,
            timestamp: new Date().toISOString(),
            isOwnMessage: true
        });
    }
}

// Exibir mensagem na interface
function displayMessage(data) {
    const messageElement = document.createElement('div');
    
    // Determinar o tipo de mensagem (usuário, sistema)
    let messageClass = data.type;
    if (data.type === 'user') {
        messageClass = data.isOwnMessage ? 'user' : 'other';
    }
    
    messageElement.className = `message ${messageClass}`;
    
    // Formatar a data
    const timestamp = new Date(data.timestamp);
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Adicionar conteúdo da mensagem
    if (data.type === 'system') {
        messageElement.innerHTML = `
            <div class="message-content">${data.message}</div>
            <div class="timestamp">${formattedTime}</div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="username">${data.username}</div>
            <div class="message-content">${data.message}</div>
            <div class="timestamp">${formattedTime}</div>
        `;
    }
    
    // Adicionar ao container de mensagens
    chatMessages.appendChild(messageElement);
    
    // Rolar para a mensagem mais recente
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Para facilitar o teste, permitir que o usuário pressione Enter no campo de usuário
usernameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        messageInput.focus();
    }
});