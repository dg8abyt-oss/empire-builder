// Game State
let game = {
    money: 0,
    totalMoneyEarned: 0,
    startTime: Date.now(),
    clickCount: 0,
    prestigeMultiplier: 1,
    businesses: []
};

// The 20 Ways to Make Money (Configuration)
const businessConfig = [
    { name: "Recycle Cans", baseCost: 15, baseIncome: 0.5, id: 0 },
    { name: "Dog Walking", baseCost: 100, baseIncome: 3, id: 1 },
    { name: "Lemonade Stand", baseCost: 500, baseIncome: 10, id: 2 },
    { name: "Newspaper Route", baseCost: 1100, baseIncome: 25, id: 3 },
    { name: "Car Wash", baseCost: 5000, baseIncome: 80, id: 4 },
    { name: "Pizza Delivery", baseCost: 12000, baseIncome: 150, id: 5 },
    { name: "Freelance Coding", baseCost: 40000, baseIncome: 350, id: 6 },
    { name: "Twitch Streamer", baseCost: 150000, baseIncome: 1000, id: 7 },
    { name: "Dropshipping", baseCost: 500000, baseIncome: 2800, id: 8 },
    { name: "Crypto Farm", baseCost: 1500000, baseIncome: 7500, id: 9 },
    { name: "Real Estate", baseCost: 5000000, baseIncome: 18000, id: 10 },
    { name: "Tech Startup", baseCost: 25000000, baseIncome: 55000, id: 11 },
    { name: "Space Tourism", baseCost: 150000000, baseIncome: 200000, id: 12 },
    { name: "Asteroid Mining", baseCost: 1000000000, baseIncome: 950000, id: 13 },
    { name: "Moon Base", baseCost: 7500000000, baseIncome: 4500000, id: 14 },
    { name: "Dyson Swarm", baseCost: 50000000000, baseIncome: 25000000, id: 15 },
    { name: "Warp Drive", baseCost: 400000000000, baseIncome: 150000000, id: 16 },
    { name: "Time Machine", baseCost: 3000000000000, baseIncome: 800000000, id: 17 },
    { name: "Reality Engine", baseCost: 25000000000000, baseIncome: 5000000000, id: 18 },
    { name: "Universe Simulation", baseCost: 200000000000000, baseIncome: 50000000000, id: 19 }
];

// Initialization
function init() {
    loadGame();
    if (game.businesses.length === 0) {
        game.businesses = businessConfig.map(b => ({
            id: b.id,
            count: 0,
            cost: b.baseCost
        }));
    }
    renderBusinesses();
    requestAnimationFrame(gameLoop);
    setInterval(autoSave, 30000);
}

// Core Logic
function getIncomeMultiplier() {
    return game.prestigeMultiplier;
}

function manualClick() {
    let clickVal = 1 * getIncomeMultiplier();
    // Add 1% of CPS to click value to scale it late game
    const cps = calculateCPS();
    if (cps > 0) clickVal += (cps * 0.01);
    
    addMoney(clickVal);
    game.clickCount++;
    createFloatingText(clickVal);
}

function addMoney(amount) {
    game.money += amount;
    game.totalMoneyEarned += amount;
    updateUI();
}

function buyBusiness(id) {
    const biz = game.businesses[id];
    const cfg = businessConfig[id];
    
    if (game.money >= biz.cost) {
        game.money -= biz.cost;
        biz.count++;
        // Cost scaling: Base * 1.15^Count
        biz.cost = Math.ceil(cfg.baseCost * Math.pow(1.15, biz.count));
        renderBusinesses();
        updateUI();
    }
}

function calculateCPS() {
    let cps = 0;
    game.businesses.forEach(b => {
        const cfg = businessConfig[b.id];
        cps += (b.count * cfg.baseIncome);
    });
    return cps * getIncomeMultiplier();
}

// Game Loop
let lastTime = Date.now();
function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const cps = calculateCPS();
    if (cps > 0) {
        addMoney(cps * dt);
    }
    
    updateUI();
    checkUnlocks();
    requestAnimationFrame(gameLoop);
}

// UI Updates
function updateUI() {
    document.getElementById('money-display').innerText = formatMoney(game.money);
    document.getElementById('cps-display').innerText = `per second: ${formatMoney(calculateCPS())}`;
    document.getElementById('click-val').innerText = `+$${formatMoney(1 + (calculateCPS()*0.01))}`;
    
    // Enable/Disable buttons
    game.businesses.forEach(b => {
        const btn = document.getElementById(`btn-${b.id}`);
        if (btn) btn.disabled = game.money < b.cost;
    });

    if (game.totalMoneyEarned > 1000000) {
        document.getElementById('prestige-container').style.display = 'block';
        const pBonus = Math.sqrt(game.totalMoneyEarned / 1000000);
        document.getElementById('prestige-bonus').innerText = `Next Multiplier: ${pBonus.toFixed(2)}x`;
    }
}

function renderBusinesses() {
    const list = document.getElementById('business-list');
    list.innerHTML = '';
    
    game.businesses.forEach((b, index) => {
        const cfg = businessConfig[index];
        const div = document.createElement('div');
        div.className = 'business-item';
        div.id = `biz-row-${index}`;
        
        // Hide if not unlocked yet (logic: show if previous owned > 0 or if it's the first one)
        // For visibility, let's show the first 2 always, then only if you can afford 50% of it
        // Simpler: Show if previous is owned or it's index 0
        let locked = false;
        if (index > 0 && game.businesses[index-1].count === 0) locked = true;
        // Exception: allow peeking at next one
        if (index > 0 && game.businesses[index-1].count > 0) locked = false;
        
        if (locked) div.classList.add('locked');

        div.innerHTML = `
            <div class="b-info">
                <h4>${cfg.name}</h4>
                <div class="b-income">+$${formatMoney(cfg.baseIncome * getIncomeMultiplier())}/sec</div>
                <div class="b-cost">Cost: ${formatMoney(b.cost)}</div>
            </div>
            <div style="display:flex; align-items:center;">
                <div class="b-count">${b.count}</div>
                <button class="buy-btn" id="btn-${index}" onclick="buyBusiness(${index})">Buy</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function checkUnlocks() {
    // Re-render only if lock state changes (optimization omitted for brevity, simple check)
    // Actually, simple CSS class toggling is better than re-rendering HTML
    game.businesses.forEach((b, index) => {
        const row = document.getElementById(`biz-row-${index}`);
        if(row) {
            let locked = true;
            if (index === 0) locked = false;
            else if (game.businesses[index-1].count > 0) locked = false;
            
            if (!locked) row.classList.remove('locked');
        }
    });
}

function formatMoney(n) {
    if (n < 1000) return Math.floor(n);
    if (n < 1000000) return (n/1000).toFixed(2) + 'k';
    if (n < 1000000000) return (n/1000000).toFixed(2) + 'm';
    if (n < 1000000000000) return (n/1000000000).toFixed(2) + 'b';
    return (n/1000000000000).toFixed(2) + 't';
}

function createFloatingText(amount) {
    // Visual effect omitted for code brevity but placeholder logic here
}

// Prestige
function prestige() {
    if (confirm("Reset everything for a permanent multiplier?")) {
        const newMult = Math.sqrt(game.totalMoneyEarned / 1000000);
        if (newMult < 1) return;
        
        game.prestigeMultiplier += newMult;
        game.money = 0;
        game.totalMoneyEarned = 0;
        game.businesses = businessConfig.map(b => ({
            id: b.id, count: 0, cost: b.baseCost
        }));
        saveGame();
        renderBusinesses();
    }
}

// Save/Load
function saveGame() {
    localStorage.setItem('empireBuilderSave', JSON.stringify(game));
    console.log("Saved");
}
function loadGame() {
    const saved = localStorage.getItem('empireBuilderSave');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge allows adding new businesses in updates without breaking saves
        game = { ...game, ...parsed };
        // Ensure business array matches config length
        if (game.businesses.length < businessConfig.length) {
            for (let i = game.businesses.length; i < businessConfig.length; i++) {
                game.businesses.push({ id: i, count: 0, cost: businessConfig[i].baseCost });
            }
        }
    }
}
function autoSave() { saveGame(); }
function hardReset() {
    if(confirm("Wipe save completely?")) {
        localStorage.removeItem('empireBuilderSave');
        location.reload();
    }
}

// API Interaction
async function claimDailyBonus() {
    try {
        const res = await fetch('/api/daily-bonus');
        const data = await res.json();
        if(data.bonus) {
            addMoney(data.bonus);
            alert(`Server granted you $${data.bonus}!`);
        } else {
            alert(data.message);
        }
    } catch (e) {
        console.error(e);
        alert("Server error.");
    }
}

init();