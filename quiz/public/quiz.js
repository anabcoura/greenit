const socket = io();

const apelido = localStorage.getItem("apelido");
const avatar = localStorage.getItem("avatar") || "img/avatars/dog.png";
const codigoSala = localStorage.getItem("codigoSalaJogador");
const playerId = localStorage.getItem("playerId");

if (!apelido || !codigoSala || !playerId) {
  alert("Dados do jogador ausentes. Redirecionando...");
  window.location.href = "enterRoom.html";
}

socket.emit("entrarSala", { codigo: codigoSala, apelido, avatar, playerId });

socket.on("novaPergunta", ({ pergunta, opcoes, tempo }) => {
  document.getElementById("perguntaTitulo").textContent = pergunta;

  const ul = document.getElementById("opcoes");
  ul.innerHTML = "";

  opcoes.forEach((opcao, index) => {
    const li = document.createElement("li");
    li.textContent = opcao;
    li.classList.add("opcao");

    li.onclick = () => {
      socket.emit("responder", {
        codigo: codigoSala,
        playerId,
        resposta: index
      });

      // Desativar as opções após resposta
      document.querySelectorAll(".opcao").forEach(el => el.style.pointerEvents = "none");
    };

    ul.appendChild(li);
  });

  iniciarCronometro(tempo);
});

socket.on("fimDoQuiz", () => {
  alert("O quiz terminou! Obrigado por jogar 🎉");
  window.location.href = "/";
});

function iniciarCronometro(segundos) {
  let tempoRestante = segundos;
  const cronometroEl = document.getElementById("cronometro");

  cronometroEl.textContent = tempoRestante;
  const intervalo = setInterval(() => {
    tempoRestante--;
    cronometroEl.textContent = tempoRestante;

    if (tempoRestante <= 0) {
      clearInterval(intervalo);
      cronometroEl.textContent = "0";
    }
  }, 1000);
}
