const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {}; // Almacena { username: { nick, avatar, id } }
let publicHistory = [];
let privateHistories = {}; 

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        // Registro de usuario con su perfil completo
        users[data.u] = { nick: data.n, avatar: data.a || 'perfil.png', id: socket.id };
        socket.username = data.u;
        io.emit('sync_users', users); // Sincroniza la lista de contactos para todos
        socket.emit('init_public', publicHistory);
    });

    socket.on('update_profile', (data) => {
        if (users[socket.username]) {
            users[socket.username].nick = data.n;
            users[socket.username].avatar = data.a;
            io.emit('sync_users', users); // Actualización instantánea de perfiles
        }
    });

    socket.on('msg_public', (msg) => {
        const fullMsg = { 
            ...msg, 
            from: socket.username,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
        };
        publicHistory.push(fullMsg);
        if (publicHistory.length > 50) publicHistory.shift();
        io.emit('rcv_public', fullMsg);
    });

    socket.on('msg_private', (data) => {
        const target = users[data.to];
        if (target) {
            const pm = { 
                from: socket.username, 
                text: data.text,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
            };
            
            const room = [socket.username, data.to].sort().join('-');
            if (!privateHistories[room]) privateHistories[room] = [];
            privateHistories[room].push(pm);

            io.to(target.id).emit('rcv_private', pm);
        }
    });

    socket.on('get_private_history', (other) => {
        const room = [socket.username, other].sort().join('-');
        socket.emit('load_private', { with: other, history: privateHistories[room] || [] });
    });

    socket.on('disconnect', () => {
        if (socket.username) delete users[socket.username];
        io.emit('sync_users', users);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`SayChat corriendo en ${PORT}`));
