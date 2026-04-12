const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; // Aquí guardamos: { username: { nick, avatar, id } }
let publicHistory = [];

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        users[data.u] = { nick: data.n, avatar: data.a, id: socket.id };
        socket.username = data.u;
        io.emit('sync_users', users); // Avisar a todos quién está online
        socket.emit('init_public', publicHistory);
    });

    socket.on('update_profile', (data) => {
        if (users[socket.username]) {
            users[socket.username].nick = data.n;
            users[socket.username].avatar = data.a;
            io.emit('sync_users', users); // Sincronización universal
        }
    });

    socket.on('msg_public', (msg) => {
        const fullMsg = { ...msg, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
        publicHistory.push(fullMsg);
        if (publicHistory.length > 50) publicHistory.shift();
        io.emit('rcv_public', fullMsg);
    });

    socket.on('msg_private', (data) => {
        const target = users[data.to];
        if (target) {
            io.to(target.id).emit('rcv_private', { 
                from: socket.username, 
                text: data.text,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) delete users[socket.username];
        io.emit('sync_users', users);
    });
});

server.listen(process.env.PORT || 3000);
