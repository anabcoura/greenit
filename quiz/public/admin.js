const socket = io();
let codigoSala = null;
let adminId = localStorage.getItem("adminId");

if (!adminId) {
  adminId = crypto.randomUUID();
  localStorage.setItem("adminId", adminId);
}

const codigoSalaAnterior = localStorage.getItem("codigoSalaAdmin");
if (codigoSalaAnterior) {
  codigoSala = codigoSalaAnterior;
  socket.emit("reentrarSalaAdmin", { codigo: codigoSala, adminId });
}

document.getElementById("criar").onclick = () => {
  const tema = document.getElementById("tema").value;
  const dificuldade = document.getElementById("dificuldade").value;
  const tempo = parseInt(document.getElementById("tempo").value);

  if (!tema || !dificuldade || isNaN(tempo)) {
    alert("Preencha todas as configurações corretamente.");
    return;
  }

  socket.emit("criarSala", { tema, dificuldade, tempo, adminId });
};

document.getElementById("iniciar").onclick = () => {
  socket.emit("iniciarQuiz", codigoSala);
};

document.getElementById("pular").onclick = () => {
  socket.emit("pularPergunta", codigoSala);
};

document.getElementById("finalizarPartida").onclick = () => {
  const confirmar = confirm("Tem certeza que deseja finalizar a partida?");
  if (confirmar) {
    socket.emit("finalizarPartida", codigoSala);
  }
};

document.getElementById("pular").style.display = "none";

socket.on("salaCriada", ({ codigo }) => {
  codigoSala = codigo;
  localStorage.setItem("codigoSalaAdmin", codigoSala);

  document.getElementById("codigoSala").textContent = `Código da sala: ${codigoSala}`;
  document.getElementById("formCriacao").style.display = "none";
  document.getElementById("controle").style.display = "block";
  document.getElementById("painelAdmin").style.display = "block";
});

socket.on("jogadoresAtualizados", (jogadores) => {
  const ul = document.getElementById("lista-jogadores");
  ul.innerHTML = "";

  jogadores.forEach((j) => {
    const li = document.createElement("li");
    li.innerHTML = `<img src="${j.avatar}" width="30"> ${j.apelido}`;
    ul.appendChild(li);
  });

  document.getElementById("iniciar").disabled = jogadores.length < 2;
});

socket.on("pontuacaoAtualizada", ({ pontuacao, jogadores }) => {
  const ul = document.getElementById("listaGerenciarJogadores");
  ul.innerHTML = "";

  jogadores
    .filter(jog => !jog.isAdmin)
    .forEach(jog => {
      const li = document.createElement("li");
      li.innerHTML = `${jog.apelido} - ${pontuacao[jog.playerId] || 0} pts 
        <button onclick="expulsar('${jog.playerId}')">Expulsar</button>`;
      ul.appendChild(li);
    });
});

function expulsar(playerId) {
  socket.emit("expulsarJogador", { codigo: codigoSala, playerId });
}

socket.on("novaPergunta", () => {
  document.getElementById("pular").style.display = "inline";
});

socket.on("fimDoQuiz", () => {
  document.getElementById("pular").style.display = "none";
});

socket.on("erro", (msg) => {
  alert("Erro: " + msg);
});

socket.on("partidaFinalizada", () => {
  alert("Você finalizou a partida. A sala foi encerrada.");
  location.href = "/";
});

