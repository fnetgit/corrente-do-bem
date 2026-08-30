
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

function updateActiveLink() {
    const scrollPosition = window.scrollY + 150;

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionBottom
        ) {
            navLinks.forEach((link) => {
                link.classList.remove("active");

                if (link.getAttribute("href") === `#${section.id}`) {
                    link.classList.add("active");
                }
            });
        }
    });
}

window.addEventListener("scroll", updateActiveLink);
window.addEventListener("load", updateActiveLink);
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

/* Copia texto genérico */
function copyText(text, message) {
  navigator.clipboard.writeText(text).then(() => showToast(message));
}

/* Copia a chave Pix */
function copyPixKey() {
  const pixKey = document.getElementById("pix-key").textContent.trim();
  copyText(pixKey, "Chave Pix copiada!");
}

function showToast(message) {
  const toastElement = document.getElementById("toast");
  const toastMessageElement = document.getElementById("toast-message");
  
  if (message && toastMessageElement) {
    toastMessageElement.textContent = message;
  }
  
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
