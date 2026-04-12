const socket = io();

let username = "";

// ENTRAR
function entrar() {
  const u = user.value.trim();

  if (!/^[a-z0-9]+$/.test(u)) {
    return alert("solo minúsculas y números");
  }

  username = u;

  localStorage.setItem("user", username);

  socket.emit("join", username);

  login.style.display = "none";
  app.style.display = "block";
}

// ENVIAR
function enviar() {
  if (!msg.value) return;

  socket.emit("mensaje", msg.value);
  msg.value = "";
}

// HISTORIAL
socket.on("historial", (msgs) => {
  chat.innerHTML = "";
  msgs.forEach(m => agregar(m));
});

// MENSAJE NUEVO
socket.on("mensaje", (m) => {
  agregar(m);
});

function agregar(m) {
  const div = document.createElement("div");

  div.className = "msg " + (m.user === username ? "tuyo" : "otros");

  div.textContent = m.user + ": " + m.text;

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
}

// AUTO LOGIN
window.onload = () => {
  const saved = localStorage.getItem("user");

  if (saved) {
    user.value = saved;
    entrar();
  }
};
