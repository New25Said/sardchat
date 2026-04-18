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

io.on('connection', (socket) => {
    socket.emit('init', { history: chatHistory, users: activeUsers });

    socket.on('join', (data) => {
        activeUsers[socket.id] = { nickname: data.nickname, photo: data.photo };
        const systemMsg = { text: `${data.nickname} se ha unido`, type: 'system' };
        chatHistory.push(systemMsg);
        io.emit('user list update', activeUsers);
        io.emit('message', systemMsg);
    });

    socket.on('update profile', (data) => {
        if (activeUsers[socket.id]) {
            const oldName = activeUsers[socket.id].nickname;
            activeUsers[socket.id] = { nickname: data.nickname, photo: data.photo };
            
            // Actualizamos el historial para que los que entren nuevos vean el cambio
            chatHistory.forEach(msg => {
                if(msg.userId === socket.id) {
                    msg.userNick = data.nickname;
                    msg.userPhoto = data.photo;
                }
            });

            io.emit('user list update', activeUsers);
            io.emit('message', { text: `${oldName} ahora es ${data.nickname}`, type: 'system' });
        }
    });

    socket.on('message', (data) => {
        if (!activeUsers[socket.id]) return;
        const user = activeUsers[socket.id];
        let msgData = {
            userId: socket.id,
            userNick: user.nickname,
            userPhoto: user.photo,
            time: Date.now()
        };

        if (data.startsWith('/sys ')) {
            msgData.text = data.replace('/sys ', '');
            msgData.type = 'system';
        } else if (data.startsWith('/aviso ')) {
            msgData.text = data.replace('/aviso ', '');
            msgData.type = 'aviso';
        } else {
            msgData.text = data;
            msgData.type = 'user';
        }

        chatHistory.push(msgData);
        io.emit('message', msgData);
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            const name = activeUsers[socket.id].nickname;
            delete activeUsers[socket.id];
            io.emit('user list update', activeUsers);
            io.emit('message', { text: `${name} ha salido`, type: 'system' });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('WineChat Pro Online'));
