// --- GAME STATE ---
let deck = [];
let dealerHand = [];
let playerHand = [];
let currentBet = 0;
let isGameOver = true;

// --- CARD UTILITIES ---
const suits = ['♠', '♥', '♣', '♦'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// creates a shuffled deck of 52 cards
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    // fisher-yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// calculates score for a hand
function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;

    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else if (card.value === 'A') {
            aceCount += 1;
            score += 11;
        } else {
            score += parseInt(card.value);
        }
    }

    // adjust for aces if score > 21
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount -= 1;
    }
    return score;
}

// --- UI FUNCTIONS ---
// generates HTML for a single card
function createCardElement(card, isHidden = false) {
    const el = document.createElement('div');
    el.className = 'card';
    
    if (isHidden) {
        el.classList.add('hidden');
        return el;
    }

    // card color
    if (card.suit === '♥' || card.suit === '♦') {
        el.classList.add('red');
    } else {
        el.classList.add('black');
    }

    el.innerHTML = `
        <div class="card-top">${card.value} ${card.suit}</div>
        <div class="card-center">${card.suit}</div>
        <div class="card-bottom">${card.value} ${card.suit}</div>
    `;
    return el;
}

// updates the board (cards and scores)
function updateBoard(revealDealer = false) {
    const dealerContainer = document.getElementById('dealer-cards');
    const playerContainer = document.getElementById('player-cards');
    const dealerScoreEl = document.getElementById('dealer-score');
    const playerScoreEl = document.getElementById('player-score');

    // clear previous
    dealerContainer.innerHTML = '';
    playerContainer.innerHTML = '';

    // render dealer hand
    dealerHand.forEach((card, index) => {
        // if not revealing and it's the second card (index 1), hide it
        if (!revealDealer && index === 1) {
            dealerContainer.appendChild(createCardElement(card, true));
        } else {
            dealerContainer.appendChild(createCardElement(card));
        }
    });

    // render player hand
    playerHand.forEach(card => {
        playerContainer.appendChild(createCardElement(card));
    });

    // update scores
    const pScore = calculateScore(playerHand);
    playerScoreEl.innerText = pScore;

    if (revealDealer) {
        dealerScoreEl.innerText = calculateScore(dealerHand);
    } else {
        // only show value of first card
        const visibleCardVal = calculateScore([dealerHand[0]]);
        dealerScoreEl.innerText = `${visibleCardVal} + ?`;
    }
}

function setMessage(msg, color = '#ffd700') {
    const el = document.getElementById('game-message');
    el.innerText = msg;
    el.style.color = color;
}

// --- GAME ACTIONS ---

const betInput = document.getElementById('bet-amount');
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const bettingControls = document.getElementById('betting-controls');
const gameActions = document.getElementById('game-actions');

dealBtn.addEventListener('click', () => {
    // 1. validate bet
    let rawValue = parseFloat(betInput.value);
    const amount = Math.floor(rawValue);
    
    if (!isNaN(amount)) betInput.value = amount;

    if (isNaN(amount) || amount <= 0) {
        setMessage("Invalid bet amount!", "red");
        return;
    }
    if (amount > getTokens()) {
        setMessage("Not enough tokens!", "red");
        return;
    }

    // 2. start game
    currentBet = amount;
    setTokens(getTokens() - currentBet);
    updateTokenDisplay();

    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    isGameOver = false;

    // UI switch
    bettingControls.style.display = 'none';
    gameActions.style.display = 'flex';
    setMessage("Hit or Stand?");
    
    updateBoard(false);

    // instant blackjack check
    if (calculateScore(playerHand) === 21) {
        handleGameOver();
    }
});

hitBtn.addEventListener('click', () => {
    if (isGameOver) return;
    
    playerHand.push(deck.pop());
    updateBoard(false);

    const score = calculateScore(playerHand);
    if (score > 21) {
        handleGameOver(); // bust
    }
});

standBtn.addEventListener('click', () => {
    if (isGameOver) return;
    dealerPlay();
});

function dealerPlay() {
    // dealer must hit on 16 and below, stand on 17
    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    handleGameOver();
}

function handleGameOver() {
    isGameOver = true;
    updateBoard(true); // reveal dealer card

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);
    
    let message = "";
    let color = "#ffd700";

    if (pScore > 21) {
        message = "BUST! You went over 21.";
        color = "#e74c3c";
    } else if (dScore > 21) {
        message = "Dealer BUST! You Win!";
        color = "#2ECC71";
        setTokens(getTokens() + (currentBet * 2));
    } else if (pScore > dScore) {
        message = `You Win! (${pScore} vs ${dScore})`;
        color = "#2ECC71";
        setTokens(getTokens() + (currentBet * 2));
    } else if (dScore > pScore) {
        message = `Dealer Wins! (${dScore} vs ${pScore})`;
        color = "#e74c3c";
    } else {
        message = "Push! It's a tie.";
        setTokens(getTokens() + currentBet); // return bet
    }

    setMessage(message, color);
    updateTokenDisplay();

    // reset UI after short delay or change button text
    gameActions.style.display = 'none';
    bettingControls.style.display = 'flex'; // show bet controls again
    dealBtn.innerText = "PLAY AGAIN";
}

// --- PRESET BUTTONS ---
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let value = btn.getAttribute('data-value');
        if (value === 'max') {
            value = Math.floor(getTokens());
        }
        document.getElementById('bet-amount').value = value;
    });
});