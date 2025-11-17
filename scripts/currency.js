const DEFAULT_TOKENS = 100;
const TOKEN_KEY = "casino_tokens";

// Inicializace žetonů při prvním spuštění
function initTokens() {
    if (localStorage.getItem(TOKEN_KEY) === null) {
        localStorage.setItem(TOKEN_KEY, DEFAULT_TOKENS);
    }
}

// Získání aktuálního počtu žetonů
function getTokens() {
    return parseInt(localStorage.getItem(TOKEN_KEY) || DEFAULT_TOKENS, 10);
}

// Nastavení nového počtu žetonů
function setTokens(amount) {
    localStorage.setItem(TOKEN_KEY, amount);
}

// Aktualizace zobrazení žetonů na stránce
function updateTokenDisplay(selector = "#currency") {
    const el = document.querySelector(selector);
    if (el) el.textContent = getTokens().toFixed(1) + " tokens";
}

// Spustit při načtení stránky
initTokens();

// Skrytá funkce: kliknutí na "Tokens:" přičte 100 tokenů
document.addEventListener("DOMContentLoaded", () => {
    const currencyDisplay = document.querySelector(".currency-display");
    if (currencyDisplay) {
        currencyDisplay.addEventListener("click", () => {
            setTokens(getTokens() + 100);
            updateTokenDisplay();
        });
    }
});