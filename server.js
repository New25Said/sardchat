const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Memoria volátil del servidor (Se borra solo si Render apaga el server)
let chatHistory = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // En cuanto alguien conecta, le enviamos TODO el historial de golpe
    socket.emit('load history', chatHistory);

    socket.on('join', (data) => {
        socket.user = data; 
    });

    socket.on('message', (msg) => {
        if (socket.user) {
            const messageData = {
                text: msg,
                user: socket.user.nickname,
                photo: socket.user.photo,
                id: socket.id + Date.now() // ID único para el mensaje
            };
            
            chatHistory.push(messageData); // Guardar en la RAM
            io.emit('message', messageData); // Envío instantáneo a todos
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`WineChat vivo en puerto ${PORT}`));
