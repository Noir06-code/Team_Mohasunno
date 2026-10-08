// Memory Vault Clue Manager (Section 8 & 9 of Game Design)

const VAULT_STORAGE_KEY = "last_human_mission_vault";

export const MISSIONS_DATA = {
  "mission-01": {
    id: "mission-01",
    title: "MISSION 01 — FIRST SIGNAL",
    era: "Pioneer Era (1970–1989)",
    destination: "Deep Space / Heliocentric",
    hardware: "Pioneer 10 Interstellar Probe",
    model: "/models/pioneer10.glb",
    modelScale: 1.2,
    modelPosition: [0, 0, 0],
    modelRotation: [0.2, 0.4, 0],
    objective: "Reconstruct the lost Pioneer telemetry stream and inspect deep-space hardware.",
    historicalContext: "Launched on March 2, 1972, Pioneer 10 was the first human artifact to transit the Asteroid Belt and encounter Jupiter. Contact was maintained for over 30 years until 2003 as it traversed deep space on an interstellar escape trajectory.",
    scientificPrinciple: "Deep-space communication relies on precise radio frequency matching, parabolic dish alignment, and Doppler velocity calculation.",
    clues: [
      {
        id: "m01-c01",
        code: "CLUE A",
        type: "Environmental",
        rarity: "normal",
        title: "Parabolic Alignment",
        desc: "Pioneer 10's 2.74-meter high-gain antenna must maintain continuous directional lock with Earth's Deep Space Network.",
        unlocked: false
      },
      {
        id: "m01-c02",
        code: "CLUE B",
        type: "Scientific Principle",
        rarity: "normal",
        title: "Doppler Velocity Shift",
        desc: "Frequency deviation between transmitted and received signals directly reveals spacecraft acceleration relative to Earth.",
        unlocked: false
      },
      {
        id: "m01-c03",
        code: "CLUE C",
        type: "Engineering",
        rarity: "normal",
        title: "SNAP-19 RTG Power",
        desc: "Four radioisotope thermoelectric generators provide continuous nuclear decay power millions of kilometers beyond solar reach.",
        unlocked: false
      },
      {
        id: "m01-c04",
        code: "CLUE D",
        type: "Historical Evidence",
        rarity: "hidden",
        title: "Jovian Slingshot",
        desc: "Jupiter's intense gravitational gradient accelerated Pioneer 10 onto a solar escape trajectory toward Aldebaran.",
        unlocked: false
      },
      {
        id: "m01-c05",
        code: "CLUE E",
        type: "Master Signal",
        rarity: "master",
        title: "The Golden Plaque Map",
        desc: "The etched plaque uses 14 galactic pulsars with binary timing frequencies to permanently encode humanity's spacetime coordinate.",
        unlocked: false
      }
    ]
  },
  "mission-02": {
    id: "mission-02",
    title: "MISSION 02 — THE LUNAR ARCHIVE",
    era: "Apollo & Early Lunar Era (1969–1972)",
    destination: "The Moon (Sea of Tranquility)",
    hardware: "Apollo Lunar Module (Eagle) & LADEE",
    model: "/models/apollo_lunar_module.glb",
    modelScale: 0.9,
    modelPosition: [0, -1.2, 0],
    modelRotation: [0, 0.5, 0],
    objective: "Examine parked surface hardware at Tranquility Base and calibrate lunar seismic instruments.",
    historicalContext: "On July 20, 1969, Apollo 11's Lunar Module Eagle descent stage touched down. Hardware intentionally left on the lunar surface includes the descent engine, laser retroreflector, and early seismometer packages.",
    scientificPrinciple: "Passive seismology uses natural and controlled impact waves to determine planetary mantle and crust thickness.",
    clues: [
      {
        id: "m02-c01",
        code: "CLUE A",
        type: "Environmental",
        rarity: "normal",
        title: "Descent Stage Anchor",
        desc: "The descent stage served as a stationary launch platform, remaining permanently anchored at Tranquility Base.",
        unlocked: false
      },
      {
        id: "m02-c02",
        code: "CLUE B",
        type: "Scientific Principle",
        rarity: "normal",
        title: "Laser Range Timing",
        desc: "Corner-cube retroreflectors reflect Earth lasers with millimetric precision, proving the Moon is receding at 3.8 cm per year.",
        unlocked: false
      },
      {
        id: "m02-c03",
        code: "CLUE C",
        type: "Engineering",
        rarity: "normal",
        title: "Throttleable Descent Engine",
        desc: "Variable-thrust rocket engines allowed human pilots to hover, maneuver, and land gently in a 1/6th gravity environment.",
        unlocked: false
      },
      {
        id: "m02-c04",
        code: "CLUE D",
        type: "Historical Evidence",
        rarity: "hidden",
        title: "EASEP Seismic Records",
        desc: "The early Apollo seismic package detected micrometeorite impacts and thermal expansion tremors.",
        unlocked: false
      },
      {
        id: "m02-c05",
        code: "CLUE E",
        type: "Master Signal",
        rarity: "master",
        title: "Lunar Regolith Horizon",
        desc: "LADEE verified that solar ultraviolet radiation lofted electrostatically charged dust grains above the lunar terminator.",
        unlocked: false
      }
    ]
  },
  "mission-04": {
    id: "mission-04",
    title: "MISSION 04 — THE RED PLANET",
    era: "Red Planet Expansion (1976–2021)",
    destination: "Mars (Meridiani Planum / Jezero)",
    hardware: "Opportunity Rover, Viking Lander & Ingenuity",
    model: "/models/viking_lander.glb",
    modelScale: 1.1,
    modelPosition: [0, -1.0, 0],
    modelRotation: [0, 0.3, 0],
    objective: "Analyze Martian soil composition, safe rover navigation paths, and aerial aerodynamics.",
    historicalContext: "From Viking's biological experiments in 1976 to Opportunity's 45 km marathon and Ingenuity's powered aerial flights, Mars exploration transformed from isolated landings into an active chain of scientific evidence.",
    scientificPrinciple: "Thin-atmosphere aerodynamics requires ultra-high rotor RPM (~2400 RPM) to produce lift in 1% Earth air density.",
    clues: [
      {
        id: "m04-c01",
        code: "CLUE A",
        type: "Environmental",
        rarity: "normal",
        title: "Hematite Blueberries",
        desc: "Opportunity discovered spherical hematite concretions formed solely inside ancient liquid groundwater.",
        unlocked: false
      },
      {
        id: "m04-c02",
        code: "CLUE B",
        type: "Scientific Principle",
        rarity: "normal",
        title: "Rotor Lift in 1% Air",
        desc: "Ingenuity's carbon-fiber counter-rotating blades overcome the extreme thinness of the Martian atmosphere.",
        unlocked: false
      },
      {
        id: "m04-c03",
        code: "CLUE C",
        type: "Engineering",
        rarity: "normal",
        title: "Rocker-Bogie Mobility",
        desc: "The rocker-bogie suspension keeps all 6 wheels on uneven rocky terrain without springs, preventing chassis roll.",
        unlocked: false
      },
      {
        id: "m04-c04",
        code: "CLUE D",
        type: "Historical Evidence",
        rarity: "hidden",
        title: "Viking Weather Station",
        desc: "Continuous meteorological monitoring confirmed seasonal carbon dioxide freezing and atmospheric pressure cycling.",
        unlocked: false
      },
      {
        id: "m04-c05",
        code: "CLUE E",
        type: "Master Signal",
        rarity: "master",
        title: "Chain of Water Evidence",
        desc: "Geological layering in sedimentary rock proves Mars was once warm, wet, and habitable for sustained geological eras.",
        unlocked: false
      }
    ]
  }
};

export class MemoryVault {
  constructor() {
    this.vaultState = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load vault state:", e);
    }
    return {
      unlockedClues: {},
      completedMissions: [],
      score: 0
    };
  }

  saveState() {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.vaultState));
    } catch (e) {
      console.warn("Could not save vault state:", e);
    }
  }

  unlockClue(missionId, clueId) {
    if (!this.vaultState.unlockedClues[missionId]) {
      this.vaultState.unlockedClues[missionId] = [];
    }
    if (!this.vaultState.unlockedClues[missionId].includes(clueId)) {
      this.vaultState.unlockedClues[missionId].push(clueId);
      this.vaultState.score += 100;
      this.saveState();
      return true;
    }
    return false;
  }

  isClueUnlocked(missionId, clueId) {
    const list = this.vaultState.unlockedClues[missionId] || [];
    return list.includes(clueId);
  }

  getUnlockedCount(missionId) {
    return (this.vaultState.unlockedClues[missionId] || []).length;
  }

  getTotalUnlocked() {
    let count = 0;
    for (const m in this.vaultState.unlockedClues) {
      count += this.vaultState.unlockedClues[m].length;
    }
    return count;
  }
}
