const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; 
let publicHistory = [];
let privateHistories = {}; 

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        users[data.username] = { id: socket.id, avatar: data.avatar, nickname: data.nickname };
        socket.username = data.username;
        io.emit('update users', users);
        socket.emit('load public', publicHistory);
    });

    socket.on('change profile', (data) => {
        if (users[socket.username]) {
            users[socket.username].avatar = data.avatar;
            users[socket.username].nickname = data.nickname;
            io.emit('profile updated', { username: socket.username, avatar: data.avatar, nickname: data.nickname });
        }
    });

    socket.on('send public', (msg) => {
        const data = { ...msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        publicHistory.push(data);
        if (publicHistory.length > 50) publicHistory.shift();
        io.emit('broadcast public', data);
    });

    socket.on('send private', (data) => {
        const room = [socket.username, data.to].sort().join('-');
        if (!privateHistories[room]) privateHistories[room] = [];
        const msgPayload = { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), from: socket.username };
        privateHistories[room].push(msgPayload);
        const target = users[data.to];
        if (target) io.to(target.id).emit('private message', msgPayload);
    });

    socket.on('get private history', (otherUser) => {
        const room = [socket.username, otherUser].sort().join('-');
        socket.emit('load private', { with: otherUser, history: privateHistories[room] || [] });
    });

    socket.on('check user', (target) => {
        if (users[target]) socket.emit('user exists', { username: target, avatar: users[target].avatar, nickname: users[target].nickname });
        else socket.emit('user not found', target);
    });

    socket.on('disconnect', () => {
        if (socket.username) { delete users[socket.username]; io.emit('update users', users); }
    });
});

server.listen(process.env.PORT || 3000);
