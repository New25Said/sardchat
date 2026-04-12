const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Guardamos los mensajes en un array (se mantienen mientras el server esté encendido)
let chatHistory = [];

io.on('connection', (socket) => {
    // Cuando alguien entra, le enviamos el historial actual
    socket.emit('load history', chatHistory);

    socket.on('send message', (data) => {
        const newMessage = {
            user: data.user,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        chatHistory.push(newMessage);
        // Si el historial es muy largo, cortamos los viejos (opcional)
        if (chatHistory.length > 100) chatHistory.shift();

        // Enviamos el mensaje a todos los conectados
        io.emit('broadcast message', newMessage);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
