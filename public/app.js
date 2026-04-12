const socket = io();

let currentUser = "";
let chatPrivadoCon = "";
let grupoActual = "";

// 🔐 LOGIN / REGISTRO
function registro() {
  socket.emit("registro", {
    username: user.value,
    password: pass.value,
    nickname: nick.value
  });
}

function login() {
  socket.emit("login", {
    username: user.value,
    password: pass.value
  });
}

socket.on("login_ok", (u) => {
  currentUser = u;
  login.style.display = "none";
  app.style.display = "block";
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
  msgs.forEach(m => agregarGlobal(m));
});

socket.on("mensaje_global", (m) => {
  agregarGlobal(m);
});

function agregarGlobal(m) {
  const div = document.createElement("div");
  div.textContent = m.nickname + ": " + m.text;
  mensajes_global.appendChild(div);
}


// 💬 PRIVADO
function cargarPrivado() {
  chatPrivadoCon = user2.value;
  socket.emit("cargar_privado", chatPrivadoCon);
}

socket.on("historial_privado", (msgs) => {
  mensajes_privado.innerHTML = "";
  msgs.forEach(m => agregarPrivado(m));
});

function enviarPrivado() {
  if (!msg_privado.value || !chatPrivadoCon) return;

  socket.emit("mensaje_privado", {
    to: chatPrivadoCon,
    text: msg_privado.value
  });

  msg_privado.value = "";
}

socket.on("mensaje_privado", (m) => {
  if (m.from === chatPrivadoCon || m.to === chatPrivadoCon) {
    agregarPrivado(m);
  }
});

function agregarPrivado(m) {
  const div = document.createElement("div");
  div.textContent = m.from + ": " + m.text;
  mensajes_privado.appendChild(div);
}


// 👥 GRUPOS
function crearGrupo() {
  const miembros = document.getElementById("miembros").value.split(",");
  
  socket.emit("crear_grupo", {
    nombre: nombre_grupo.value,
    miembros
  });
}

function abrirGrupo() {
  grupoActual = grupo_actual.value;
  mensajes_grupo.innerHTML = "";
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
    const div = document.createElement("div");
    div.textContent = msg.user + ": " + msg.text;
    mensajes_grupo.appendChild(div);
  }
});


// ⚙️ PERFIL
function guardarPerfil() {
  const file = photo.files[0];

  if (!file) {
    socket.emit("perfil", {
      nickname: newnick.value
    });
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    socket.emit("perfil", {
      nickname: newnick.value,
      photo: reader.result
    });
  };

  reader.readAsDataURL(file);
}


// 🎨 TEMAS
function tema(t) {
  if (t === "morado") {
    document.body.style.background = "#1a0126";
  }
  if (t === "oscuro") {
    document.body.style.background = "#000";
  }
  if (t === "azul") {
    document.body.style.background = "#001f3f";
  }
}


// 🧭 NAVEGACIÓN
function ocultarTodo() {
  global.style.display = "none";
  privado.style.display = "none";
  grupos.style.display = "none";
  config.style.display = "none";
}

function irGlobal() {
  ocultarTodo();
  global.style.display = "block";
}

function irPrivado() {
  ocultarTodo();
  privado.style.display = "block";
}

function irGrupos() {
  ocultarTodo();
  grupos.style.display = "block";
}

function irConfig() {
  ocultarTodo();
  config.style.display = "block";
}
