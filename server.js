const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; // { nickname: { id, avatar } }
let publicHistory = [];

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        // Guardamos al usuario y su avatar
        users[data.user] = { id: socket.id, avatar: data.avatar };
        socket.nickname = data.user;
        io.emit('update users', users); // Avisar a todos quién está conectado
        socket.emit('load public', publicHistory);
    });

    // Mensaje Público
    socket.on('send public', (msg) => {
        const data = { ...msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        publicHistory.push(data);
        if (publicHistory.length > 50) publicHistory.shift();
        io.emit('broadcast public', data);
    });

    // Mensaje Privado
    socket.on('send private', (data) => {
        const target = users[data.to];
        const msgPayload = {
            from: socket.nickname,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: data.avatar
        };
        if (target) {
            io.to(target.id).emit('private message', msgPayload);
        }
    });

    socket.on('disconnect', () => {
        if (socket.nickname) {
            delete users[socket.nickname];
            io.emit('update users', users);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Ready'));
