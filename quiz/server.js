const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const perguntasPorTema = require("./perguntas.json");
const respostasPorSala = {};
const salas = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", (socket) => {
  socket.on("criarSala", ({ tema, dificuldade, tempo, adminId }) => {
    const todasPerguntas = perguntasPorTema[tema] || [];
    const perguntasFiltradas = todasPerguntas.filter(
      (p) => p.dificuldade === dificuldade
    );

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    salas[codigo] = {
      jogadores: [
        {
          id: socket.id,
          playerId: adminId,
          apelido: "Admin",
          avatar: "",
          isAdmin: true,
        },
      ],
      pontuacao: { [adminId]: 0 },
      perguntas: [...perguntasFiltradas],
      perguntaAtual: null,
      dono: adminId,
      tempo: tempo * 1000,
    };

    socket.join(codigo);
    socket.emit("salaCriada", { codigo });
    io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(salas[codigo]));
  });

  socket.on("entrarSala", ({ codigo, apelido, avatar, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return socket.emit("erro", "Sala não encontrada");

    console.log(`Jogador ${apelido} tentou entrar na sala ${codigo}`);

    const existente = sala.jogadores.find((j) => j.playerId === playerId);
    if (existente) {
        existente.id = socket.id;
    } else {
        sala.jogadores.push({
            id: socket.id,
            playerId,
            apelido,
            avatar,
            isAdmin: false,
        });
        sala.pontuacao[playerId] = sala.pontuacao[playerId] || 0;
    }

    socket.join(codigo);
    socket.emit("salaEntrou"); 
    console.log(`Jogador ${apelido} entrou na sala ${codigo} com sucesso!`);

    io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala)); // Atualiza lista

    socket.emit("entrarSalaEspera", codigo); 
});

socket.on("entrarSalaEspera", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return socket.emit("erro", "Sala não encontrada");

    console.log(`🔥 Evento entrarSalaEspera chamado para sala ${codigo}`); // Teste no terminal

    socket.join(codigo);
    io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala)); // Envia lista

    if (sala.dono === socket.id) {
        socket.emit("admin"); // Identifica o administrador
    }
});



  socket.on("reentrarSalaAdmin", ({ codigo, adminId }) => {
    const sala = salas[codigo];
    if (!sala || sala.dono !== adminId) return;

    const admin = sala.jogadores.find(
      (j) => j.playerId === adminId && j.isAdmin
    );
    if (admin) {
      admin.id = socket.id;
      socket.join(codigo);
      socket.emit("salaCriada", { codigo });
      io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala));
    }
  });

  socket.on("reentrarSalaJogador", ({ codigo, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const jogador = sala.jogadores.find(
      (j) => j.playerId === playerId && !j.isAdmin
    );
    if (!jogador) return;

    jogador.id = socket.id;
    socket.join(codigo);

    socket.emit("reentrouSala", getInfoJogadores(sala));
    io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala));

    if (sala.perguntaAtual && respostasPorSala[codigo]) {
      const tempoRestante = Math.max(
        0,
        sala.tempo - (Date.now() - respostasPorSala[codigo].inicio)
      );

      socket.emit("novaPergunta", {
        pergunta: sala.perguntaAtual,
        tempo: tempoRestante,
      });
    }
  });

  socket.on("iniciarQuiz", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    const jogadoresReais = sala.jogadores.filter((j) => !j.isAdmin);
    if (jogadoresReais.length < 2) {
      socket.emit(
        "erro",
        "É necessário pelo menos 2 jogadores para iniciar o quiz."
      );
      return;
    }

    if (sala.perguntas.length > 0) {
      sala.perguntaAtual = sala.perguntas.shift();
      respostasPorSala[codigo] = { respostas: [], inicio: Date.now() };
      io.to(codigo).emit("novaPergunta", {
        pergunta: sala.perguntaAtual,
        tempo: sala.tempo,
      });
    }
  });

  socket.on("iniciarQuiz", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    console.log(`Quiz iniciado na sala ${codigo}`);

    io.to(codigo).emit("quizIniciado"); // Notifica todos para iniciar o quiz
});

  socket.on("responder", ({ codigo, resposta }) => {
    const sala = salas[codigo];
    if (!sala) return;

    if (!respostasPorSala[codigo]) return;

    const jogador = sala.jogadores.find((j) => j.id === socket.id);
    if (!jogador || jogador.isAdmin) return;

    const jaRespondeu = respostasPorSala[codigo].respostas.some(
      (r) => r.playerId === jogador.playerId
    );
    if (jaRespondeu) return;

    respostasPorSala[codigo].respostas.push({
      playerId: jogador.playerId,
      resposta,
      tempo: Date.now(),
    });

    const conectados = sala.jogadores.filter(
      (j) => j.id !== null && !j.isAdmin
    );
    const idsConectados = [...new Set(conectados.map((j) => j.playerId))];
    const idsRespondentes = [
      ...new Set(respostasPorSala[codigo].respostas.map((r) => r.playerId)),
    ];

    if (idsConectados.every((pid) => idsRespondentes.includes(pid))) {
      processarRespostas(codigo);
    }
  });

  socket.on("pularPergunta", (codigo) => {
    const sala = salas[codigo];
    if (!sala || !sala.perguntaAtual) {
      socket.emit("erro", "O quiz ainda não foi iniciado.");
      return;
    }

    const solicitante = sala.jogadores.find((j) => j.id === socket.id);
    if (!solicitante || solicitante.playerId !== sala.dono) return;

    enviarProximaPergunta(codigo);
  });

  socket.on("expulsarJogador", ({ codigo, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const jogadorRemovido = sala.jogadores.find((j) => j.playerId === playerId);
    sala.jogadores = sala.jogadores.filter((j) => j.playerId !== playerId);
    delete sala.pontuacao[playerId];

    if (jogadorRemovido?.id) {
      io.to(jogadorRemovido.id).emit("expulso");
    }

    io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala));
  });

  socket.on("disconnect", () => {
    for (const codigo in salas) {
      const sala = salas[codigo];
      const jogador = sala.jogadores.find((j) => j.id === socket.id);
      if (jogador) {
        jogador.id = null;
        io.to(codigo).emit("jogadoresAtualizados", getInfoJogadores(sala));
      }
    }
  });

  function processarRespostas(codigo) {
    const sala = salas[codigo];
    const dados = respostasPorSala[codigo];
    const respostas = dados.respostas;

    const corretas = respostas
      .filter((r) => r.resposta === sala.perguntaAtual.correta)
      .sort((a, b) => a.tempo - b.tempo);

    corretas.forEach(({ playerId }, index) => {
      const pontos = 1000 - index * 200;
      sala.pontuacao[playerId] = (sala.pontuacao[playerId] || 0) + pontos;
    });

    io.to(codigo).emit("respostasProcessadas", {
      pontuacao: sala.pontuacao,
      correta: sala.perguntaAtual.correta,
    });

    io.to(codigo).emit("pontuacaoAtualizada", {
      pontuacao: sala.pontuacao,
      jogadores: sala.jogadores,
    });

    setTimeout(() => enviarProximaPergunta(codigo), 3000);
  }

  function enviarProximaPergunta(codigo) {
    const sala = salas[codigo];
    if (!sala) return;

    if (sala.perguntas.length > 0) {
      sala.perguntaAtual = sala.perguntas.shift();
      respostasPorSala[codigo] = { respostas: [], inicio: Date.now() };
      io.to(codigo).emit("novaPergunta", {
        pergunta: sala.perguntaAtual,
        tempo: sala.tempo,
      });
    } else {
      io.to(codigo).emit("fimDoQuiz", {
        pontuacao: sala.pontuacao,
        jogadores: sala.jogadores,
      });
    }
  }

  function getInfoJogadores(sala) {
    return sala.jogadores.map((j) => ({
      apelido: j.apelido,
      avatar: j.avatar,
      playerId: j.playerId,
      isAdmin: j.isAdmin,
    }));
  }

  socket.on("finalizarPartida", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    io.to(codigo).emit("partidaFinalizada");
    delete salas[codigo];
    delete respostasPorSala[codigo];
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
