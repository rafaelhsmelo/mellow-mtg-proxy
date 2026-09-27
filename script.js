// === 1. MAPEAMENTO DO DOM (Document Object Model) ===

// Controles de interação
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// Onde as cartas serão geradas
const cardsContainer = document.getElementById('cardsContainer');

// Alvo de injeção de dados para a tabela
const debugTableBody = document.getElementById('debugTableBody');

// === 2. REGISTRO DE EVENTOS ===

// Aciona a execução da busca através do clique
searchButton.addEventListener('click', searchCard);

// === 3. LÓGICA DE REQUISIÇÃO E PROCESSAMENTO ===

// Função assíncrona necessária para operações de rede (fetch)
async function searchCard() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Limpa a tela antes de gerar novos resultados
    cardsContainer.innerHTML = "";
    debugTableBody.innerHTML = "";

    // Divide o texto do textarea em um Array de linhas
    const lines = query.split('\n');

    // Repetição para processar cada linha
    for (const line of lines) {
        let cardNameInput = line.trim();
        if (!cardNameInput) continue; // Pula linhas vazias

        let count = 1;

        // Procura por números no início da linha, seguidos de espaço
        const match = cardNameInput.match(/^(\d+)\s+(.+)$/);
        if (match) {
            count = parseInt(match[1], 10);
            cardNameInput = match[2]; // O nome da carta passa a ser o resto do texto
        }

        const apiUrl = `https://api.scryfall.com/cards/named?fuzzy=${cardNameInput}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Carta não encontrada: ${cardNameInput}`);

            const cardData = await response.json();

            // Formata os textos e ícones
            let formattedMana = formatIcons(cardData.mana_cost || "");
            let formattedOracle = formatIcons(cardData.oracle_text || "").replace(/\n/g, '<br><br>');
            let ptText = (cardData.power && cardData.toughness) ? `${cardData.power}/${cardData.toughness}` : "";

            // Repetição para renderizar cópias de cartas plurais
            for (let i = 0; i < count; i++) {
                // Cria a 'div' nova e aplica a classe CSS
                const cardElement = document.createElement('div');
                cardElement.className = 'mtg-card';

                // Insere a estrutura HTML completa dentro da nova div
                cardElement.innerHTML = `
                    <div class="card-inner">
                        <div class="card-header">
                            <span class="card-name">${cardData.name}</span>
                            <span class="card-mana">${formattedMana}</span>
                        </div>
                        <div class="card-art-placeholder">[Arte]</div>
                        <div class="card-type">${cardData.type_line}</div>
                        <div class="card-text-box">${formattedOracle}</div>
                        <div class="card-footer">
                            <span class="card-pt">${ptText}</span>
                        </div>
                    </div>
                `;

                // Exibe a carta pronta na tela
                cardsContainer.appendChild(cardElement);
            }

            // População da tabela de depuração (adiciona apenas os dados da última carta da lista para referência)
            debugTableBody.innerHTML = "";
            for (const [key, value] of Object.entries(cardData)) {
                const row = document.createElement('tr');
                const cellKey = document.createElement('td');
                const cellValue = document.createElement('td');

                cellKey.textContent = key;
                cellValue.textContent = typeof value === 'object' ? JSON.stringify(value) : value;

                row.appendChild(cellKey);
                row.appendChild(cellValue);
                debugTableBody.appendChild(row);
            }

        } catch (error) {
            console.error(error);
            // Avisa no console e continua o laço para a próxima carta da lista
        }
    }
}

// === 6. FUNÇÕES AUXILIARES ===

// Dicionário de conversão de ícones Scryfall para mana-font
const manaIconMap = {
    't': 'tap',
    'q': 'untap',
    '1/2': '1-2',
    '∞': 'infinity'
};

// Converte texto entre chaves (ex: {1}, {W}, {T}) em ícones HTML da biblioteca mana-font
function formatIcons(text) {
    // Retorna vazio se não tiver texto
    if (!text) return "";

    // Procura globalmente por chaves e captura o conteúdo interno
    return text.replace(/\{([^}]+)\}/g, function (match, p1) {
        let icon = p1.toLowerCase();

        // Busca o ícone no dicionário. Se não existir, mantém o próprio ícone.
        icon = manaIconMap[icon] || icon;

        // Remove a barra de custos híbridos ou phyrexianos (ex: "w/u" vira "wu")
        icon = icon.replace('/', '');

        return `<i class="ms ms-${icon} ms-cost"></i>`;
    });
}