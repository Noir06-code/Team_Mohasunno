// Mission Mischief: Interactive In-Mission Bottom-Right Companion
// Displays animated speech bubbles with real telemetry, scientific tips, radiation errors, and EVA alerts.

import { AudioSynth } from '../utils/AudioSynth.js';
import { refreshIcons } from '../utils/Icons.js';

export class MissionMischief {
  constructor(threeGame) {
    this.threeGame = threeGame;
    this.container = document.getElementById("mission-mischief");
    this.bubble = document.getElementById("mischief-bubble");
    this.typeTag = document.getElementById("mischief-type-tag");
    this.textEl = document.getElementById("mischief-message-text");
    this.avatarBtn = document.getElementById("mischief-avatar-btn");

    this.currentMissionId = "mission-01";
    this.activeTimer = null;
    this.dismissTimer = null;
    this.isBubbleVisible = false;
    this.messageIndex = 0;
    this.isMutedOrPaused = false;

    // Curated mission broadcast pool
    this.missionDialogues = {
      "mission-01": [
        {
          type: "telemetry",
          icon: "radio",
          tag: "TELEMETRY",
          text: "Carrier wave locked at 2.29 GHz S-Band. Pioneer 10 velocity: 51,682 km/h escaping the Solar System!"
        },
        {
          type: "tip",
          icon: "sparkles",
          tag: "RECON TIP",
          text: "Rotate the spacecraft in 3D to locate the 4 pulsating cyan beacons. Click the antenna dish to align the radio wave!"
        },
        {
          type: "error",
          icon: "alert-triangle",
          tag: "RADIATION WARNING",
          text: "WARNING: Jupiter's intense radiation belt flux spike detected (4.8 Mrad)! High-gain telemetry buffer scrambled!"
        },
        {
          type: "fact",
          icon: "info",
          tag: "NASA ARCHIVE",
          text: "Pioneer 10 was the first human artifact to transit the Asteroid Belt and transmit close-up images of Jupiter."
        },
        {
          type: "tip",
          icon: "search",
          tag: "VAULT CLUE",
          text: "Inspect the gold-anodized plaque mounted on the antenna strut. It permanently encodes 14 galactic pulsars!"
        },
        {
          type: "error",
          icon: "zap",
          tag: "EVA INTERFERENCE",
          text: "ALERT: EVA network sweep probe detected. Physical radio wave alignment successfully bypasses EVA encryption!"
        },
        {
          type: "telemetry",
          icon: "database",
          tag: "RTG STATUS",
          text: "SNAP-19 RTG nuclear decay thermal output: 157 Watts. Still powering core instruments after 40+ years in deep space!"
        }
      ],
      "mission-02": [
        {
          type: "telemetry",
          icon: "radio",
          tag: "TELEMETRY",
          text: "Tranquility Base coordinates: 0.67408° N, 23.47297° E. Lunar surface gravity: 1.62 m/s² (1/6th of Earth)."
        },
        {
          type: "tip",
          icon: "sparkles",
          tag: "RECON TIP",
          text: "Inspect the golden descent stage below. It served as a permanent launch pad while the ascent stage departed!"
        },
        {
          type: "error",
          icon: "alert-triangle",
          tag: "THERMAL WARNING",
          text: "WARNING: Extreme lunar day/night thermal swing detected (-130°C to +120°C). Regolith shielding active."
        },
        {
          type: "fact",
          icon: "info",
          tag: "NASA ARCHIVE",
          text: "Laser retroreflectors left by Apollo 11 still reflect Earth observatory lasers today, proving the Moon drifts 3.8 cm/year!"
        },
        {
          type: "error",
          icon: "zap",
          tag: "EVA INTERFERENCE",
          text: "EVA ANOMALY: Lunar communication link encrypted by EVA. Physical seismometer records recovered via manual audit!"
        },
        {
          type: "telemetry",
          icon: "database",
          tag: "LADEE SENSORS",
          text: "LADEE ultraviolet spectrometer confirms electrostatically charged dust grains lofted above the lunar sunrise terminator."
        }
      ],
      "mission-03": [
        {
          type: "telemetry",
          icon: "radio",
          tag: "TELEMETRY",
          text: "Xenon ion thruster grid active: specific impulse 3,120 seconds. Accelerating xenon ions at 30 km/s!"
        },
        {
          type: "tip",
          icon: "sparkles",
          tag: "RECON TIP",
          text: "Dawn is the only spacecraft in human history to orbit two distinct extraterrestrial worlds: Vesta and Ceres!"
        },
        {
          type: "error",
          icon: "alert-triangle",
          tag: "MICROMETEORITE ALERT",
          text: "WARNING: High dust particle count in the Asteroid Belt. Ion engine auxiliary propellant valve re-calibrated."
        },
        {
          type: "fact",
          icon: "info",
          tag: "NASA ARCHIVE",
          text: "Occator Crater's glowing bright spots on dwarf planet Ceres are sodium carbonate salt deposits from ancient subsurface brine!"
        },
        {
          type: "error",
          icon: "zap",
          tag: "EVA INTERFERENCE",
          text: "EVA ALERT: Orbital simulation corrupted by EVA. Human ion physics equations bypass artificial network lockdown."
        },
        {
          type: "telemetry",
          icon: "database",
          tag: "GRAND SENSORS",
          text: "GRaND neutron spectrometer confirms dwarf planet Ceres contains a rocky mantle rich in water-ice (25% by mass)!"
        }
      ],
      "mission-04": [
        {
          type: "telemetry",
          icon: "radio",
          tag: "TELEMETRY",
          text: "Martian atmospheric density: 0.020 kg/m³ (~1% of Earth). Surface pressure: 6.1 mbar at Jezero Crater."
        },
        {
          type: "tip",
          icon: "sparkles",
          tag: "RECON TIP",
          text: "Ingenuity's dual carbon-fiber rotors must spin at 2,400 RPM to generate lift in the ultra-thin Martian atmosphere!"
        },
        {
          type: "error",
          icon: "alert-triangle",
          tag: "DUST STORM WARNING",
          text: "WARNING: Airborne regolith dust reducing solar array output by 14%. Rocker-bogie wheel motors nominal."
        },
        {
          type: "fact",
          icon: "info",
          tag: "NASA ARCHIVE",
          text: "Opportunity discovered hematite 'blueberries' inside sedimentary rocks, providing decisive evidence of ancient standing water!"
        },
        {
          type: "error",
          icon: "zap",
          tag: "EVA INTERFERENCE",
          text: "EVA LOCKDOWN DETECTED: Martian relay satellites muted. Direct physical ground rover telemetry engaged!"
        },
        {
          type: "telemetry",
          icon: "database",
          tag: "MOBILITY TELEMETRY",
          text: "Rocker-bogie chassis pitch angle: 12.4°. All 6 wheels maintaining traction across Martian basaltic sand dunes."
        }
      ]
    };

    this.initEvents();
  }

  initEvents() {
    if (this.avatarBtn) {
      this.avatarBtn.addEventListener("click", () => {
        AudioSynth.playClick();
        this.triggerImmediateTip();
      });
    }

    if (this.bubble) {
      this.bubble.addEventListener("click", () => {
        AudioSynth.playClick();
        this.triggerImmediateTip();
      });
    }
  }

  start(missionId) {
    if (missionId) this.currentMissionId = missionId;
    this.isMutedOrPaused = false;
    this.messageIndex = 0;

    this.stopTimers();

    // Show initial welcome tip after 2.5s
    this.activeTimer = setTimeout(() => {
      this.showNextMessage();
    }, 2500);
  }

  stop() {
    this.isMutedOrPaused = true;
    this.stopTimers();
    this.hideBubble();
  }

  stopTimers() {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  setMission(missionId) {
    this.currentMissionId = missionId;
    this.messageIndex = 0;
    this.stopTimers();
    this.activeTimer = setTimeout(() => {
      this.showNextMessage();
    }, 1800);
  }

  showNextMessage() {
    if (this.isMutedOrPaused) return;

    const list = this.missionDialogues[this.currentMissionId] || this.missionDialogues["mission-01"];
    const item = list[this.messageIndex % list.length];
    this.messageIndex++;

    this.displayBubble(item);

    // Schedule bubble disappearance after 8.5 seconds
    this.dismissTimer = setTimeout(() => {
      this.hideBubble();

      // Schedule next message after 5.5 seconds of quiet
      this.activeTimer = setTimeout(() => {
        this.showNextMessage();
      }, 5500);
    }, 8500);
  }

  displayBubble(item) {
    if (!this.bubble || !this.textEl || !this.typeTag) return;

    // Play appropriate audio chime
    if (item.type === "error") {
      AudioSynth.playGlitchChirp();
    } else {
      AudioSynth.playCompanionChirp();
    }

    // Set badge icon and label
    this.typeTag.innerHTML = `<i data-lucide="${item.icon}"></i> ${item.tag}`;
    this.typeTag.className = `mischief-tag tag-${item.type}`;
    this.textEl.innerHTML = item.text;

    refreshIcons(this.bubble);

    // Show bubble with smooth animation
    this.bubble.classList.remove("hidden");
    this.bubble.classList.remove("bubble-fade-out");
    this.bubble.classList.add("bubble-pop-in");
    this.isBubbleVisible = true;
  }

  hideBubble() {
    if (!this.bubble || !this.isBubbleVisible) return;

    this.bubble.classList.remove("bubble-pop-in");
    this.bubble.classList.add("bubble-fade-out");

    setTimeout(() => {
      if (this.bubble.classList.contains("bubble-fade-out")) {
        this.bubble.classList.add("hidden");
        this.bubble.classList.remove("bubble-fade-out");
      }
      this.isBubbleVisible = false;
    }, 350);
  }

  triggerImmediateTip() {
    this.stopTimers();

    const list = this.missionDialogues[this.currentMissionId] || this.missionDialogues["mission-01"];
    const item = list[Math.floor(Math.random() * list.length)];

    this.displayBubble(item);

    this.dismissTimer = setTimeout(() => {
      this.hideBubble();
      this.activeTimer = setTimeout(() => {
        this.showNextMessage();
      }, 6000);
    }, 9000);
  }

  onHotspotHover(hotspotName) {
    if (this.isMutedOrPaused) return;

    // Only interrupt if bubble is currently hidden
    if (!this.isBubbleVisible) {
      this.stopTimers();
      this.displayBubble({
        type: "tip",
        icon: "radar",
        tag: "TARGET LOCK",
        text: `Beacon detected: <strong>${hotspotName}</strong>. Click the pulsating holographic ring to calibrate and reconstruct!`
      });

      this.dismissTimer = setTimeout(() => {
        this.hideBubble();
        this.activeTimer = setTimeout(() => {
          this.showNextMessage();
        }, 6000);
      }, 8000);
    }
  }

  onClueRecovered(clueTitle) {
    this.stopTimers();
    this.displayBubble({
      type: "fact",
      icon: "award",
      tag: "EVIDENCE SECURED",
      text: `Outstanding work! <strong>${clueTitle}</strong> recovered into the Memory Vault. EVA cannot erase what is anchored in physical science!`
    });

    this.dismissTimer = setTimeout(() => {
      this.hideBubble();
      this.activeTimer = setTimeout(() => {
        this.showNextMessage();
      }, 7000);
    }, 9000);
  }
}
