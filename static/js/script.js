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
/* ==========================================================================
   Integração com Google Sheets (atualização automática das metas)
   ==========================================================================
   Layout esperado da planilha (primeira aba), a partir da LINHA 2 (a linha 1
   é o cabeçalho e é ignorada pelo site):

       Coluna A          Coluna B      Coluna C (opcional, o site não lê)
       ------------      --------      -----------------------------------
       Doações           Meta          Total arrecadado (só de referência)
       1000              100000        =SOMA(A2:A1000)   <- fórmula opcional
       500
       250
       ...

   - Coluna A: cada doação lançada vira uma nova linha. O site SOMA todos
     os valores numéricos dessa coluna sozinho (não depende de fórmula).
   - Coluna B: a meta. Basta preencher uma vez (o site usa o primeiro valor
     numérico que encontrar nessa coluna).
   - Coluna C: totalmente opcional — pode ter uma fórmula de soma só para
     quem estiver preenchendo a planilha acompanhar visualmente. O site
     ignora essa coluna por completo.
*/
const SHEET_ID = "1b6Bsxzkhhebxk-FPrZzE7Ba5eqS6CrVQiKVZhe1gDEA";
const SHEET_GID = "0"; // aba (planilha) usada — 0 é a primeira aba
// Endpoint "gviz/tq" (em vez de /export?format=csv): é o recomendado pelo
// próprio Google para leitura via JavaScript de páginas externas, pois evita
// bloqueios de CORS que o endpoint /export costuma sofrer nesse cenário.
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

/* Converte "R$ 5.000,50", "5000", " 5000 " etc. em número JS (5000.5) */
function parseValorPlanilha(texto) {
  if (texto === undefined || texto === null) return null;
  const limpo = String(texto)
    .replace(/["']/g, "") // remove aspas que o CSV do Google costuma adicionar
    .replace(/[^\d,.-]/g, "") // remove "R$", espaços, letras
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove ponto de milhar (1.234 -> 1234)
    .replace(",", "."); // vírgula decimal -> ponto decimal
  if (limpo.trim() === "") return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

/* Lê a planilha, soma todas as doações lançadas na coluna A e pega a meta
   na coluna B. Retorna null em caso de falha (sem internet, planilha fora
   do ar, layout inesperado etc.), para a página usar os valores fixos do
   HTML como reserva. */
async function buscarMetasDaPlanilha() {
  try {
    const resposta = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!resposta.ok)
      throw new Error(
        "Não foi possível acessar a planilha (status " + resposta.status + ")",
      );

    const csv = await resposta.text();

    // Se o Google devolveu uma página de login/erro em vez do CSV, o texto
    // começa com "<" (HTML). Isso normalmente indica que a planilha ainda
    // não está compartilhada como "Qualquer pessoa com o link".
    if (csv.trim().startsWith("<")) {
      throw new Error(
        "A resposta não é um CSV (parece uma página HTML de login/erro). " +
          "Verifique se a planilha está compartilhada como 'Qualquer pessoa com o link - Leitor'.",
      );
    }

    console.info("[planilha] CSV recebido:", csv); // ajuda a conferir o que chegou

    const linhas = csv
      .trim()
      .split("\n")
      .map((linha) => linha.split(","));

    // A primeira linha é o cabeçalho (títulos das colunas) e é ignorada.
    const linhasDeDados = linhas.slice(1);

    let totalArrecadado = 0;
    let doacoesEncontradas = 0;
    let meta = null;

    linhasDeDados.forEach((colunas) => {
      const valorDoacao = parseValorPlanilha(colunas[0]); // coluna A
      if (valorDoacao !== null) {
        totalArrecadado += valorDoacao;
        doacoesEncontradas++;
      }

      if (meta === null) {
        const valorMeta = parseValorPlanilha(colunas[1]); // coluna B
        if (valorMeta !== null) meta = valorMeta;
      }
    });

    if (doacoesEncontradas === 0 && meta === null) {
      console.warn(
        "[planilha] CSV recebido, mas não encontrei nenhum valor numérico nas colunas A (doações) ou B (meta). Confira o texto logado acima e o layout da planilha.",
      );
      return null;
    }

    console.info(
      `[planilha] ${doacoesEncontradas} doação(ões) somada(s) = R$ ${totalArrecadado} | Meta encontrada: R$ ${meta}`,
    );

    return {
      arrecadado: doacoesEncontradas > 0 ? totalArrecadado : null,
      meta,
    };
  } catch (erro) {
    console.warn(
      "Não foi possível atualizar as metas pela planilha. Usando os valores do HTML como reserva.",
      erro,
    );
    return null;
  }
}

/* Aplica os valores (vindos da planilha ou do HTML) na barra de progresso */
function renderizarProgresso(raisedAmount, goalAmount) {
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage =
    goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;

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

/* Anima a barra de progresso ao carregar, buscando os valores atualizados
   da planilha do Google Sheets. Se a busca falhar, usa os valores que já
   estão fixos no HTML (data-value do #progress-bar e "R$ 100.000" da meta). */
window.addEventListener("load", async () => {
  const progressBar = document.getElementById("progress-bar");
  const goalAmountElement = document.getElementById("goal-amount");
  const currentYearElement = document.getElementById("current-year");

  // Valores de reserva (fallback), lidos do próprio HTML
  let raisedAmount = Number(progressBar.dataset.value || 0);
  let goalAmount =
    parseValorPlanilha(goalAmountElement?.textContent) || 100_000;

  const dadosPlanilha = await buscarMetasDaPlanilha();
  if (dadosPlanilha) {
    if (dadosPlanilha.arrecadado !== null)
      raisedAmount = dadosPlanilha.arrecadado;
    if (dadosPlanilha.meta !== null) goalAmount = dadosPlanilha.meta;
  }

  if (currentYearElement)
    currentYearElement.textContent = new Date().getFullYear();

  renderizarProgresso(raisedAmount, goalAmount);
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
