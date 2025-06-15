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

// Servir arquivos estáticos da raiz
app.use(express.static(path.join(__dirname, "public")));

// Redirecionar "/" para a página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "enterRoom.html"));
});

io.on("connection", (socket) => {
  socket.on("criarSala", ({ tema, dificuldade, tempo, adminId }) => {
    const codigo = gerarCodigoUnico();

    salas[codigo] = {
      codigo,
      tema, // usado para acessar perguntas[tema]
      dificuldade,
      tempo,
      jogadores: [],
      pontuacao: {},
      perguntaAtual: null,
      emAndamento: false,
      adminId
    };

    socket.join(codigo);
    socket.emit("salaCriada", { codigo });
  });

  socket.on("entrarSala", ({ codigo, apelido, avatar, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const existe = sala.jogadores.some(j => j.playerId === playerId);
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

    enviarNovaPergunta(codigo);
  });

  socket.on("responder", ({ codigo, playerId, resposta }) => {
    const sala = salas[codigo];
    if (!sala || !sala.perguntaAtual) return;

    if (resposta === sala.perguntaAtual.correta) {
      sala.pontuacao[playerId] = (sala.pontuacao[playerId] || 0) + 10;
    }

    io.to(codigo).emit("pontuacaoAtualizada", {
      pontuacao: sala.pontuacao,
      jogadores: sala.jogadores
    });
  });

  socket.on("pularPergunta", (codigo) => {
    enviarNovaPergunta(codigo);
  });

  socket.on("finalizarPartida", (codigo) => {
    io.to(codigo).emit("fimDoQuiz");
    delete salas[codigo];
  });

  socket.on("expulsarJogador", ({ codigo, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    sala.jogadores = sala.jogadores.filter(j => j.playerId !== playerId);
    delete sala.pontuacao[playerId];

    io.to(codigo).emit("jogadoresAtualizados", sala.jogadores);
  });
});

function enviarNovaPergunta(codigo) {
  const sala = salas[codigo];
  if (!sala) return;

  const perguntasDoTema = perguntas[sala.tema];
  if (!perguntasDoTema || !perguntasDoTema.length) {
    console.error(`Nenhuma pergunta disponível para o tema "${sala.tema}"`);
    return;
  }

  const filtradas = perguntasDoTema.filter(p => p.dificuldade === sala.dificuldade);
  if (!filtradas.length) {
    console.error(`Sem perguntas com dificuldade "${sala.dificuldade}" no tema "${sala.tema}"`);
    return;
  }

  const perguntaAleatoria = filtradas[Math.floor(Math.random() * filtradas.length)];

  sala.perguntaAtual = perguntaAleatoria;

  io.to(codigo).emit("novaPergunta", {
    pergunta: perguntaAleatoria.pergunta,
    opcoes: perguntaAleatoria.opcoes,
    tempo: sala.tempo || 30
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
