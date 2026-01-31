const DEFAULT_TOKENS = 100;
const TOKEN_KEY = "casino_tokens";

// token initialization when first visiting site
function initTokens() {
    if (localStorage.getItem(TOKEN_KEY) === null) {
        localStorage.setItem(TOKEN_KEY, DEFAULT_TOKENS);
    }
}

// get current token count
function getTokens() {
    return parseInt(localStorage.getItem(TOKEN_KEY) || DEFAULT_TOKENS, 10);
}

// set new token count
function setTokens(amount) {
    localStorage.setItem(TOKEN_KEY, amount);
}

// update token display on the page
function updateTokenDisplay(selector = "#currency") {
    const el = document.querySelector(selector);
    if (el) el.textContent = getTokens().toFixed(1) + " tokens";
}

// run on page load
initTokens();

// hidden feature: clicking on "Tokens:" adds 100 tokens
document.addEventListener("DOMContentLoaded", () => {
    const currencyDisplay = document.querySelector(".currency-display");
    if (currencyDisplay) {
        currencyDisplay.addEventListener("click", () => {
            setTokens(getTokens() + 100);
            updateTokenDisplay();
        });
    }
});