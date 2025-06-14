const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const fs = require("fs");
const perguntas = JSON.parse(fs.readFileSync("perguntas.json", "utf-8"));

const path = require("path");
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

const salas = {};

// Socket.io
io.on("connection", (socket) => {
  console.log("Novo socket conectado:", socket.id);

  // Criar nova sala (admin)
  socket.on("criarSala", ({ tema, dificuldade, tempo, adminId }) => {
    const codigo = gerarCodigoUnico();

    salas[codigo] = {
      codigo,
      tema,
      dificuldade,
      tempo,
      jogadores: [],
      perguntas: [],
      emAndamento: false,
      adminId,
      pontuacao: {},
    };

    socket.join(codigo);

    // Envia o código da sala para o admin
    socket.emit("salaCriada", { codigo });
  });

  // Jogador entra na sala
  socket.on("entrarSala", ({ codigo, apelido, avatar, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    // Evita duplicações
    const jaExiste = sala.jogadores.some((j) => j.playerId === playerId);
    if (!jaExiste) {
      const jogador = { playerId, apelido, avatar, isAdmin: false };
      sala.jogadores.push(jogador);
      sala.pontuacao[playerId] = 0;
    }

    socket.join(codigo);

    io.to(codigo).emit("jogadoresAtualizados", sala.jogadores);
    socket.emit("salaEntrou");
  });

  // Iniciar o quiz (admin)
  socket.on("iniciarQuiz", (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    sala.emAndamento = true;

    // Enviar sinal para todos jogadores iniciarem o quiz
    io.to(codigo).emit("quizIniciado");

    // Enviar primeira pergunta
    enviarNovaPergunta(codigo);
  });

  // Pular pergunta
  socket.on("pularPergunta", (codigo) => {
    enviarNovaPergunta(codigo);
  });

  // Jogador responde
  socket.on("responder", ({ codigo, playerId, resposta }) => {
    const sala = salas[codigo];
    if (!sala || !sala.perguntaAtual) return;

    const correta = sala.perguntaAtual.correta;

    if (resposta === correta) {
      sala.pontuacao[playerId] = (sala.pontuacao[playerId] || 0) + 10;
    }

    io.to(codigo).emit("pontuacaoAtualizada", {
      pontuacao: sala.pontuacao,
      jogadores: sala.jogadores,
    });
  });

  // Finalizar partida
  socket.on("finalizarPartida", (codigo) => {
    io.to(codigo).emit("partidaFinalizada");
    delete salas[codigo];
  });

  // Expulsar jogador
  socket.on("expulsarJogador", ({ codigo, playerId }) => {
    const sala = salas[codigo];
    if (!sala) return;

    sala.jogadores = sala.jogadores.filter((j) => j.playerId !== playerId);
    delete sala.pontuacao[playerId];

    io.to(codigo).emit("jogadoresAtualizados", sala.jogadores);
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
    // Você pode adicionar lógica aqui para remover jogadores se quiser
  });
});

// Gerador de código de sala simples
function gerarCodigoUnico() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let codigo = "";
  for (let i = 0; i < 4; i++) {
    codigo += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  return salas[codigo] ? gerarCodigoUnico() : codigo;
}

// Enviar nova pergunta fictícia (substitua por lógica real se quiser)
function enviarNovaPergunta(codigo) {
  const sala = salas[codigo];
  if (!sala) return;

  // Seleciona uma pergunta aleatória
  const perguntaAleatoria =
    perguntas[Math.floor(Math.random() * perguntas.length)];

  // Armazena a pergunta atual na sala
  sala.perguntaAtual = perguntaAleatoria;

  io.to(codigo).emit("novaPergunta", {
    pergunta: perguntaAleatoria.pergunta,
    opcoes: perguntaAleatoria.opcoes,
    tempo: sala.tempo || 30,
  });
}

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "enterRoom.html"));
});

