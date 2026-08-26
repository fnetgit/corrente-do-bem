/* Anima a barra de progresso ao carregar */
window.addEventListener("load", () => {
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = Number(progressBar.dataset.value || 0);
  const goalAmount = 100_000;
  const progressPercentage =
    goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;
  const currentYearElement = document.getElementById("current-year");

  document.getElementById("raised-amount").textContent =
    "R$ " + raisedAmount.toLocaleString("pt-BR");
  document.getElementById("progress-label").textContent =
    progressPercentage + "% concluído";
  if (currentYearElement)
    currentYearElement.textContent = new Date().getFullYear();
  setTimeout(() => {
    progressBar.style.width = Math.min(progressPercentage, 100) + "%";
  }, 300);
});

/* Copia a chave Pix */
function copyPixKey() {
  const pixKey = document.getElementById("pix-key").textContent.trim();
  navigator.clipboard.writeText(pixKey).then(() => showToast());
}
function showToast() {
  const toastElement = document.getElementById("toast");
  toastElement.classList.add("visible");
  setTimeout(() => toastElement.classList.remove("visible"), 2800);
}

/* Menu sanduíche */
(function () {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("nav--open");
    toggle.setAttribute("aria-expanded", isOpen);
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  /* Fecha o menu ao clicar em um link */
  menu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("nav--open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    });
  });
})();

/* Modal QR Code */
function openQrModal() {
  document.getElementById("qr-modal").classList.add("visible");
  document.body.style.overflow = "hidden";
}
function closeQrModal(event) {
  if (
    event &&
    event.target !== document.getElementById("qr-modal") &&
    !event.target.classList.contains("qr-modal-close")
  )
    return;
  document.getElementById("qr-modal").classList.remove("visible");
  document.body.style.overflow = "";
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape")
    closeQrModal({ target: document.getElementById("qr-modal") });
});

/* FAQ acordeão */
function toggleFaq(button) {
  const answer = button.nextElementSibling;
  const isOpen = button.classList.contains("open");

  /* Fecha todos os itens */
  document.querySelectorAll(".faq-question.open").forEach((faqButton) => {
    faqButton.classList.remove("open");
    faqButton.nextElementSibling.classList.remove("open");
  });

  /* Abre o item clicado se ele estava fechado */
  if (!isOpen) {
    button.classList.add("open");
    answer.classList.add("open");
  }
}
