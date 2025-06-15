const socket = io();

const apelido = localStorage.getItem("apelido");
const avatar = localStorage.getItem("avatar");
const codigoSala = localStorage.getItem("codigoSalaJogador");
let playerId = localStorage.getItem("playerId");

if (!apelido || !avatar || !codigoSala) {
  alert("Dados incompletos. Retornando à tela inicial.");
  window.location.href = "enterRoom.html";
}

if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem("playerId", playerId);
}

// Entrar na sala
socket.emit("entrarSala", { codigo: codigoSala, apelido, avatar, playerId });

// Receber lista de jogadores
socket.on("jogadoresAtualizados", (jogadores) => {
  const ul = document.getElementById("lista-jogadores");
  ul.innerHTML = "";

  jogadores.forEach((j) => {
    const li = document.createElement("li");
    li.innerHTML = `<img src="${j.avatar}" width="30" style="border-radius:50%;"> ${j.apelido}`;
    ul.appendChild(li);
  });

  socket.on("quizIniciado", () => {
    window.location.href = "/quiz.html";
  });
});
