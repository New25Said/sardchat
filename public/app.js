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
