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
    socket.emit('load-history', chatHistory);
    socket.on('send-message', (data) => {
        data.socketId = socket.id;
        chatHistory.push(data);
        io.emit('new-message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor en línea'));
