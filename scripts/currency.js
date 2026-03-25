const DEFAULT_TOKENS = 100;
const TOKEN_KEY = "casino_tokens";
// Only Coinflip and Home are unlocked by default
const DEFAULT_UNLOCKED = ['index.html', 'coinflip.html'];

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
    if (el) el.textContent = getTokens().toFixed(0);
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

// --- GAME UNLOCKING ---
function getUnlockedGames() {
    const stored = localStorage.getItem("unlockedGames");
    if (!stored) {
        localStorage.setItem('unlockedGames', JSON.stringify(DEFAULT_UNLOCKED));
        return DEFAULT_UNLOCKED;
    }
    return JSON.parse(stored);
}

function isGameUnlocked(gameFile) {
    const unlocked = getUnlockedGames();
    return unlocked.includes(gameFile);
}

function buyGame(gameFileName, cost) {
    if (isGameUnlocked(gameFileName)) {
        alert("You already have this game unlocked!");
        return;
    }

    const currentTokens = getTokens();
    if (currentTokens >= cost) {
        setTokens(currentTokens - cost);
        
        const unlocked = getUnlockedGames();
        unlocked.push(gameFileName);
        localStorage.setItem('unlockedGames', JSON.stringify(unlocked));
        
        updateNavLocks();
        updateTokenDisplay();
        
        // update main page cards if function exists
        if (typeof updateMainUI === 'function') updateMainUI();

        alert(`Successfully purchased ${gameFileName.replace('.html', '').toUpperCase()}!`);
    } else {
        alert(`You don't have enough tokens! Cost: ${cost}, You have: ${currentTokens}`);
    }
}

// // update navigation links based on unlocked games
// function updateNavLocks() {
// const unlocked = getUnlockedGames();
// const navLinks = document.querySelectorAll('.nav-links a');

// navLinks.forEach(link => {
// const href = link.getAttribute('href');
// // if the game is unlocked, remove the lock
// if (unlocked.includes(href)) {
//     link.classList.remove('notUnlocked');
// } else {
//     // else, add the lock
//     link.classList.add('notUnlocked');
// }
// });
// }

// update navigation links based on unlocked games
function updateNavLocks() {
    const unlocked = getUnlockedGames();
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        let href = link.getAttribute('href');
        
        // Remove leading slash if present (e.g., "/coinflip" -> "coinflip")
        if (href.startsWith('/')) {
            href = href.substring(1);
        }
        
        // If removing the slash leaves an empty string (was just "/"), it's index.html
        if (href === '') {
            href = 'index.html';
        }
        
        // If the .html extension is missing, add it (e.g., "coinflip" -> "coinflip.html")
        if (href.length > 0 && !href.endsWith('.html')) {
            href += '.html';
        }

        // Now compare the corrected name
        if (unlocked.includes(href)) {
            link.classList.remove('notUnlocked');
        } else {
            link.classList.add('notUnlocked');
        }
    });
}

// --- PROGRESS RESET ---
function resetProgress() {
    if (confirm("DO YOU REALLY WANT TO RESET THE GAME? All purchased games and tokens will be lost!")) {
        localStorage.clear();
        location.reload();
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateTokenDisplay();
    updateNavLocks();
});