const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let usuarios = {};

io.on("connection", (socket) => {

  socket.on("nuevo_usuario", (username) => {
    usuarios[socket.id] = username;
  });

  socket.on("mensaje", (msg) => {
    io.emit("mensaje", {
      user: usuarios[socket.id],
      text: msg
    });
  });

  socket.on("disconnect", () => {
    delete usuarios[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en " + PORT);
});
