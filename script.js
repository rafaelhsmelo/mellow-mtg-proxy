// --- 1. MAPEAMENTO DO DOM ---

// Controles de interação
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// Alvos de injeção de dados no molde da carta
const cardName = document.querySelector('.card-name');
const cardMana = document.querySelector('.card-mana');
const cardType = document.querySelector('.card-type');
const cardText = document.querySelector('.card-text-box'); 
const cardPt = document.querySelector('.card-pt');

// Alvo de injeção de dados para a tabela
const debugTableBody = document.getElementById('debugTableBody');

// --- 2. REGISTRO DE EVENTOS ---

// Aciona a execução da busca através do clique
searchButton.addEventListener('click', searchCard);

// Monitora o teclado dentro do campo; aciona a busca exclusivamente na tecla Enter
searchInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        searchCard();
    }
});

// --- 3. LÓGICA DE REQUISIÇÃO E PROCESSAMENTO ---

// Função assíncrona necessária para operações de rede (fetch)
async function searchCard() {
    // Extração da string e remoção de espaços em branco nas extremidades
    const query = searchInput.value.trim();

    // Condição de guarda: interrompe a função se o campo estiver vazio
    if (!query) return;

    // Construção do endpoint da API Scryfall
    const apiUrl = `https://api.scryfall.com/cards/named?fuzzy=${query}`;

    try {
        // Envia a requisição HTTP e pausa a execução até obter o retorno
        const response = await fetch(apiUrl);

        // Validação de status de resposta (erros 404, 500 disparam a exceção)
        if (!response.ok) {
            throw new Error('Carta não encontrada ou erro na API');
        }

        // Conversão do corpo da resposta para um objeto JavaScript estruturado
        const cardData = await response.json();

        // --- 4. POPULAÇÃO DOS DADOS DA CARTA ---
        
        cardName.textContent = cardData.name;
        
        // Correção de chave: a propriedade na API é "mana_cost". Fallback para evitar undefined em terrenos.
        cardMana.textContent = cardData.mana_cost || ""; 
        
        cardType.textContent = cardData.type_line;
        
        // Correção de variável: direcionado para cardText, não cardType.
        cardText.textContent = cardData.oracle_text || "";

        // Validação condicional: preenche apenas se ambos os valores existirem
        if (cardData.power && cardData.toughness) {
            cardPt.textContent = `${cardData.power}/${cardData.toughness}`;
        } else {
            cardPt.textContent = "";
        }

        // --- 5. POPULAÇÃO DA TABELA DE DEPURAÇÃO ---
        
        // O bloco for foi movido para o interior da função searchCard e da estrutura try.
        // É necessário garantir que ele ocorra após a definição da variável cardData.
        
        // Reinicia o corpo da tabela para evitar acúmulo de buscas sucessivas
        debugTableBody.innerHTML = "";

        // Itera pelos pares chave-valor do objeto de resposta
        for (const [key, value] of Object.entries(cardData)) {
            // Criação programática de elementos HTML
            const row = document.createElement('tr');
            const cellKey = document.createElement('td');
            const cellValue = document.createElement('td');

            cellKey.textContent = key;

            // Tratamento de tipo: converte objetos ou arrays aninhados em texto legível.
            // Correção de sintaxe implementada no operador ternário (adição do fallback : value).
            cellValue.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
            
            // Montagem da hierarquia DOM
            row.appendChild(cellKey);
            row.appendChild(cellValue);
            debugTableBody.appendChild(row);
        }

    } catch (error) {
        // Bloco responsável por interceptar exceções de rede e tratativas não encontradas
        console.error('Erro na busca', error);
        alert("Carta não encontrada");
    }
}