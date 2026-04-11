const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let usuarios = {};
let cuentas = JSON.parse(fs.readFileSync("users.json"));

// Registrar usuario
io.on("connection", (socket) => {

  socket.on("registro", ({ username, password }) => {
    if (cuentas[username]) {
      socket.emit("error_login", "Usuario ya existe");
      return;
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      socket.emit("error_login", "Username inválido");
      return;
    }

    cuentas[username] = { password };
    fs.writeFileSync("users.json", JSON.stringify(cuentas));

    socket.emit("login_ok", username);
  });

  // Login
  socket.on("login", ({ username, password }) => {
    if (!cuentas[username]) {
      socket.emit("error_login", "No existe");
      return;
    }

    if (cuentas[username].password !== password) {
      socket.emit("error_login", "Contraseña incorrecta");
      return;
    }

    usuarios[socket.id] = username;
    socket.emit("login_ok", username);
  });

  // Mensajes
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
