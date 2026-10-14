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
  "mission-03": {
    id: "mission-03",
    title: "MISSION 03 — THE ASTEROID FRONTIER",
    era: "Ion Propulsion Era (2007–2018)",
    destination: "Asteroid Belt (Ceres & Vesta)",
    hardware: "Dawn Ion Propulsion Spacecraft",
    model: "/models/dawn.glb",
    modelScale: 1.1,
    modelPosition: [0, 0, 0],
    modelRotation: [0.1, 0.4, 0],
    objective: "Calibrate xenon ion propulsion grids and detect subsurface hydrogen ice signatures.",
    historicalContext: "Launched in 2007, NASA's Dawn became the first spacecraft to orbit two separate extraterrestrial destinations—proto-planet Vesta and dwarf planet Ceres—relying entirely on high-efficiency xenon ion engines.",
    scientificPrinciple: "Electrostatic ion thrusters accelerate xenon atoms with electric fields to over 30 km/s, providing 10x higher propellant efficiency than chemical combustion.",
    clues: [
      {
        id: "m03-c01",
        code: "CLUE A",
        type: "Engineering",
        rarity: "normal",
        title: "Xenon Ion Acceleration Grid",
        desc: "Molybdenum electrostatic accelerator grids expel positive xenon ions at 30 km/s for continuous months of thrust.",
        unlocked: false
      },
      {
        id: "m03-c02",
        code: "CLUE B",
        type: "Environmental",
        rarity: "normal",
        title: "Ceres Bright Faculae",
        desc: "Occator Crater's luminous white spots are crystallized sodium carbonate salts deposited by ancient hydrothermal brines.",
        unlocked: false
      },
      {
        id: "m03-c03",
        code: "CLUE C",
        type: "Scientific Principle",
        rarity: "normal",
        title: "Specific Impulse Efficiency",
        desc: "Operating at a specific impulse > 3,100 seconds, Dawn achieved a record 11.5 km/s delta-v using only 425 kg of xenon gas.",
        unlocked: false
      },
      {
        id: "m03-c04",
        code: "CLUE D",
        type: "Historical Evidence",
        rarity: "hidden",
        title: "Rheasilvia Impact Basin",
        desc: "Vesta's 505 km impact basin excavated basaltic crust, proving early asteroid melting and planetesimal differentiation.",
        unlocked: false
      },
      {
        id: "m03-c05",
        code: "CLUE E",
        type: "Master Signal",
        rarity: "master",
        title: "GRaND Water-Ice Signature",
        desc: "The Gamma Ray & Neutron Detector confirmed dwarf planet Ceres possesses an ice-rich rocky mantle with 25% water by mass.",
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
  },
  "mission-05": {
    id: "mission-05",
    title: "MISSION 05 — THE EXOPLANET OBSERVATORY",
    era: "Exoplanet Era (2009–2018)",
    destination: "Earth-Trailing Orbit (Cygnus Constellation)",
    hardware: "Kepler Space Telescope & Spitzer",
    model: "/models/kepler.glb",
    modelScale: 1.15,
    modelPosition: [0, 0, 0],
    modelRotation: [0.15, 0.45, 0],
    objective: "Calibrate Kepler's photometer array to detect micro-dips in stellar flux caused by transiting alien worlds.",
    historicalContext: "Launched on March 7, 2009, Kepler observed over 530,000 stars, discovering 2,662 confirmed alien worlds via transit photometry, proving planets outnumber stars across our galaxy.",
    scientificPrinciple: "Transit photometry measures the micro-dip in stellar brightness (< 0.01%) when an exoplanet passes in front of its star, directly determining planetary radius.",
    clues: [
      {
        id: "m05-c01",
        code: "CLUE A",
        type: "Engineering",
        rarity: "normal",
        title: "Curved 95-Megapixel CCD Focal Plane",
        desc: "A curved mosaic array of 42 CCD sensors compensated for telescope optical field curvature without glass lenses.",
        unlocked: false
      },
      {
        id: "m05-c02",
        code: "CLUE B",
        type: "Scientific Principle",
        rarity: "normal",
        title: "Transit Photometry Light Curve",
        desc: "The ratio of brightness drop equals the ratio of planet area to star area: Delta F / F = (Rp / Rstar)^2.",
        unlocked: false
      },
      {
        id: "m05-c03",
        code: "CLUE C",
        type: "Engineering",
        rarity: "normal",
        title: "Reaction Wheel Pointing Stability",
        desc: "Gyroscopic reaction wheels maintained pointing precision to 0.009 arcseconds to detect parts-per-million photon variations.",
        unlocked: false
      },
      {
        id: "m05-c04",
        code: "CLUE D",
        type: "Historical Evidence",
        rarity: "hidden",
        title: "Habitable Zone Alien Worlds",
        desc: "Kepler-452b and Kepler-186f confirmed rocky terrestrial planets orbit within liquid water habitable Goldilocks zones.",
        unlocked: false
      },
      {
        id: "m05-c05",
        code: "CLUE E",
        type: "Master Signal",
        rarity: "master",
        title: "Spitzer Cryogenic Infrared",
        desc: "Liquid helium cooled detectors measured atmospheric thermal emission from exoplanet cloud decks.",
        unlocked: false
      }
    ]
  },
  "mission-06": {
    id: "mission-06",
    title: "MISSION 06 — THE ASTEROID FRONTIER",
    era: "Ion Propulsion Era (2007–2018)",
    destination: "Asteroid Belt (Ceres & Vesta)",
    hardware: "Dawn Ion Propulsion Spacecraft",
    model: "/models/dawn.glb",
    modelScale: 1.1,
    modelPosition: [0, 0, 0],
    modelRotation: [0.1, 0.4, 0],
    objective: "Calibrate xenon ion thruster grids and detect subsurface hydrogen ice signatures at Occator Crater.",
    historicalContext: "Launched in 2007, NASA's Dawn became the first spacecraft to orbit two separate extraterrestrial destinations—proto-planet Vesta and dwarf planet Ceres—relying entirely on high-efficiency xenon ion engines.",
    scientificPrinciple: "Electrostatic ion thrusters accelerate xenon atoms with electric fields to over 30 km/s, providing 10x higher propellant efficiency than chemical combustion.",
    clues: [
      { id: "m06-c01", code: "CLUE A", type: "Engineering", rarity: "normal", title: "Xenon Ion Acceleration Grid", desc: "Molybdenum electrostatic accelerator grids expel positive xenon ions at 30 km/s for continuous months of thrust.", unlocked: false },
      { id: "m06-c02", code: "CLUE B", type: "Environmental", rarity: "normal", title: "Ceres Bright Faculae", desc: "Occator Crater's luminous white spots are crystallized sodium carbonate salts deposited by ancient hydrothermal brines.", unlocked: false },
      { id: "m06-c03", code: "CLUE C", type: "Scientific Principle", rarity: "normal", title: "Specific Impulse Efficiency", desc: "Operating at a specific impulse > 3,100 seconds, Dawn achieved a record 11.5 km/s delta-v using only 425 kg of xenon gas.", unlocked: false },
      { id: "m06-c04", code: "CLUE D", type: "Historical Evidence", rarity: "hidden", title: "Rheasilvia Impact Basin", desc: "Vesta's 505 km impact basin excavated basaltic crust, proving early asteroid melting and planetesimal differentiation.", unlocked: false },
      { id: "m06-c05", code: "CLUE E", type: "Master Signal", rarity: "master", title: "GRaND Water-Ice Signature", desc: "The Gamma Ray & Neutron Detector confirmed dwarf planet Ceres possesses an ice-rich rocky mantle with 25% water by mass.", unlocked: false }
    ]
  },
  "mission-07": {
    id: "mission-07",
    title: "MISSION 07 — THE EXOPLANET HUNTER",
    era: "Deep Space Observatories (2009–2018)",
    destination: "Earth-Trailing Heliocentric Orbit",
    hardware: "Kepler Space Telescope",
    model: "/models/kepler.glb",
    modelScale: 1.15,
    modelPosition: [0, 0, 0],
    modelRotation: [0.15, 0.45, 0],
    objective: "Reconstruct Kepler photometer light curve measurements to confirm transiting terrestrial worlds.",
    historicalContext: "Operating from 2009 to 2018, Kepler proved that planets outnumber stars across our galaxy by monitoring 530,000 stars simultaneously for micro-dips in flux.",
    scientificPrinciple: "Transit depth equals the square of the ratio of planetary radius to stellar radius (ΔF/F = (Rp/R*)²).",
    clues: [
      { id: "m07-c01", code: "CLUE A", type: "Engineering", rarity: "normal", title: "42 CCD Photometer Array", desc: "Monitored 115 square degrees of the Cygnus constellation with millimagnitude accuracy.", unlocked: false },
      { id: "m07-c02", code: "CLUE B", type: "Scientific Principle", rarity: "normal", title: "Periodic Transit Signatures", desc: "Orbital period is derived via Kepler's Third Law from the precise recurrence time of transit dips.", unlocked: false },
      { id: "m07-c03", code: "CLUE C", type: "Engineering", rarity: "normal", title: "Solar Radiation Pressure Trim", desc: "During K2 extended operations, solar photon pressure balanced the telescope when reaction wheels failed.", unlocked: false },
      { id: "m07-c04", code: "CLUE D", type: "Historical Evidence", rarity: "hidden", title: "Kepler-186f Earth-Size World", desc: "First validated Earth-sized exoplanet discovered within a red dwarf star's circumstellar habitable zone.", unlocked: false },
      { id: "m07-c05", code: "CLUE E", type: "Master Signal", rarity: "master", title: "Planetary Abundance Law", desc: "Statistical confirmation that average star systems host 1.6 planets, fundamentally changing humanity's place in the universe.", unlocked: false }
    ]
  },
  "mission-08": {
    id: "mission-08",
    title: "MISSION 08 — THE LUNAR ATMOSPHERE",
    era: "Lunar Reconnaissance Era (2013–2014)",
    destination: "Moon (Far Side Orbit & Exosphere)",
    hardware: "LADEE Lunar Dust & Exosphere Explorer",
    model: "/models/ladee.glb",
    modelScale: 1.25,
    modelPosition: [0, 0, 0],
    modelRotation: [0.1, 0.5, 0],
    objective: "Analyze electrostatically levitated lunar dust grains and sample exospheric helium and argon.",
    historicalContext: "Launched on September 6, 2013, LADEE investigated the fragile lunar exosphere and confirmed that ultraviolet sunlight lofted microscopic regolith particles along the terminator line before deliberately impacting the far side in 2014.",
    scientificPrinciple: "Photoelectric charging by solar UV ejects electrons from regolith grains, building positive surface potentials that levitate dust particles into a glowing lunar horizon glow.",
    clues: [
      { id: "m08-c01", code: "CLUE A", type: "Engineering", rarity: "normal", title: "LDEX Impact Ionization Detector", desc: "Measured electric charges created when high-velocity lunar dust grains struck a target plate.", unlocked: false },
      { id: "m08-c02", code: "CLUE B", type: "Environmental", rarity: "normal", title: "Electrostatic Dust Fountains", desc: "Verified astronaut sketches from Apollo 17 showing horizon glow caused by levitated sunlit regolith dust.", unlocked: false },
      { id: "m08-c03", code: "CLUE C", type: "Scientific Principle", rarity: "normal", title: "Exospheric Gas Sputtering", desc: "Solar wind ions sputter atoms directly off lunar rocks, creating tenuous transient sodium, potassium, and helium atmospheres.", unlocked: false },
      { id: "m08-c04", code: "CLUE D", type: "Engineering", rarity: "hidden", title: "LLCD Pulsed Laser Comms", desc: "First deep-space optical laser link, transmitting data from lunar orbit to Earth at a record 622 Mbps.", unlocked: false },
      { id: "m08-c05", code: "CLUE E", type: "Master Signal", rarity: "master", title: "Far Side Controlled Impact", desc: "At mission end on April 18, 2014, LADEE impacted the far side rim of Sundman V crater at 5,800 km/h.", unlocked: false }
    ]
  },
  "mission-09": {
    id: "mission-09",
    title: "MISSION 09 — AERIAL FLIGHT ON MARS",
    era: "Planetary Aviation Era (2021–2024)",
    destination: "Mars (Jezero Crater / Neretva Vallis)",
    hardware: "Ingenuity Mars Helicopter",
    model: "/models/ingenuity.glb",
    modelScale: 1.2,
    modelPosition: [0, -0.6, 0],
    modelRotation: [0, 0.4, 0],
    objective: "Test counter-rotating carbon fiber rotor lift in 1% atmospheric pressure and scout rover pathways.",
    historicalContext: "Arriving attached to Perseverance's belly in 2021, Ingenuity achieved the Wright Brothers moment on another planet. Originally planned for 5 test flights, it completed 72 historic flights covering over 17 km until rotor tip damage in 2024.",
    scientificPrinciple: "Lift in thin 0.01-bar CO2 atmosphere requires 2,400 to 2,700 RPM rotor speed, specialized low-Reynolds airfoils, and an ultralight 1.8 kg chassis.",
    clues: [
      { id: "m09-c01", code: "CLUE A", type: "Engineering", rarity: "normal", title: "Coaxial Carbon-Fiber Blades", desc: "Dual 1.2-meter counter-rotating rotor blades spin in opposite directions to cancel torque without a tail rotor.", unlocked: false },
      { id: "m09-c02", code: "CLUE B", type: "Scientific Principle", rarity: "normal", title: "Low-Reynolds Aerodynamics", desc: "Aerodynamic lift generation at low atmospheric densities with specialized high-camber blade profiles.", unlocked: false },
      { id: "m09-c03", code: "CLUE C", type: "Engineering", rarity: "normal", title: "Autonomous Visual Odometry", desc: "Down-looking 30 Hz tracking cameras map ground terrain features in real time to calculate drift without GPS.", unlocked: false },
      { id: "m09-c04", code: "CLUE D", type: "Environmental", rarity: "hidden", title: "Jezero Delta Reconnaissance", desc: "Scouted ancient river delta deposits and boulder fields to optimize Perseverance rover sample collection routes.", unlocked: false },
      { id: "m09-c05", code: "CLUE E", type: "Master Signal", rarity: "master", title: "72 Historic Planetary Flights", desc: "Completed 72 sorties over 1,000 Martian sols, proving powered atmospheric flight is viable across alien worlds.", unlocked: false }
    ]
  },
  "mission-10": {
    id: "mission-10",
    title: "MISSION 10 — THE REUSABLE FLEET",
    era: "Space Shuttle Era (1981–2011)",
    destination: "Low Earth Orbit (LEO)",
    hardware: "Space Shuttle Orbiter",
    model: "/models/space_shuttle.glb",
    modelScale: 1.1,
    modelPosition: [0, 0, 0],
    modelRotation: [0.1, 0.4, 0],
    objective: "Inspect orbiter thermal protection tiles, pilot SSME main engine burns, and deploy orbital payloads.",
    historicalContext: "Flying 135 missions between 1981 and 2011, NASA's Space Shuttle fleet (Columbia, Challenger, Discovery, Atlantis, Endeavour) deployed the Hubble Space Telescope, assembled the International Space Station, and pioneered reusable winged spacecraft.",
    scientificPrinciple: "Orbital velocity (~28,000 km/h) creates intense hypersonic atmospheric compression during reentry, requiring reinforced carbon-carbon (RCC) leading edges and silica ceramic thermal tiles capable of withstanding 1,650°C.",
    clues: [
      { id: "m10-c01", code: "CLUE A", type: "Engineering", rarity: "normal", title: "HRSI Silica Ceramic Tiles", desc: "Over 24,000 individual high-temperature reusable tiles absorb and dissipate hypersonic reentry shock heating.", unlocked: false },
      { id: "m10-c02", code: "CLUE B", type: "Scientific Principle", rarity: "normal", title: "Orbital Mechanics & Delta-V", desc: "Reaching a 300 km orbit requires ~9.5 km/s delta-v, delivered by solid rocket boosters and three SSME liquid engines.", unlocked: false },
      { id: "m10-c03", code: "CLUE C", type: "Engineering", rarity: "normal", title: "SSME Staged Combustion Cycle", desc: "Three liquid hydrogen/liquid oxygen engines operating at 20 MPa chamber pressure with 452 seconds vacuum Isp.", unlocked: false },
      { id: "m10-c04", code: "CLUE D", type: "Historical Evidence", rarity: "hidden", title: "Hubble Repair & ISS Assembly", desc: "Extravehicular spacewalks and the 15-meter Canadarm robotic arm deployed and serviced great observatories.", unlocked: false },
      { id: "m10-c05", code: "CLUE E", type: "Master Signal", rarity: "master", title: "135 Winged Space Missions", desc: "Carried 355 astronauts and 1.6 million kg of scientific cargo into space across three decades of human spaceflight.", unlocked: false }
    ]
  }
};

// ==========================================================================
// COMPLETE HISTORICAL CATALOG FROM NASA CHRONOLOGICAL TIMELINE (PDF)
// ==========================================================================
export const NASA_TIMELINE_CATALOG = [
  {
    era: "1. The Pioneer Era (1960–1969)",
    subtitle: "Early Probes, Lunar Impactors & Apollo 11",
    items: [
      { year: "1962", name: "Mariner 2", target: "Venus / Heliocentric", type: "Unmanned Flyby", status: "First successful Venus flyby stage; now derelict in heliocentric orbit around the Sun." },
      { year: "1964–1965", name: "Ranger Program (Ranger 6, 7, 8, 9)", target: "Moon (Lunar Surface)", type: "Unmanned Impact Probes", status: "High-speed lunar impact imaging probes; crashed into the Moon after transmitting surface photos." },
      { year: "1965–1969", name: "Pioneer 6, 7, 8, and 9", target: "Heliocentric Orbit", type: "Unmanned Solar Satellites", status: "Early solar weather monitoring probes orbiting the Sun; decommissioned in heliocentric orbits." },
      { year: "1966–1968", name: "Surveyor Program (Surveyor 1, 3, 5, 6, 7)", target: "Moon (Ocean of Storms, etc.)", type: "Unmanned Soft Landers", status: "First U.S. robotic lunar soft landers. Surveyor 3 was visited by Apollo 12 astronauts in 1969." },
      { year: "1966–1967", name: "Lunar Orbiter Program (Orbiters 1–5)", target: "Moon (Lunar Surface)", type: "Unmanned Mapping Orbiters", status: "Systematically mapped candidate Apollo landing sites; intentionally crashed into Moon at mission end." },
      { year: "1967", name: "Mariner 5", target: "Venus / Heliocentric", type: "Unmanned Flyby", status: "Atmospheric probe flyby stage; now in permanent heliocentric orbit." },
      { year: "1968–1969", name: "Saturn V S-IVB Upper Stages (Apollo 8, 10, 11)", target: "Moon / Heliocentric", type: "Rocket Boosters", status: "Jettisoned rocket upper stages; placed into heliocentric orbit or commanded to impact the Moon." },
      { year: "1969", name: "Apollo 11 Lunar Module Descent Stage (Eagle)", target: "Moon (Sea of Tranquillity)", type: "Manned Soft Landing", status: "First crewed lunar soft landing site. Left behind Eagle descent stage, EASEP package, flag, and boots." }
    ]
  },
  {
    era: "2. Apollo & Deep Exploration Era (1970–1989)",
    subtitle: "Lunar Exploration, Viking & Interstellar Probes",
    items: [
      { year: "1969–1972", name: "Apollo 12, 14, 15, 16, 17 Descent Stages", target: "Moon (Multiple Surface Sites)", type: "Manned Soft Landings", status: "Descent stages left on surface: Intrepid (A12), Antares (A14), Falcon (A15), Orion (A16), Challenger (A17)." },
      { year: "1969–1972", name: "Apollo Ascent Stages (A12, A14, A15, A16, A17)", target: "Moon (Lunar Surface)", type: "Manned / Jettisoned", status: "Intentionally crashed into the lunar surface after returning astronauts to orbit to calibrate seismometers." },
      { year: "1971–1972", name: "Apollo Lunar Roving Vehicles (LRV-1, LRV-2, LRV-3)", target: "Moon (Hadley, Descartes, Taurus)", type: "Manned Electric Rovers", status: "Left parked at Apollo 15, 16, and 17 landing sites alongside Fallen Astronaut sculpture and ALSEP arrays." },
      { year: "1972", name: "Pioneer 10 Interstellar Probe", target: "Jupiter / Interstellar Space", type: "Unmanned Outer Space Probe", status: "First probe to cross asteroid belt & fly by Jupiter. Last contact 2003; heading toward Aldebaran." },
      { year: "1973", name: "Pioneer 11 Interstellar Probe", target: "Jupiter / Saturn / Deep Space", type: "Unmanned Outer Space Probe", status: "Studied Jupiter & Saturn. Last contact 1995; heading out of solar system toward Aquila constellation." },
      { year: "1976", name: "Viking 1 Lander & Viking 2 Lander", target: "Mars (Chryse & Utopia Planitia)", type: "Unmanned Soft Landers", status: "First long-term operational landers on Mars. Viking 1 operated 1976–1982; Viking 2 operated 1976–1980." },
      { year: "1978", name: "Pioneer Venus Multiprobe (Bus + 4 Probes)", target: "Venus Surface & Atmosphere", type: "Unmanned Atmospheric Probes", status: "Probes entered thick Venusian atmosphere; Day Probe survived impact and transmitted data for 67 minutes." }
    ]
  },
  {
    era: "3. Red Planet Expansion & Asteroid Era (1990–2009)",
    subtitle: "Pathfinder, MER Rovers, Comets & Telescopes",
    items: [
      { year: "1994", name: "Magellan Spacecraft", target: "Venus Atmosphere", type: "Unmanned Radar Orbiter", status: "Mapped Venusian surface via radar; intentionally plunged into atmosphere at mission end." },
      { year: "1997", name: "Mars Pathfinder Lander & Sojourner Rover", target: "Mars (Ares Vallis)", type: "Unmanned Lander & Rover", status: "NASA's first mobile Mars rover. Operated successfully until final contact in September 1997." },
      { year: "1998", name: "Deep Space 1", target: "Heliocentric Orbit", type: "Unmanned Technology Probe", status: "Ion engine technology demonstrator; decommissioned in stable heliocentric orbit in 2001." },
      { year: "1999", name: "Mars Polar Lander & Deep Space 2 Probes", target: "Mars (South Polar Region)", type: "Unmanned Landers", status: "Failed during entry, descent, and landing; crashed near the Martian south pole." },
      { year: "1999", name: "Lunar Prospector", target: "Moon (Lunar South Pole)", type: "Unmanned Orbiter", status: "Mapped lunar composition; intentionally impacted crater near south pole to search for water ice." },
      { year: "2001", name: "NEAR Shoemaker Spacecraft", target: "Asteroid 433 Eros", type: "Unmanned Asteroid Orbiter", status: "First spacecraft to orbit and soft-land on an asteroid; remains intact on the surface of Eros." },
      { year: "2003–2020", name: "Spitzer Space Telescope", target: "Earth-Trailing Heliocentric", type: "Unmanned Space Observatory", status: "Great Observatories infrared telescope; decommissioned into safe mode in trailing heliocentric orbit." },
      { year: "2004–2010", name: "Spirit Rover (MER-A)", target: "Mars (Gusev Crater)", type: "Unmanned Mobile Rover", status: "Logged 7.7 km exploring water history; became stuck in soft soil ('Troy') in 2009." },
      { year: "2004–2018", name: "Opportunity Rover (MER-B)", target: "Mars (Meridiani Planum)", type: "Unmanned Mobile Rover", status: "Traversed 45.16 km over 14+ years; proved ancient liquid water. Final contact after 2018 dust storm." },
      { year: "2005", name: "Deep Impact Smart Impactor", target: "Comet 9P/Tempel 1", type: "Unmanned Kinetic Impactor", status: "370 kg copper impactor crashed into comet nucleus to create crater and analyze subsurface ice." },
      { year: "2008", name: "Phoenix Mars Lander", target: "Mars (Vastitas Borealis)", type: "Unmanned Polar Lander", status: "Discovered water ice just beneath Martian topsoil; ended operations after winter solar loss." },
      { year: "2009", name: "LCROSS Centaur & Shepherding Spacecraft", target: "Moon (Cabeus Crater)", type: "Unmanned Impact Probes", status: "Impacted permanently shadowed crater at lunar south pole, confirming presence of water ice." },
      { year: "2009–2018", name: "Kepler Space Telescope", target: "Earth-Trailing Heliocentric", type: "Unmanned Space Observatory", status: "Discovered over 2,600 exoplanets via transit photometry; decommissioned in trailing heliocentric orbit." }
    ]
  },
  {
    era: "4. Modern Era (2010–Present)",
    subtitle: "High-Precision Planetary Exploration, Helicopters & Artemis Precursors",
    items: [
      { year: "2012", name: "GRAIL Probes (Ebb and Flow)", target: "Moon (Sally Ride Crater)", type: "Unmanned Gravity Mappers", status: "Mapped lunar gravity field; intentionally crashed into mountain ridge near Sally Ride crater." },
      { year: "2014", name: "LADEE Moon Orbiter", target: "Moon (Far Side Surface)", type: "Unmanned Atmospheric Probe", status: "Studied lunar dust & exosphere; intentionally impacted lunar far side at end of mission." },
      { year: "2018", name: "Dawn Spacecraft", target: "Dwarf Planet Ceres", type: "Unmanned Asteroid Orbiter", status: "First spacecraft to orbit two extraterrestrial bodies (Vesta & Ceres); inactive in stable Ceres orbit." },
      { year: "2018–2022", name: "InSight Lander", target: "Mars (Elysium Planitia)", type: "Unmanned Seismology Station", status: "Detected 1,300+ marsquakes and mapped internal structure; retired after solar panel dust accumulation." },
      { year: "2021", name: "Perseverance EDL Debris & Sky Crane", target: "Mars (Jezero Crater)", type: "Unmanned Entry/Descent Debris", status: "Sky Crane descent stage, heat shield, parachute, and backshell scattered in Jezero Crater during landing." },
      { year: "2021–2024", name: "Ingenuity Mars Helicopter", target: "Mars (Jezero Crater)", type: "Unmanned Aerial Technology", status: "First powered flight on another planet; completed 72 historic flights before rotor blade damage in 2024." },
      { year: "2024", name: "Intuitive Machines IM-1 ('Odysseus')", target: "Moon (Malapert A Crater)", type: "Unmanned CLPS Lander", status: "Commercial Lunar Payload Services lander carrying NASA scientific payloads to the lunar south pole." },
      { year: "2025/2026", name: "Intuitive Machines IM-2 ('Athena')", target: "Moon (Mons Mouton)", type: "Unmanned CLPS Lander", status: "Carries NASA's PRIME-1 drill and mass spectrometer to search for subsurface lunar ice." },
      { year: "Educational", name: "JPL Open Source Rover Project", target: "Earth / Open Source CAD", type: "Robotic Replica / Educational", status: "Open-source 6-wheeled rocker-bogie educational CAD model developed by JPL for community building." }
    ]
  }
];

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
