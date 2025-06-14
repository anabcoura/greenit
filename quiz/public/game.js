const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codigoSala = urlParams.get("codigo");

    if (!codigoSala) {
        alert("Código da sala não encontrado. Redirecionando...");
        window.location.href = "/";
        return;
    }

    // Enviar evento para o servidor confirmando a entrada no quiz
    socket.emit("entrarQuiz", codigoSala);
});

let codigoSala = null;

document.getElementById('criar').onclick = () => {
  const tema = document.getElementById('tema').value;
  console.log("Tema selecionado:", tema);
  socket.emit('criarSala', tema);
};

document.getElementById('entrar').onclick = () => {
  const codigo = prompt("Digite o código da sala:");
  socket.emit('entrarSala', codigo);
};

document.getElementById('iniciar').onclick = () => {
  socket.emit('iniciarQuiz', codigoSala);
};

document.getElementById('pular').onclick = () => {
  socket.emit('pularPergunta', codigoSala);
};

socket.on('salaCriada', (dados) => {
  codigoSala = dados.codigo;
  const souDono = (socket.id === dados.dono);

  alert(`Sala criada com código: ${codigoSala}`);

  if (souDono) {
    mostrarControlesDeAdministracao();
  }
});

socket.on('salaEntrou', (codigo) => {
  codigoSala = codigo;
  alert(`Você entrou na sala ${codigo}`);
});

socket.on('novaPergunta', (p) => {
  const opcoes = p.opcoes.map((op, i) =>
    `<button onclick="responder(${i})">${op}</button>`
  ).join('<br>');
  document.body.innerHTML = `
    <h3>${p.pergunta}</h3>
    ${opcoes}
    <div id="placar">
      <h3>Placar</h3>
      <ul id="lista-placar"></ul>
    </div>
    <div id="jogadores">
      <h3>Jogadores na sala:</h3>
      <ul id="lista-jogadores"></ul>
    </div>
    <div id="admin" style="display: none;">
      <h3>Controles do Criador da Sala</h3>
      <button id="pular">Pular Pergunta</button>
    </div>
  `;

  document.getElementById('pular')?.addEventListener('click', () => {
    socket.emit('pularPergunta', codigoSala);
  });
});

socket.on('erro', (msg) => {
  alert(msg);
});

function responder(i) {
  socket.emit('responder', { codigo: codigoSala, resposta: i });
}

socket.on('respostasProcessadas', (dados) => {
  const { pontuacao, correta } = dados;

  const lista = document.getElementById('lista-placar');
  if (lista) {
    lista.innerHTML = '';
    const jogadores = Object.entries(pontuacao).sort(([, a], [, b]) => b - a);
    jogadores.forEach(([id, pontos]) => {
      const li = document.createElement('li');
      li.textContent = `Jogador ${id.slice(0, 5)}...: ${pontos} pts`;
      lista.appendChild(li);
    });
  }

  alert(`Resposta correta: ${correta}`);
});

socket.on('fimDoQuiz', (pontuacao) => {
  const ranking = Object.entries(pontuacao)
    .sort(([, a], [, b]) => b - a)
    .map(([id, pontos], i) => `${i + 1}º - ${id.slice(0, 5)}...: ${pontos} pts`)
    .join('\n');

  alert("Fim do quiz!\n\nRanking final:\n" + ranking);
});

function mostrarControlesDeAdministracao() {
  const div = document.getElementById('admin');
  if (div) div.style.display = 'block';
}

socket.on('jogadoresAtualizados', (ids) => {
  const ul = document.getElementById('lista-jogadores');
  if (ul) {
    ul.innerHTML = '';
    ids.forEach(id => {
      const li = document.createElement('li');
      li.textContent = `Jogador ${id.slice(0, 5)}...`;
      ul.appendChild(li);
    });
  }
});
