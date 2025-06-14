const socket = io();

// Captura o código da sala da URL
const urlParams = new URLSearchParams(window.location.search);
const codigoSala = urlParams.get("codigo");

// Exibe o nome da sala no HTML
document.getElementById("nomeSala").textContent = `Sala: ${codigoSala}`;

// Envia evento para o servidor indicando que entrou na sala de espera
socket.emit("entrarSalaEspera", codigoSala);

// Captura e exibe a lista de jogadores
socket.on("jogadoresAtualizados", (jogadores) => {
    console.log("Lista de jogadores recebida:", jogadores); // Debug no console

    const ul = document.getElementById("listaJogadores");
    ul.innerHTML = ""; // Limpa a lista anterior

    jogadores.forEach(j => {
        const li = document.createElement("li");
        li.className = "player";
        li.innerHTML = `<img src="${j.avatar}" class="avatar"> ${j.apelido}`;
        ul.appendChild(li);
    });
});


// Se o usuário for o administrador, exibe os controles
socket.on("admin", () => {
    document.querySelector(".admin-controls").style.display = "block";
});

// Iniciar o quiz ao apertar o botão
document.getElementById("startQuiz").addEventListener("click", () => {
    socket.emit("iniciarQuiz", codigoSala);
});

// Quando o quiz for iniciado, redireciona todos para game.html
socket.on("quizIniciado", () => {
    window.location.href = `/game.html?codigo=${codigoSala}`;
});
