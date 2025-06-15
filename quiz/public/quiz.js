const socket = io();

const apelido = localStorage.getItem("apelido");
const avatar = localStorage.getItem("avatar");
const codigoSala = localStorage.getItem("codigoSalaJogador");
const playerId = localStorage.getItem("playerId");
let cronometroIntervalo = null;

if (!apelido || !codigoSala || !playerId) {
  alert("Informações incompletas. Redirecionando...");
  window.location.href = "/enterRoom.html";
}

socket.emit("entrarSala", { codigo: codigoSala, apelido, avatar, playerId });

socket.on("quizIniciado", () => {
  mostrarContagem(() => {
    socket.emit("solicitarPrimeiraPergunta", codigoSala);
  });
});

socket.on("novaPergunta", ({ pergunta, opcoes, tempo }) => {
  const telaResultado = document.getElementById("telaResultado");
  if (telaResultado) telaResultado.classList.add("hidden");

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

      document.querySelectorAll(".opcao").forEach((el) => {
        el.classList.add("respondido");
        el.style.pointerEvents = "none";
      });

      li.classList.add("selecionada");
    };

    ul.appendChild(li);
  });

  iniciarCronometro(tempo);
});

socket.on("fimDoQuiz", (ranking) => {
  const telaResultado = document.getElementById("telaResultado");
  if (telaResultado) telaResultado.classList.remove("hidden");

  const lista = document.getElementById("listaRanking");
  if (lista) {
    lista.innerHTML = "";
    ranking.forEach((jogador, index) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${jogador.avatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%;">
          <span><strong>${index + 1}.</strong> ${jogador.apelido} — ${jogador.pontos} pts</span>
        </div>
      `;

      lista.appendChild(li);
    });
  }
});

function iniciarCronometro(segundos) {
  clearInterval(cronometroIntervalo);

  let tempoRestante = segundos;
  const cronometroEl = document.getElementById("cronometro");
  cronometroEl.textContent = tempoRestante;

  cronometroIntervalo = setInterval(() => {
    tempoRestante--;
    cronometroEl.textContent = tempoRestante;

    if (tempoRestante <= 0) {
      clearInterval(cronometroIntervalo);
      cronometroEl.textContent = "0";
    }
  }, 1000);
}

function voltarParaInicio() {
  localStorage.removeItem("codigoSalaJogador");
  localStorage.removeItem("playerId");
  window.location.href = "/enterRoom.html";
}

function mostrarContagem(callback) {
  const telaContagem = document.getElementById("telaContagem");
  const msg = document.getElementById("msgContagem");
  const container = document.querySelector(".container");

  container.style.display = "none";
  telaContagem.classList.remove("hidden");

  let segundos = 3;
  msg.textContent = `O quiz começa em ${segundos}...`;

  const intervalo = setInterval(() => {
    segundos--;
    if (segundos > 0) {
      msg.textContent = `O quiz começa em ${segundos}...`;
    } else {
      clearInterval(intervalo);
      telaContagem.classList.add("hidden");
      container.style.display = "block";

      if (callback) callback();
    }
  }, 1000);
}

