const coin = document.getElementById('coin');
const betInput = document.getElementById('bet-amount');
const message = document.getElementById('result-message');
const redBtn = document.getElementById('red-btn');
const blueBtn = document.getElementById('blue-btn');

let isFlipping = false;

function flipCoin(choice)
{
    if (isFlipping) return;

    // 1. validate bet
    let rawValue = parseFloat(betInput.value);
    const betAmount = Math.floor(rawValue);
    if (!isNaN(betAmount)) betInput.value = betAmount;

    if (isNaN(betAmount) || betAmount <= 0) {
        message.innerText = "Invalid bet amount!";
        message.style.color = "#ff0000";        
        return;
    }
    if (betAmount > getTokens()) {
        message.innerText = "Not enough tokens!";
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
    message.innerText = "Flipping...";
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
        if (won) {
            setTokens(getTokens() + winAmount);
            updateTokenDisplay();
            message.innerText = `It is ${resultColor.toUpperCase()}! You win ${winAmount} tokens!`;
            message.style.color = '#2ED137';
        } else {
            message.innerText = `It is ${resultColor.toUpperCase()}! You lose ${betAmount} tokens!`;
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