document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  let codigoSala = null;
  let avatarIndex = 0;
  let cronometro = null;

  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem("playerId", playerId);
  }

  const avatarList = [
    "img/avatars/av1.svg",
    "img/avatars/av2.svg",
    "img/avatars/av3.svg",
    "img/avatars/av4.svg",
    "img/avatars/av5.svg",
    "img/avatars/av6.svg",
    "img/avatars/av7.svg",
    "img/avatars/av8.svg",
    "img/avatars/av9.svg",
    "img/avatars/av10.svg",
    "img/avatars/av11.svg",
    "img/avatars/av12.svg",
    "img/avatars/av13.svg",
    "img/avatars/av14.svg",
    "img/avatars/av15.svg",
    "img/avatars/av16.svg",
    "img/avatars/av17.svg",
    "img/avatars/av18.svg",
    "img/avatars/av19.svg",
    "img/avatars/av20.svg"
  ];

  const avatarImg = document.getElementById("avatarPreview");
  updateAvatarPreview();

  document.getElementById("prevAvatar").onclick = () => {
    avatarIndex = (avatarIndex - 1 + avatarList.length) % avatarList.length;
    updateAvatarPreview();
  };

  document.getElementById("nextAvatar").onclick = () => {
    avatarIndex = (avatarIndex + 1) % avatarList.length;
    updateAvatarPreview();
  };

  function updateAvatarPreview() {
    avatarImg.src = avatarList[avatarIndex];
  }

  document.getElementById("entrar").onclick = () => {
    const apelido = document.getElementById("apelido").value.trim();
    const codigo = document.getElementById("codigo").value.trim();
    const avatar = avatarList[avatarIndex];

    if (!apelido || !codigo) {
        alert("Preencha o apelido e o código da sala.");
        return;
    }

    codigoSala = codigo;
    localStorage.setItem("codigoSalaJogador", codigoSala);

    socket.emit("entrarSala", { codigo, apelido, avatar, playerId });
};

socket.on("salaEntrou", () => {
    console.log("Entrou na sala, redirecionando para sala de espera...");
    window.location.href = "/waitingRoom.html"; 
});

  socket.on("reentrouSala", (jogadores) => {
    document.getElementById("entrada").style.display = "none";
    document.getElementById("espera").style.display = "block";

    const ul = document.getElementById("jogadores");
    ul.innerHTML = "";
    jogadores.forEach(j => {
      const li = document.createElement("li");
      li.innerHTML = `<img src="${j.avatar}" width="30"> ${j.apelido}`;
      ul.appendChild(li);
    });
  });

  socket.on("jogadoresAtualizados", (jogadores) => {
    const ul = document.getElementById("jogadores");
    ul.innerHTML = "";
    jogadores.forEach(j => {
      const li = document.createElement("li");
      li.innerHTML = `<img src="${j.avatar}" width="30"> ${j.apelido}`;
      ul.appendChild(li);
    });
  });

  socket.on("novaPergunta", ({ pergunta, tempo }) => {
    clearInterval(cronometro);
    document.getElementById("espera").style.display = "none";
    document.getElementById("pergunta").style.display = "block";

    const div = document.getElementById("pergunta");
    div.innerHTML = "";

    const h3 = document.createElement("h3");
    h3.textContent = pergunta.pergunta;
    div.appendChild(h3);

    const cron = document.createElement("p");
    cron.id = "cronometro";
    div.appendChild(cron);

    let segundos = Math.floor(tempo / 1000);
    cron.textContent = `Tempo restante: ${segundos}s`;

    cronometro = setInterval(() => {
      segundos--;
      cron.textContent = segundos >= 0
        ? `Tempo restante: ${segundos}s`
        : "Tempo esgotado!";
      if (segundos < 0) clearInterval(cronometro);
    }, 1000);

    pergunta.opcoes.forEach((op, i) => {
      const btn = document.createElement("button");
      btn.textContent = op;
      btn.onclick = () => {
        socket.emit("responder", { codigo: codigoSala, resposta: i });
        clearInterval(cronometro);
        div.innerHTML = "<p>Resposta enviada. Aguardando os outros jogadores...</p>";
      };
      div.appendChild(btn);
      div.appendChild(document.createElement("br"));
    });
  });

  socket.on("respostasProcessadas", ({ correta }) => {
    alert(`Resposta correta: ${correta}`);
  });

  socket.on("fimDoQuiz", ({ pontuacao, jogadores }) => {
    document.getElementById("entrada").style.display = "none";
    document.getElementById("espera").style.display = "none";
    document.getElementById("pergunta").style.display = "none";

    const podio = document.getElementById("podio");
    const container = document.getElementById("rankingContainer");
    const listaTop = document.getElementById("listaTop10");

    container.innerHTML = "";
    listaTop.innerHTML = "";
    podio.style.display = "block";

    const ranking = jogadores
      .filter(jog => !jog.isAdmin)
      .map(jog => ({
        apelido: jog.apelido,
        avatar: jog.avatar,
        playerId: jog.playerId,
        pontos: pontuacao[jog.playerId] || 0
      }))
      .sort((a, b) => b.pontos - a.pontos);

    const cores = ["#ffd700", "#c0c0c0", "#cd7f32"];

    ranking.slice(0, 3).forEach((jog, index) => {
      const col = document.createElement("div");
      col.style.textAlign = "center";
      col.style.flex = "1";
      col.style.height = `${80 + (3 - index) * 40}px`;
      col.style.background = cores[index];
      col.style.borderRadius = "10px";
      col.style.display = "flex";
      col.style.flexDirection = "column";
      col.style.justifyContent = "flex-end";
      col.style.alignItems = "center";
      col.style.padding = "10px";
      col.style.animation = "rise 0.8s ease-out";

      const img = document.createElement("img");
      img.src = jog.avatar;
      img.width = 50;
      img.style.borderRadius = "50%";

      const nick = document.createElement("p");
      nick.textContent = jog.apelido;

      const pts = document.createElement("p");
      pts.textContent = `${jog.pontos} pts`;

      col.appendChild(img);
      col.appendChild(nick);
      col.appendChild(pts);
      container.appendChild(col);
    });

    ranking.slice(0, 10).forEach((jog, index) => {
      const item = document.createElement("li");
      item.textContent = `${index + 1}º - ${jog.apelido}: ${jog.pontos} pts`;
      listaTop.appendChild(item);
    });
  });

  socket.on("expulso", () => {
    alert("Você foi removido da sala pelo administrador.");
    location.reload();
  });

  socket.on("erro", (msg) => {
    alert("Erro: " + msg);
  });

  socket.on("partidaFinalizada", () => {
  alert("A partida foi finalizada pelo administrador.");
  location.href = "/"; // redireciona para início
});


});