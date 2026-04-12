const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 🔒 Cargar archivos (si no existen, los crea)
function cargarJSON(ruta, defecto) {
  if (!fs.existsSync(ruta)) {
    fs.writeFileSync(ruta, JSON.stringify(defecto, null, 2));
  }
  return JSON.parse(fs.readFileSync(ruta));
}

let cuentas = cargarJSON("users.json", {});
let mensajesGlobal = cargarJSON("messages.json", []);
let privados = cargarJSON("privates.json", {});
let grupos = cargarJSON("groups.json", {});

// 💾 Guardar
function guardar() {
  fs.writeFileSync("users.json", JSON.stringify(cuentas, null, 2));
  fs.writeFileSync("messages.json", JSON.stringify(mensajesGlobal, null, 2));
  fs.writeFileSync("privates.json", JSON.stringify(privados, null, 2));
  fs.writeFileSync("groups.json", JSON.stringify(grupos, null, 2));
}

// 👥 usuarios conectados
let online = {};

io.on("connection", (socket) => {

  // 🧾 REGISTRO
  socket.on("registro", ({ username, password, nickname }) => {

    if (cuentas[username]) {
      return socket.emit("error", "Usuario ya existe");
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      return socket.emit("error", "Solo letras y números minúsculos");
    }

    cuentas[username] = {
      password,
      nickname,
      photo: ""
    };

    guardar();
    socket.emit("login_ok", username);
  });

  // 🔐 LOGIN
  socket.on("login", ({ username, password }) => {

    if (!cuentas[username] || cuentas[username].password !== password) {
      return socket.emit("error", "Login incorrecto");
    }

    online[socket.id] = username;

    socket.emit("login_ok", username);

    // enviar historial global
    socket.emit("historial_global", mensajesGlobal);
  });

  // 🌍 MENSAJE GLOBAL
  socket.on("mensaje_global", (text) => {
    const user = online[socket.id];

    const msg = {
      user,
      nickname: cuentas[user].nickname,
      text,
      time: Date.now()
    };

    mensajesGlobal.push(msg);
    guardar();

    io.emit("mensaje_global", msg);
  });

  // 💬 MENSAJE PRIVADO
  socket.on("mensaje_privado", ({ to, text }) => {
    const from = online[socket.id];

    if (!privados[from]) privados[from] = {};
    if (!privados[to]) privados[to] = {};

    if (!privados[from][to]) privados[from][to] = [];
    if (!privados[to][from]) privados[to][from] = [];

    const msg = {
      from,
      to,
      text,
      time: Date.now()
    };

    privados[from][to].push(msg);
    privados[to][from].push(msg);

    guardar();

    io.emit("mensaje_privado", msg);
  });

  // 📥 CARGAR CHAT PRIVADO
  socket.on("cargar_privado", (user2) => {
    const user1 = online[socket.id];

    const chat = privados[user1]?.[user2] || [];
    socket.emit("historial_privado", chat);
  });

  // 👥 CREAR GRUPO
  socket.on("crear_grupo", ({ nombre, miembros }) => {
    grupos[nombre] = {
      miembros,
      mensajes: []
    };
    guardar();
  });

  // 👥 MENSAJE GRUPO
  socket.on("mensaje_grupo", ({ grupo, text }) => {
    const user = online[socket.id];

    const msg = {
      user,
      text,
      time: Date.now()
    };

    grupos[grupo].mensajes.push(msg);
    guardar();

    io.emit("mensaje_grupo", { grupo, msg });
  });

  // ⚙️ PERFIL
  socket.on("perfil", ({ nickname, photo }) => {
    const user = online[socket.id];

    cuentas[user].nickname = nickname || cuentas[user].nickname;
    cuentas[user].photo = photo || cuentas[user].photo;

    guardar();
  });

  socket.on("disconnect", () => {
    delete online[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
