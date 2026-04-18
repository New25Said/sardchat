const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Al entrar, enviamos todo lo que existe en la RAM
    socket.emit('load history', chatHistory);

    socket.on('message', (data) => {
        // Guardamos el mensaje exactamente como llegó
        chatHistory.push(data);
        // Lo enviamos a todos los conectados
        io.emit('new message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor WineChat Online'));
