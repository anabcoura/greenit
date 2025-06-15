const socket = io();
let codigoSala = null;
let adminId = localStorage.getItem("adminId");

if (!adminId) {
  adminId = crypto.randomUUID();
  localStorage.setItem("adminId", adminId);
}

document.addEventListener("DOMContentLoaded", () => {
  const btnCriar = document.getElementById("btnConfirmarCriacao");
  const btnIniciar = document.getElementById("iniciar");
  const btnPular = document.getElementById("pular");
  const configuracaoSala = document.getElementById("configuracaoSala");
  const painelAdmin = document.getElementById("painelAdmin");

  btnCriar.addEventListener("click", (e) => {
    e.preventDefault();

    const tema = document.getElementById("tema").value;
    const dificuldade = document.getElementById("dificuldade").value;
    const tempo = parseInt(document.getElementById("tempo").value, 10);

    if (!tema || !dificuldade || isNaN(tempo) || tempo <= 0) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    socket.emit("criarSala", { tema, dificuldade, tempo, adminId });
  });

  btnIniciar.addEventListener("click", () => {
    if (codigoSala) {
      socket.emit("iniciarQuiz", codigoSala);
    }
  });

  btnPular.addEventListener("click", () => {
    if (codigoSala) {
      socket.emit("pularPergunta", codigoSala);
    }
  });

  document.getElementById("finalizarPartida").addEventListener("click", () => {
    if (!codigoSala) return;

    const confirmar = confirm("Tem certeza que deseja finalizar a partida?");
    if (confirmar) {
      socket.emit("finalizarPartida", codigoSala);
    }
  });
});

socket.on("salaCriada", ({ codigo }) => {
  codigoSala = codigo;
  localStorage.setItem("codigoSalaAdmin", codigoSala);

  document.getElementById("codigoSala").textContent = `Código da sala: ${codigoSala}`;

  const configuracaoSala = document.getElementById("configuracaoSala");
  const painelAdmin = document.getElementById("painelAdmin");
  if (configuracaoSala) configuracaoSala.style.display = "none";
  if (painelAdmin) painelAdmin.style.display = "block";

  document.getElementById("pular").style.display = "none"; // Só mostra ao iniciar o quiz
});

socket.on("jogadoresAtualizados", (jogadores) => {
  const ul = document.getElementById("lista-jogadores");
  ul.innerHTML = "";

  jogadores.forEach((j) => {
    const li = document.createElement("li");
    li.innerHTML = `<img src="${j.avatar}" width="30" style="vertical-align: middle; margin-right: 8px;" /> ${j.apelido}`;
    ul.appendChild(li);
  });

  document.getElementById("iniciar").disabled = jogadores.length < 2;
});

socket.on("pontuacaoAtualizada", ({ pontuacao, jogadores }) => {
  const ul = document.getElementById("listaGerenciarJogadores");
  ul.innerHTML = "";

  jogadores
    .filter(j => !j.isAdmin)
    .forEach(j => {
      const li = document.createElement("li");
      li.innerHTML = `${j.apelido} - ${pontuacao[j.playerId] || 0} pts 
        <button onclick="expulsar('${j.playerId}')">Expulsar</button>`;
      ul.appendChild(li);
    });
});

socket.on("novaPergunta", () => {
  document.getElementById("pular").style.display = "inline";
});

socket.on("fimDoQuiz", () => {
  document.getElementById("pular").style.display = "none";
});

socket.on("partidaFinalizada", () => {
  alert("Você finalizou a partida. A sala foi encerrada.");
  location.href = "/";
});

function expulsar(playerId) {
  if (codigoSala) {
    socket.emit("expulsarJogador", { codigo: codigoSala, playerId });
  }
}