const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// crear archivo si no existe
if (!fs.existsSync("messages.json")) {
  fs.writeFileSync("messages.json", "[]");
}

let mensajes = JSON.parse(fs.readFileSync("messages.json"));

// guardar mensajes
function guardar() {
  fs.writeFileSync("messages.json", JSON.stringify(mensajes, null, 2));
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {

    if (!/^[a-z0-9]+$/.test(username)) {
      return socket.emit("error", "solo minúsculas y números");
    }

    socket.username = username;

    socket.emit("historial", mensajes);
  });

  socket.on("mensaje", (text) => {

    if (!socket.username) return;

    const msg = {
      user: socket.username,
      text
    };

    mensajes.push(msg);
    guardar();

    io.emit("mensaje", msg);
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
