const socket = io();

let currentUser = "";
let chatPrivadoCon = "";
let grupoActual = "";
let modo = "global";

// 🔐 LOGIN / REGISTRO
function registro() {
  if (!user.value || !pass.value || !nick.value) {
    return alert("Completa todo");
  }

  socket.emit("registro", {
    username: user.value.trim(),
    password: pass.value.trim(),
    nickname: nick.value.trim()
  });
}

function login() {
  if (!user.value || !pass.value) {
    return alert("Faltan datos");
  }

  socket.emit("login", {
    username: user.value.trim(),
    password: pass.value.trim()
  });
}

socket.on("login_ok", (u) => {
  currentUser = u;
  login.style.display = "none";
  app.style.display = "flex";
});

socket.on("error", (msg) => alert(msg));


// 🌍 GLOBAL
function enviarGlobal() {
  if (!msg_global.value) return;

  socket.emit("mensaje_global", msg_global.value);
  msg_global.value = "";
}

socket.on("historial_global", (msgs) => {
  mensajes_global.innerHTML = "";
  msgs.forEach(m => agregarMensaje(mensajes_global, m));
});

socket.on("mensaje_global", (m) => {
  agregarMensaje(mensajes_global, m);
});


// 💬 PRIVADO
function cargarPrivado() {
  if (!user2.value) return;

  modo = "privado";
  chatPrivadoCon = user2.value;

  cambiarVista();

  socket.emit("cargar_privado", chatPrivadoCon);
}

function enviarPrivado() {
  if (!msg_privado.value || !chatPrivadoCon) return;

  socket.emit("mensaje_privado", {
    to: chatPrivadoCon,
    text: msg_privado.value
  });

  msg_privado.value = "";
}

socket.on("historial_privado", (msgs) => {
  mensajes_privado.innerHTML = "";
  msgs.forEach(m => agregarPrivado(m));
});

socket.on("mensaje_privado", (m) => {
  if (m.from === chatPrivadoCon || m.to === chatPrivadoCon) {
    agregarPrivado(m);
  }
});

function agregarPrivado(m) {
  const esMio = m.from === currentUser;

  const div = document.createElement("div");
  div.className = "msg " + (esMio ? "tuyo" : "otros");
  div.textContent = m.from + ": " + m.text;

  mensajes_privado.appendChild(div);
}


// 👥 GRUPOS
function abrirGrupo() {
  if (!grupo_actual.value) return;

  modo = "grupo";
  grupoActual = grupo_actual.value;

  cambiarVista();
}

function enviarGrupo() {
  if (!msg_grupo.value || !grupoActual) return;

  socket.emit("mensaje_grupo", {
    grupo: grupoActual,
    text: msg_grupo.value
  });

  msg_grupo.value = "";
}

socket.on("mensaje_grupo", ({ grupo, msg }) => {
  if (grupo === grupoActual) {
    agregarMensaje(mensajes_grupo, msg);
  }
});


// 💬 MENSAJES GENERALES
function agregarMensaje(contenedor, m) {
  const esMio = m.user === currentUser;

  const div = document.createElement("div");
  div.className = "msg " + (esMio ? "tuyo" : "otros");
  div.textContent = (m.nickname || m.user) + ": " + m.text;

  contenedor.appendChild(div);
}


// ⚙️ CAMBIO DE VISTA
function cambiarVista() {
  mensajes_global.style.display = "none";
  mensajes_privado.style.display = "none";
  mensajes_grupo.style.display = "none";

  msg_global.style.display = "none";
  msg_privado.style.display = "none";
  msg_grupo.style.display = "none";

  if (modo === "global") {
    mensajes_global.style.display = "block";
    msg_global.style.display = "block";
  }

  if (modo === "privado") {
    mensajes_privado.style.display = "block";
    msg_privado.style.display = "block";
  }

  if (modo === "grupo") {
    mensajes_grupo.style.display = "block";
    msg_grupo.style.display = "block";
  }
}


// 🧭 BOTONES
function irGlobal() {
  modo = "global";
  cambiarVista();
}


// 🚀 ENVÍO GENERAL
function enviarActual() {
  if (modo === "global") enviarGlobal();
  if (modo === "privado") enviarPrivado();
  if (modo === "grupo") enviarGrupo();
}
