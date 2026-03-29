const coin = document.getElementById('coin');
const betInput = document.getElementById('bet-amount');
const message = document.getElementById('result-message');
const redBtn = document.getElementById('red-btn');
const blueBtn = document.getElementById('blue-btn');

// --- TEXTS ---
const coinflipTexts = {
    invalidBet: { en: "Invalid bet amount!", cs: "Neplatná částka sázky!" },
    notEnough: { en: "Not enough tokens!", cs: "Nemáš dostatek žetonů!" },
    flipping: { en: "Flipping...", cs: "Házení..." },
    red: { en: "RED", cs: "ČERVENÁ" },
    blue: { en: "BLUE", cs: "MODRÁ" },
    win: { en: "It is {color}! You win {amount} tokens!", cs: "Padla {color}! Vyhráváš {amount} žetonů!" },
    lose: { en: "It is {color}! You lose {amount} tokens!", cs: "Padla {color}! Prohráváš {amount} žetonů!" }
};

function getCfText(key) {
    const lang = localStorage.getItem('selectedLang') || 'en';
    return coinflipTexts[key][lang];
}

let isFlipping = false;

function flipCoin(choice)
{
    if (isFlipping) return;

    // 1. validate bet
    let rawValue = parseFloat(betInput.value);
    const betAmount = Math.floor(rawValue);
    if (!isNaN(betAmount)) betInput.value = betAmount;

    if (isNaN(betAmount) || betAmount <= 0) {
        message.innerText = getCfText('invalidBet');
        message.style.color = "#ff0000";        
        return;
    }
    if (betAmount > getTokens()) {
        message.innerText = getCfText('notEnough');
        message.style.color = "#ff0000";
        return;
    }

    // 2. start flip
    isFlipping = true;
    setTokens(getTokens() - betAmount);
    updateTokenDisplay();

    // block buttons
    redBtn.disabled = true;
    blueBtn.disabled = true;
    message.innerText = getCfText('flipping');
    message.style.color = "#ffd700";

    // 3. calculate result
    const result = Math.floor(Math.random() * 2); // 0 = red, 1 = blue
    const resultColor = result === 0 ? 'red' : 'blue';

    // 4. reset animation
    coin.style.transition = 'none';
    coin.style.transform = 'rotateY(0deg)';
    coin.offsetHeight; // trigger reflow - for restarting animation

    // 5. start animation
    coin.style.transition = 'transform 3s ease-out';

    // if red comes up -> flips 5 times (1800deg)
    // if blue comes up -> flips 5.5 times (1980deg)
    const rotations = 5;
    const degrees = result === 0
        ? (rotations * 360) + 0 // red
        : (rotations * 360) + 180; // blue
 
    coin.style.transform = `rotateY(${degrees}deg)`;

    // 6. calculation after animation
    setTimeout(() => {
        let winAmount = 0;
        let won = false;
        
        if (choice === resultColor) {
            won = true;
            winAmount = betAmount * 2;
        }
        
        const translatedColor = getCfText(resultColor);
        
        if (won) {
            setTokens(getTokens() + winAmount);
            updateTokenDisplay();
            message.innerText = getCfText('win').replace('{color}', translatedColor).replace('{amount}', winAmount);
            message.style.color = '#2ED137';
        } else {
            message.innerText = getCfText('lose').replace('{color}', translatedColor).replace('{amount}', betAmount);
            message.style.color = '#ff0000';
        }
        
        // unblock buttons
        isFlipping = false;
        redBtn.disabled = false;
        blueBtn.disabled = false;
    }, 3000);
}

// --- EVENT LISTENERS ---

// bet buttons logic
if (redBtn) {
    redBtn.addEventListener('click', () => flipCoin('red'));
}
if (blueBtn) {
    blueBtn.addEventListener('click', () => flipCoin('blue'));
}

// preset buttons logic
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let value = btn.getAttribute('data-value');
        if (value === 'max') {
            value = Math.floor(getTokens());
        }
        betInput.value = value;
    });
});