// Scientific Puzzles System for The Last Human Mission

export class PuzzleManager {
  constructor(vault, onClueAwarded, onMissionComplete) {
    this.vault = vault;
    this.onClueAwarded = onClueAwarded;
    this.onMissionComplete = onMissionComplete;
    this.currentPuzzle = null;
    this.modalEl = document.getElementById("puzzle-modal");
    this.bodyEl = document.getElementById("puzzle-body");
    this.titleEl = document.getElementById("puzzle-title");
    this.subtitleEl = document.getElementById("puzzle-subtitle");
    this.closeBtn = document.getElementById("puzzle-close-btn");

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.closePuzzle());
    }
  }

  closePuzzle() {
    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }
    this.currentPuzzle = null;
  }

  openPuzzle(missionId, puzzleType) {
    if (!this.modalEl || !this.bodyEl) return;
    this.currentPuzzle = { missionId, puzzleType };
    this.modalEl.classList.remove("hidden");

    if (puzzleType === "signal") {
      this.renderSignalPuzzle(missionId);
    } else if (puzzleType === "flyby") {
      this.renderFlybyPuzzle(missionId);
    } else if (puzzleType === "telemetry") {
      this.renderTelemetryPuzzle(missionId);
    } else if (puzzleType === "descent") {
      this.renderDescentPuzzle(missionId);
    } else if (puzzleType === "spectrum") {
      this.renderSpectrumPuzzle(missionId);
    }
  }

  // PUZZLE 1: SIGNAL RECONSTRUCTION
  renderSignalPuzzle(missionId) {
    this.titleEl.textContent = "PUZZLE 01 // SIGNAL RECONSTRUCTION";
    this.subtitleEl.textContent = "Match receiver frequency and modulation dials to decode the deep space telemetry carrier wave.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <div class="scope-display">
          <canvas id="waveform-canvas" width="460" height="160"></canvas>
          <div class="scope-overlay">
            <span class="target-label">TARGET CARRIER (DASHED GREEN)</span>
            <span class="player-label">RECEIVER OUTPUT (SOLID CYAN)</span>
          </div>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>CARRIER FREQ: <span id="val-freq">2.1</span> GHz</label>
            <input type="range" id="dial-freq" min="1.0" max="4.0" step="0.1" value="1.8" />
          </div>
          <div class="dial-control">
            <label>MODULATION: <span id="val-mod">42</span> kHz</label>
            <input type="range" id="dial-mod" min="10" max="90" step="1" value="25" />
          </div>
          <div class="dial-control">
            <label>RF GAIN: <span id="val-gain">18</span> dB</label>
            <input type="range" id="dial-gain" min="5" max="35" step="1" value="12" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="signal-feedback" class="puzzle-feedback">TUNING SIGNAL LOCK: 42%</div>
          <button id="btn-lock-signal" class="solve-btn">LOCK SIGNAL CARRIER 📡</button>
        </div>
      </div>
    `;

    const canvas = document.getElementById("waveform-canvas");
    const ctx = canvas.getContext("2d");
    const dialFreq = document.getElementById("dial-freq");
    const dialMod = document.getElementById("dial-mod");
    const dialGain = document.getElementById("dial-gain");
    const feedback = document.getElementById("signal-feedback");
    const lockBtn = document.getElementById("btn-lock-signal");

    // Target parameters for Pioneer 10
    const target = { freq: 2.29, mod: 64, gain: 24 };

    let animId;
    let t = 0;

    const drawScope = () => {
      t += 0.04;
      ctx.fillStyle = "#050a0e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw Target wave (Dashed green)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = 80 + Math.sin(x * 0.04 * target.freq + t) * (target.gain * 1.5) + Math.cos(x * 0.01 * target.mod) * 12;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Player wave (Solid cyan)
      const pFreq = parseFloat(dialFreq.value);
      const pMod = parseFloat(dialMod.value);
      const pGain = parseFloat(dialGain.value);

      ctx.setLineDash([]);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = 80 + Math.sin(x * 0.04 * pFreq + t) * (pGain * 1.5) + Math.cos(x * 0.01 * pMod) * 12;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lock accuracy
      const diffF = Math.abs(pFreq - target.freq) / 3.0;
      const diffM = Math.abs(pMod - target.mod) / 80.0;
      const diffG = Math.abs(pGain - target.gain) / 30.0;
      const accuracy = Math.max(0, Math.round((1 - (diffF + diffM + diffG) / 3) * 100));

      if (accuracy > 88) {
        feedback.innerHTML = `<span style="color:#4ade80;">SIGNAL LOCK ACQUIRED: ${accuracy}%</span>`;
        lockBtn.classList.add("ready");
      } else {
        feedback.innerHTML = `TUNING SIGNAL LOCK: ${accuracy}% (Align carrier wave)`;
        lockBtn.classList.remove("ready");
      }

      animId = requestAnimationFrame(drawScope);
    };

    dialFreq.oninput = (e) => document.getElementById("val-freq").textContent = e.target.value;
    dialMod.oninput = (e) => document.getElementById("val-mod").textContent = e.target.value;
    dialGain.oninput = (e) => document.getElementById("val-gain").textContent = e.target.value;

    drawScope();

    lockBtn.onclick = () => {
      const pFreq = parseFloat(dialFreq.value);
      const pMod = parseFloat(dialMod.value);
      const pGain = parseFloat(dialGain.value);
      if (Math.abs(pFreq - target.freq) < 0.35 && Math.abs(pMod - target.mod) < 14 && Math.abs(pGain - target.gain) < 8) {
        cancelAnimationFrame(animId);
        this.completePuzzle(missionId, "signal", ["m01-c01", "m01-c02"], "SIGNAL RESTORED: Carrier lock verified. Pioneer telemetry frame decoded!");
      } else {
        feedback.textContent = "SIGNAL REJECTED: Adjust dials closer to target green wave.";
      }
    };
  }

  // PUZZLE 2: FLYBY GEOMETRY
  renderFlybyPuzzle(missionId) {
    this.titleEl.textContent = "PUZZLE 02 // FLYBY GEOMETRY";
    this.subtitleEl.textContent = "Calculate the gravitational slingshot trajectory past the planetary gravity well.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <div class="orbit-display">
          <canvas id="orbit-canvas" width="460" height="180"></canvas>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>PERIAPSIS DISTANCE: <span id="val-peri">2.8</span> R_J</label>
            <input type="range" id="dial-peri" min="1.0" max="6.0" step="0.1" value="4.2" />
          </div>
          <div class="dial-control">
            <label>APPROACH VELOCITY: <span id="val-vel">36.5</span> km/s</label>
            <input type="range" id="dial-vel" min="20.0" max="60.0" step="0.5" value="48.0" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="flyby-feedback" class="puzzle-feedback">TARGET ESCAPE VELOCITY: > 51.5 km/s</div>
          <button id="btn-execute-flyby" class="solve-btn">CALCULATE SLINGSHOT 🪐</button>
        </div>
      </div>
    `;

    const canvas = document.getElementById("orbit-canvas");
    const ctx = canvas.getContext("2d");
    const dialPeri = document.getElementById("dial-peri");
    const dialVel = document.getElementById("dial-vel");
    const feedback = document.getElementById("flyby-feedback");
    const execBtn = document.getElementById("btn-execute-flyby");

    const drawOrbit = () => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Planet (Jupiter)
      const px = 240, py = 90;
      ctx.beginPath();
      ctx.arc(px, py, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#b45309";
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.stroke();

      // Atmospheric safety boundary
      ctx.beginPath();
      ctx.arc(px, py, 32, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      const peri = parseFloat(dialPeri.value);
      const vel = parseFloat(dialVel.value);

      // Draw trajectory hyperbolic arc
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 20; x < canvas.width - 20; x += 4) {
        const dx = x - px;
        const curve = (peri * 14) / (1 + (dx * dx) / (vel * 120));
        const y = py + curve;
        if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const escapeVel = (vel * 1.38 - peri * 2.8).toFixed(1);
      const isCrash = peri < 1.6;
      const isEscape = escapeVel >= 51.0 && !isCrash;

      if (isCrash) {
        feedback.innerHTML = `<span style="color:#ef4444;">WARNING: Trajectory collides with radiation belt / atmosphere!</span>`;
        execBtn.classList.remove("ready");
      } else if (isEscape) {
        feedback.innerHTML = `<span style="color:#4ade80;">SLINGSHOT SUCCESS: Solar Escape Velocity = ${escapeVel} km/s!</span>`;
        execBtn.classList.add("ready");
      } else {
        feedback.textContent = `Escape Velocity = ${escapeVel} km/s (Need ≥ 51.0 km/s without colliding)`;
        execBtn.classList.remove("ready");
      }
    };

    dialPeri.oninput = (e) => { document.getElementById("val-peri").textContent = e.target.value; drawOrbit(); };
    dialVel.oninput = (e) => { document.getElementById("val-vel").textContent = e.target.value; drawOrbit(); };
    drawOrbit();

    execBtn.onclick = () => {
      const peri = parseFloat(dialPeri.value);
      const vel = parseFloat(dialVel.value);
      const escapeVel = vel * 1.38 - peri * 2.8;
      if (peri >= 1.6 && peri <= 3.4 && escapeVel >= 51.0) {
        this.completePuzzle(missionId, "flyby", ["m01-c03", "m01-c04"], "GRAVITATIONAL SLINGSHOT CONFIRMED: Trajectory to solar escape calculated!");
      }
    };
  }

  // PUZZLE 3: TELEMETRY SEQUENCING
  renderTelemetryPuzzle(missionId) {
    this.titleEl.textContent = "PUZZLE 03 // MISSION SEQUENCE ORDER";
    this.subtitleEl.textContent = "Arrange the scientific mission flight profile phases in chronological order.";

    const steps = [
      { id: "s1", text: "1. Launch & Trans-Mars/Jupiter Injection", correctIdx: 0 },
      { id: "s2", text: "2. Heliocentric Cruise & Asteroid Belt Transit", correctIdx: 1 },
      { id: "s3", text: "3. Planetary Gravity Encounter & Closest Approach", correctIdx: 2 },
      { id: "s4", text: "4. Physical Radiation & Magnetic Field Measurement", correctIdx: 3 },
      { id: "s5", text: "5. High-Gain Telemetry Burst & Solar Escape", correctIdx: 4 }
    ];

    // Shuffle
    const shuffled = [...steps].sort(() => Math.random() - 0.5);

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <p class="sequence-instructions">Click two steps to swap their positions until the scientific timeline is correctly restored:</p>
        <div id="sequence-list" class="sequence-list">
          ${shuffled.map((s, idx) => `
            <div class="seq-card" data-idx="${idx}" data-correct="${s.correctIdx}">
              <span class="card-num">${idx + 1}</span>
              <span class="card-text">${s.text}</span>
            </div>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <div id="seq-feedback" class="puzzle-feedback">Select steps to rearrange timeline</div>
          <button id="btn-verify-seq" class="solve-btn">VERIFY MISSION SEQUENCE 📋</button>
        </div>
      </div>
    `;

    const list = document.getElementById("sequence-list");
    let selectedEl = null;

    list.addEventListener("click", (e) => {
      const card = e.target.closest(".seq-card");
      if (!card) return;

      if (!selectedEl) {
        selectedEl = card;
        card.classList.add("selected");
      } else {
        // Swap contents
        const text1 = selectedEl.querySelector(".card-text").textContent;
        const correct1 = selectedEl.getAttribute("data-correct");

        const text2 = card.querySelector(".card-text").textContent;
        const correct2 = card.getAttribute("data-correct");

        selectedEl.querySelector(".card-text").textContent = text2;
        selectedEl.setAttribute("data-correct", correct2);

        card.querySelector(".card-text").textContent = text1;
        card.setAttribute("data-correct", correct1);

        selectedEl.classList.remove("selected");
        selectedEl = null;
      }
    });

    document.getElementById("btn-verify-seq").onclick = () => {
      const cards = list.querySelectorAll(".seq-card");
      let allCorrect = true;
      cards.forEach((card, idx) => {
        if (parseInt(card.getAttribute("data-correct")) !== idx) {
          allCorrect = false;
        }
      });

      if (allCorrect) {
        this.completePuzzle(missionId, "telemetry", ["m01-c05"], "TIMELINE RESTORED: All mission telemetry phases verified in chronological order!");
      } else {
        document.getElementById("seq-feedback").textContent = "TIMELINE REJECTED: One or more flight phases are out of chronological order.";
      }
    };
  }

  completePuzzle(missionId, puzzleType, clueIds, successMsg) {
    clueIds.forEach(id => {
      this.vault.unlockClue(missionId, id);
      if (this.onClueAwarded) this.onClueAwarded(id);
    });

    this.bodyEl.innerHTML = `
      <div class="puzzle-success-screen">
        <div class="success-icon">✓</div>
        <h3>EVIDENCE ACCEPTED</h3>
        <p>${successMsg}</p>
        <div class="reward-badge">
          <span>RECOVERED: ${clueIds.length} CLUE FRAGMENT(S)</span>
        </div>
        <button id="btn-continue-after-puzzle" class="solve-btn ready">RETURN TO EXPLORATION</button>
      </div>
    `;

    document.getElementById("btn-continue-after-puzzle").onclick = () => {
      this.closePuzzle();
      if (this.vault.getUnlockedCount(missionId) >= 3 && this.onMissionComplete) {
        this.onMissionComplete(missionId);
      }
    };
  }
}
