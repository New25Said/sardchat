const socket = io();

let username = "";

function registro() {
  socket.emit("registro", {
    username: user.value,
    password: pass.value
  });
}

function login() {
  socket.emit("login", {
    username: user.value,
    password: pass.value
  });
}

socket.on("login_ok", (user) => {
  username = user;
  login.style.display = "none";
  chat.style.display = "block";
});

socket.on("error_login", (msg) => {
  alert(msg);
});

function enviar() {
  socket.emit("mensaje", msg.value);
  msg.value = "";
}

socket.on("mensaje", (data) => {
  const div = document.createElement("div");
  div.textContent = data.user + ": " + data.text;
  mensajes.appendChild(div);
});
