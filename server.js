const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir el HTML directamente desde la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.user = data; 
    });

    socket.on('message', (msg) => {
        if (socket.user) {
            io.emit('message', {
                text: msg,
                user: socket.user.nickname,
                photo: socket.user.photo
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
