// Pirate quotes from Pirates of the Caribbean
const pirateQuotes = [
    "I've got a jar of dirt!",
    "Why is the rum always gone?",
    "Not all treasure is silver and gold, mate.",
    "The problem is not the problem. The problem is your attitude about the problem.",
    "You will always remember this as the day you almost caught Captain Jack Sparrow!",
    "Me? I'm dishonest, and a dishonest man you can always trust to be dishonest.",
    "You best start believing in ghost stories. You're in one!",
    "Keep a weather eye on the horizon.",
    "Take what you can, give nothing back!",
    "A captain goes down with his ship.",
    "Dead men tell no tales.",
    "Drink up, me hearties, yo ho!",
    "It's not about living forever. It's about living with yourself forever.",
    "The seas may be rough, but I am the captain!",
    "Savvy?",
    "Part of the ship, part of the crew.",
    "Do you fear death?",
    "Life is cruel. Why should the afterlife be any different?",
    "You have a debt to pay.",
    "I'm Captain Jack Sparrow. Savvy?"
];

// Theme titles
const themeTitles = {
    light: "☀️ Liar's Dice ☀️",
    dark: "🌙 Liar's Dice 🌙",
    oled: "🖥️ Liar's Dice 🖥️",
    pirates: "⚓ Liar's Dice ⚓",
    ocean: "🌊 Liar's Dice 🌊",
    skull: "💀 Liar's Dice 💀",
    treasure: "💰 Liar's Dice 💰",
    storm: "⛈️ Liar's Dice ⛈️",
    rum: "🥃 Liar's Dice 🥃",
    kraken: "🦑 Liar's Dice 🦑",
    dutchman: "👻 Flying Dutchman 👻",
    mario: "🍄 Liar's Dice 🍄"
};

// Theme emojis for starter dialog
const themeEmojis = {
    light: "☀️",
    dark: "🌙",
    oled: "🖥️",
    pirates: "⚓",
    ocean: "🌊",
    skull: "💀",
    treasure: "💰",
    storm: "⛈️",
    rum: "🥃",
    kraken: "🦑",
    dutchman: "👻",
    mario: "🍄"
};

// State
let currentCount = 25;
let currentQuoteIndex = 0;
let soundPlayed = false;
let isMuted = false;
let wakeLock = null;

// DOM Elements
let diceCountEl, quoteDisplayEl;
let secondaryButtons;
let themeSelect, themeTitle, celebrationContainer, muteBtn, fullscreenBtn;

// Initialize
function init() {
    // Get DOM elements
    diceCountEl = document.getElementById('diceCount');
    quoteDisplayEl = document.getElementById('quoteDisplay');
    secondaryButtons = document.getElementById('secondaryButtons');
    themeSelect = document.getElementById('themeSelect');
    themeTitle = document.getElementById('themeTitle');
    celebrationContainer = document.getElementById('celebrationContainer');
    muteBtn = document.getElementById('muteBtn');
    fullscreenBtn = document.getElementById('fullscreenBtn');

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    document.getElementById('copyrightYear').textContent = new Date().getFullYear();
    loadState();
    updateDisplay();
    showRandomQuote();
}

// Save state to localStorage
function saveState() {
    const state = {
        count: currentCount,
        theme: themeSelect.value,
        muted: isMuted
    };
    localStorage.setItem('liars-dice-state', JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('liars-dice-state');
    if (saved) {
        const state = JSON.parse(saved);
        currentCount = state.count || 25;
        if (state.theme) {
            themeSelect.value = state.theme;
            // Change theme without saving (to avoid overwriting with defaults)
            document.body.className = `theme-${state.theme}`;
            if (themeTitle) {
                themeTitle.textContent = themeTitles[state.theme] || "Liar's Dice";
            }
        }
        if (state.muted) {
            isMuted = true;
            if (muteBtn) muteBtn.textContent = '🔇';
        }
    }
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    saveState();
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen not available:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Update fullscreen button icon
function updateFullscreenButton() {
    if (fullscreenBtn) {
        fullscreenBtn.textContent = document.fullscreenElement ? '⛌' : '⛶';
        fullscreenBtn.title = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
    }

    // Manage wake lock based on fullscreen state
    if (document.fullscreenElement) {
        requestWakeLock();
    } else {
        releaseWakeLock();
    }
}

// Request wake lock to prevent screen sleep
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake lock error:', err);
        }
    }
}

// Release wake lock
async function releaseWakeLock() {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
    }
}

// Handle visibility change - reacquire wake lock when page becomes visible (only if fullscreen)
function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && document.fullscreenElement) {
        requestWakeLock();
    }
}

// Change dice count
function changeDice(amount, event) {
    if (event) event.stopPropagation();

    const prevCount = currentCount;
    currentCount = Math.max(0, currentCount + amount);
    updateDisplay();
    showNextQuote();
    checkLowDice();

    // Check for zero - trigger celebration
    if (currentCount === 0 && prevCount > 0) {
        triggerCelebration();
    }

    saveState();
}

// Reset to zero
function resetToZero(event) {
    if (event) event.stopPropagation();
    currentCount = 0;
    updateDisplay();
    saveState();
}

// Update display
function updateDisplay() {
    diceCountEl.textContent = currentCount;
}

// Show random quote
function showRandomQuote() {
    currentQuoteIndex = Math.floor(Math.random() * pirateQuotes.length);
    quoteDisplayEl.textContent = `"${pirateQuotes[currentQuoteIndex]}"`;
}

// Show next quote
function showNextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % pirateQuotes.length;
    quoteDisplayEl.textContent = `"${pirateQuotes[currentQuoteIndex]}"`;
}

// Check for low dice and play sound
function checkLowDice() {
    if (currentCount === 5 && !soundPlayed) {
        soundPlayed = true;
        playAlertSound();
    }
    if (currentCount > 5) {
        soundPlayed = false;
    }
}

// Play alert sound using Web Audio API
function playAlertSound() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const theme = themeSelect.value;

        if (theme === 'pirates') {
            playPirateSound(audioCtx);
        } else if (theme === 'mario') {
            playMarioDeathSound(audioCtx);
        } else {
            playThemeSound(audioCtx, theme);
        }
    } catch (e) {
        console.log('Audio not available');
    }
}

// Pirates theme - sea shanty style melody
function playPirateSound(audioCtx) {
    const notes = [
        { freq: 392, duration: 0.3, type: 'triangle' },
        { freq: 440, duration: 0.3, type: 'triangle' },
        { freq: 494, duration: 0.3, type: 'triangle' },
        { freq: 392, duration: 0.4, type: 'triangle' },
        { freq: 330, duration: 0.3, type: 'triangle' },
        { freq: 392, duration: 0.3, type: 'triangle' },
        { freq: 440, duration: 0.5, type: 'triangle' },
        { freq: 392, duration: 0.6, type: 'triangle' },
    ];

    let time = audioCtx.currentTime;
    notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = note.freq;
        osc.type = note.type;

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration);

        osc.start(time);
        osc.stop(time + note.duration);
        time += note.duration * 0.9;
    });
}

// Mario death sound (classic NES Mario Bros death jingle)
function playMarioDeathSound(audioCtx) {
    // Classic Mario death sound: B4, F4, pause, F4, F4-E4-D4-C4 (descending)
    const notes = [
        { freq: 494, duration: 0.15 },   // B4
        { freq: 349, duration: 0.15 },   // F4
        { freq: 0, duration: 0.15 },     // pause
        { freq: 349, duration: 0.15 },   // F4
        { freq: 349, duration: 0.15 },   // F4
        { freq: 330, duration: 0.15 },   // E4
        { freq: 294, duration: 0.15 },   // D4
        { freq: 262, duration: 0.4 },    // C4 (held longer)
    ];

    let time = audioCtx.currentTime;
    notes.forEach(note => {
        if (note.freq === 0) {
            // Just advance time for pause
            time += note.duration;
            return;
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = note.freq;
        osc.type = 'square';

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration * 0.9);

        osc.start(time);
        osc.stop(time + note.duration);
        time += note.duration;
    });
}

// Theme-specific sounds
function playThemeSound(audioCtx, theme) {
    const patterns = {
        light: [
            { freq: 523, dur: 0.2, type: 'sine' },
            { freq: 659, dur: 0.2, type: 'sine' },
            { freq: 784, dur: 0.3, type: 'sine' },
            { freq: 1047, dur: 0.5, type: 'sine' }
        ],
        dark: [
            { freq: 220, dur: 0.4, type: 'sawtooth' },
            { freq: 185, dur: 0.4, type: 'sawtooth' },
            { freq: 147, dur: 0.6, type: 'sawtooth' }
        ],
        oled: [
            { freq: 880, dur: 0.15, type: 'square' },
            { freq: 1047, dur: 0.15, type: 'square' },
            { freq: 1319, dur: 0.15, type: 'square' },
            { freq: 1568, dur: 0.3, type: 'square' }
        ],
        ocean: [
            { freq: 262, dur: 0.3, type: 'sine' },
            { freq: 330, dur: 0.3, type: 'sine' },
            { freq: 392, dur: 0.3, type: 'sine' },
            { freq: 523, dur: 0.4, type: 'sine' },
            { freq: 392, dur: 0.5, type: 'sine' }
        ],
        skull: [
            { freq: 147, dur: 0.5, type: 'sawtooth' },
            { freq: 139, dur: 0.5, type: 'sawtooth' },
            { freq: 131, dur: 0.7, type: 'sawtooth' },
            { freq: 98, dur: 1.0, type: 'sawtooth' }
        ],
        treasure: [
            { freq: 784, dur: 0.15, type: 'triangle' },
            { freq: 880, dur: 0.15, type: 'triangle' },
            { freq: 988, dur: 0.15, type: 'triangle' },
            { freq: 1047, dur: 0.2, type: 'triangle' },
            { freq: 1319, dur: 0.4, type: 'triangle' }
        ],
        storm: [
            { freq: 100, dur: 0.3, type: 'sawtooth' },
            { freq: 80, dur: 0.4, type: 'sawtooth' },
            { freq: 120, dur: 0.3, type: 'sawtooth' },
            { freq: 60, dur: 0.8, type: 'sawtooth' }
        ],
        rum: [
            { freq: 294, dur: 0.3, type: 'triangle' },
            { freq: 330, dur: 0.3, type: 'triangle' },
            { freq: 294, dur: 0.3, type: 'triangle' },
            { freq: 262, dur: 0.5, type: 'triangle' }
        ],
        kraken: [
            { freq: 82, dur: 0.6, type: 'sawtooth' },
            { freq: 73, dur: 0.6, type: 'sawtooth' },
            { freq: 65, dur: 0.8, type: 'sawtooth' },
            { freq: 55, dur: 1.2, type: 'sawtooth' }
        ],
        dutchman: [
            { freq: 330, dur: 0.4, type: 'triangle' },
            { freq: 392, dur: 0.3, type: 'triangle' },
            { freq: 330, dur: 0.3, type: 'triangle' },
            { freq: 262, dur: 0.4, type: 'triangle' },
            { freq: 196, dur: 0.6, type: 'triangle' }
        ]
    };

    const pattern = patterns[theme] || patterns.light;
    let time = audioCtx.currentTime;

    pattern.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = theme === 'skull' || theme === 'kraken' ? 800 : 2000;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = note.freq;
        osc.type = note.type;

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur);

        osc.start(time);
        osc.stop(time + note.dur);
        time += note.dur * 0.85;
    });
}

// Celebration animations
function triggerCelebration() {
    const theme = themeSelect.value;
    celebrationContainer.innerHTML = '';

    switch(theme) {
        case 'light':
            createConfetti(['#2196F3', '#4CAF50', '#ff9800', '#e91e63']);
            playVictorySound();
            break;
        case 'dark':
            createFireworks(['#bb86fc', '#03dac6', '#cf6679']);
            playVictorySound();
            break;
        case 'oled':
            createFireworks(['#00ffff', '#ff00ff', '#00ff00']);
            playOledVictory();
            break;
        case 'pirates':
            createCoins();
            playPirateVictory();
            break;
        case 'ocean':
            createWaves();
            playOceanVictory();
            break;
        case 'skull':
            createSkulls();
            playSkullVictory();
            break;
        case 'treasure':
            createCoins();
            playTreasureVictory();
            break;
        case 'storm':
            createLightning();
            playStormVictory();
            break;
        case 'rum':
            createConfetti(['#8d6e63', '#ffab91', '#5d4037', '#ff5722']);
            playVictorySound();
            break;
        case 'kraken':
            createTentacles();
            playKrakenVictory();
            break;
        case 'dutchman':
            createGhosts();
            playDutchmanVictory();
            break;
        case 'mario':
            createMushrooms();
            playMarioVictory();
            break;
        default:
            createConfetti(['#ff0', '#f0f', '#0ff', '#0f0']);
            playVictorySound();
    }
}

function createConfetti(colors) {
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '-20px';
        particle.style.width = (Math.random() * 10 + 5) + 'px';
        particle.style.height = (Math.random() * 10 + 5) + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        celebrationContainer.appendChild(particle);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 5000);
}

function createFireworks(colors) {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const fw = document.createElement('div');
            fw.className = 'firework';
            fw.style.left = (Math.random() * 80 + 10) + '%';
            fw.style.top = (Math.random() * 60 + 10) + '%';
            fw.style.background = colors[Math.floor(Math.random() * colors.length)];
            celebrationContainer.appendChild(fw);
        }, i * 300);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 4000);
}

function createCoins() {
    for (let i = 0; i < 20; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = '🪙';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.top = '-50px';
        coin.style.animationDelay = Math.random() * 1.5 + 's';
        celebrationContainer.appendChild(coin);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 4000);
}

function createWaves() {
    for (let i = 0; i < 5; i++) {
        const wave = document.createElement('div');
        wave.className = 'wave';
        wave.style.animationDelay = i * 0.3 + 's';
        wave.style.background = `rgba(129, 212, 250, ${0.3 - i * 0.05})`;
        celebrationContainer.appendChild(wave);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 3000);
}

function createSkulls() {
    for (let i = 0; i < 15; i++) {
        const skull = document.createElement('div');
        skull.className = 'skull-float';
        skull.textContent = '💀';
        skull.style.left = Math.random() * 100 + '%';
        skull.style.animationDelay = Math.random() * 2 + 's';
        celebrationContainer.appendChild(skull);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 5000);
}

function createLightning() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const lightning = document.createElement('div');
            lightning.className = 'lightning';
            celebrationContainer.appendChild(lightning);
            setTimeout(() => lightning.remove(), 500);
        }, i * 700);
    }
}

function createTentacles() {
    for (let i = 0; i < 8; i++) {
        const tentacle = document.createElement('div');
        tentacle.className = 'tentacle';
        tentacle.textContent = '🦑';
        tentacle.style.left = (i * 12 + 5) + '%';
        tentacle.style.animationDelay = i * 0.2 + 's';
        celebrationContainer.appendChild(tentacle);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 4000);
}

function createGhosts() {
    for (let i = 0; i < 12; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'skull-float';
        ghost.textContent = '👻';
        ghost.style.left = Math.random() * 100 + '%';
        ghost.style.animationDelay = Math.random() * 1.5 + 's';
        celebrationContainer.appendChild(ghost);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 5000);
}

function createMushrooms() {
    const items = ['🍄', '⭐', '🪙', '❓'];
    for (let i = 0; i < 20; i++) {
        const item = document.createElement('div');
        item.className = 'mushroom';
        item.textContent = items[Math.floor(Math.random() * items.length)];
        item.style.left = Math.random() * 100 + '%';
        item.style.top = (Math.random() * 50 + 25) + '%';
        item.style.animationDelay = Math.random() * 1 + 's';
        celebrationContainer.appendChild(item);
    }
    setTimeout(() => celebrationContainer.innerHTML = '', 4000);
}

// Victory sounds
function playVictorySound() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784, 1047];
        let time = audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc.start(time);
            osc.stop(time + 0.3);
            time += 0.15;
        });
    } catch(e) {}
}

function playPirateVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const melody = [392, 392, 440, 494, 494, 440, 392, 440, 494, 523, 494];
        let time = audioCtx.currentTime;

        melody.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
            osc.start(time);
            osc.stop(time + 0.25);
            time += 0.2;
        });
    } catch(e) {}
}

function playOceanVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [262, 330, 392, 523, 659, 784];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            osc.start(time);
            osc.stop(time + 0.4);
            time += 0.25;
        });
    } catch(e) {}
}

function playSkullVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [110, 130, 110, 98, 110, 130, 165, 196];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc.start(time);
            osc.stop(time + 0.3);
            time += 0.2;
        });
    } catch(e) {}
}

function playTreasureVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [1047, 1319, 1568, 2093, 1568, 1319, 1047, 1319, 1568, 2093];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            osc.start(time);
            osc.stop(time + 0.15);
            time += 0.1;
        });
    } catch(e) {}
}

function playStormVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = audioCtx.createBufferSource();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 150;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        noise.start();
    } catch(e) {}
}

function playKrakenVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [55, 65, 55, 49, 55, 73, 87, 110];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            osc.start(time);
            osc.stop(time + 0.4);
            time += 0.25;
        });
    } catch(e) {}
}

function playDutchmanVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [330, 392, 440, 392, 330, 294, 330, 392, 523];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
            osc.start(time);
            osc.stop(time + 0.35);
            time += 0.2;
        });
    } catch(e) {}
}

function playOledVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [1047, 1319, 1568, 2093, 1568, 2093];
        let time = audioCtx.currentTime;

        notes.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            osc.start(time);
            osc.stop(time + 0.15);
            time += 0.12;
        });
    } catch(e) {}
}

function playMarioVictory() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Upbeat 8-bit victory fanfare
        const notes = [
            // Opening burst
            { freq: 523, dur: 0.08 },  // C5
            { freq: 659, dur: 0.08 },  // E5
            { freq: 784, dur: 0.12 },  // G5
            { freq: 0, dur: 0.05 },    // pause
            // Bouncy middle section
            { freq: 698, dur: 0.1 },   // F5
            { freq: 880, dur: 0.1 },   // A5
            { freq: 784, dur: 0.08 },  // G5
            { freq: 659, dur: 0.08 },  // E5
            { freq: 784, dur: 0.12 },  // G5
            { freq: 0, dur: 0.05 },    // pause
            // Triumphant ending
            { freq: 880, dur: 0.1 },   // A5
            { freq: 988, dur: 0.1 },   // B5
            { freq: 1047, dur: 0.3 },  // C6 (held)
        ];
        let time = audioCtx.currentTime;

        notes.forEach(note => {
            if (note.freq === 0) {
                time += note.dur;
                return;
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = note.freq;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur * 0.9);
            osc.start(time);
            osc.stop(time + note.dur);
            time += note.dur;
        });
    } catch(e) {}
}

// Change theme
function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    if (themeTitle) {
        themeTitle.textContent = themeTitles[theme] || "Liar's Dice";
    }
    saveState();
}

// Starter Selection Functions
let currentPlayerCount = 5;
let isSelecting = false;
let selectionTimeoutId = null;
let lastSelectedPlayer = null; // Track last winner for subsequent spins
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 15;

function showStarterOverlay() {
    const overlay = document.getElementById('starterOverlay');
    overlay.classList.add('show');

    // Update dialog title with theme emoji
    const currentTheme = themeSelect.value;
    const emoji = themeEmojis[currentTheme] || '🎯';
    const dialogTitle = overlay.querySelector('h2');
    if (dialogTitle) {
        dialogTitle.textContent = `${emoji} Who starts? ${emoji}`;
    }

    updatePlayerCountDisplay();
    updatePlayerPositions();
    document.getElementById('resultText').textContent = '';
}

function closeStarterOverlay() {
    const overlay = document.getElementById('starterOverlay');
    overlay.classList.remove('show');

    // Stop any ongoing selection
    if (selectionTimeoutId) {
        clearTimeout(selectionTimeoutId);
        selectionTimeoutId = null;
    }

    // Reset state
    isSelecting = false;
    lastSelectedPlayer = null; // Reset for next time dialog opens

    // Clear highlights
    const players = document.querySelectorAll('.player-position');
    players.forEach(p => {
        p.classList.remove('highlighted', 'winner');
        p.style.background = '';
        p.style.transform = '';
        p.style.animation = '';
    });

    // Re-enable button
    const spinBtn = document.querySelector('.btn-spin');
    if (spinBtn) spinBtn.disabled = false;
}

function changePlayerCount(delta) {
    const newCount = currentPlayerCount + delta;

    if (newCount >= MIN_PLAYERS && newCount <= MAX_PLAYERS) {
        currentPlayerCount = newCount;
        lastSelectedPlayer = null; // Reset since player positions changed
        updatePlayerCountDisplay();
        updatePlayerPositions();
        document.getElementById('resultText').textContent = '';
    }
}

function updatePlayerCountDisplay() {
    const display = document.getElementById('playerCountDisplay');
    if (display) {
        display.textContent = currentPlayerCount;
    }
}

function updatePlayerPositions() {
    const container = document.getElementById('playerPositions');
    container.innerHTML = '';

    const radius = 115; // Distance from center
    const angleStep = (2 * Math.PI) / currentPlayerCount;

    for (let i = 0; i < currentPlayerCount; i++) {
        const angle = (i * angleStep) - (Math.PI / 2); // Start from top
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-position';
        playerDiv.textContent = `P${i + 1}`;
        playerDiv.style.left = `calc(50% + ${x}px - 25px)`;
        playerDiv.style.top = `calc(50% + ${y}px - 25px)`;

        container.appendChild(playerDiv);
    }
}

function startSelection() {
    if (isSelecting) return;

    isSelecting = true;
    const spinBtn = document.querySelector('.btn-spin');
    const resultText = document.getElementById('resultText');
    const players = document.querySelectorAll('.player-position');

    spinBtn.disabled = true;
    resultText.textContent = '';

    // Clear any previous timeouts
    if (selectionTimeoutId) {
        clearTimeout(selectionTimeoutId);
        selectionTimeoutId = null;
    }

    // Clear any previous highlights
    players.forEach(p => {
        p.classList.remove('highlighted', 'winner');
        p.style.background = '';
        p.style.transform = '';
        p.style.animation = '';
    });

    // Determine the winner beforehand
    const selectedPlayer = Math.floor(Math.random() * currentPlayerCount);

    // Calculate total iterations - enough spins to feel random (3-5 full cycles)
    const minCycles = 3;
    const extraCycles = Math.random() * 2; // 0-2 additional cycles
    const totalIterations = Math.floor((minCycles + extraCycles) * currentPlayerCount) + selectedPlayer;

    let currentIteration = 0;

    // Start at last winner position, or random if first spin
    let currentPlayer = lastSelectedPlayer !== null ? lastSelectedPlayer : Math.floor(Math.random() * currentPlayerCount);

    function highlightNext() {
        // Check if we've been cancelled
        if (!isSelecting) {
            return;
        }

        if (currentIteration >= totalIterations) {
            // Selection complete - mark winner
            // Remove ALL highlights first to prevent multiple highlighted players
            players.forEach(p => p.classList.remove('highlighted'));
            players[currentPlayer].classList.add('winner');

            // Store the winner for next spin
            lastSelectedPlayer = currentPlayer;

            resultText.textContent = `Player ${currentPlayer + 1} starts! 🎉`;
            spinBtn.disabled = false;
            isSelecting = false;
            selectionTimeoutId = null;

            // Play result sound
            playResultSound();
            return;
        }

        // Remove highlight from previous player
        players.forEach(p => p.classList.remove('highlighted'));

        // Highlight current player
        players[currentPlayer].classList.add('highlighted');

        // Play tick sound
        playTickSound();

        // Move to next player
        currentPlayer = (currentPlayer + 1) % currentPlayerCount;
        currentIteration++;

        // Game show wheel-style delay: starts very fast, slows down naturally
        // Using exponential growth with random jitter for natural feel
        const progress = currentIteration / totalIterations;

        // Base delay grows exponentially from 30ms to 400ms
        const baseDelay = 30 + (370 * Math.pow(progress, 2.5));

        // Add random jitter (±15%) to make it feel more organic
        const jitter = 1 + (Math.random() - 0.5) * 0.3;
        const delay = baseDelay * jitter;

        selectionTimeoutId = setTimeout(highlightNext, delay);
    }

    // Start the selection
    highlightNext();
}

// Shared audio context for tick sounds to prevent audio skipping
let tickAudioCtx = null;

function playTickSound() {
    if (isMuted) return;

    try {
        // Reuse the same audio context
        if (!tickAudioCtx) {
            tickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const osc = tickAudioCtx.createOscillator();
        const gain = tickAudioCtx.createGain();

        osc.connect(gain);
        gain.connect(tickAudioCtx.destination);

        // Short, high-pitched tick
        osc.frequency.value = 800;
        osc.type = 'square';

        const now = tickAudioCtx.currentTime;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    } catch(e) {
        console.log('Audio not available');
    }
}

function playResultSound() {
    if (isMuted) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784];
        let time = audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            osc.start(time);
            osc.stop(time + 0.2);
            time += 0.15;
        });
    } catch(e) {}
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
