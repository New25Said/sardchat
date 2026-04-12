const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));

// 🧠 memoria temporal
let usersDB = {}; // username -> { password, nickname }
let onlineUsers = {}; // username -> socket.id
let chatHistory = [];

io.on('connection', (socket) => {

    // 🟢 REGISTRO
    socket.on('register', ({ username, password, nickname }) => {
        if (usersDB[username]) {
            socket.emit('register error', 'Usuario ya existe');
        } else {
            usersDB[username] = { password, nickname };
            socket.emit('register success');
        }
    });

    // 🔵 LOGIN
    socket.on('login', ({ username, password }) => {
        const user = usersDB[username];

        if (!user || user.password !== password) {
            socket.emit('login error', 'Datos incorrectos');
            return;
        }

        if (onlineUsers[username]) {
            socket.emit('login error', 'Usuario ya conectado');
            return;
        }

        socket.username = username;
        onlineUsers[username] = socket.id;

        socket.emit('login success', {
            username,
            nickname: user.nickname
        });

        socket.emit('load history', chatHistory);
    });

    // 💬 MENSAJE GLOBAL
    socket.on('send message', (text) => {
        if (!socket.username) return;

        const user = usersDB[socket.username];

        const msg = {
            user: socket.username,
            nickname: user.nickname,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        chatHistory.push(msg);
        if (chatHistory.length > 100) chatHistory.shift();

        io.emit('broadcast message', msg);
    });

    // ❌ DESCONECTAR
    socket.on('disconnect', () => {
        if (socket.username) {
            delete onlineUsers[socket.username];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor activo 🚀"));
