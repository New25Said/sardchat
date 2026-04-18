const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];
let activeUsers = {}; 

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // Al conectar enviamos el historial y los usuarios actuales
    socket.emit('init', { history: chatHistory, users: activeUsers });

    socket.on('join', (data) => {
        activeUsers[socket.id] = { 
            nickname: data.nickname, 
            photo: data.photo 
        };
        
        const systemMsg = { text: `${data.nickname} se ha unido`, type: 'system' };
        chatHistory.push(systemMsg);
        
        io.emit('user list update', activeUsers);
        io.emit('message', systemMsg);
    });

    socket.on('update profile', (data) => {
        if (activeUsers[socket.id]) {
            const oldName = activeUsers[socket.id].nickname;
            activeUsers[socket.id] = { nickname: data.nickname, photo: data.photo };
            
            io.emit('user list update', activeUsers);
            io.emit('message', { text: `${oldName} ahora es ${data.nickname}`, type: 'system' });
        }
    });

    socket.on('message', (text) => {
        if (activeUsers[socket.id]) {
            const msgData = {
                text: text,
                userId: socket.id,
                type: 'user',
                time: Date.now()
            };
            chatHistory.push(msgData);
            io.emit('message', msgData);
        }
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            const name = activeUsers[socket.id].nickname;
            delete activeUsers[socket.id];
            io.emit('user list update', activeUsers);
            io.emit('message', { text: `${name} ha salido del chat`, type: 'system' });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor WineChat escuchando en puerto ' + PORT));
