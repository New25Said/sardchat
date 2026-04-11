const socket = io();

let username = "";

function entrar() {
  username = document.getElementById("username").value;

  if (!username) return alert("Pon username");

  socket.emit("nuevo_usuario", username);

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

function enviar() {
  const input = document.getElementById("msg");

  if (!input.value) return;

  socket.emit("mensaje", input.value);
  input.value = "";
}

socket.on("mensaje", (data) => {
  const div = document.createElement("div");
  div.className = "mensaje";
  div.textContent = data.user + ": " + data.text;

  document.getElementById("mensajes").appendChild(div);
});
