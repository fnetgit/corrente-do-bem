/* Anima barra de progresso ao carregar */
window.addEventListener('load', () => {
    const barra = document.getElementById('barra');
    const meta = parseInt(barra.dataset.meta, 10);
    const valor = Math.round((meta / 100) * 500000);
    document.getElementById('valor-arrecadado').textContent =
        'R$ ' + valor.toLocaleString('pt-BR');
    document.getElementById('pct-label').textContent = meta + '% concluído';
    setTimeout(() => { barra.style.width = meta + '%'; }, 300);
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
