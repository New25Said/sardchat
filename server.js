const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; 

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        users[data.user] = { id: socket.id, avatar: data.avatar, nick: data.nick };
        socket.username = data.user;
        io.emit('update_users', users);
    });

    socket.on('send_public', (msg) => {
        io.emit('rcv_public', { ...msg, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    });

    socket.on('send_private', (data) => {
        const target = users[data.to];
        if (target) {
            io.to(target.id).emit('rcv_private', { 
                from: socket.username, 
                text: data.text, 
                nick: data.nick,
                avatar: data.avatar,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.username];
        io.emit('update_users', users);
    });
});

server.listen(process.env.PORT || 3000);
