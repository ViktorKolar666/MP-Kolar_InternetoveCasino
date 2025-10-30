// Matter.js initialization
const { Engine, Render, Runner, World, Bodies, Events } = Matter;

const width = 600, height = 700;
const engine = Engine.create();
const { world } = engine;

const render = Render.create({
    element: document.getElementById("plinko-canvas"),
    engine,
    options: {
        width,
        height,
        wireframes: false,
        background: "#1D1F1F"
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
World.add(world, [
    Bodies.rectangle(width / 2, height, width, 20, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 20, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 20, height, { isStatic: true })
]);

// Pins
const pinRadius = 5, rows = 16;
const pinSpacingY = (height - 200) / (rows - 1), pinSpacingX = width / rows;
for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 1;
    const offsetX = (width - pinsInRow * pinSpacingX) / 2 + pinSpacingX / 2;
    const y = 50 + row * pinSpacingY;
    for (let col = 0; col < pinsInRow; col++) {
        const x = offsetX + col * pinSpacingX;
        World.add(world, Bodies.circle(x, y, pinRadius, { isStatic: true, render: { fillStyle: "white" } }));
    }
}

// Slots & multipliers
const slotWidth = width / (rows + 1), slotHeight = 60;
const slots = [], slotColors = [], slotMultipliers = [];
const multipliers = [0.5, 1, 5, 10, 15, 30, 60, 75, 100, 75, 60, 30, 15, 10, 5, 1, 0.5];
for (let i = 0; i <= rows; i++) {
    const centerDist = Math.abs(i - Math.floor((rows + 1) / 2));
    const maxDist = Math.floor((rows + 1) / 2);
    const red = Math.round(120 + (255 - 120) * (1 - centerDist / maxDist));
    const color = `rgb(${red},0,0)`;
    slotColors.push(color);
    slotMultipliers.push(`x ${multipliers[i]}`);
    const x = i * slotWidth + slotWidth / 2;
    const slot = Bodies.rectangle(x, height - slotHeight / 2, slotWidth, slotWidth, {
        isStatic: true, render: { fillStyle: color }
    });
    slot.color = color;
    slot.multiplier = slotMultipliers[i];
    slots.push(slot);
    World.add(world, slot);
}

// Draw multipliers
const ctx = render.canvas.getContext("2d");
Events.on(render, "afterRender", () => {
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    slots.forEach(slot => {
        const { x, y } = slot.position;
        ctx.fillStyle = "white";
        ctx.fillText(slot.multiplier, x, y);
    });
});

// Ball drop & collision
const balls = [];
function highlightSlot(slot) {
    const orig = slot.color;
    slot.render.fillStyle = lightenColor(orig, 0.5);
    setTimeout(() => { slot.render.fillStyle = orig; }, 300);
}
function lightenColor(color, amount) {
    const [r, g, b] = color.match(/\d+/g).map(Number).map(c => Math.min(255, c + amount * 255));
    return `rgb(${r},${g},${b})`;
}
Events.on(engine, "collisionStart", event => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        balls.forEach((ball, idx) => {
            slots.forEach(slot => {
                if ((bodyA === ball && bodyB === slot) || (bodyB === ball && bodyA === slot)) {
                    highlightSlot(slot);
                    const multiplier = parseFloat(slot.multiplier.replace("x ", ""));
                    const win = Math.round(ball.bet * multiplier);
                    setTokens(getTokens() + win);
                    updateTokenDisplay();
                    addWinToHistory(multiplier, win);
                    World.remove(world, ball);
                    balls.splice(idx, 1);
                }
            });
        });
    });
});

// Výpis posledních 15 výher
const winHistory = [];
function addWinToHistory(multiplier, winAmount) {
    // Určení třídy podle násobiče
    let cls = "";
    if (multiplier >= 100) cls = "win-x100";
    else if (multiplier >= 75) cls = "win-x75";
    else if (multiplier >= 60) cls = "win-x60";
    else if (multiplier >= 30) cls = "win-x30";
    else if (multiplier >= 15) cls = "win-x15";
    else if (multiplier >= 10) cls = "win-x10";
    else if (multiplier >= 5) cls = "win-x5";
    else if (multiplier >= 1) cls = "win-x1";
    else cls = "win-x05";

    winHistory.unshift({ multiplier, winAmount, cls });
    if (winHistory.length > 15) winHistory.pop();

    const container = document.getElementById("win-history");
    if (container) {
        container.innerHTML = winHistory.map(
            w => `<div class="win-entry ${w.cls}">x${w.multiplier} &rarr; +${w.winAmount} tokens</div>`
        ).join("");
    }
}

// Bet & drop logic
const betAmountInput = document.getElementById("bet-amount");
const startGameBtn = document.getElementById("start-game");
function validateBetInput() {
    const value = parseFloat(betAmountInput.value);
    startGameBtn.disabled = !betAmountInput.value || value <= 0;
}
betAmountInput.addEventListener("input", validateBetInput);
validateBetInput();

startGameBtn.addEventListener("click", () => {
    const betError = document.getElementById("bet-error");
    const betAmount = parseFloat(betAmountInput.value);
    betError.style.display = "none";
    betAmountInput.classList.remove("error");
    if (!betAmountInput.value) {
        betError.textContent = "Field cannot be empty!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }
    if (betAmount <= 0) {
        betError.textContent = "Bet amount must be positive!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }
    if (betAmount > getTokens()) {
        betError.textContent = "Not enough tokens!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }
    setTokens(getTokens() - betAmount);
    updateTokenDisplay();
    // Drop ball mainly from center (±10% width)
    const center = width / 2;
    const dropRadius = width * 0.10;
    const randomX = center + (Math.random() - 0.5) * 2 * dropRadius;
    const dropY = 30;
    const ball = Bodies.circle(randomX, dropY, 10, {
        restitution: 0.6,
        render: { fillStyle: "red" }
    });
    ball.bet = betAmount;
    balls.push(ball);
    World.add(world, ball);
});

// Responzivní zobrazení hrací plochy
function resizePlinkoCanvas() {
    const container = document.getElementById("plinko-canvas");
    if (!container) return;
    const canvas = render.canvas;
    const baseWidth = 600, baseHeight = 700;

    // Zjisti dostupnou šířku viewportu (nebo rodiče) a výšku okna
    const availWidth = Math.min(window.innerWidth, container.parentElement.offsetWidth || window.innerWidth);
    const availHeight = window.innerHeight - container.getBoundingClientRect().top - 30;

    // Spočítej škálovací faktor tak, aby se plocha vešla na šířku i výšku, ale nikdy nebyla větší než originál
    const scale = Math.min(availWidth / baseWidth, availHeight / baseHeight, 1);

    // Nastav škálování canvasu
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = "top center";
    canvas.style.width = baseWidth + "px";
    canvas.style.height = baseHeight + "px";

    // Kontejner má vždy velikost nativního canvasu (kvůli centrování flexem)
    container.style.width = baseWidth + "px";
    container.style.height = baseHeight + "px";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "flex-start";
    container.style.margin = "0 auto";
    container.style.overflow = "visible";
}
window.addEventListener("resize", resizePlinkoCanvas);
resizePlinkoCanvas();