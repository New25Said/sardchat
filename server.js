const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; // { username: { nickname, avatar, id } }
let publicHistory = [];
let privateHistories = {}; 

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        // Si el usuario ya existe, actualizamos su ID de socket
        users[data.username] = { 
            nickname: data.nickname, 
            avatar: data.avatar || 'perfil.png', 
            id: socket.id 
        };
        socket.username = data.username;
        io.emit('update_users', users);
        socket.emit('load_public', publicHistory);
    });

    socket.on('update_profile', (data) => {
        if (users[socket.username]) {
            users[socket.username].nickname = data.nickname;
            users[socket.username].avatar = data.avatar;
            // Avisar a todos del cambio para actualizar mensajes viejos
            io.emit('profile_changed', { 
                username: socket.username, 
                nickname: data.nickname, 
                avatar: data.avatar 
            });
        }
    });

    socket.on('send_public', (msg) => {
        const fullMsg = { 
            ...msg, 
            from: socket.username, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        publicHistory.push(fullMsg);
        io.emit('broadcast_public', fullMsg);
    });

    socket.on('send_private', (data) => {
        const room = [socket.username, data.to].sort().join('-');
        if (!privateHistories[room]) privateHistories[room] = [];
        
        const msgPayload = {
            from: socket.username,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        privateHistories[room].push(msgPayload);

        const target = users[data.to];
        if (target) {
            io.to(target.id).emit('private_message', { ...msgPayload, nickname: users[socket.username].nickname, avatar: users[socket.username].avatar });
        }
    });

    socket.on('get_private_history', (other) => {
        const room = [socket.username, other].sort().join('-');
        socket.emit('load_private', { with: other, history: privateHistories[room] || [] });
    });

    socket.on('check_user', (target) => {
        if (users[target]) socket.emit('user_exists', { username: target, ...users[target] });
        else socket.emit('user_not_found', target);
    });
});

server.listen(process.env.PORT || 3000);
