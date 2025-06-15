const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const perguntas = JSON.parse(fs.readFileSync("perguntas.json", "utf-8"));
const salas = {};

function embaralharArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Servir arquivos estáticos da raiz
app.use(express.static(path.join(__dirname, "public")));

// Redirecionar "/" para a página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "enterRoom.html"));
});

io.on("connection", (socket) => {
  socket.on("criarSala", ({ tema, dificuldade, tempo, adminId }) => {
    const codigo = gerarCodigoUnico();
    const filtradas = perguntas[tema].filter(
      (p) => p.dificuldade === dificuldade
    );
    const filaEmbaralhada = embaralharArray(filtradas); // função que cria uma ordem aleatória

    salas[codigo] = {
      codigo,
      tema,
      dificuldade,
      tempo,
      jogadores: [],
      pontuacao: {},
      perguntaAtual: null,
      emAndamento: false,
      adminId,
      filaPerguntas: filaEmbaralhada,
      respostasDaRodada: [],
      indiceAtual: 0,
    };

    socket.join(codigo);
    socket.emit("salaCriada", { codigo });
  });

  socket.on("entrarSala", ({ codigo, apelido, avatar, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const existe = sala.jogadores.some((j) => j.playerId === playerId);
    if (!existe) {
      sala.jogadores.push({ apelido, avatar, playerId });
      sala.pontuacao[playerId] = 0;
    }

    socket.join(codigo);
    io.to(codigo).emit("jogadoresAtualizados", sala.jogadores);
  });

  socket.on("iniciarQuiz", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    sala.emAndamento = true;
    io.to(codigo).emit("quizIniciado");
  });

  socket.on("responder", ({ codigo, playerId, resposta }) => {
    const sala = salas[codigo];
    if (!sala || !sala.perguntaAtual) return;

    const jaRespondeu = sala.respostasDaRodada.find(
      (r) => r.playerId === playerId
    );
    if (jaRespondeu) return;

    const correta = resposta === sala.perguntaAtual.correta;

    sala.respostasDaRodada.push({
      playerId,
      tempoResposta: Date.now(),
      correta,
    });

    if (correta) {
      // Pontuação com bônus de velocidade
      const bonus =
        10 + (sala.jogadores.length - sala.respostasDaRodada.length);
      sala.pontuacao[playerId] = (sala.pontuacao[playerId] || 0) + bonus;
    }

    io.to(codigo).emit("pontuacaoAtualizada", {
      pontuacao: sala.pontuacao,
      jogadores: sala.jogadores,
    });

    if (sala.respostasDaRodada.length === sala.jogadores.length) {
      // Todos responderam, avança para a próxima pergunta
      sala.indiceAtual++;
      setTimeout(() => enviarNovaPergunta(codigo), 1000); // pequena pausa
    }
  });

  socket.on("pularPergunta", (codigo) => {
    enviarNovaPergunta(codigo);
  });

  socket.on("finalizarPartida", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    const ranking = sala.jogadores
      .map((jogador) => ({
        apelido: jogador.apelido,
        avatar: jogador.avatar, // agora estamos incluindo a imagem
        pontos: sala.pontuacao[jogador.playerId] || 0,
      }))
      .sort((a, b) => b.pontos - a.pontos);

    io.to(codigo).emit("fimDoQuiz", ranking);

    delete salas[codigo];
  });

  socket.on("expulsarJogador", ({ codigo, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    sala.jogadores = sala.jogadores.filter((j) => j.playerId !== playerId);
    delete sala.pontuacao[playerId];

    io.to(codigo).emit("jogadoresAtualizados", sala.jogadores);
  });

  socket.on("solicitarPrimeiraPergunta", (codigo) => {
    enviarNovaPergunta(codigo);
  });
});

function enviarNovaPergunta(codigo) {
  const sala = salas[codigo];
  if (!sala) return;

  const proxima = sala.filaPerguntas[sala.indiceAtual];
  if (!proxima) {
    // Fim do quiz: todas as perguntas foram usadas
    const ranking = sala.jogadores
      .map((jogador) => ({
        apelido: jogador.apelido,
        avatar: jogador.avatar,
        pontos: sala.pontuacao[jogador.playerId] || 0,
      }))
      .sort((a, b) => b.pontos - a.pontos);

    io.to(codigo).emit("fimDoQuiz", ranking);
    delete salas[codigo];
    return;
  }

  sala.perguntaAtual = proxima;
  sala.respostasDaRodada = [];

  io.to(codigo).emit("novaPergunta", {
    pergunta: proxima.pergunta,
    opcoes: proxima.opcoes,
    tempo: sala.tempo || 30,
  });
}

function gerarCodigoUnico() {
  let codigo;
  do {
    codigo = Math.floor(1000 + Math.random() * 9000).toString(); // Gera entre 1000 e 9999
  } while (salas[codigo]);
  return codigo;
}

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
