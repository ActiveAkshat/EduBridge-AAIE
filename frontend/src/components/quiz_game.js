export const QUIZ_TEMPLATE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FlappyBrain — Quiz Game</title>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #0a0a14;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
    font-family: 'Nunito', sans-serif;
    color: #fff;
  }
  #gameCanvas {
    border-radius: 18px;
    border: 2px solid rgba(255,255,255,0.08);
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    cursor: pointer;
    display: block;
    max-width: 100%;
  }
  #hint {
    margin-top: 8px;
    font-size: .72rem;
    opacity: .35;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<canvas id="gameCanvas" width="820" height="500"></canvas>
<p id="hint">↑ ↓ or W S — hold to move up/down &nbsp;|&nbsp; release to stay in place</p>

<script>
// ═══════════════════════════════════════
// QUIZ DATA
// ═══════════════════════════════════════
// <<<QUIZ_DATA_PLACEHOLDER_START>>>
const QUIZ_DATA = [
  { question: "What is the capital of France?",      options: ["Berlin", "Paris", "Rome", "Madrid"],         correct: 1 },
  { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"],         correct: 2 },
  { question: "What is 12 × 12?",                    options: ["124", "144", "132", "154"],                  correct: 1 },
  { question: "Who painted the Mona Lisa?",          options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], correct: 2 },
  { question: "Chemical symbol for Gold?",           options: ["Gd", "Go", "Gl", "Au"],                     correct: 3 },
  { question: "Sides of a hexagon?",                 options: ["5", "6", "7", "8"],                         correct: 1 },
  { question: "Primary language in Brazil?",         options: ["Spanish", "French", "Portuguese", "Italian"], correct: 2 },
  { question: "Largest ocean?",                      options: ["Atlantic", "Indian", "Arctic", "Pacific"],   correct: 3 },
  { question: "World War II ended in?",              options: ["1943", "1944", "1945", "1946"],              correct: 2 },
  { question: "Speed of light (approx)?",            options: ["300k km/s", "150k km/s", "450k km/s", "200k km/s"], correct: 0 },
];
// <<<QUIZ_DATA_PLACEHOLDER_END>>>

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width;   // 820
const H = canvas.height;  // 500

// Layout zones
const Q_BOX_X  = 30;          // question box left
const Q_BOX_Y  = 18;
const Q_BOX_W  = W - 80;
const Q_BOX_H  = 70;

const GAME_TOP  = Q_BOX_Y + Q_BOX_H + 18;  // where gameplay area starts (~106)
const GAME_H    = H - GAME_TOP - 30;        // playable height (~364)
const GROUND_Y  = GAME_TOP + GAME_H;        // ground line

// Answer boxes — 4 boxes stacked vertically on the RIGHT side
const BOX_COUNT  = 4;
const BOX_W      = 170;
const BOX_H      = GAME_H / BOX_COUNT - 8;  // ~83px each with gaps
const BOX_RIGHT  = W - 20;
const BOX_X      = BOX_RIGHT - BOX_W;

function boxY(lane) {
  return GAME_TOP + lane * (GAME_H / BOX_COUNT) + 4;
}

// Bird
const BIRD_START_X = 80;
const BIRD_W       = 38;
const BIRD_H       = 30;

// Physics — bird moves RIGHT automatically, player controls Y
const BIRD_SPEED   = 3.2;     // constant horizontal speed
const MOVE_SPEED   = 5.0;     // how fast bird moves up/down when key held
const GRAVITY      = 0;       // NO gravity — bird stays put
const BOOST_FORCE  = 0;       // unused
const MAX_VY       = 0;       // unused

// Colors
const LANE_COLORS  = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
const LANE_LABELS  = ['A', 'B', 'C', 'D'];

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let phase = 'menu';

let bird, stars, particles;
let score, lives, streak, questionIdx;
let correctCount, wrongCount;
let bgOffset;
let flashColor, flashTimer;
let streakMsg, streakMsgTimer;
let resultPhase, resultTimer, resultCorrect, resultQ;
let questionX; // question box scroll-in animation
let boxesX;    // answer boxes slide-in from right

function initGame() {
  bird = {
    x:        BIRD_START_X,
    y:        GAME_TOP + GAME_H / 2 - BIRD_H / 2,
    vy:       0,
    flap:     0,
    rotation: 0,
    answered: false,
  };

  score        = 0;
  lives        = 3;
  streak       = 0;
  questionIdx  = 0;
  correctCount = 0;
  wrongCount   = 0;
  bgOffset     = 0;
  flashColor   = null;
  flashTimer   = 0;
  streakMsg    = null;
  streakMsgTimer = 0;
  resultPhase  = false;
  resultTimer  = 0;
  questionX    = -Q_BOX_W;   // slides in from left
  boxesX       = W + 20;     // slides in from right

  stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.3 + 0.2,
    s: Math.random() * 0.5 + 0.1,
  }));

  particles = [];
}

// ═══════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════
function burst(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 / n) * i + Math.random() * 0.5;
    particles.push({
      x, y,
      vx: Math.cos(a) * (2 + Math.random() * 5),
      vy: Math.sin(a) * (2 + Math.random() * 5) - 1,
      color, size: 4 + Math.random() * 5, life: 1,
    });
  }
}

// ═══════════════════════════════════════
// ANSWER CHECK
// ═══════════════════════════════════════
function checkAnswer(lane) {
  if (bird.answered || resultPhase) return;
  bird.answered = true;

  const q = QUIZ_DATA[questionIdx];
  const ok = lane === q.correct;

  if (ok) {
    const pts = streak >= 3 ? 20 : streak >= 1 ? 15 : 10;
    score += pts;
    streak++;
    correctCount++;
    flashColor = 'green'; flashTimer = 40;
    burst(bird.x, bird.y, '#2ecc71', 20);
    if (streak >= 3) {
      streakMsg = streak === 3 ? '🔥 On Fire!' : streak === 5 ? '⚡ Unstoppable!' : '💥 ' + streak + '× Streak!';
      streakMsgTimer = 90;
    }
  } else {
    streak = 0;
    wrongCount++;
    lives--;
    flashColor = 'red'; flashTimer = 50;
    burst(bird.x, bird.y, '#e74c3c', 14);
  }

  resultPhase   = true;
  resultTimer   = ok ? 60 : 85;
  resultCorrect = ok;
  resultQ       = q;
  questionIdx++;
}

// ═══════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════
function update() {

  // Slide-in animations
  if (questionX < Q_BOX_X) questionX = Math.min(Q_BOX_X, questionX + 22);
  if (boxesX > BOX_X)      boxesX    = Math.max(BOX_X,   boxesX    - 22);

  if (resultPhase) {
    updateParticles();
    if (flashTimer > 0) flashTimer--; else flashColor = null;
    resultTimer--;
    if (resultTimer <= 0) {
      resultPhase = false;
      if (lives <= 0 || questionIdx >= QUIZ_DATA.length) {
        phase = 'ended';
        return;
      }
      // Next question — reset bird, slide in fresh
      bird.x        = BIRD_START_X;
      bird.y        = GAME_TOP + GAME_H / 2 - BIRD_H / 2;
      bird.vy       = 0;
      bird.answered = false;
      questionX     = -Q_BOX_W;
      boxesX        = W + 20;
    }
    return;
  }

  if (phase !== 'playing') return;

  bgOffset++;

  // Bird moves RIGHT automatically
  bird.x += BIRD_SPEED;

  // Vertical — NO gravity, bird only moves when keys held
  bird.y        += bird.vy;
  bird.rotation  = Math.min(Math.max(bird.vy * 4, -22), 22);

  // Clamp to play area (soft boundary, no penalty)
  if (bird.y < GAME_TOP)              bird.y = GAME_TOP;
  if (bird.y + BIRD_H > GROUND_Y)     bird.y = GROUND_Y - BIRD_H;

  // Stars scroll
  stars.forEach(s => { s.x -= s.s; if (s.x < 0) s.x = W; });

  // ── Collision with answer boxes ──
  if (!bird.answered && bird.x + BIRD_W >= boxesX && bird.x <= boxesX + BOX_W) {
    const birdCY = bird.y + BIRD_H / 2;
    for (let lane = 0; lane < BOX_COUNT; lane++) {
      const by = boxY(lane);
      if (birdCY >= by && birdCY <= by + BOX_H) {
        checkAnswer(lane);
        break;
      }
    }
  }

  // Bird flew past boxes without hitting one (shouldn't happen often but safeguard)
  if (!bird.answered && bird.x > W + 20) {
    // Treat as wrong — missed
    const q = QUIZ_DATA[questionIdx];
    checkAnswer(-1); // -1 = missed, always wrong
  }

  if (flashTimer > 0) flashTimer--; else flashColor = null;
  if (streakMsgTimer > 0) streakMsgTimer--; else streakMsg = null;
  updateParticles();
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx; p.y += p.vy;
    p.vy   += 0.2;
    p.life -= 0.025;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ═══════════════════════════════════════
// DRAW
// ═══════════════════════════════════════
function draw() {
  // BG
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(1, '#1a1035');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawStars();
  drawGround();

  if (phase === 'playing' || resultPhase) {
    drawQuestionBox();
    drawAnswerBoxes();
    drawBird();
    drawTrail();
  }

  drawParticlesCanvas();

  if (flashColor && flashTimer > 0) {
    const a = (flashTimer / 50) * 0.2;
    ctx.fillStyle = flashColor === 'green' ? 'rgba(46, 204, 113, ' + a + ')' : 'rgba(231, 76, 60, ' + a + ')';
    ctx.fillRect(0, 0, W, H);
  }

  if (resultPhase) drawResultBanner();

  if (streakMsg && streakMsgTimer > 0) {
    ctx.save();
    ctx.globalAlpha  = Math.min(1, streakMsgTimer / 18);
    ctx.font         = "bold 32px 'Bangers', cursive";
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#f1c40f';
    ctx.shadowColor  = '#c0392b';
    ctx.shadowBlur   = 10;
    ctx.fillText(streakMsg, W / 2, GAME_TOP + 36);
    ctx.restore();
  }

  drawHUD();

  if (phase === 'menu')  drawMenu();
  if (phase === 'ended') drawEnd();
}

// ── Stars ────────────────────────────────────────
function drawStars() {
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.2 + s.r * 0.2) + ')';
    ctx.fill();
  });
}

// ── Ground ───────────────────────────────────────
function drawGround() {
  ctx.fillStyle = '#0d2b1a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(0, GROUND_Y, W, 3);
  // scrolling dashes
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  for (let i = 0; i < 24; i++) {
    const gx = ((bgOffset * 2.8 + i * 48) % (W + 48)) - 48;
    ctx.fillRect(gx, GROUND_Y + 3, 22, H - GROUND_Y - 3);
  }
}

// ── Question box (top, slides in from left) ───────
function drawQuestionBox() {
  const q = QUIZ_DATA[Math.min(questionIdx, QUIZ_DATA.length - 1)];

  // Glow
  ctx.shadowColor = 'rgba(245,166,35,0.35)';
  ctx.shadowBlur  = 18;

  // Box background
  ctx.fillStyle = 'rgba(245,166,35,0.12)';
  ctx.beginPath();
  ctx.roundRect(questionX, Q_BOX_Y, Q_BOX_W, Q_BOX_H, 16);
  ctx.fill();

  // Border
  const borderGrad = ctx.createLinearGradient(questionX, 0, questionX + Q_BOX_W, 0);
  borderGrad.addColorStop(0,   '#f5a623');
  borderGrad.addColorStop(0.5, '#e74c3c');
  borderGrad.addColorStop(1,   '#9b59b6');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.roundRect(questionX, Q_BOX_Y, Q_BOX_W, Q_BOX_H, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Q number badge
  ctx.fillStyle = '#f5a623';
  ctx.beginPath();
  ctx.arc(questionX + 28, Q_BOX_Y + Q_BOX_H / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.font         = "bold 15px 'Bangers', cursive";
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#1a1a2e';
  ctx.fillText('Q' + (questionIdx + 1) + ' ', questionX + 28, Q_BOX_Y + Q_BOX_H / 2);

  // Question text
  ctx.font         = "bold 18px 'Nunito', sans-serif";
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#fff';
  ctx.fillText(q.question, questionX + 56, Q_BOX_Y + Q_BOX_H / 2);
}

// ── Answer boxes (RIGHT side, stacked vertically) ─
function drawAnswerBoxes() {
  const q = QUIZ_DATA[Math.min(questionIdx, QUIZ_DATA.length - 1)];

  for (let lane = 0; lane < BOX_COUNT; lane++) {
    const bx    = boxesX;
    const by    = boxY(lane);
    const color = LANE_COLORS[lane];
    const label = LANE_LABELS[lane];
    const opt   = q.options[lane];
    const isCorrect = lane === q.correct;

    // Glow on hover (when bird is near this lane)
    const birdCY   = bird.y + BIRD_H / 2;
    const boxCY    = by + BOX_H / 2;
    const proximity = Math.max(0, 1 - Math.abs(birdCY - boxCY) / (GAME_H / 2));
    const glowAmt  = proximity * 0.5;

    ctx.shadowColor = color;
    ctx.shadowBlur  = 8 + glowAmt * 20;

    // Box bg
    ctx.fillStyle = 'rgba(' + hexToRgb(color) + ', ' + (0.12 + glowAmt * 0.15) + ')';
    ctx.beginPath();
    ctx.roundRect(bx, by, BOX_W, BOX_H, 12);
    ctx.fill();

    // Box border
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2 + glowAmt * 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, BOX_W, BOX_H, 12);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Letter badge (left side of box)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx + 22, by + BOX_H / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.font         = "bold 16px 'Bangers', cursive";
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#fff';
    ctx.fillText(label, bx + 22, by + BOX_H / 2);

    // Option text
    ctx.font         = "bold 13px 'Nunito', sans-serif";
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#fff';
    // Word wrap within box
    wrapText(ctx, opt, bx + 44, by + BOX_H / 2, BOX_W - 52, 16);

    // Show correct indicator during result phase
    if (resultPhase && isCorrect) {
      ctx.fillStyle = 'rgba(46,204,113,0.25)';
      ctx.beginPath();
      ctx.roundRect(bx, by, BOX_W, BOX_H, 12);
      ctx.fill();
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bx, by, BOX_W, BOX_H, 12);
      ctx.stroke();
    }
  }

  // Connecting line from question box to answer boxes (like a speech bubble tail)
  if (questionX >= Q_BOX_X - 5) {
    const lineAlpha = Math.min(1, (questionX - Q_BOX_X + 5) / 20) * 0.3;
    ctx.strokeStyle = 'rgba(245, 166, 35, ' + lineAlpha + ')';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(Q_BOX_X + Q_BOX_W, Q_BOX_Y + Q_BOX_H / 2);
    ctx.lineTo(boxesX, GAME_TOP + GAME_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ── Bird ─────────────────────────────────────────
let trailPoints = [];
function drawTrail() {
  // Store trail
  trailPoints.push({ x: bird.x + BIRD_W / 2, y: bird.y + BIRD_H / 2, t: 1 });
  if (trailPoints.length > 18) trailPoints.shift();
  trailPoints.forEach((p, i) => {
    p.t -= 0.04;
    const a = Math.max(0, p.t * 0.4);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + i * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 166, 35, ' + a + ')';
    ctx.fill();
  });
}

function drawBird() {
  const bx = bird.x;
  const by = bird.y;

  ctx.save();
  ctx.translate(bx + BIRD_W / 2, by + BIRD_H / 2);
  ctx.rotate((bird.rotation * Math.PI) / 180);

  // Body glow
  ctx.shadowColor = 'rgba(245,166,35,0.6)';
  ctx.shadowBlur  = 14;

  // Body
  const bg = ctx.createRadialGradient(-3, -4, 2, 0, 0, BIRD_W / 2);
  bg.addColorStop(0, '#ffe082');
  bg.addColorStop(1, '#f5a623');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_W / 2, BIRD_H / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Wing
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.ellipse(-3, bird.flap > 0 ? -9 : 5, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(9, -5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath(); ctx.arc(10, -5, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(11.2, -6.2, 1.2, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(14, -1); ctx.lineTo(23, 1); ctx.lineTo(14, 4);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawParticlesCanvas() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ── HUD ──────────────────────────────────────────
function drawHUD() {
  // Small pill at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 200, H - 26, 400, 22, 11);
  ctx.fill();

  const items = [
    { label: 'SCORE',  val: score },
    { label: 'STREAK', val: streak + (streak >= 3 ? '🔥' : '') },
    { label: 'LIVES',  val: '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives)) },
    { label: 'Q',      val: questionIdx + '/' + QUIZ_DATA.length },
  ];
const spacing = 400 / items.length;
items.forEach((item, i) => {
    const ix = W / 2 - 200 + i * spacing + spacing / 2;
    ctx.font = "9px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(item.label, ix, H - 24);
    ctx.font = "bold 12px 'Bangers', cursive";
    ctx.fillStyle = '#f5a623';
    ctx.fillText(String(item.val), ix + 38, H - 24);
});
}

// ── Result banner ─────────────────────────────────
function drawResultBanner() {
    const msg = resultCorrect ? '✅  CORRECT!' : '❌  WRONG!';
    const sub = resultCorrect ? '' : 'Correct: ' + resultQ.options[resultQ.correct];
    const color = resultCorrect ? '#2ecc71' : '#e74c3c';
    const prog = 1 - resultTimer / (resultCorrect ? 60 : 85);

    ctx.save();
    ctx.globalAlpha = Math.min(1, prog * 5);

    // Banner bg
    ctx.fillStyle = resultCorrect ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 160, GAME_TOP + GAME_H / 2 - 40, 320, sub ? 80 : 55, 16);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 160, GAME_TOP + GAME_H / 2 - 40, 320, sub ? 80 : 55, 16);
    ctx.stroke();

    ctx.font = "bold 36px 'Bangers', cursive";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText(msg, W / 2, GAME_TOP + GAME_H / 2 - 14);
    ctx.shadowBlur = 0;

    if (sub) {
        ctx.font = "bold 15px 'Nunito', sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(sub, W / 2, GAME_TOP + GAME_H / 2 + 24);
    }
    ctx.restore();
}

// ── Menu ──────────────────────────────────────────
function drawMenu() {
    ctx.fillStyle = 'rgba(8,8,18,0.88)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.font = "bold 72px 'Bangers', cursive";
    ctx.fillStyle = '#f5a623';
    ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 14;
    ctx.fillText('🧠 FlappyBrain', W / 2, H * 0.27);
    ctx.shadowBlur = 0;

    ctx.font = "bold 16px 'Nunito', sans-serif";
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('The bird flies right — steer it into the CORRECT answer box!', W / 2, H * 0.44);

    ctx.font = "13px 'Nunito', sans-serif";
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Hold ↑ ↓ or W S to move   •   Release to stay in place', W / 2, H * 0.52);

    // Button
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.roundRect(W / 2 - 100, H * 0.62, 200, 52, 30); ctx.fill();
    ctx.font = "bold 26px 'Bangers', cursive";
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('▶  START QUIZ', W / 2, H * 0.62 + 26);
}

// ── End ───────────────────────────────────────────
function drawEnd() {
    ctx.fillStyle = 'rgba(8,8,18,0.92)';
    ctx.fillRect(0, 0, W, H);

    const pct = Math.round((correctCount / QUIZ_DATA.length) * 100);
    const won = lives > 0;
    const grade = pct >= 90 ? '🏆 Perfect!' : pct >= 70 ? '⭐ Great Job!' : pct >= 50 ? '👍 Not Bad!' : '😅 Keep Trying!';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.font = "bold 56px 'Bangers', cursive";
    ctx.fillStyle = '#f5a623'; ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 12;
    ctx.fillText(won ? grade : '💀 Game Over', W / 2, H * 0.20);
    ctx.shadowBlur = 0;

    ctx.font = "bold 86px 'Bangers', cursive";
    ctx.fillStyle = '#2ecc71';
    ctx.shadowColor = 'rgba(46,204,113,0.5)'; ctx.shadowBlur = 22;
    ctx.fillText(score, W / 2, H * 0.40);
    ctx.shadowBlur = 0;

    ctx.font = "11px 'Nunito', sans-serif";
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('FINAL SCORE', W / 2, H * 0.52);

    const stats = [
        { label: 'Correct', val: correctCount, color: '#2ecc71' },
        { label: 'Wrong', val: wrongCount, color: '#e74c3c' },
        { label: 'Accuracy', val: pct + '%', color: '#f5a623' },
    ];
    stats.forEach((s, i) => {
        const sx = W * 0.22 + i * (W * 0.28);
        ctx.font = "bold 32px 'Bangers', cursive";
        ctx.fillStyle = s.color;
        ctx.fillText(s.val, sx, H * 0.64);
        ctx.font = "10px 'Nunito', sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(s.label.toUpperCase(), sx, H * 0.72);
    });

    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.roundRect(W / 2 - 100, H * 0.80, 200, 52, 30); ctx.fill();
    ctx.font = "bold 26px 'Bangers', cursive";
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('▶  PLAY AGAIN', W / 2, H * 0.80 + 26);
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
    }
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

// ═══════════════════════════════════════
// INPUT
// ═══════════════════════════════════════
const keysDown = {};

window.addEventListener('keydown', e => {
    keysDown[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', ' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keysDown[e.key] = false; });

// Bird moves ONLY when key held; stops immediately when released
function applyHeldKeys() {
    if (phase !== 'playing' || resultPhase) return;
    if (keysDown['ArrowUp'] || keysDown['w'] || keysDown['W']) {
        bird.vy = -MOVE_SPEED;
    } else if (keysDown['ArrowDown'] || keysDown['s'] || keysDown['S']) {
        bird.vy = MOVE_SPEED;
    } else {
        bird.vy = 0;   // no key = bird stays perfectly still
    }
}

canvas.addEventListener('click', () => {
    if (phase === 'menu' || phase === 'ended') { startGame(); return; }
});

let txStart = 0;
canvas.addEventListener('touchstart', e => { txStart = e.touches[0].clientY; e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (phase !== 'playing' || resultPhase) return;
    const dy = e.touches[0].clientY - txStart;
    bird.vy = dy > 0 ? MOVE_SPEED : -MOVE_SPEED;
    txStart = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => { bird.vy = 0; });

// ═══════════════════════════════════════
// LOOP
// ═══════════════════════════════════════
let rafId;
function loop() {
    applyHeldKeys();
    update();
    draw();
    rafId = requestAnimationFrame(loop);
}

function startGame() {
    cancelAnimationFrame(rafId);
    trailPoints = [];
    initGame();
    phase = 'playing';
    loop();
}

// Boot
initGame();
phase = 'menu';
loop();
</script >
</body >
</html >
    `;
