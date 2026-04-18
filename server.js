const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io con CORS para evitar bloqueos en el despliegue
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Memoria volátil para el historial (se borra si el server se reinicia/apaga)
let chatHistory = [];

// Servir archivos estáticos (index.html, style.css, baner.png) desde la raíz
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Lógica de comunicación en tiempo real
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Al conectar, enviamos el historial completo al cliente
    socket.emit('load-history', chatHistory);

    // Escuchar cuando un usuario envía un mensaje
    socket.on('send-message', (data) => {
        // Enriquecemos el mensaje con el ID del socket para identificar autoría
        const messagePayload = {
            n: data.n,           // Nickname
            p: data.p,           // Photo (Base64)
            txt: data.txt,       // Texto del mensaje
            t: data.t,           // Tipo (u=user, s=sys, a=aviso)
            socketId: socket.id, // ID único de la conexión actual
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Guardar en el historial del servidor
        chatHistory.push(messagePayload);

        // Retransmitir a TODOS los usuarios conectados
        io.emit('new-message', messagePayload);
    });

    // Notificar desconexión en consola (opcional)
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});

// Puerto dinámico para Render o 3000 local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ======================================
       WineChat Pro corriendo en puerto ${PORT}
    ======================================
    `);
});
