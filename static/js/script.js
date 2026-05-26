/* Anima barra de progresso ao carregar */
window.addEventListener('load', () => {
    const barra = document.getElementById('barra');
    const valor = Number(barra.dataset.valor || 0);
    const meta = 100_000;
    const percentual = meta > 0 ? Math.round((valor / meta) * 100) : 0;
    const currentYearElement = document.getElementById('current-year');

    document.getElementById('valor-arrecadado').textContent =
        'R$ ' + valor.toLocaleString('pt-BR');
    document.getElementById('pct-label').textContent = percentual + '% concluído';
    if (currentYearElement) currentYearElement.textContent = new Date().getFullYear();
    setTimeout(() => { barra.style.width = Math.min(percentual, 100) + '%'; }, 300);
});

/* Copiar chave Pix */
function copiarChave() {
    const chave = document.getElementById('chave-pix').textContent.trim();
    navigator.clipboard.writeText(chave).then(() => mostrarToast());
}
function mostrarToast() {
    const t = document.getElementById('toast');
    t.classList.add('visivel');
    setTimeout(() => t.classList.remove('visivel'), 2800);
}

/* FAQ acordeão */
function toggleFaq(btn) {
    const resposta = btn.nextElementSibling;
    const aberto = btn.classList.contains('aberto');

    /* Fecha todos */
    document.querySelectorAll('.faq-pergunta.aberto').forEach(b => {
        b.classList.remove('aberto');
        b.nextElementSibling.classList.remove('aberto');
    });

    /* Abre o clicado (se estava fechado) */
    if (!aberto) {
        btn.classList.add('aberto');
        resposta.classList.add('aberto');
    }
}
