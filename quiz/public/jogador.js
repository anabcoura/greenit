const socket = io();
let avatarIndex = 0;
let codigoSala = localStorage.getItem("codigoSalaJogador");
let apelido = localStorage.getItem("apelido");
let avatar = localStorage.getItem("avatar") || "img/avatars/dog.png";
let cronometro = null;

let playerId = localStorage.getItem("playerId");
if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem("playerId", playerId);
}

if (!apelido || !codigoSala) {
  alert("Informações do jogador não encontradas. Retornando à página inicial.");
  window.location.href = "enterRoom.html";
}

document.getElementById("apelido").value = apelido;
document.getElementById("codigo").value = codigoSala;
document.getElementById("avatarPreview").src = avatar;

const avatarList = [
  "img/avatars/dog.png",
  "img/avatars/cat.png",
  "img/avatars/monkey.png",
  "img/avatars/frog.png",
  "img/avatars/unicorn.png",
  "img/avatars/robot.png"
];

avatarIndex = avatarList.indexOf(avatar);
if (avatarIndex === -1) avatarIndex = 0;

function updateAvatarPreview() {
  avatar = avatarList[avatarIndex];
  document.getElementById("avatarPreview").src = avatar;
}

document.getElementById("prevAvatar").onclick = () => {
  avatarIndex = (avatarIndex - 1 + avatarList.length) % avatarList.length;
  updateAvatarPreview();
};

document.getElementById("nextAvatar").onclick = () => {
  avatarIndex = (avatarIndex + 1) % avatarList.length;
  updateAvatarPreview();
};

document.getElementById("entrar").onclick = () => {
  apelido = document.getElementById("apelido").value.trim();
  codigoSala = document.getElementById("codigo").value.trim();

  if (!apelido || !codigoSala) {
    alert("Preencha o apelido e o código da sala.");
    return;
  }

  localStorage.setItem("apelido", apelido);
  localStorage.setItem("avatar", avatar);
  localStorage.setItem("codigoSalaJogador", codigoSala);

  socket.emit("entrarSala", { codigo: codigoSala, apelido, avatar, playerId });
};

socket.on("salaEntrou", () => {
  document.getElementById("entrada").style.display = "none";
  document.getElementById("espera").style.display = "block";
});

socket.on("partidaFinalizada", () => {
  alert("A partida foi finalizada pelo administrador.");
  location.href = "/";
});

// Demais eventos (jogadoresAtualizados, novaPergunta, fimDoQuiz, etc.) entram aqui
