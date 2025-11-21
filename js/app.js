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

// Mario death-style sound (descending tones)
function playMarioDeathSound(audioCtx) {
    const notes = [
        { freq: 784, duration: 0.15 },
        { freq: 622, duration: 0.15 },
        { freq: 523, duration: 0.15 },
        { freq: 392, duration: 0.2 },
        { freq: 311, duration: 0.2 },
        { freq: 262, duration: 0.3 },
        { freq: 196, duration: 0.5 },
    ];

    let time = audioCtx.currentTime;
    notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = note.freq;
        osc.type = 'square';

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration);

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
        const notes = [
            { freq: 523, dur: 0.1 },
            { freq: 659, dur: 0.1 },
            { freq: 784, dur: 0.1 },
            { freq: 1047, dur: 0.2 },
            { freq: 784, dur: 0.1 },
            { freq: 1047, dur: 0.4 }
        ];
        let time = audioCtx.currentTime;

        notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = note.freq;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur);
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

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
