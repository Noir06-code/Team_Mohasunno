// Scientific Puzzles System for The Last Human Mission
// Student-friendly, guided, engaging, and rewarding educational science mechanics

import { refreshIcons } from '../utils/Icons.js';
import { AudioSynth } from '../utils/AudioSynth.js';
import { Typewriter } from '../utils/Typewriter.js';

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
    } else if (puzzleType === "transit") {
      this.renderTransitPuzzle(missionId);
    } else if (puzzleType === "aerodynamics") {
      this.renderAerodynamicsPuzzle(missionId);
    }

    refreshIcons(this.modalEl);
  }

  // ==========================================
  // PUZZLE 1: SIGNAL RECONSTRUCTION
  // ==========================================
  renderSignalPuzzle(missionId) {
    this.titleEl.innerHTML = `<i data-lucide="radio"></i> PUZZLE 01 // RADIO SIGNAL RECONSTRUCTION`;
    this.subtitleEl.textContent = "Tune the receiver frequency to match the deep-space carrier wave.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <!-- Student Guidance Tip -->
        <div class="student-science-tip">
          <div class="tip-header">
            <i data-lucide="help-circle"></i>
            <strong>STUDENT FIELD GUIDE // RADIO PHYSICS:</strong>
          </div>
          <p>Deep-space radio signals travel across 12 billion km. Move the <strong>Carrier Frequency</strong> slider to ~2.3 GHz (Pioneer 10's S-band frequency) and adjust <strong>Modulation</strong> until your blue wave overlaps with the green target line!</p>
        </div>

        <div class="scope-display">
          <canvas id="waveform-canvas" width="460" height="160"></canvas>
          <div class="scope-overlay">
            <span class="target-label"><i data-lucide="radio"></i> TARGET CARRIER (DASHED GREEN)</span>
            <span class="player-label"><i data-lucide="radio"></i> RECEIVER OUTPUT (SOLID CYAN)</span>
          </div>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>CARRIER FREQ: <span id="val-freq">1.8</span> GHz</label>
            <input type="range" id="dial-freq" min="1.0" max="4.0" step="0.1" value="1.8" />
          </div>
          <div class="dial-control">
            <label>MODULATION: <span id="val-mod">25</span> kHz</label>
            <input type="range" id="dial-mod" min="10" max="90" step="1" value="25" />
          </div>
          <div class="dial-control">
            <label>RF GAIN: <span id="val-gain">12</span> dB</label>
            <input type="range" id="dial-gain" min="5" max="35" step="1" value="12" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="signal-feedback" class="puzzle-feedback">TUNING SIGNAL LOCK: 42%</div>
          <button id="btn-lock-signal" class="solve-btn">
            <i data-lucide="radio"></i> LOCK SIGNAL CARRIER
          </button>
        </div>
      </div>
    `;

    refreshIcons(this.bodyEl);

    const canvas = document.getElementById("waveform-canvas");
    const ctx = canvas.getContext("2d");
    const dialFreq = document.getElementById("dial-freq");
    const dialMod = document.getElementById("dial-mod");
    const dialGain = document.getElementById("dial-gain");
    const feedback = document.getElementById("signal-feedback");
    const lockBtn = document.getElementById("btn-lock-signal");

    // Target parameters for Pioneer 10 (2.29 GHz S-Band)
    const target = { freq: 2.29, mod: 64, gain: 24 };

    let animId;
    let t = 0;

    const drawScope = () => {
      t += 0.04;
      ctx.fillStyle = "#050a0e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Oscilloscope grid lines
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

      // Calculate matching accuracy
      const diffF = Math.abs(pFreq - target.freq) / 3.0;
      const diffM = Math.abs(pMod - target.mod) / 80.0;
      const diffG = Math.abs(pGain - target.gain) / 30.0;
      const accuracy = Math.max(0, Math.round((1 - (diffF + diffM + diffG) / 3) * 100));

      if (accuracy > 85) {
        feedback.innerHTML = `<span style="color:#4ade80; font-weight:600;"><i data-lucide="check-circle-2"></i> SIGNAL LOCK ACQUIRED: ${accuracy}%</span>`;
        lockBtn.classList.add("ready");
      } else {
        feedback.innerHTML = `TUNING SIGNAL LOCK: ${accuracy}% (Align cyan wave over green)`;
        lockBtn.classList.remove("ready");
      }

      animId = requestAnimationFrame(drawScope);
    };

    dialFreq.oninput = (e) => {
      document.getElementById("val-freq").textContent = e.target.value;
      AudioSynth.playClick();
    };
    dialMod.oninput = (e) => {
      document.getElementById("val-mod").textContent = e.target.value;
      AudioSynth.playClick();
    };
    dialGain.oninput = (e) => {
      document.getElementById("val-gain").textContent = e.target.value;
      AudioSynth.playClick();
    };

    drawScope();

    lockBtn.onclick = () => {
      const pFreq = parseFloat(dialFreq.value);
      const pMod = parseFloat(dialMod.value);
      const pGain = parseFloat(dialGain.value);
      if (Math.abs(pFreq - target.freq) < 0.38 && Math.abs(pMod - target.mod) < 16 && Math.abs(pGain - target.gain) < 10) {
        cancelAnimationFrame(animId);
        const prefix = missionId.replace("mission-", "m");
        this.completePuzzle(
          missionId,
          "signal",
          [`${prefix}-c01`, `${prefix}-c02`],
          "SIGNAL RESTORED: Carrier lock verified! Telemetry frame and scientific sensor measurements successfully decoded!"
        );
      } else {
        feedback.textContent = "SIGNAL REJECTED: Tune dials closer to target green wave.";
      }
    };
  }

  // ==========================================
  // PUZZLE 2: FLYBY GEOMETRY
  // ==========================================
  renderFlybyPuzzle(missionId) {
    this.titleEl.innerHTML = `<i data-lucide="orbit"></i> PUZZLE 02 // JUPITER SLINGSHOT TRAJECTORY`;
    this.subtitleEl.textContent = "Calculate gravitational slingshot trajectory to escape the Solar System.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <!-- Student Guidance Tip -->
        <div class="student-science-tip">
          <div class="tip-header">
            <i data-lucide="help-circle"></i>
            <strong>STUDENT FIELD GUIDE // GRAVITY ASSIST:</strong>
          </div>
          <p>Jupiter is 318 times more massive than Earth! Pioneer 10 used Jupiter's gravitational pull like a slingshot to gain speed. If you fly too close (<strong>&lt; 1.6 R_J</strong>), radiation destroys the probe. Set <strong>Periapsis</strong> between 2.0 and 3.0 R_J to achieve <strong>&ge; 51 km/s</strong> escape velocity!</p>
        </div>

        <div class="orbit-display">
          <canvas id="orbit-canvas" width="460" height="180"></canvas>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>PERIAPSIS DISTANCE: <span id="val-peri">4.2</span> R_J</label>
            <input type="range" id="dial-peri" min="1.0" max="6.0" step="0.1" value="4.2" />
          </div>
          <div class="dial-control">
            <label>APPROACH VELOCITY: <span id="val-vel">48.0</span> km/s</label>
            <input type="range" id="dial-vel" min="20.0" max="60.0" step="0.5" value="48.0" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="flyby-feedback" class="puzzle-feedback">TARGET ESCAPE VELOCITY: > 51.0 km/s</div>
          <button id="btn-execute-flyby" class="solve-btn">
            <i data-lucide="orbit"></i> CALCULATE SLINGSHOT
          </button>
        </div>
      </div>
    `;

    refreshIcons(this.bodyEl);

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
      const px = 230, py = 90;
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fillStyle = "#b45309";
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Atmospheric / Radiation safety limit (dashed red)
      ctx.beginPath();
      ctx.arc(px, py, 34, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.setLineDash([4, 4]);
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
        feedback.innerHTML = `<span style="color:#ef4444; font-weight:600;"><i data-lucide="x"></i> WARNING: Periapsis &lt; 1.6 R_J collides with radiation belt!</span>`;
        execBtn.classList.remove("ready");
      } else if (isEscape) {
        feedback.innerHTML = `<span style="color:#4ade80; font-weight:600;"><i data-lucide="check-circle-2"></i> SLINGSHOT SUCCESS: Solar Escape Velocity = ${escapeVel} km/s!</span>`;
        execBtn.classList.add("ready");
      } else {
        feedback.textContent = `Escape Velocity = ${escapeVel} km/s (Need ≥ 51.0 km/s to escape)`;
        execBtn.classList.remove("ready");
      }
    };

    dialPeri.oninput = (e) => {
      document.getElementById("val-peri").textContent = e.target.value;
      AudioSynth.playClick();
      drawOrbit();
    };
    dialVel.oninput = (e) => {
      document.getElementById("val-vel").textContent = e.target.value;
      AudioSynth.playClick();
      drawOrbit();
    };
    drawOrbit();

    execBtn.onclick = () => {
      const peri = parseFloat(dialPeri.value);
      const vel = parseFloat(dialVel.value);
      const escapeVel = vel * 1.38 - peri * 2.8;
      if (peri >= 1.6 && peri <= 3.4 && escapeVel >= 51.0) {
        const prefix = missionId.replace("mission-", "m");
        this.completePuzzle(
          missionId,
          "flyby",
          [`${prefix}-c03`, `${prefix}-c04`],
          "ORBITAL MECHANICS CONFIRMED: Trajectory calculation validated! Gravitational energy transfer and orbital trajectory achieved!"
        );
      }
    };
  }

  // ==========================================
  // PUZZLE 3: TELEMETRY SEQUENCING
  // ==========================================
  renderTelemetryPuzzle(missionId) {
    this.titleEl.innerHTML = `<i data-lucide="list-ordered"></i> PUZZLE // MISSION TIMELINE ORDER`;
    this.subtitleEl.textContent = "Arrange the scientific mission flight profile phases in chronological order.";

    let steps = [];
    let awardClues = [];
    let successStory = "";

    if (missionId === "mission-02") {
      steps = [
        { id: "s1", text: "Saturn V Launch & Trans-Lunar Injection (TLI)", correctIdx: 0 },
        { id: "s2", text: "Translunar Coast & Lunar Orbit Insertion (LOI)", correctIdx: 1 },
        { id: "s3", text: "Lunar Module Descent & Powered Lunar Landing", correctIdx: 2 },
        { id: "s4", text: "Extravehicular Surface Activity & EASEP Seismic Setup", correctIdx: 3 },
        { id: "s5", text: "Ascent Engine Firing & Earth Return Injection", correctIdx: 4 }
      ];
      awardClues = ["m02-c03", "m02-c04"];
      successStory = "APOLLO CHRONOLOGY RESTORED: Lunar landing sequence verified from TLI to Pacific splashdown!";
    } else if (missionId === "mission-03") {
      steps = [
        { id: "s1", text: "Delta II Launch & Mars Gravity Assist Slingshot", correctIdx: 0 },
        { id: "s2", text: "Ion Engine Interplanetary Cruise to Asteroid Belt", correctIdx: 1 },
        { id: "s3", text: "Vesta Orbit Insertion & Basaltic Core Spectroscopy", correctIdx: 2 },
        { id: "s4", text: "Departure from Vesta & Heliocentric Cruise to Ceres", correctIdx: 3 },
        { id: "s5", text: "Ceres Low-Altitude Orbit & GRaND Subsurface Ice Mapping", correctIdx: 4 }
      ];
      awardClues = ["m03-c03", "m03-c04"];
      successStory = "DAWN FLIGHT PROFILE RESTORED: Record-setting dual-body orbital mission chronologically locked!";
    } else if (missionId === "mission-04") {
      steps = [
        { id: "s1", text: "Interplanetary Launch & Mars Atmospheric Entry (EDL)", correctIdx: 0 },
        { id: "s2", text: "Supersonic Parachute & Powered Descent Landing", correctIdx: 1 },
        { id: "s3", text: "Surface Deployment & Rocker-Bogie Soil Sampling", correctIdx: 2 },
        { id: "s4", text: "Ingenuity Helicopter Release & Historic 1st Flight", correctIdx: 3 },
        { id: "s5", text: "Sedimentary Hematite Mapping & Groundwater Evidence", correctIdx: 4 }
      ];
      awardClues = ["m04-c01", "m04-c04"];
      successStory = "RED PLANET CHRONOLOGY RESTORED: Surface and aerial robotics missions harmonized across decades!";
    } else if (missionId === "mission-05") {
      steps = [
        { id: "s1", text: "Delta II Heliocentric Earth-Trailing Launch", correctIdx: 0 },
        { id: "s2", text: "Optical Dust Cover Ejection & First Sky Calibration", correctIdx: 1 },
        { id: "s3", text: "Continuous 95-Megapixel CCD Stellar Photometry", correctIdx: 2 },
        { id: "s4", text: "Transit Light-Curve Signature Analysis (Kepler-452b)", correctIdx: 3 },
        { id: "s5", text: "Solar Radiation Balance Repointing & Extended K2 Survey", correctIdx: 4 }
      ];
      awardClues = ["m05-c03", "m05-c04"];
      successStory = "EXOPLANET CHRONOLOGY RESTORED: 530,000 surveyed stars and 2,662 alien worlds preserved in timeline!";
    } else {
      steps = [
        { id: "s1", text: "Launch & Trans-Jupiter Planetary Injection", correctIdx: 0 },
        { id: "s2", text: "Heliocentric Cruise & Asteroid Belt Transit", correctIdx: 1 },
        { id: "s3", text: "Jupiter Gravity Encounter & Closest Approach", correctIdx: 2 },
        { id: "s4", text: "Radiation Belt & Magnetic Field Science Measurement", correctIdx: 3 },
        { id: "s5", text: "Deep Space Telemetry Burst & Solar Escape Cruise", correctIdx: 4 }
      ];
      awardClues = ["m01-c03", "m01-c04"];
      successStory = "TIMELINE RESTORED: All 5 mission flight phases confirmed in chronological sequence!";
    }

    // Shuffle
    const shuffled = [...steps].sort(() => Math.random() - 0.5);

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <!-- Student Guidance Tip -->
        <div class="student-science-tip">
          <div class="tip-header">
            <i data-lucide="help-circle"></i>
            <strong>STUDENT FIELD GUIDE // MISSION PLANNING:</strong>
          </div>
          <p>Every space mission follows a chronological chain of events. Tap or click any two cards below to swap their positions until the timeline starts with <em>Launch</em> and finishes with <em>Primary Science Cruise / Mission Objective</em>!</p>
        </div>

        <div id="sequence-list" class="sequence-list">
          ${shuffled.map((s, idx) => `
            <div class="seq-card" data-idx="${idx}" data-correct="${s.correctIdx}">
              <span class="card-num">${idx + 1}</span>
              <span class="card-text">${s.text}</span>
            </div>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <div id="seq-feedback" class="puzzle-feedback">Tap or click any two cards to swap positions</div>
          <button id="btn-verify-seq" class="solve-btn">
            <i data-lucide="list-ordered"></i> VERIFY SEQUENCE
          </button>
        </div>
      </div>
    `;

    refreshIcons(this.bodyEl);

    const list = document.getElementById("sequence-list");
    let selectedEl = null;

    list.addEventListener("click", (e) => {
      const card = e.target.closest(".seq-card");
      if (!card) return;

      AudioSynth.playClick();

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
        this.completePuzzle(
          missionId,
          "telemetry",
          awardClues,
          successStory
        );
      } else {
        AudioSynth.playClick();
        document.getElementById("seq-feedback").innerHTML = `<span style="color:#ef4444;"><i data-lucide="x"></i> Sequence incomplete. Verify chronological sequence of launch, transit, and objective phases.</span>`;
        refreshIcons(document.getElementById("seq-feedback"));
      }
    };
  }

  // ==========================================
  // PUZZLE 4: EXOPLANET TRANSIT PHOTOMETRY (KEPLER)
  // ==========================================
  renderTransitPuzzle(missionId) {
    this.titleEl.innerHTML = `<i data-lucide="sun"></i> PUZZLE // EXOPLANET TRANSIT PHOTOMETRY (KEPLER)`;
    this.subtitleEl.textContent = "Calibrate photometer sensors to detect micro-dips in stellar brightness caused by an eclipsing alien world.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <div class="student-science-tip">
          <div class="tip-header">
            <i data-lucide="help-circle"></i>
            <strong>STUDENT FIELD GUIDE // TRANSIT PHOTOMETRY:</strong>
          </div>
          <p>When an exoplanet passes between Kepler and its host star, it blocks a minuscule fraction of light (ΔF/F = (Rp/Rstar)²). Adjust <strong>Exoplanet Radius</strong> to ~1.6 R⊕ and <strong>Orbital Inclination</strong> to ~90° to confirm discovery of <strong>Kepler-452b</strong> in the habitable Goldilocks zone!</p>
        </div>

        <div class="scope-display">
          <canvas id="transit-canvas" width="460" height="170"></canvas>
          <div class="scope-overlay">
            <span class="target-label"><i data-lucide="sun"></i> STELLAR FLUX LIGHT CURVE (KEPLER PHOTOMETER)</span>
          </div>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>PLANET RADIUS: <span id="val-radius">0.8</span> R⊕</label>
            <input type="range" id="dial-radius" min="0.5" max="3.5" step="0.1" value="0.8" />
          </div>
          <div class="dial-control">
            <label>ORBITAL INCLINATION: <span id="val-incline">84</span>°</label>
            <input type="range" id="dial-incline" min="80" max="100" step="1" value="84" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="transit-feedback" class="puzzle-feedback">TRANSIT ALIGNMENT: 46% (SEARCHING LIGHT CURVE)</div>
          <button id="btn-confirm-transit" class="solve-btn" disabled>
            <i data-lucide="check-circle-2"></i> CONFIRM EXOPLANET DISCOVERY
          </button>
        </div>
      </div>
    `;

    refreshIcons(this.bodyEl);

    const canvas = document.getElementById("transit-canvas");
    const ctx = canvas.getContext("2d");
    const rSlider = document.getElementById("dial-radius");
    const iSlider = document.getElementById("dial-incline");
    const rVal = document.getElementById("val-radius");
    const iVal = document.getElementById("val-incline");
    const feedback = document.getElementById("transit-feedback");
    const confirmBtn = document.getElementById("btn-confirm-transit");

    let animTime = 0;
    let animId = null;

    const renderLoop = () => {
      animTime += 0.025;
      const radius = parseFloat(rSlider.value);
      const incline = parseFloat(iSlider.value);

      rVal.textContent = radius.toFixed(1);
      iVal.textContent = incline.toString();

      // Clear canvas
      ctx.fillStyle = "#060914";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top area: Star and orbiting planet
      const starX = canvas.width / 2;
      const starY = 52;
      const starR = 28;

      // Draw Star glow & body
      const starGrad = ctx.createRadialGradient(starX, starY, 4, starX, starY, starR * 1.8);
      starGrad.addColorStop(0, "#ffffff");
      starGrad.addColorStop(0.35, "#fef08a");
      starGrad.addColorStop(0.7, "#f59e0b");
      starGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(starX, starY, starR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();

      // Planet orbit position
      const orbitW = 180;
      const planetX = starX + Math.sin(animTime) * orbitW;
      const planetY = starY + (incline - 90) * 1.8;
      const planetR = radius * 4.2;

      // Draw transiting planet (black disc when in front of star)
      const isBehind = Math.cos(animTime) < 0;
      if (!isBehind) {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Bottom area: Photometer Light Curve Graph
      const graphY = 135;
      const graphH = 30;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, graphY);
      ctx.lineTo(canvas.width - 30, graphY);
      ctx.stroke();

      // Draw baseline and dip
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(30, graphY);

      const inTransit = (!isBehind && Math.abs(planetX - starX) < (starR + planetR) && Math.abs(planetY - starY) < (starR + planetR));
      const dipDepth = (radius * radius * 1.8) * Math.max(0, 1 - Math.abs(incline - 90) * 0.15);

      for (let x = 30; x <= canvas.width - 30; x += 4) {
        const dx = Math.abs(x - starX);
        let y = graphY;
        if (dx < 60) {
          const factor = Math.cos((dx / 60) * (Math.PI / 2));
          y += factor * dipDepth;
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Check alignment criteria
      const isRadiusValid = (radius >= 1.4 && radius <= 1.8);
      const isAngleValid = (incline >= 89 && incline <= 91);

      if (isRadiusValid && isAngleValid) {
        feedback.innerHTML = `<span style="color:#10b981;"><i data-lucide="check"></i> EXOPLANET TRANSIT CONFIRMED: Kepler-452b Signature Matched!</span>`;
        confirmBtn.disabled = false;
        confirmBtn.classList.add("ready");
      } else {
        feedback.textContent = `TARGET: Radius ~1.6 R⊕, Inclination ~90° [Current: ${radius.toFixed(1)} R⊕, ${incline}°]`;
        confirmBtn.disabled = true;
        confirmBtn.classList.remove("ready");
      }
      refreshIcons(feedback);

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    const cleanup = () => {
      if (animId) cancelAnimationFrame(animId);
    };

    confirmBtn.onclick = () => {
      cleanup();
      this.completePuzzle(
        missionId,
        "transit",
        ["m05-c01", "m05-c02"],
        "Kepler-452b confirmed! By measuring the 0.0084% dip in stellar photons, Kepler proved rocky Earth-sized worlds exist in alien habitable zones. EVA cannot refute the laws of optics and geometry."
      );
    };

    rSlider.oninput = () => AudioSynth.playClick();
    iSlider.oninput = () => AudioSynth.playClick();
  }

  // ==========================================
  // PUZZLE 5: MARTIAN ROTOR AERODYNAMICS (INGENUITY)
  // ==========================================
  renderAerodynamicsPuzzle(missionId) {
    this.titleEl.innerHTML = `<i data-lucide="wind"></i> PUZZLE // MARTIAN ROTOR AERODYNAMICS (INGENUITY)`;
    this.subtitleEl.textContent = "Calibrate rotor RPM and blade pitch to produce aerodynamic lift in Mars's 1% ultra-thin atmosphere.";

    this.bodyEl.innerHTML = `
      <div class="puzzle-container">
        <div class="student-science-tip">
          <div class="tip-header">
            <i data-lucide="help-circle"></i>
            <strong>STUDENT FIELD GUIDE // THIN AIR AERODYNAMICS:</strong>
          </div>
          <p>Mars air density is only 0.020 kg/m³ (~1% of Earth!). To lift off against Martian gravity (g = 3.72 m/s²), Ingenuity's counter-rotating blades must achieve ~2,400 RPM with a blade pitch of 10°–14° to generate > 17 N of vertical aerodynamic lift!</p>
        </div>

        <div class="scope-display">
          <canvas id="aero-canvas" width="460" height="170"></canvas>
          <div class="scope-overlay">
            <span class="target-label"><i data-lucide="wind"></i> AERODYNAMIC FLIGHT ENVELOPE</span>
          </div>
        </div>

        <div class="dials-panel">
          <div class="dial-control">
            <label>ROTOR SPEED: <span id="val-rpm">1200</span> RPM</label>
            <input type="range" id="dial-rpm" min="800" max="3000" step="50" value="1200" />
          </div>
          <div class="dial-control">
            <label>BLADE PITCH: <span id="val-pitch">5</span>°</label>
            <input type="range" id="dial-pitch" min="2" max="22" step="1" value="5" />
          </div>
        </div>

        <div class="puzzle-actions">
          <div id="aero-feedback" class="puzzle-feedback">CALCULATING LIFT COEFFICIENT...</div>
          <button id="btn-engage-takeoff" class="solve-btn" disabled>
            <i data-lucide="rocket"></i> ENGAGE POWERED VERTICAL TAKEOFF
          </button>
        </div>
      </div>
    `;

    refreshIcons(this.bodyEl);

    const canvas = document.getElementById("aero-canvas");
    const ctx = canvas.getContext("2d");
    const rpmSlider = document.getElementById("dial-rpm");
    const pitchSlider = document.getElementById("dial-pitch");
    const rpmVal = document.getElementById("val-rpm");
    const pitchVal = document.getElementById("val-pitch");
    const feedback = document.getElementById("aero-feedback");
    const takeoffBtn = document.getElementById("btn-engage-takeoff");

    let rotorAngle = 0;
    let animId = null;

    const renderLoop = () => {
      const rpm = parseInt(rpmSlider.value, 10);
      const pitch = parseInt(pitchSlider.value, 10);

      rotorAngle += (rpm / 600);
      rpmVal.textContent = rpm.toString();
      pitchVal.textContent = pitch.toString();

      // Atmospheric lift formula approximation: L = 0.5 * rho * v^2 * S * Cl
      const rho = 0.020; // Mars air density kg/m3
      const speedFactor = (rpm / 2400) ** 2;
      const pitchFactor = Math.sin((pitch * Math.PI) / 180) * 3.8;
      const liftForce = 18.5 * speedFactor * pitchFactor; // in Newtons
      const weightForce = 16.5; // Ingenuity weight on Mars (1.8 kg * 3.72 m/s2)

      // Clear canvas (Martian landscape)
      ctx.fillStyle = "#1e1112";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Martian dust ground
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, 140, canvas.width, 30);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, 144, canvas.width, 26);

      // Helicopter position (lifts if liftForce > weightForce)
      const isLifting = liftForce >= weightForce;
      const hoverHeight = isLifting ? Math.min(65, (liftForce - weightForce) * 6 + 25) : 0;
      const hx = canvas.width / 2;
      const hy = 135 - hoverHeight;

      // Helicopter body & mast
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(hx - 8, hy - 20, 16, 20); // solar cube & electronics
      ctx.fillStyle = "#475569";
      ctx.fillRect(hx - 2, hy - 44, 4, 24); // mast

      // Dual counter-rotating blades (visual motion blur)
      const bladeW = 54;
      const blurAlpha = Math.min(0.85, (rpm / 2400) * 0.7 + 0.2);

      // Top rotor
      ctx.save();
      ctx.translate(hx, hy - 40);
      ctx.fillStyle = `rgba(56, 189, 248, ${blurAlpha})`;
      ctx.fillRect(-bladeW * Math.cos(rotorAngle), -2, bladeW * 2 * Math.cos(rotorAngle), 4);
      ctx.restore();

      // Bottom rotor
      ctx.save();
      ctx.translate(hx, hy - 28);
      ctx.fillStyle = `rgba(56, 189, 248, ${blurAlpha})`;
      ctx.fillRect(bladeW * Math.cos(-rotorAngle), -2, -bladeW * 2 * Math.cos(-rotorAngle), 4);
      ctx.restore();

      // Legs / landing gear
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy);
      ctx.lineTo(hx - 18, hy + 6);
      ctx.moveTo(hx + 8, hy);
      ctx.lineTo(hx + 18, hy + 6);
      ctx.stroke();

      // Vector arrows: Lift (cyan up) vs Gravity (orange down)
      ctx.lineWidth = 3;
      // Lift arrow
      const liftArrowLen = Math.min(50, liftForce * 2.2);
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(hx - 36, hy - 10);
      ctx.lineTo(hx - 36, hy - 10 - liftArrowLen);
      ctx.stroke();

      // Gravity arrow
      ctx.strokeStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(hx + 36, hy - 10);
      ctx.lineTo(hx + 36, hy - 10 + 36);
      ctx.stroke();

      // Check alignment criteria
      const isRpmOk = (rpm >= 2300 && rpm <= 2600);
      const isPitchOk = (pitch >= 10 && pitch <= 14);

      if (isRpmOk && isPitchOk && isLifting) {
        feedback.innerHTML = `<span style="color:#10b981;"><i data-lucide="check"></i> AERODYNAMIC LIFT NOMINAL: Lift (${liftForce.toFixed(1)} N) > Martian Gravity (${weightForce.toFixed(1)} N)!</span>`;
        takeoffBtn.disabled = false;
        takeoffBtn.classList.add("ready");
      } else {
        feedback.textContent = `TARGET: 2400 RPM, Pitch 10°–14° [Current Lift: ${liftForce.toFixed(1)} N / Needed: > 16.5 N]`;
        takeoffBtn.disabled = true;
        takeoffBtn.classList.remove("ready");
      }
      refreshIcons(feedback);

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    const cleanup = () => {
      if (animId) cancelAnimationFrame(animId);
    };

    takeoffBtn.onclick = () => {
      cleanup();
      this.completePuzzle(
        missionId,
        "aerodynamics",
        ["m04-c02", "m04-c03"],
        "Ingenuity achieves powered flight on Mars! High-RPM aerodynamics overcame the 99% atmospheric void, proving human engineering can fly on another world."
      );
    };

    rpmSlider.oninput = () => AudioSynth.playClick();
    pitchSlider.oninput = () => AudioSynth.playClick();
  }

  completePuzzle(missionId, puzzleType, clueIds, successMsg) {
    // Play celebratory sound effects
    AudioSynth.playSuccessChord();
    AudioSynth.playClueChime();

    clueIds.forEach(id => {
      this.vault.unlockClue(missionId, id);
      if (this.onClueAwarded) this.onClueAwarded(id);
    });

    this.bodyEl.innerHTML = `
      <div class="puzzle-success-screen">
        <div class="success-icon"><i data-lucide="award"></i></div>
        <h3>EVIDENCE ACCEPTED</h3>
        <p id="typewriter-success-text" class="success-story-text"></p>
        <div class="reward-badge">
          <i data-lucide="sparkles"></i>
          <span>RECOVERED: ${clueIds.length} SCIENTIFIC CLUE(S)</span>
        </div>
        <button id="btn-continue-after-puzzle" class="solve-btn ready">
          <i data-lucide="check"></i> RETURN TO EXPLORATION
        </button>
      </div>
    `;

    refreshIcons(this.bodyEl);

    // Storytelling Typewriter animation for the deduction result
    const textEl = document.getElementById("typewriter-success-text");
    if (textEl) {
      Typewriter.type(textEl, successMsg, { speed: 18, audio: true });
    }

    document.getElementById("btn-continue-after-puzzle").onclick = () => {
      this.closePuzzle();
      if (this.vault.getUnlockedCount(missionId) >= 3 && this.onMissionComplete) {
        this.onMissionComplete(missionId);
      }
    };
  }
}
