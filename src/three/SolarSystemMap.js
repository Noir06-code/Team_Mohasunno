// Interactive 2D Solar System Engine for Visual Mission Selection
// Renders an animated, high-DPI 2D Solar System with clickable orbital destinations,
// real planetary textures/colors, asteroid belt particles, and trajectory paths.

import { AudioSynth } from '../utils/AudioSynth.js';

export class SolarSystemMap {
  constructor(canvasId, onSelectCallback) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.onSelectCallback = onSelectCallback;

    this.selectedMissionId = "mission-01";
    this.hoveredBody = null;
    this.animationFrameId = null;
    this.time = 0;

    // Pre-calculated orbital bodies
    // rFactor: orbital radius factor, speed: orbital angular speed, color: planet color
    this.bodies = [
      {
        id: "sun",
        name: "Sun (Sol)",
        tag: "Solar Core",
        distAU: "0.0 AU",
        color: "#fbbf24",
        glowColor: "rgba(251, 191, 36, 0.45)",
        radius: 18,
        isSun: true
      },
      {
        id: "mercury",
        name: "Mercury",
        tag: "Terrestrial Planet",
        distAU: "0.39 AU",
        orbitR: 52,
        speed: 1.6,
        size: 4,
        color: "#9ca3af",
        missionId: null
      },
      {
        id: "venus",
        name: "Venus",
        tag: "Atmospheric Planet",
        distAU: "0.72 AU",
        orbitR: 85,
        speed: 1.15,
        size: 6.5,
        color: "#fcd34d",
        missionId: null
      },
      {
        id: "earth",
        name: "Earth & Moon",
        tag: "Tranquility Base",
        distAU: "1.0 AU",
        orbitR: 124,
        speed: 0.9,
        size: 7.5,
        color: "#38bdf8",
        moonColor: "#e2e8f0",
        missionId: "mission-02",
        missionTitle: "MISSION 02: THE LUNAR ARCHIVE"
      },
      {
        id: "mars",
        name: "Mars",
        tag: "Jezero / Meridiani",
        distAU: "1.52 AU",
        orbitR: 168,
        speed: 0.72,
        size: 6,
        color: "#ef4444",
        missionId: "mission-04",
        missionTitle: "MISSION 04: THE RED PLANET"
      },
      {
        id: "asteroids",
        name: "Asteroid Belt (Ceres)",
        tag: "Occator Crater",
        distAU: "2.77 AU",
        orbitR: 216,
        speed: 0.55,
        size: 5.5,
        color: "#a3e635",
        missionId: "mission-03",
        missionTitle: "MISSION 03: THE ASTEROID FRONTIER",
        isAsteroid: true
      },
      {
        id: "jupiter",
        name: "Jupiter & Deep Space",
        tag: "Interstellar Escape",
        distAU: "5.20 AU",
        orbitR: 278,
        speed: 0.38,
        size: 13,
        color: "#f59e0b",
        missionId: "mission-01",
        missionTitle: "MISSION 01: FIRST SIGNAL"
      },
      {
        id: "saturn",
        name: "Saturn",
        tag: "Outer Gas Giant",
        distAU: "9.58 AU",
        orbitR: 340,
        speed: 0.26,
        size: 10.5,
        color: "#fed7aa",
        hasRings: true,
        missionId: null
      },
      {
        id: "kepler",
        name: "Kepler & Spitzer Observatory",
        tag: "Cygnus Exoplanet Field",
        distAU: "Earth-Trailing (1.01 AU)",
        orbitR: 400,
        speed: 0.20,
        size: 8,
        color: "#c084fc",
        missionId: "mission-05",
        missionTitle: "MISSION 05: THE EXOPLANET OBSERVATORY"
      }
    ];

    // Asteroid belt dust particles
    this.asteroidParticles = [];
    for (let i = 0; i < 90; i++) {
      this.asteroidParticles.push({
        baseR: 206 + Math.random() * 22,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0012 + Math.random() * 0.0008,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.5
      });
    }

    this.initEvents();
    this.resize();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = rect.width || 600;
    this.height = rect.height || 420;

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.scale(dpr, dpr);
  }

  initEvents() {
    window.addEventListener("resize", () => this.resize());

    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseleave", () => {
      this.hoveredBody = null;
    });

    this.canvas.addEventListener("click", (e) => this.onClick(e));
  }

  setSelectedMission(missionId) {
    this.selectedMissionId = missionId;
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    const hitPadding = 18;

    for (const b of this.bodies) {
      if (b.screenX !== undefined && b.screenY !== undefined) {
        const dx = mx - b.screenX;
        const dy = my - b.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= b.size + hitPadding || (b.isSun && dist <= b.radius + 6)) {
          found = b;
          break;
        }
      }
    }

    if (found !== this.hoveredBody) {
      this.hoveredBody = found;
      if (found && found.missionId) {
        AudioSynth.playHover();
      }
      this.canvas.style.cursor = (found && found.missionId) ? "pointer" : "default";
    }
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hitPadding = 20;
    for (const b of this.bodies) {
      if (b.missionId && b.screenX !== undefined && b.screenY !== undefined) {
        const dx = mx - b.screenX;
        const dy = my - b.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= b.size + hitPadding) {
          AudioSynth.playClick();
          this.selectedMissionId = b.missionId;
          if (this.onSelectCallback) {
            this.onSelectCallback(b.missionId);
          }
          break;
        }
      }
    }
  }

  animate() {
    this.time += 0.015;
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep space gradient backdrop
    const bgGrad = ctx.createRadialGradient(
      this.width * 0.45, this.height * 0.5, 20,
      this.width * 0.45, this.height * 0.5, Math.max(this.width, this.height)
    );
    bgGrad.addColorStop(0, "#0b1329");
    bgGrad.addColorStop(0.65, "#060914");
    bgGrad.addColorStop(1, "#020409");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Center of the solar system map
    // Place Sun slightly to the left on wide screens for balanced layout
    const cx = this.width * 0.46;
    const cy = this.height * 0.5;

    // Scale orbital radii responsively to canvas dimensions
    const scale = Math.min(this.width / 740, this.height / 460);

    // 1. Draw Asteroid Belt Particle Field
    ctx.save();
    for (const p of this.asteroidParticles) {
      p.angle += p.speed;
      const rx = p.baseR * scale;
      const ry = (p.baseR * 0.58) * scale;
      const px = cx + Math.cos(p.angle) * rx;
      const py = cy + Math.sin(p.angle) * ry;

      ctx.fillStyle = `rgba(163, 230, 53, ${p.alpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size * Math.max(0.7, scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Planetary Orbital Ellipses
    for (const b of this.bodies) {
      if (b.orbitR) {
        const rx = b.orbitR * scale;
        const ry = (b.orbitR * 0.58) * scale; // Angled perspective ellipse

        const isSelected = (b.missionId && b.missionId === this.selectedMissionId);
        const isHovered = (this.hoveredBody === b);

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

        if (isSelected) {
          ctx.strokeStyle = "rgba(35, 131, 226, 0.75)";
          ctx.lineWidth = 2.0;
          ctx.setLineDash([]);
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = b.missionId ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1.0;
          ctx.setLineDash(b.missionId ? [4, 6] : [2, 8]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Draw Pioneer 10 Interstellar Trajectory Vector (Curving past Jupiter into deep space)
    ctx.save();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const jupOrbitR = 278 * scale;
    ctx.moveTo(cx + 80 * scale, cy + 30 * scale);
    ctx.quadraticCurveTo(
      cx + jupOrbitR * 0.85, cy + (jupOrbitR * 0.58) * 0.7,
      this.width - 20, 35
    );
    ctx.stroke();
    ctx.restore();

    // 4. Draw Central Sun
    const sunBody = this.bodies[0];
    const sunR = sunBody.radius * Math.max(0.8, scale);
    sunBody.screenX = cx;
    sunBody.screenY = cy;
    sunBody.size = sunR;

    // Sun outer corona glow
    const sunGlow = ctx.createRadialGradient(cx, cy, sunR * 0.4, cx, cy, sunR * 3.2);
    sunGlow.addColorStop(0, "rgba(254, 240, 138, 0.75)");
    sunGlow.addColorStop(0.35, "rgba(245, 158, 11, 0.35)");
    sunGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Sun core
    const sunCore = ctx.createRadialGradient(cx - (sunR * 0.3), cy - (sunR * 0.3), 1, cx, cy, sunR);
    sunCore.addColorStop(0, "#ffffff");
    sunCore.addColorStop(0.4, "#fef08a");
    sunCore.addColorStop(1, "#f59e0b");
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw Orbiting Planets & Mission Beacons
    for (let idx = 1; idx < this.bodies.length; idx++) {
      const b = this.bodies[idx];
      const rx = b.orbitR * scale;
      const ry = (b.orbitR * 0.58) * scale;

      // Calculate orbital angle
      const angle = (this.time * b.speed * 0.4) + (idx * 1.35);
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;

      b.screenX = px;
      b.screenY = py;

      const isSelected = (b.missionId && b.missionId === this.selectedMissionId);
      const isHovered = (this.hoveredBody === b);
      const pSize = b.size * Math.max(0.85, scale);

      // Saturn Rings
      if (b.hasRings) {
        ctx.save();
        ctx.strokeStyle = "rgba(254, 215, 170, 0.65)";
        ctx.lineWidth = 3.5 * scale;
        ctx.beginPath();
        ctx.ellipse(px, py, pSize * 2.1, pSize * 0.75, 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Planet Sphere Body
      const planetGrad = ctx.createRadialGradient(
        px - (pSize * 0.35), py - (pSize * 0.35), 0.5,
        px, py, pSize
      );
      planetGrad.addColorStop(0, "#ffffff");
      planetGrad.addColorStop(0.3, b.color);
      planetGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();

      // Earth's Moon
      if (b.id === "earth") {
        const moonAngle = this.time * 2.8;
        const moonDist = pSize * 2.2;
        const mx = px + Math.cos(moonAngle) * moonDist;
        const my = py + Math.sin(moonAngle) * (moonDist * 0.6);
        ctx.fillStyle = b.moonColor;
        ctx.beginPath();
        ctx.arc(mx, my, 2.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mission Target Beacon / Holographic Ring
      if (b.missionId) {
        const pulse = Math.sin(this.time * 4 + idx) * 3;
        const ringR = pSize + 8 + pulse;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        if (isSelected) {
          ctx.strokeStyle = "#2383e2";
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Outer secondary ring
          ctx.beginPath();
          ctx.arc(px, py, ringR + 5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(35, 131, 226, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.0;
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();

        // Mission Code Badge Pill
        const missionNum = b.missionId.replace("mission-", "M0");
        ctx.save();
        ctx.font = `700 ${Math.max(9, Math.round(10 * scale))}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const badgeText = `${missionNum}`;
        const tw = ctx.measureText(badgeText).width;
        const bx = px;
        const by = py - (pSize + 14);

        // Badge pill background
        ctx.fillStyle = isSelected ? "#2383e2" : "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx - (tw / 2) - 5, by - 7, tw + 10, 14, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.fillText(badgeText, bx, by);
        ctx.restore();
      }
    }

    // 6. Draw Hover Tooltip
    if (this.hoveredBody) {
      const hb = this.hoveredBody;
      const hx = hb.screenX;
      const hy = hb.screenY + (hb.size || 10) + 18;

      ctx.save();
      ctx.font = "600 11px 'Inter', sans-serif";
      const title = hb.name;
      const sub = `${hb.tag} // ${hb.distAU}`;
      const titleW = ctx.measureText(title).width;
      ctx.font = "400 9.5px 'Inter', sans-serif";
      const subW = ctx.measureText(sub).width;
      const boxW = Math.max(titleW, subW) + 20;
      const boxH = 38;

      // Keep inside bounds
      const clampedX = Math.max(boxW / 2 + 8, Math.min(this.width - boxW / 2 - 8, hx));
      const clampedY = Math.min(this.height - boxH - 8, hy);

      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.strokeStyle = hb.missionId ? "#2383e2" : "rgba(55, 53, 47, 0.2)";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(clampedX - boxW / 2, clampedY, boxW, boxH, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#1e293b";
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.fillText(title, clampedX, clampedY + 14);

      ctx.fillStyle = hb.missionId ? "#0b6e99" : "#64748b";
      ctx.font = "500 9.5px 'Inter', sans-serif";
      ctx.fillText(sub, clampedX, clampedY + 28);
      ctx.restore();
    }

    ctx.restore();
  }
}
