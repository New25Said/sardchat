const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; // { nickname: { id, avatar } }
let publicHistory = [];
let privateHistories = {}; 

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        users[data.user] = { id: socket.id, avatar: data.avatar };
        socket.nickname = data.user;
        io.emit('update users', users);
        socket.emit('load public', publicHistory);
    });

    // Validar si un usuario existe para agregarlo
    socket.on('check user', (target) => {
        if (users[target]) {
            socket.emit('user exists', { user: target, avatar: users[target].avatar });
        } else {
            socket.emit('user not found', target);
        }
    });

    socket.on('send public', (msg) => {
        const data = { ...msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        publicHistory.push(data);
        if (publicHistory.length > 50) publicHistory.shift();
        io.emit('broadcast public', data);
    });

    socket.on('get private history', (otherUser) => {
        const room = [socket.nickname, otherUser].sort().join('-');
        socket.emit('load private', { 
            with: otherUser, 
            history: privateHistories[room] || [] 
        });
    });

    socket.on('send private', (data) => {
        const room = [socket.nickname, data.to].sort().join('-');
        if (!privateHistories[room]) privateHistories[room] = [];

        const msgPayload = {
            from: socket.nickname,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: data.avatar
        };

        privateHistories[room].push(msgPayload);
        
        const target = users[data.to];
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
server.listen(PORT, () => console.log('SayChat V3 Ready'));
