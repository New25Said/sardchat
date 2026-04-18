const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let chatHistory = [];
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // Enviar historial al entrar
    socket.emit('load-history', chatHistory);

    // Recibir mensaje y repartirlo
    socket.on('send-message', (data) => {
        data.socketId = socket.id;
        chatHistory.push(data);
        io.emit('new-message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor WineChat Online en puerto ' + PORT));
