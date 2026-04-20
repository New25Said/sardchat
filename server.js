const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    socket.emit('load history', chatHistory);

    socket.on('join', (data) => {
        socket.user = data; 
        // Notificación de sistema al entrar
        const welcomeMsg = { text: `${data.nickname} se ha unido al chat`, type: 'sys' };
        chatHistory.push(welcomeMsg);
        io.emit('message', welcomeMsg);
    });

    socket.on('message', (msg) => {
        if (socket.user) {
            let messageData = {
                user: socket.user.nickname,
                photo: socket.user.photo,
                type: 'user',
                id: socket.id + Date.now()
            };

            // Lógica de Comandos
            if (msg.startsWith('/sys ')) {
                messageData.text = msg.replace('/sys ', '');
                messageData.type = 'sys';
            } else if (msg.startsWith('/aviso ')) {
                messageData.text = msg.replace('/aviso ', '');
                messageData.type = 'aviso';
            } else {
                messageData.text = msg;
            }
            
            chatHistory.push(messageData);
            io.emit('message', messageData);
        }
    });

    socket.on('disconnect', () => {
        if (socket.user) {
            const byeMsg = { text: `${socket.user.nickname} ha salido del chat`, type: 'sys' };
            chatHistory.push(byeMsg);
            io.emit('message', byeMsg);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`WineChat Pro en puerto ${PORT}`));
