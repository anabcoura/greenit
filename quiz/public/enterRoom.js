document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btnEntrarSala");
  const btnCriar = document.getElementById("btnCriarSala");

  if (btnEntrar) {
    btnEntrar.addEventListener("click", (e) => {
      e.preventDefault();

      const apelidoInput = document.getElementById("apelido");
      const codigoInput = document.getElementById("codigo");
      const avatarImg = document.getElementById("avatarPreview");

      if (!apelidoInput || !codigoInput || !avatarImg) {
        alert("Campos obrigatórios não encontrados no HTML.");
        return;
      }

      const apelido = apelidoInput.value.trim();
      const codigo = codigoInput.value.trim();
      const avatar = avatarImg.getAttribute("src");

      if (!apelido || !codigo || !avatar) {
        alert("Preencha todos os campos antes de continuar.");
        return;
      }

      localStorage.setItem("apelido", apelido);
      localStorage.setItem("avatar", avatar);
      localStorage.setItem("codigoSalaJogador", codigo);

      window.location.href = "waitingRoom.html";
    });
  }

  if (btnCriar) {
    btnCriar.addEventListener("click", (e) => {
      e.preventDefault();
      // Se quiser acionar criação de sala automática no futuro
      window.location.href = "createRoom.html";
    });
  }
});
