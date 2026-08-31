const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

function updateActiveLink() {
  const scrollPosition = window.scrollY + 150;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
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

const SHEET_ID = "1b6Bsxzkhhebxk-FPrZzE7Ba5eqS6CrVQiKVZhe1gDEA";
const SHEET_GID = "0"; // aba (planilha) usada — 0 é a primeira aba
// Endpoint "gviz/tq" (em vez de /export?format=csv): é o recomendado pelo
// próprio Google para leitura via JavaScript de páginas externas, pois evita
// bloqueios de CORS que o endpoint /export costuma sofrer nesse cenário.
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

/* Converte "R$ 5.000,50", "5000", " 5000 " etc. em número JS (5000.5) */
function parseSpreadsheetValue(text) {
  if (text === undefined || text === null) return null;
  const cleaned = String(text)
    .replace(/["']/g, "") // remove aspas que o CSV do Google costuma adicionar
    .replace(/[^\d,.-]/g, "") // remove "R$", espaços, letras
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove ponto de milhar (1.234 -> 1234)
    .replace(",", "."); // vírgula decimal -> ponto decimal
  if (cleaned.trim() === "") return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

/* Lê a planilha, soma todas as doações lançadas na coluna A e pega a goal
   na coluna C. Retorna null em caso de falha (sem internet, planilha fora
   do ar, layout inesperado etc.), para a página usar os valores fixos do
   HTML como reserva. */
async function fetchSpreadsheetGoals() {
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok)
      throw new Error(
        "Não foi possível acessar a planilha (status " + response.status + ")",
      );

    const csv = await response.text();

    // Se o Google devolveu uma página de login/error em vez do CSV, o text
    // começa com "<" (HTML). Isso normalmente indica que a planilha ainda
    // não está compartilhada como "Qualquer pessoa com o link".
    if (csv.trim().startsWith("<")) {
      throw new Error(
        "A response não é um CSV (parece uma página HTML de login/error). " +
          "Verifique se a planilha está compartilhada como 'Qualquer pessoa com o link - Leitor'.",
      );
    }

    console.info("[planilha] CSV recebido:", csv); // ajuda a conferir o que chegou

    const rows = csv
      .trim()
      .split("\n")
      .map((row) => {
        // Divide por vírgulas, mas ignora vírgulas dentro de aspas duplas
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        return row.split(regex);
      });

    // A primeira row é o cabeçalho (títulos das columns) e é ignorada.
    const dataRows = rows.slice(1);

    let totalRaised = 0;
    let donationsFound = 0;
    let goal = null;

    dataRows.forEach((columns) => {
      const donationValue = parseSpreadsheetValue(columns[0]); // coluna A
      if (donationValue !== null) {
        totalRaised += donationValue;
        donationsFound++;
      }

      if (goal === null) {
        const goalValue = parseSpreadsheetValue(columns[2]); // column C
        if (goalValue !== null) goal = goalValue;
      }
    });

    if (donationsFound === 0 && goal === null) {
      console.warn(
        "[spreadsheet] CSV received, but no numeric value found in columns A (donations) or C (goal). Check the text logged above and the spreadsheet layout.",
      );
      return null;
    }

    console.info(
      `[planilha] ${donationsFound} doação(ões) somada(s) = R$ ${totalRaised} | Meta encontrada: R$ ${goal}`,
    );

    return {
      raised: donationsFound > 0 ? totalRaised : null,
      goal,
    };
  } catch (error) {
    console.warn(
      "Não foi possível atualizar as metas pela planilha. Usando os valores do HTML como reserva.",
      error,
    );
    return null;
  }
}

/* Aplica os valores (vindos da planilha ou do HTML) na barra de progresso */
function renderProgress(raisedAmount, goalAmount) {
  const progressBar = document.getElementById("progress-bar");
  let progressPercentage =
    goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;

  if (raisedAmount > 0 && progressPercentage === 0) {
    progressPercentage = 1;
  }

  if (raisedAmount < goalAmount && progressPercentage === 100) {
    progressPercentage = 99;
  }

  document.getElementById("raised-amount").textContent =
    "R$ " + raisedAmount.toLocaleString("pt-BR");

  const goalAmountElement = document.getElementById("goal-amount");
  if (goalAmountElement)
    goalAmountElement.textContent = "R$ " + goalAmount.toLocaleString("pt-BR");

  document.getElementById("progress-label").textContent =
    progressPercentage + "% concluído";

  setTimeout(() => {
    progressBar.style.width = Math.min(progressPercentage, 100) + "%";
  }, 300);
}

let lastRaisedAmount = null;
let lastGoalAmount = null;

async function updateProgressFromSpreadsheet() {
  const spreadsheetData = await fetchSpreadsheetGoals();
  if (spreadsheetData) {
    if (spreadsheetData.raised !== null)
      lastRaisedAmount = spreadsheetData.raised;
    if (spreadsheetData.goal !== null) lastGoalAmount = spreadsheetData.goal;
  }
  renderProgress(lastRaisedAmount, lastGoalAmount);
}

const SPREADSHEET_REFRESH_INTERVAL_MS = 30_000;

/* Anima a barra de progresso ao carregar, buscando os valores atualizados
   da planilha do Google Sheets. Se a busca falhar, usa os valores que já
   estão fixos no HTML (data-value do #progress-bar e "R$ 100.000" da goal). */
window.addEventListener("load", async () => {
  const progressBar = document.getElementById("progress-bar");
  const goalAmountElement = document.getElementById("goal-amount");
  const currentYearElement = document.getElementById("current-year");

  // Valores de reserva (fallback), lidos do próprio HTML
  lastRaisedAmount = Number(progressBar.dataset.value || 0);
  lastGoalAmount =
    parseSpreadsheetValue(goalAmountElement?.textContent) || 100_000;

  if (currentYearElement)
    currentYearElement.textContent = new Date().getFullYear();

  await updateProgressFromSpreadsheet();

  setInterval(updateProgressFromSpreadsheet, SPREADSHEET_REFRESH_INTERVAL_MS);
});

/* Copia text genérico */
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
