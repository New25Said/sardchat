const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];
let users = {}; // { socketId: { nickname, photo, isRegistered: true } }

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Al conectar, enviamos el historial y la lista de usuarios actual
    socket.emit('init', { history: chatHistory, users: users });

    socket.on('join', (data) => {
        const isFirstTime = !users[socket.id];
        users[socket.id] = { 
            nickname: data.nickname, 
            photo: data.photo, 
            isRegistered: true 
        };

        // Notificar entrada
        const systemMsg = { text: `${data.nickname} ha entrado al chat`, type: 'system' };
        chatHistory.push(systemMsg);
        
        io.emit('user list update', users);
        io.emit('message', systemMsg);
    });

    socket.on('update profile', (data) => {
        if (users[socket.id]) {
            const oldName = users[socket.id].nickname;
            users[socket.id].nickname = data.nickname;
            users[socket.id].photo = data.photo;

            io.emit('user list update', users); // Esto actualiza nombres en mensajes viejos
            io.emit('message', { text: `${oldName} ahora es ${data.nickname}`, type: 'system' });
        }
    });

    socket.on('message', (text) => {
        if (users[socket.id]) {
            const msgData = {
                text: text,
                userId: socket.id, // Referencia al usuario
                type: 'user',
                time: Date.now()
            };
            chatHistory.push(msgData);
            io.emit('message', msgData);
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const name = users[socket.id].nickname;
            delete users[socket.id];
            io.emit('user list update', users);
            io.emit('message', { text: `${name} se ha desconectado`, type: 'system' });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor WineChat Pro corriendo...'));
