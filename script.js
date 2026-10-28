const DEFAULT_MATERI = [
  {
    id: "vocab-past-tense",
    judul: "[Susun Huruf] Past Tense",
    type: "word",
    lang: "en-US",
    items: [
      { target: "ENCOURAGED", hint: "Mendorong / Memberi semangat" },
      { target: "ARRIVED", hint: "Tiba / Sampai" }
    ]
  }
];

const DATA = (typeof DAFTAR_MATERI_SCRAMBLE !== 'undefined') ? DAFTAR_MATERI_SCRAMBLE : DEFAULT_MATERI;

let currentTopicIndex = 0;
let currentItemIndex = 0;
let selectedPieces = [];
let bankPieces = [];
let score = 0;

// State Game
let isGameStarted = false;
let timerMode = "180";
let timeRemaining = 180;
let secondsElapsed = 0;
let timerInterval = null;

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, type = "sine") {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function playSound(name) {
  if (name === "click") playTone(600, 0.08, "sine");
  if (name === "pop") playTone(800, 0.1, "sine");
  if (name === "correct") {
    playTone(523.25, 0.12);
    setTimeout(() => playTone(659.25, 0.12), 100);
    setTimeout(() => playTone(783.99, 0.25), 200);
  }
  if (name === "wrong") {
    playTone(200, 0.15, "sawtooth");
    setTimeout(() => playTone(150, 0.25, "sawtooth"), 120);
  }
}

// Bersihkan Canvas Kembang Api
function clearFireworks() {
  const canvas = document.getElementById('fireworks');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// DOM Elements
const materiSelect = document.getElementById('materi-select');
const timeSelect = document.getElementById('time-select');
const modeTagEl = document.getElementById('mode-tag');
const hintTextEl = document.getElementById('hint-text');
const answerZoneEl = document.getElementById('answer-zone');
const wordBankEl = document.getElementById('word-bank');
const progressTextEl = document.getElementById('progress-text');
const scoreTextEl = document.getElementById('score-text');
const timerTextEl = document.getElementById('timer-text');
const startBtn = document.getElementById('start-btn');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const audioBtn = document.getElementById('audio-btn');
const victoryModal = document.getElementById('victory-modal');
const timeoutModal = document.getElementById('timeout-modal');

function setupDropdowns() {
  materiSelect.innerHTML = '';
  DATA.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = m.judul;
    materiSelect.appendChild(opt);
  });
}

// Reset Game ke Posisi Standby (Sebelum Tombol Mulai Diklik)
function resetToStandby() {
  clearInterval(timerInterval);
  clearFireworks();
  
  isGameStarted = false;
  currentTopicIndex = parseInt(materiSelect.value) || 0;
  currentItemIndex = 0;
  score = 0;
  secondsElapsed = 0;
  timerMode = timeSelect.value;
  
  if (timerMode !== "unlimited") {
    timeRemaining = parseInt(timerMode);
  }

  // Sembunyikan Modal
  victoryModal.classList.remove('active');
  timeoutModal.classList.remove('active');

  // Atur Tampilan Tombol
  startBtn.style.display = 'inline-flex';
  checkBtn.style.display = 'none';
  resetBtn.style.display = 'none';

  updateTimerDisplay();
  loadItem();
}

// Memulai Game Saat Tombol "Mulai Bermain" Diklik
function startGame() {
  playSound("pop");
  isGameStarted = true;

  // Ubah Tampilan Tombol
  startBtn.style.display = 'none';
  checkBtn.style.display = 'inline-flex';
  resetBtn.style.display = 'inline-flex';

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (timerMode === "unlimited") {
      secondsElapsed++;
      updateTimerDisplay();
    } else {
      timeRemaining--;
      secondsElapsed++;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        playSound("wrong");
        timeoutModal.classList.add('active');
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  let displaySecs = (timerMode === "unlimited") ? secondsElapsed : timeRemaining;
  const mins = String(Math.floor(displaySecs / 60)).padStart(2, '0');
  const secs = String(displaySecs % 60).padStart(2, '0');
  timerTextEl.textContent = `${mins}:${secs}`;

  if (timerMode !== "unlimited" && timeRemaining <= 30 && isGameStarted) {
    timerTextEl.classList.add('warning');
  } else {
    timerTextEl.classList.remove('warning');
  }
}

function loadItem() {
  const topic = DATA[currentTopicIndex];
  const itemObj = topic.items[currentItemIndex];

  modeTagEl.textContent = (topic.type === 'word') ? "MODE SUSUN HURUF" : "MODE SUSUN KALIMAT";
  progressTextEl.textContent = `${currentItemIndex + 1}/${topic.items.length}`;
  scoreTextEl.textContent = `⭐ ${score}`;
  hintTextEl.textContent = itemObj.hint;

  const targetStr = itemObj.target;
  let rawArray = (topic.type === 'word') ? targetStr.toUpperCase().split('') : targetStr.split(' ');

  bankPieces = [...rawArray];
  if (bankPieces.length > 1) {
    do {
      bankPieces.sort(() => Math.random() - 0.5);
    } while (bankPieces.join(topic.type === 'word' ? '' : ' ') === targetStr);
  }

  selectedPieces = [];
  answerZoneEl.classList.remove('correct', 'shake');
  renderChips();
}

function renderChips() {
  answerZoneEl.innerHTML = '';
  selectedPieces.forEach((piece, idx) => {
    const chip = createChip(piece, () => {
      if (!isGameStarted) return; // Kepingan tidak aktif jika belum tekan Mulai
      playSound("pop");
      selectedPieces.splice(idx, 1);
      bankPieces.push(piece);
      renderChips();
    });
    answerZoneEl.appendChild(chip);
  });

  wordBankEl.innerHTML = '';
  bankPieces.forEach((piece, idx) => {
    const chip = createChip(piece, () => {
      if (!isGameStarted) return; // Kepingan tidak aktif jika belum tekan Mulai
      playSound("click");
      bankPieces.splice(idx, 1);
      selectedPieces.push(piece);
      renderChips();
    });
    wordBankEl.appendChild(chip);
  });
}

function createChip(text, onClick) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.textContent = text;
  chip.onclick = onClick;
  return chip;
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = DATA[currentTopicIndex].lang || 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

// Event Listeners
startBtn.addEventListener('click', startGame);

checkBtn.addEventListener('click', () => {
  if (!isGameStarted) return;

  const topic = DATA[currentTopicIndex];
  const targetStr = topic.items[currentItemIndex].target;
  const joinChar = (topic.type === 'word') ? '' : ' ';
  const userStr = selectedPieces.join(joinChar);

  if (userStr.toLowerCase() === targetStr.toLowerCase()) {
    answerZoneEl.classList.add('correct');
    playSound("correct");
    score += 100;
    scoreTextEl.textContent = `⭐ ${score}`;
    speakText(targetStr);

    setTimeout(() => {
      currentItemIndex++;
      if (currentItemIndex < topic.items.length) {
        loadItem();
      } else {
        triggerVictory();
      }
    }, 1200);
  } else {
    playSound("wrong");
    answerZoneEl.classList.add('shake');
    setTimeout(() => {
      answerZoneEl.classList.remove('shake');
    }, 500);
  }
});

resetBtn.addEventListener('click', () => {
  if (!isGameStarted) return;
  playSound("pop");
  loadItem();
});

audioBtn.addEventListener('click', () => {
  const targetStr = DATA[currentTopicIndex].items[currentItemIndex].target;
  speakText(targetStr);
});

materiSelect.addEventListener('change', resetToStandby);
timeSelect.addEventListener('change', resetToStandby);

function triggerVictory() {
  clearInterval(timerInterval);
  
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-time').textContent = timerTextEl.textContent;

  let stars = "⭐⭐⭐";
  if (secondsElapsed > 180) stars = "⭐⭐";
  if (secondsElapsed > 300) stars = "⭐";
  document.getElementById('star-rating').textContent = stars;

  victoryModal.classList.add('active');
  launchFireworks();
}

function launchFireworks() {
  const canvas = document.getElementById('fireworks');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      dx: (Math.random() - 0.5) * 12,
      dy: (Math.random() - 0.5) * 12,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      radius: Math.random() * 3 + 2,
      life: 100
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      if (p.life > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
      }
    });
    if (particles.some(p => p.life > 0)) requestAnimationFrame(animate);
  }
  animate();
}

// Inisialisasi awal ke mode Standby
setupDropdowns();
resetToStandby();
