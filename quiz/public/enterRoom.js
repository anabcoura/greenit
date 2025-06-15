document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btnEntrarSala");
  const btnCriar = document.getElementById("btnCriarSala");

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
    "img/avatars/av20.svg",
  ];

  let currentAvatarIndex = 0;
  const avatarPreview = document.getElementById("avatarPreview");

  document.getElementById("nextAvatar").addEventListener("click", () => {
    currentAvatarIndex = (currentAvatarIndex + 1) % avatarList.length;
    avatarPreview.src = avatarList[currentAvatarIndex];
  });

  document.getElementById("prevAvatar").addEventListener("click", () => {
    currentAvatarIndex =
      (currentAvatarIndex - 1 + avatarList.length) % avatarList.length;
    avatarPreview.src = avatarList[currentAvatarIndex];
  });

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
