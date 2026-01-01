// WHEEL CONFIGURATION 
// European roulette number sequence (Clockwise)
const rouletteNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// Function to determine segment color
function getSegmentColor(number) {
    if (number === 0) return '#2ECC71'; // Green
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? '#e74c3c' : '#0A1914'; // Red vs Dark
}

// Generate segments for Winwheel
const segments = rouletteNumbers.map(num => ({
    'fillStyle': getSegmentColor(num),
    'text': num.toString(),
    'textFillStyle': '#D9F2EB',
    'textFontSize': 16
}));

// Initialize Winwheel
let theWheel = new Winwheel({
    'numSegments': 37,
    'outerRadius': 190, // Matches canvas size
    'textFontSize': 18,
    'textFontFamily': 'Pixelify Sans',
    'segments': segments,
    'lineWidth': 2,
    'strokeStyle': '#D9F2EB', // Divider lines color
    'innerRadius': 70, // Donut hole
    'animation': {
        'type': 'spinToStop',
        'duration': 4, // Spin time in seconds
        'spins': 8,
        'callbackFinished': alertPrize,
        'easing': 'Power4.out' // Requires TweenMax
    }
});

// BETTING LOGIC
let currentBetSelection = null; // Stores what the user clicked (e.g., 'red', '0', '17')

// Function called when user clicks on the board
window.selectBet = function(selection) {
    // 1. Remove highlight from all cells
    document.querySelectorAll('.board-cell').forEach(el => el.classList.remove('selected'));
    
    // 2. Set new selection
    currentBetSelection = selection;
    
    // 3. Add highlight to the clicked element
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }

    // 4. Update UI text
    document.getElementById('selected-bet-text').innerText = selection.toUpperCase();
}

// GAME LOGIC
const spinBtn = document.getElementById('spin-btn');
const messageArea = document.getElementById('message-area');
const betInput = document.getElementById('bet-amount');

spinBtn.addEventListener('click', () => {
    // 1. Get raw value
    let rawValue = parseFloat(betInput.value);
    
    // 2. Round down to nearest integer (Floor)
    const betAmount = Math.floor(rawValue);

    // 3. Update the input field visually so user sees the rounded number
    if (!isNaN(betAmount)) {
        betInput.value = betAmount;
    }
    
    // Validation
    if (!currentBetSelection) {
        messageArea.innerText = "Please select a bet on the table!";
        messageArea.style.color = "#ffd700";
        return;
    }
    if (isNaN(betAmount) || betAmount <= 0) {
        messageArea.innerText = "Invalid bet amount!";
        messageArea.style.color = "#ffd700";
        return;
    }
    if (betAmount > getTokens()) {
        messageArea.innerText = "Not enough tokens!";
        messageArea.style.color = "red";
        return;
    }

    // Deduct tokens immediately
    setTokens(getTokens() - betAmount);
    updateTokenDisplay();
    
    messageArea.innerText = "Spinning...";
    messageArea.style.color = "#ffd700";
    
    // Disable button and start spin
    spinBtn.disabled = true;
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.draw();
    theWheel.startAnimation();
});

// Function called when spin finishes
function alertPrize(indicatedSegment) {
    const winningNumber = parseInt(indicatedSegment.text);
    // Re-read value (it is already rounded from the click event)
    const betAmount = parseInt(betInput.value); 
    let winAmount = 0;
    let won = false;

    // Check Win Condition
    if (currentBetSelection === 'red') {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        if (redNumbers.includes(winningNumber)) won = true;
        if (won) winAmount = betAmount * 2;
    } 
    else if (currentBetSelection === 'black') {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        // Note: 0 is neither red nor black
        if (!redNumbers.includes(winningNumber) && winningNumber !== 0) won = true;
        if (won) winAmount = betAmount * 2;
    }
    else if (currentBetSelection === 'even') {
        if (winningNumber !== 0 && winningNumber % 2 === 0) won = true;
        if (won) winAmount = betAmount * 2;
    }
    else if (currentBetSelection === 'odd') {
        if (winningNumber !== 0 && winningNumber % 2 !== 0) won = true;
        if (won) winAmount = betAmount * 2;
    }
    else {
        // Specific Number Bet
        if (parseInt(currentBetSelection) === winningNumber) {
            won = true;
            winAmount = betAmount * 36; // Standard payout 35:1 + original bet
        }
    }

    // Handle Result
    if (won) {
        setTokens(getTokens() + winAmount);
        updateTokenDisplay();
        messageArea.innerText = `WIN! Number ${winningNumber}. You won ${winAmount} tokens!`;
        messageArea.style.color = "#2ECC71";
    } else {
        messageArea.innerText = `Loss. Number ${winningNumber}. Better luck next time!`;
        messageArea.style.color = "#e74c3c";
    }

    spinBtn.disabled = false;
}

// Initial draw of the wheel
theWheel.draw();

// PRESET BUTTONS LOGIC
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let value = btn.getAttribute('data-value');
        
        // Handle 'max' button click
        if (value === 'max') {
            value = Math.floor(getTokens()/2); // Max is half of current tokens
        }
        
        // Set the value to the input field
        document.getElementById('bet-amount').value = value;
    });
});