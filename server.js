const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Memoria volátil del chat
let chatHistory = [];

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Enviar historial completo al nuevo usuario
    socket.emit('load-history', chatHistory);

    socket.on('send-message', (data) => {
        // Estampamos el socketId para identificar al autor en el cliente
        const messagePayload = {
            ...data,
            socketId: socket.id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        chatHistory.push(messagePayload);
        io.emit('new-message', messagePayload);
    });

    socket.on('disconnect', () => {
        // Aquí podrías añadir lógica de "Desconectado" si lo deseas a futuro
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`>>> Servidor iniciado en puerto ${PORT}`));
