const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs-extra");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DB_FILE = "./data.json";

app.use(express.static("public"));

async function loadDB() {
  return await fs.readJSON(DB_FILE);
}

async function saveDB(data) {
  await fs.writeJSON(DB_FILE, data, { spaces: 2 });
}

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  socket.on("login", async ({ username, avatar }) => {
    const db = await loadDB();

    if (!db.users[username]) {
      db.users[username] = { avatar };
    }

    onlineUsers[username] = socket.id;
    socket.username = username;

    await saveDB(db);

    io.emit("userList", Object.keys(onlineUsers));

    io.emit("systemMessage", {
      text: `${username} se ha conectado`
    });

    socket.emit("loadMessages", db.messages);
  });

  socket.on("sendMessage", async (msg) => {
    const db = await loadDB();

    if (msg.to === "global") {
      db.messages.global.push(msg);
      io.emit("newMessage", msg);
    } else {
      const key = [msg.from, msg.to].sort().join("-");
      if (!db.messages.private[key]) db.messages.private[key] = [];
      db.messages.private[key].push(msg);

      io.to(onlineUsers[msg.to]).emit("newMessage", msg);
      socket.emit("newMessage", msg);
    }

    await saveDB(db);
  });

  socket.on("disconnect", async () => {
    const username = socket.username;
    if (!username) return;

    delete onlineUsers[username];

    io.emit("userList", Object.keys(onlineUsers));
    io.emit("systemMessage", {
      text: `${username} se ha desconectado`
    });
  });
});

server.listen(3000, () => console.log("Server ON"));
