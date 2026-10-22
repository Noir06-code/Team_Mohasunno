import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MemoryVault, MISSIONS_DATA, NASA_TIMELINE_CATALOG } from './MemoryVault.js';
import { PuzzleManager } from './Puzzles.js';
import { SpaceEnvironment } from './SpaceEnvironment.js';
import { SpaceShuttle } from './SpaceShuttle.js';
import { AudioSynth } from '../utils/AudioSynth.js';
import { Typewriter } from '../utils/Typewriter.js';
import { refreshIcons } from '../utils/Icons.js';
import { MissionMischief } from './MissionMischief.js';
import { SolarSystemMap } from './SolarSystemMap.js';

export class ThreeGame {
  constructor(canvasContainerId, onReturnToArchive) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = document.getElementById("three-canvas");
    this.onReturnToArchive = onReturnToArchive;

    this.currentMissionId = "mission-01";
    this.selectedModalMissionId = "mission-01";
    this.vault = new MemoryVault();

    // Enable high-efficiency Draco mesh decompression for authentic NASA models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.spaceEnv = null;
    this.solarSystemMap = null;
    this.mischief = null;
    this.spaceShuttle = null;

    // Flight input state for Space Shuttle
    this.shuttleInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      rollLeft: false,
      rollRight: false
    };

    // Mission Timer Constraint (5 minutes per mission)
    this.missionTimerSeconds = 300;
    this.timerInterval = null;

    // Real-Time Live Clock
    this.clockInterval = null;

    // Camera Perspective & Smooth Transition
    this.activePerspective = 'target'; // 'target', 'cockpit', 'free', 'celestial'
    this.camTransition = null; // { startPos, endPos, startTarget, endTarget, progress, duration }

    this.activeModel = null;
    this.hotspots = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.clock = new THREE.Clock();

    // Lighting references
    this.sunLight = null;
    this.planetBounceLight = null;
    this.ambientLight = null;
    this.rimLight = null;

    this.initThree();
    this.mischief = new MissionMischief(this);
    this.puzzleManager = new PuzzleManager(
      this.vault,
      (clueId) => this.onClueRecovered(clueId),
      (missionId) => this.onMissionFinished(missionId)
    );

    this.initUI();
    this.loadMission(this.currentMissionId);
    this.mischief.start(this.currentMissionId);
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 1.8, 5.2);

    // Renderer with cinematic tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit Controls optimized for touchscreens and desktop
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 18;
    this.controls.minDistance = 1.0;
    this.controls.target.set(0, 0, 0);
    this.controls.enablePan = false; // Strictly rotate with 1 finger to prevent pan jitters
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 1.2;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // 1. Primary Sun Collimated Directional Light (emanates directly from the Sun's 3D position)
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    this.sunLight.position.set(110, 50, -150);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.scene.add(this.sunLight);

    // 2. Planetary Atmosphere Bounce Light (from behind and below)
    this.planetBounceLight = new THREE.DirectionalLight(0xd97736, 0.85);
    this.planetBounceLight.position.set(-20, -15, -30);
    this.scene.add(this.planetBounceLight);

    // 3. Specular Rim Backlight (highlights edges, antenna dish, and solar arrays)
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    this.rimLight.position.set(-15, 12, -15);
    this.scene.add(this.rimLight);

    // 4. Deep Space Ambient Fill
    this.ambientLight = new THREE.AmbientLight(0x0f172a, 0.55);
    this.scene.add(this.ambientLight);

    // 5. Procedural Deep Space Environment (Planets, Nebulae, Stars, Sun Flare)
    this.spaceEnv = new SpaceEnvironment(this.scene);

    // 6. Space Shuttle Flight Simulator
    this.spaceShuttle = new SpaceShuttle(this.scene, this.camera, this.controls, this.spaceEnv);

    // 7. Live Real-World Time & Mobile Orientation Handlers
    this.initRealTimeClock();
    this.initOrientationHandler();
    this.initShuttleKeyboardControls();

    // Event Listeners with Mobile Landscape Touch & Fullscreen Support
    const triggerResize = () => {
      this.onWindowResize();
      setTimeout(() => this.onWindowResize(), 120);
      setTimeout(() => this.onWindowResize(), 320);
    };

    window.addEventListener("resize", () => this.onWindowResize());
    window.addEventListener("orientationchange", triggerResize);
    document.addEventListener("fullscreenchange", triggerResize);
    document.addEventListener("webkitfullscreenchange", triggerResize);

    this.canvas.addEventListener("mousemove", (e) => this.onPointerMove(e));
    this.canvas.addEventListener("click", (e) => this.onPointerClick(e));

    // Prevent browser default scroll/navigation gesture so OrbitControls touch drag is never cancelled
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
    }, { passive: false });

    // High-responsiveness pointer tap detector for mobile touchscreens
    let pointerDownX = 0;
    let pointerDownY = 0;
    let pointerDownTime = 0;

    this.canvas.addEventListener("pointerdown", (e) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      pointerDownTime = Date.now();
    }, { passive: true });

    this.canvas.addEventListener("pointerup", (e) => {
      const dx = e.clientX - pointerDownX;
      const dy = e.clientY - pointerDownY;
      const dist = Math.hypot(dx, dy);
      const elapsed = Date.now() - pointerDownTime;
      // If moved less than 18px and released under 500ms, it's a direct tap!
      if (dist < 18 && elapsed < 500) {
        this.handlePointerTap(e.clientX, e.clientY);
      }
    });

    this.canvas.addEventListener("pointercancel", () => {
      pointerDownTime = 0;
    });
  }

  loadMission(missionId) {
    this.currentMissionId = missionId;
    const data = MISSIONS_DATA[missionId];
    if (!data) return;

    // Reset flight if active
    if (this.spaceShuttle && this.spaceShuttle.isFlying) {
      this.exitShuttle();
    }

    // Reset camera perspective to target
    this.activePerspective = 'target';
    const infoCard = document.getElementById("celestial-info-card");
    if (infoCard) infoCard.classList.add("hidden");

    // Start 5-minute mission constraint timer
    this.startMissionTimer();

    this.updateHUD(data);

    if (this.mischief) {
      this.mischief.setMission(missionId);
    }

    // Update Celestial Backdrop & Planetary Bounce Light
    if (this.spaceEnv) {
      this.spaceEnv.setMissionBackdrop(missionId);
    }
    if (this.planetBounceLight) {
      if (missionId === "mission-01") {
        this.planetBounceLight.color.setHex(0xd97736); // Jupiter Amber
        this.planetBounceLight.intensity = 0.9;
      } else if (missionId === "mission-02") {
        this.planetBounceLight.color.setHex(0x94a3b8); // Lunar Regolith Silver
        this.planetBounceLight.intensity = 0.7;
      } else if (missionId === "mission-03") {
        this.planetBounceLight.color.setHex(0x84cc16); // Asteroid Lime/Olive
        this.planetBounceLight.intensity = 0.75;
      } else if (missionId === "mission-04") {
        this.planetBounceLight.color.setHex(0xb45309); // Martian Rust
        this.planetBounceLight.intensity = 0.8;
      } else if (missionId === "mission-05") {
        this.planetBounceLight.color.setHex(0xa855f7); // Starlight Violet
        this.planetBounceLight.intensity = 0.85;
      }
    }

    // Close any open modals
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));

    // Clear previous model & hotspots
    if (this.activeModel) {
      this.scene.remove(this.activeModel);
      this.activeModel = null;
    }
    this.hotspots.forEach(h => this.scene.remove(h));
    this.hotspots = [];

    // Show loading indicator
    this.showMissionLoading(`RECONSTRUCTING MISSION ARCHIVE...\nLOADING AUTHENTIC 3D HARDWARE: ${data.hardware}`);

    // Load authentic NASA GLB model from public/models (sourced from rawsrc/)
    this.gltfLoader.load(
      data.model,
      (gltf) => {
        const rawScene = gltf.scene;

        // 1. Calculate true 3D bounding box and geometric center of the NASA GLB model
        const bbox = new THREE.Box3().setFromObject(rawScene);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());

        // 2. Center the raw model geometry at (0, 0, 0)
        rawScene.position.x = -center.x;
        rawScene.position.y = -center.y;
        rawScene.position.z = -center.z;

        // 3. Normalize model scale so its largest dimension is ~3.2 Three.js units (ideal viewing scale)
        const maxDimension = Math.max(size.x, size.y, size.z) || 1.0;
        const targetViewSize = data.targetSize || 3.2;
        const normalizedScale = targetViewSize / maxDimension;

        // Wrap in a centered pivot group for clean OrbitControls rotation
        const pivot = new THREE.Group();
        pivot.add(rawScene);
        pivot.scale.setScalar(normalizedScale);

        // Apply mission-specific tilt / rotation
        if (data.modelRotation) {
          pivot.rotation.set(...data.modelRotation);
        }

        // Enable realistic shadows and enhance PBR space materials
        pivot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.75);
              child.material.metalness = Math.max(child.material.metalness ?? 0.25, 0.4);
              child.material.envMapIntensity = 1.4;
              child.material.needsUpdate = true;
            }
          }
        });

        this.activeModel = pivot;
        this.scene.add(this.activeModel);
        this.createInteractiveHotspots(data);
        this.hideMissionLoading();
      },
      undefined,
      (err) => {
        console.warn("GLB Load notice (using fallback):", err);
        this.createFallbackModel(data);
        this.hideMissionLoading();
      }
    );
  }

  createInteractiveHotspots(data) {
    if (data.id === "mission-01") {
      // Pioneer 10 Interstellar Probe
      this.addHotspot(new THREE.Vector3(0, 0.4, 0.8), "High-Gain Parabolic Dish", "signal", "radio");
      this.addHotspot(new THREE.Vector3(-1.4, -0.2, 0.2), "RTG Nuclear Power & Trajectory", "flyby", "orbit");
      this.addHotspot(new THREE.Vector3(0.8, -0.4, -0.6), "Deep Space Flight Computer", "telemetry", "list-ordered");
      this.addHotspot(new THREE.Vector3(0.2, -0.5, 0.5), "Pioneer Golden Plaque", "plaque", "search");
    } else if (data.id === "mission-02") {
      // Apollo 11 Lunar Module Eagle
      this.addHotspot(new THREE.Vector3(0, 0.7, 0.1), "S-Band Steerable Antenna", "signal", "radio");
      this.addHotspot(new THREE.Vector3(0, -0.5, 0.7), "Descent Propulsion Engine", "flyby", "rocket");
      this.addHotspot(new THREE.Vector3(0.8, -0.3, -0.5), "Apollo Guidance Computer & EASEP", "telemetry", "cpu");
      this.addHotspot(new THREE.Vector3(0.4, -0.8, 0.5), "Lunar Commemorative Plaque", "plaque", "search");
    } else if (data.id === "mission-03") {
      // Viking 1 Lander (Mars)
      this.addHotspot(new THREE.Vector3(0, 0.5, 0.3), "GCMS Organic Soil Analyzer", "telemetry", "search");
      this.addHotspot(new THREE.Vector3(-0.8, 0.2, 0.5), "Meteorology Weather Boom", "signal", "wind");
      this.addHotspot(new THREE.Vector3(0.8, -0.4, -0.4), "Surface Sampler Trenching Arm", "flyby", "compass");
      this.addHotspot(new THREE.Vector3(0.2, -0.5, 0.6), "Viking Lander Commemorative Seal", "plaque", "award");
    } else if (data.id === "mission-04") {
      // Opportunity Rover MER-B (Mars)
      this.addHotspot(new THREE.Vector3(0, 0.6, 0.2), "Pancam Mast Stereo Imaging", "signal", "eye");
      this.addHotspot(new THREE.Vector3(-0.7, -0.3, 0.5), "Rocker-Bogie 6-Wheel Mobility", "telemetry", "compass");
      this.addHotspot(new THREE.Vector3(0.6, -0.2, -0.5), "Mossbauer Spectrometer Arm", "flyby", "search");
      this.addHotspot(new THREE.Vector3(0.1, -0.5, 0.4), "Hematite Blueberry Concretions", "plaque", "sparkles");
    } else if (data.id === "mission-05") {
      // Spitzer Space Telescope
      this.addHotspot(new THREE.Vector3(0, 0.7, 0.2), "Liquid Helium Cryogenic Dewar", "telemetry", "thermometer");
      this.addHotspot(new THREE.Vector3(-0.6, -0.2, 0.5), "Beryllium 85cm Primary Mirror", "signal", "sun");
      this.addHotspot(new THREE.Vector3(0.7, -0.3, -0.4), "Infrared Array Camera (IRAC)", "flyby", "camera");
      this.addHotspot(new THREE.Vector3(0.2, -0.6, 0.3), "Earth-Trailing Orbit Telemetry", "plaque", "search");
    } else if (data.id === "mission-06") {
      // Dawn Spacecraft (Ceres & Vesta)
      this.addHotspot(new THREE.Vector3(0, 0.35, 0.75), "Xenon Ion Propulsion Thruster", "signal", "zap");
      this.addHotspot(new THREE.Vector3(-1.3, -0.2, 0.1), "Photovoltaic Solar Array Wing", "flyby", "sun");
      this.addHotspot(new THREE.Vector3(0.7, -0.4, -0.5), "GRaND Subsurface Spectrometer", "telemetry", "radio");
      this.addHotspot(new THREE.Vector3(0.2, -0.5, 0.4), "Framing Camera & Ceres Faculae", "plaque", "search");
    } else if (data.id === "mission-07") {
      // Kepler Space Telescope
      this.addHotspot(new THREE.Vector3(0, 0.8, 0.3), "Kepler 95-Megapixel CCD Photometer", "transit", "sun");
      this.addHotspot(new THREE.Vector3(-0.8, -0.2, 0.7), "Reaction Wheel Pointing System", "telemetry", "compass");
      this.addHotspot(new THREE.Vector3(0.8, -0.4, -0.6), "Ka-Band Deep Space Downlink", "signal", "radio");
      this.addHotspot(new THREE.Vector3(0.2, 0.2, -0.8), "Habitable Zone Alien Worlds Catalog", "plaque", "globe");
    } else if (data.id === "mission-08") {
      // LADEE Lunar Dust & Exosphere Explorer
      this.addHotspot(new THREE.Vector3(0, 0.6, 0.3), "LDEX Lunar Dust Impact Detector", "signal", "sparkles");
      this.addHotspot(new THREE.Vector3(-0.7, -0.2, 0.4), "Ultraviolet Spectrometer (UVS)", "telemetry", "radio");
      this.addHotspot(new THREE.Vector3(0.6, -0.3, -0.5), "LLCD Lunar Laser Optical Link", "flyby", "zap");
      this.addHotspot(new THREE.Vector3(0.2, -0.5, 0.4), "Far Side Regolith Impact Record", "plaque", "moon");
    } else if (data.id === "mission-09") {
      // Ingenuity Mars Helicopter
      this.addHotspot(new THREE.Vector3(0, 0.8, 0.0), "Coaxial Counter-Rotating Rotors", "aerodynamics", "wind");
      this.addHotspot(new THREE.Vector3(0, 0.2, 0.3), "Solar Array & Lithium Battery", "flyby", "sun");
      this.addHotspot(new THREE.Vector3(-0.5, -0.4, 0.2), "Downward Visual Odometry Sensor", "telemetry", "camera");
      this.addHotspot(new THREE.Vector3(0.3, -0.5, -0.2), "72 Historic Flight Sorties Log", "plaque", "award");
    } else if (data.id === "mission-10") {
      // Space Shuttle Orbiter
      this.addHotspot(new THREE.Vector3(0, 0.5, -1.8), "SSME Liquid Rocket Engines", "flyby", "rocket");
      this.addHotspot(new THREE.Vector3(0, -0.6, 0.2), "Silica Ceramic Thermal Tiles", "telemetry", "shield");
      this.addHotspot(new THREE.Vector3(0, 0.6, 1.4), "Commander Cockpit HUD Avionics", "signal", "cpu");
      this.addHotspot(new THREE.Vector3(0, 0.3, -0.2), "Canadarm & Payload Bay", "plaque", "box");
    } else {
      this.addHotspot(new THREE.Vector3(0, 0, 0), "Surface Instrument Suite", "signal", "search");
    }
  }

  addHotspot(pos, name, puzzleType, iconName) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // 1. Holographic rotating outer ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    group.add(ringMesh);

    // 2. Center pulsating orb
    const sphereGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphereMesh);

    // 3. Vertical holographic beacon beam
    const beamGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -0.15;
    group.add(beamMesh);

    // 4. Generous invisible hit-proxy sphere for reliable finger taps on mobile touchscreens
    const hitProxyGeo = new THREE.SphereGeometry(0.52, 12, 12);
    const hitProxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    group.add(hitProxy);

    group.userData = {
      name,
      puzzleType,
      iconName,
      ringMesh,
      sphereMesh,
      baseScale: 1.0,
      isHovered: false
    };

    this.scene.add(group);
    this.hotspots.push(group);
  }

  createFallbackModel(data) {
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 24);
    const mat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
    this.activeModel = new THREE.Mesh(geo, mat);
    this.scene.add(this.activeModel);
    this.createInteractiveHotspots(data);
  }

  onPointerMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspots, true);

    const tooltip = document.getElementById("three-tooltip");
    if (intersects.length > 0) {
      let topGroup = intersects[0].object;
      while (topGroup.parent && !topGroup.userData.name) {
        topGroup = topGroup.parent;
      }

      if (this.hoveredObject !== topGroup) {
        AudioSynth.playHover();
        if (this.mischief && topGroup.userData && topGroup.userData.name) {
          this.mischief.onHotspotHover(topGroup.userData.name);
        }
      }

      this.hoveredObject = topGroup;
      this.hoveredObject.userData.isHovered = true;
      this.canvas.style.cursor = "pointer";

      if (tooltip) {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 900;
        const actionLabel = isTouch ? 'Tap to Inspect' : '[Click or Press E] Inspect';
        tooltip.innerHTML = `
          <div class="tip-content">
            <span class="tip-icon"><i data-lucide="${topGroup.userData.iconName}"></i></span>
            <span class="tip-text"><strong>${actionLabel}</strong> ${topGroup.userData.name}</span>
          </div>
        `;
        tooltip.style.left = `${event.clientX + 16}px`;
        tooltip.style.top = `${event.clientY - 26}px`;
        tooltip.classList.remove("hidden");
        refreshIcons(tooltip);
      }
    } else {
      if (this.hoveredObject) {
        this.hoveredObject.userData.isHovered = false;
      }
      this.hoveredObject = null;

      // Check if user is hovering over any celestial body in the Solar System
      const planetIntersects = this.spaceEnv
        ? this.raycaster.intersectObjects(this.spaceEnv.celestialBodies, true)
        : [];

      if (planetIntersects.length > 0) {
        let planetObj = planetIntersects[0].object;
        while (planetObj.parent && !planetObj.userData.name) {
          planetObj = planetObj.parent;
        }

        this.canvas.style.cursor = "pointer";
        if (tooltip && planetObj.userData && planetObj.userData.name) {
          tooltip.innerHTML = `
            <div class="tip-content planet-tip">
              <span class="tip-icon"><i data-lucide="globe"></i></span>
              <span class="tip-text">
                <strong>${planetObj.userData.name}</strong><br>
                <small>${planetObj.userData.desc}</small>
              </span>
            </div>
          `;
          tooltip.style.left = `${event.clientX + 16}px`;
          tooltip.style.top = `${event.clientY - 26}px`;
          tooltip.classList.remove("hidden");
          refreshIcons(tooltip);
        }
      } else {
        this.canvas.style.cursor = "default";
        if (tooltip) tooltip.classList.add("hidden");
      }
    }
  }

  triggerHotspotAction(topGroup) {
    if (!topGroup || !topGroup.userData) return;
    const { puzzleType, name } = topGroup.userData;
    AudioSynth.playClick();
    if (puzzleType === "plaque") {
      const currentData = MISSIONS_DATA[this.currentMissionId];
      const masterClue = currentData?.clues.find(c => c.rarity === "master") || currentData?.clues[currentData.clues.length - 1];
      if (masterClue) {
        this.vault.unlockClue(this.currentMissionId, masterClue.id);
        this.onClueRecovered(masterClue.id);
      }
      AudioSynth.playClueChime();
      this.showPlaqueInspectionModal(masterClue);
    } else {
      this.puzzleManager.openPuzzle(this.currentMissionId, puzzleType);
    }
  }

  handlePointerTap(clientX, clientY) {
    const now = Date.now();
    if (this.lastTapTimestamp && (now - this.lastTapTimestamp < 320)) {
      return;
    }
    this.lastTapTimestamp = now;

    if (this.spaceShuttle && this.spaceShuttle.isFlying) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspots, true);

    if (intersects.length > 0) {
      let topGroup = intersects[0].object;
      while (topGroup.parent && !topGroup.userData.name) {
        topGroup = topGroup.parent;
      }
      if (topGroup && topGroup.userData && topGroup.userData.name) {
        this.triggerHotspotAction(topGroup);
        return;
      }
    }

    // Inspect clicked celestial body
    const planetIntersects = this.spaceEnv
      ? this.raycaster.intersectObjects(this.spaceEnv.celestialBodies, true)
      : [];

    if (planetIntersects.length > 0) {
      let planetObj = planetIntersects[0].object;
      while (planetObj.parent && !planetObj.userData.name) {
        planetObj = planetObj.parent;
      }
      if (planetObj.userData && planetObj.userData.name) {
        const r = planetObj.geometry?.parameters?.radius || 10;
        this.focusCameraOn(
          planetObj.position,
          Math.max(18, r * 2.8),
          planetObj.userData.name,
          planetObj.userData.desc,
          planetObj.userData.iconName || "globe"
        );
      }
    }
  }

  onPointerClick(event) {
    this.handlePointerTap(event.clientX, event.clientY);
  }

  showPlaqueInspectionModal(masterClue) {
    const modal = document.getElementById("puzzle-modal");
    const title = document.getElementById("puzzle-title");
    const subtitle = document.getElementById("puzzle-subtitle");
    const body = document.getElementById("puzzle-body");

    if (modal && title && body) {
      const clueTitle = masterClue?.title || "PHYSICAL ARTIFACT";
      const clueDesc = masterClue?.desc || "Authentic physical message cast in NASA hardware.";

      title.innerHTML = `<i data-lucide="search"></i> ${clueTitle.toUpperCase()} // MASTER CLUE RECOVERED`;
      subtitle.textContent = "Physical humanity message and archival proof.";

      body.innerHTML = `
        <div class="puzzle-success-screen">
          <div class="success-icon"><i data-lucide="award"></i></div>
          <h3>PHYSICAL HUMAN ARTIFACT DETECTED</h3>
          <p id="plaque-typewriter-text" class="success-story-text"></p>
          <div class="reward-badge">
            <i data-lucide="sparkles"></i>
            <span>MASTER CLUE UNLOCKED: ${clueTitle}</span>
          </div>
          <button id="btn-close-plaque-modal" class="solve-btn ready">
            <i data-lucide="check"></i> RETURN TO EXPLORATION
          </button>
        </div>
      `;

      modal.classList.remove("hidden");
      refreshIcons(body);

      const textEl = document.getElementById("plaque-typewriter-text");
      if (textEl) {
        Typewriter.type(
          textEl,
          clueDesc,
          { speed: 18, audio: true }
        );
      }

      document.getElementById("btn-close-plaque-modal").onclick = () => {
        modal.classList.add("hidden");
      };
    }
  }

  onClueRecovered(clueId) {
    AudioSynth.playClueChime();

    const hudVaultCount = document.getElementById("hud-clue-count");
    if (hudVaultCount) {
      hudVaultCount.textContent = `${this.vault.getUnlockedCount(this.currentMissionId)}/5`;
    }

    const currentData = MISSIONS_DATA[this.currentMissionId];
    const clueObj = currentData?.clues.find(c => c.id === clueId);
    if (this.mischief && clueObj) {
      this.mischief.onClueRecovered(clueObj.title);
    }

    // Flash celebratory toast notification
    const toast = document.getElementById("clue-toast");
    if (toast) {
      toast.innerHTML = `<i data-lucide="sparkles"></i> CLUE RECOVERED: Added to Memory Vault [${this.vault.getUnlockedCount(this.currentMissionId)}/5]`;
      toast.classList.remove("hidden");
      refreshIcons(toast);
      setTimeout(() => toast.classList.add("hidden"), 3500);
    }
  }

  onMissionFinished(missionId) {
    this.stopMissionTimer();
    AudioSynth.playSuccessChord();

    const data = MISSIONS_DATA[missionId];
    const debriefModal = document.getElementById("debrief-modal");
    if (!debriefModal) return;

    document.getElementById("debrief-title").innerHTML = `<i data-lucide="award"></i> MISSION COMPLETE: ${data.title}`;
    document.getElementById("debrief-score").textContent = `RECOVERED: 5 / 5 CLUES // RANK: NASA ARCHIVE MASTER`;

    const histEl = document.getElementById("debrief-history");
    const sciEl = document.getElementById("debrief-science");

    debriefModal.classList.remove("hidden");
    refreshIcons(debriefModal);

    // Typewriter reveal of historical & scientific debrief
    if (histEl) Typewriter.type(histEl, data.historicalContext, { speed: 16, audio: false });
    if (sciEl) Typewriter.type(sciEl, data.scientificPrinciple, { speed: 16, audio: false });
  }

  updateHUD(data) {
    const titleEl = document.getElementById("hud-mission-title");
    const eraEl = document.getElementById("hud-era");
    const hardwareEl = document.getElementById("hud-hardware");
    const objectiveEl = document.getElementById("hud-objective");
    const clueCountEl = document.getElementById("hud-clue-count");

    if (titleEl) titleEl.textContent = data.title;
    if (eraEl) eraEl.textContent = data.era;
    if (hardwareEl) hardwareEl.textContent = data.hardware;
    if (clueCountEl) clueCountEl.textContent = `${this.vault.getUnlockedCount(data.id)}/5`;

    if (objectiveEl) {
      Typewriter.type(objectiveEl, data.objective, { speed: 14, audio: false });
    }
  }

  showMissionLoading(msg) {
    const loader = document.getElementById("mission-loader");
    if (loader) {
      loader.textContent = msg;
      loader.classList.remove("hidden");
    }
  }

  hideMissionLoading() {
    const loader = document.getElementById("mission-loader");
    if (loader) loader.classList.add("hidden");
  }

  // ==========================================
  // MISSION TIME CONSTRAINT
  // ==========================================
  startMissionTimer() {
    this.stopMissionTimer();
    this.missionTimerSeconds = 300; // 5:00 minutes
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.missionTimerSeconds--;
      this.updateTimerDisplay();

      if (this.missionTimerSeconds === 60) {
        AudioSynth.playTerminalAlert();
      } else if (this.missionTimerSeconds === 30 || this.missionTimerSeconds === 10) {
        AudioSynth.playClick();
      }

      if (this.missionTimerSeconds <= 0) {
        this.stopMissionTimer();
        this.onMissionTimeExpired();
      }
    }, 1000);
  }

  stopMissionTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const valEl = document.getElementById("hud-timer-value");
    const barEl = document.getElementById("hud-timer-progress");
    const badgeEl = document.getElementById("hud-mission-timer-badge");

    const m = Math.floor(Math.max(0, this.missionTimerSeconds) / 60);
    const s = Math.max(0, this.missionTimerSeconds) % 60;
    const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (valEl) valEl.textContent = str;
    if (barEl) {
      const pct = (Math.max(0, this.missionTimerSeconds) / 300) * 100;
      barEl.style.width = `${pct}%`;
    }
    if (badgeEl) {
      if (this.missionTimerSeconds <= 60) {
        badgeEl.classList.add("warning");
      } else {
        badgeEl.classList.remove("warning");
      }
    }
  }

  onMissionTimeExpired() {
    AudioSynth.playTerminalAlert();
    const modal = document.getElementById("time-expired-modal");
    if (modal) {
      modal.classList.remove("hidden");
      refreshIcons(modal);
    }
  }

  // ==========================================
  // REAL-TIME LIVE CLOCK (Bottom Left in Space)
  // ==========================================
  initRealTimeClock() {
    const updateTime = () => {
      const now = new Date();
      const clockEl = document.getElementById("actual-time-clock");
      const dateEl = document.getElementById("actual-time-date");
      const utcEl = document.getElementById("actual-time-utc");

      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (utcEl) {
        const utcHours = String(now.getUTCHours()).padStart(2, '0');
        const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
        utcEl.textContent = `${utcHours}:${utcMins} UTC`;
      }
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  // ==========================================
  // MOBILE LANDSCAPE ORIENTATION HANDLER
  // ==========================================
  initOrientationHandler() {
    const warningEl = document.getElementById("portrait-orientation-warning");
    const checkOrientation = () => {
      if (!warningEl) return;
      const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 900;
      if (isPortrait) {
        warningEl.classList.remove("hidden");
        refreshIcons(warningEl);
      } else {
        warningEl.classList.add("hidden");
      }
    };

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", () => {
      checkOrientation();
      setTimeout(checkOrientation, 150);
      setTimeout(checkOrientation, 350);
    });
    checkOrientation();

    const dismissBtn = document.getElementById("btn-dismiss-orientation-warning");
    if (dismissBtn && warningEl) {
      dismissBtn.onclick = () => warningEl.classList.add("hidden");
    }
  }

  // ==========================================
  // CAMERA VIEW & CELESTIAL FOCUS SYSTEM
  // ==========================================
  focusCameraOn(targetPos, distance = 25, label = "", desc = "", icon = "globe") {
    if (!this.camera || !this.controls) return;

    this.activePerspective = 'celestial';
    AudioSynth.playClick();

    const dir = new THREE.Vector3().subVectors(this.camera.position, targetPos).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0.4, 1).normalize();

    const destPos = targetPos.clone().add(dir.multiplyScalar(distance));

    this.camTransition = {
      startPos: this.camera.position.clone(),
      endPos: destPos,
      startTarget: this.controls.target.clone(),
      endTarget: targetPos.clone(),
      progress: 0,
      duration: 1.2
    };

    const infoCard = document.getElementById("celestial-info-card");
    const titleEl = document.getElementById("celestial-title");
    const descEl = document.getElementById("celestial-desc");
    const iconEl = document.getElementById("celestial-icon");

    if (infoCard && label) {
      if (titleEl) titleEl.textContent = label;
      if (descEl) descEl.textContent = desc;
      if (iconEl) iconEl.innerHTML = `<i data-lucide="${icon}"></i>`;
      infoCard.classList.remove("hidden");
      refreshIcons(infoCard);
    }
  }

  returnCameraToTarget() {
    this.activePerspective = 'target';
    const infoCard = document.getElementById("celestial-info-card");
    if (infoCard) infoCard.classList.add("hidden");

    const targetPos = this.activeModel ? this.activeModel.position.clone() : new THREE.Vector3(0, 0, 0);
    this.camTransition = {
      startPos: this.camera.position.clone(),
      endPos: new THREE.Vector3(0, 1.8, 5.2),
      startTarget: this.controls.target.clone(),
      endTarget: targetPos,
      progress: 0,
      duration: 1.0
    };

    AudioSynth.playClick();
  }

  setCameraPerspective(key) {
    if (key === 'target') {
      this.returnCameraToTarget();
      return;
    }

    if (key === 'cockpit') {
      this.activePerspective = 'cockpit';
      const infoCard = document.getElementById("celestial-info-card");
      if (infoCard) infoCard.classList.add("hidden");

      if (this.activeModel) {
        const pos = this.activeModel.position.clone();
        this.camTransition = {
          startPos: this.camera.position.clone(),
          endPos: pos.clone().add(new THREE.Vector3(0, 0.4, 1.4)),
          startTarget: this.controls.target.clone(),
          endTarget: pos.clone().add(new THREE.Vector3(0, 0.2, 8)),
          progress: 0,
          duration: 1.0
        };
      }
      return;
    }

    if (key === 'free') {
      this.activePerspective = 'free';
      const infoCard = document.getElementById("celestial-info-card");
      if (infoCard) infoCard.classList.add("hidden");
      return;
    }

    const bodyMap = {
      'sun': 'THE SUN',
      'mercury': 'MERCURY',
      'venus': 'VENUS',
      'earth': 'EARTH',
      'moon': 'THE MOON',
      'mars': 'MARS',
      'ceres': 'CERES',
      'jupiter': 'JUPITER',
      'saturn': 'SATURN',
      'uranus': 'URANUS',
      'neptune': 'NEPTUNE'
    };

    const targetName = bodyMap[key];
    if (targetName && this.spaceEnv) {
      const body = this.spaceEnv.celestialBodies.find(b => b.userData?.name?.includes(targetName));
      if (body) {
        const r = body.geometry?.parameters?.radius || 10;
        this.focusCameraOn(
          body.position,
          Math.max(16, r * 2.8),
          body.userData.name,
          body.userData.desc,
          body.userData.iconName || "globe"
        );
      }
    }
  }

  // ==========================================
  // SPACE SHUTTLE FLIGHT SYSTEM
  // ==========================================
  launchShuttle() {
    if (!this.spaceShuttle) return;

    this.hotspots.forEach(h => h.visible = false);
    this.spaceShuttle.launchFromEarth();

    // Hide all standard exploration HUD controls for pure cockpit flight experience
    const threeHud = document.querySelector(".three-hud");
    if (threeHud) threeHud.classList.add("hidden");

    const mischief = document.getElementById("mission-mischief-container");
    if (mischief) mischief.classList.add("hidden");

    const tooltip = document.getElementById("three-tooltip");
    if (tooltip) tooltip.classList.add("hidden");

    const infoCard = document.getElementById("celestial-info-card");
    if (infoCard) infoCard.classList.add("hidden");

    // Show sleek cockpit flight HUD
    const flightHud = document.getElementById("shuttle-flight-hud");
    if (flightHud) {
      flightHud.classList.remove("hidden");
      refreshIcons(flightHud);
    }
  }

  exitShuttle() {
    if (!this.spaceShuttle) return;

    this.spaceShuttle.exitFlight();
    this.hotspots.forEach(h => h.visible = true);

    // Re-show standard exploration HUD controls
    const threeHud = document.querySelector(".three-hud");
    if (threeHud) threeHud.classList.remove("hidden");

    const mischief = document.getElementById("mission-mischief-container");
    if (mischief) mischief.classList.remove("hidden");

    // Hide shuttle flight HUD
    const flightHud = document.getElementById("shuttle-flight-hud");
    if (flightHud) flightHud.classList.add("hidden");

    this.returnCameraToTarget();
  }

  initShuttleKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      if (!this.spaceShuttle || !this.spaceShuttle.isFlying) return;

      if (e.code === "KeyW" || e.code === "ArrowUp") this.shuttleInput.up = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") this.shuttleInput.down = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.shuttleInput.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.shuttleInput.right = true;
      if (e.code === "KeyQ") this.shuttleInput.rollLeft = true;
      if (e.code === "KeyE") this.shuttleInput.rollRight = true;

      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        this.spaceShuttle.setThrottle(this.spaceShuttle.throttle + 0.15);
      }
      if (e.code === "ControlLeft" || e.code === "ControlRight") {
        this.spaceShuttle.setThrottle(this.spaceShuttle.throttle - 0.15);
      }
      if (e.code === "Space") {
        e.preventDefault();
        this.spaceShuttle.toggleWarpBoost();
        const warpBtn = document.getElementById("btn-shuttle-warp");
        if (warpBtn) warpBtn.classList.toggle("active", this.spaceShuttle.isWarping);
      }
      if (e.code === "KeyC") {
        this.spaceShuttle.cycleCamera();
        const camLabel = document.getElementById("shuttle-cam-name");
        if (camLabel) camLabel.textContent = `${this.spaceShuttle.cameraMode.toUpperCase()} CAM`;
      }
      if (e.code === "Escape") {
        this.exitShuttle();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") this.shuttleInput.up = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") this.shuttleInput.down = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.shuttleInput.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.shuttleInput.right = false;
      if (e.code === "KeyQ") this.shuttleInput.rollLeft = false;
      if (e.code === "KeyE") this.shuttleInput.rollRight = false;
    });
  }

  initShuttleTouchControls() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const down = (e) => {
        if (e.cancelable) e.preventDefault();
        onDown();
        if (el.setPointerCapture && e.pointerId !== undefined) {
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }
      };
      const up = (e) => {
        if (e.cancelable) e.preventDefault();
        onUp();
        if (el.releasePointerCapture && e.pointerId !== undefined) {
          try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("touchstart", (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    };

    bindBtn("touch-pitch-up", () => this.shuttleInput.up = true, () => this.shuttleInput.up = false);
    bindBtn("touch-pitch-down", () => this.shuttleInput.down = true, () => this.shuttleInput.down = false);
    bindBtn("touch-yaw-left", () => this.shuttleInput.left = true, () => this.shuttleInput.left = false);
    bindBtn("touch-yaw-right", () => this.shuttleInput.right = true, () => this.shuttleInput.right = false);

    let throttleInterval = null;
    bindBtn("touch-throttle-up", () => {
      if (this.spaceShuttle) this.spaceShuttle.setThrottle(this.spaceShuttle.throttle + 0.15);
      clearInterval(throttleInterval);
      throttleInterval = setInterval(() => {
        if (this.spaceShuttle) this.spaceShuttle.setThrottle(this.spaceShuttle.throttle + 0.08);
      }, 100);
    }, () => {
      clearInterval(throttleInterval);
    });

    bindBtn("touch-throttle-down", () => {
      if (this.spaceShuttle) this.spaceShuttle.setThrottle(this.spaceShuttle.throttle - 0.15);
      clearInterval(throttleInterval);
      throttleInterval = setInterval(() => {
        if (this.spaceShuttle) this.spaceShuttle.setThrottle(this.spaceShuttle.throttle - 0.08);
      }, 100);
    }, () => {
      clearInterval(throttleInterval);
    });
  }

  initUI() {
    // Return button
    const returnBtn = document.getElementById("btn-return-archive");
    if (returnBtn) {
      returnBtn.onclick = () => {
        AudioSynth.playClick();
        if (this.mischief) this.mischief.stop();
        if (this.solarSystemMap) this.solarSystemMap.stop();
        if (this.onReturnToArchive) this.onReturnToArchive();
      };
    }

    // 3D Mission Fullscreen Toggle Button
    const threeFsBtn = document.getElementById("btn-three-fullscreen");
    if (threeFsBtn) {
      threeFsBtn.onclick = () => {
        AudioSynth.playClick();
        const target = document.documentElement;
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (!isFs) {
          if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
          else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      };
    }

    // Camera dropdown toggle
    const camBtn = document.getElementById("btn-camera-dropdown");
    const camMenu = document.getElementById("cam-view-menu");
    if (camBtn && camMenu) {
      camBtn.onclick = (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        camMenu.classList.toggle("hidden");
      };
      document.addEventListener("click", () => {
        if (!camMenu.classList.contains("hidden")) {
          camMenu.classList.add("hidden");
        }
      });
    }

    document.querySelectorAll(".cam-item").forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        AudioSynth.playClick();
        const target = item.getAttribute("data-target");
        this.setCameraPerspective(target);
        document.querySelectorAll(".cam-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        if (camMenu) camMenu.classList.add("hidden");
        const nameEl = document.getElementById("cam-active-name");
        if (nameEl) nameEl.textContent = item.textContent.trim().toUpperCase();
      };
    });

    // Celestial info card return buttons
    const closeCelestial = document.getElementById("btn-close-celestial-cam");
    const returnToProbe = document.getElementById("btn-return-to-spacecraft");
    if (closeCelestial) closeCelestial.onclick = () => this.returnCameraToTarget();
    if (returnToProbe) returnToProbe.onclick = () => this.returnCameraToTarget();

    // Ride Space Shuttle Launch button
    const rideShuttleBtn = document.getElementById("btn-ride-shuttle");
    if (rideShuttleBtn) {
      rideShuttleBtn.onclick = () => {
        AudioSynth.playClick();
        this.launchShuttle();
      };
    }

    // Exit Shuttle button
    const exitShuttleBtn = document.getElementById("btn-exit-shuttle-flight");
    if (exitShuttleBtn) {
      exitShuttleBtn.onclick = () => {
        AudioSynth.playClick();
        this.exitShuttle();
      };
    }

    // Shuttle Warp button
    const warpBtn = document.getElementById("btn-shuttle-warp");
    if (warpBtn) {
      warpBtn.onclick = () => {
        if (this.spaceShuttle) {
          this.spaceShuttle.toggleWarpBoost();
          warpBtn.classList.toggle("active", this.spaceShuttle.isWarping);
        }
      };
    }

    // Shuttle Camera button
    const shuttleCamBtn = document.getElementById("btn-shuttle-cam");
    if (shuttleCamBtn) {
      shuttleCamBtn.onclick = () => {
        if (this.spaceShuttle) {
          this.spaceShuttle.cycleCamera();
          const camLabel = document.getElementById("shuttle-cam-name");
          if (camLabel) camLabel.textContent = `${this.spaceShuttle.cameraMode.toUpperCase()} CAM`;
        }
      };
    }

    // Autopilot Nav destination buttons
    document.querySelectorAll(".shuttle-nav-btn").forEach(btn => {
      btn.onclick = () => {
        const navTarget = btn.getAttribute("data-nav");
        if (this.spaceShuttle && navTarget) {
          const locked = this.spaceShuttle.setNavTarget(navTarget);
          if (locked) {
            btn.classList.add("locked");
            setTimeout(() => btn.classList.remove("locked"), 2500);
          }
        }
      };
    });

    // Time Expired Recharge buttons
    const rechargeBtn = document.getElementById("btn-recharge-time");
    if (rechargeBtn) {
      rechargeBtn.onclick = () => {
        AudioSynth.playSuccessChord();
        this.missionTimerSeconds += 120; // +2:00 mins
        this.startMissionTimer();
        const modal = document.getElementById("time-expired-modal");
        if (modal) modal.classList.add("hidden");
      };
    }

    const expiredReturnBtn = document.getElementById("btn-return-archive-expired");
    if (expiredReturnBtn) {
      expiredReturnBtn.onclick = () => {
        AudioSynth.playClick();
        const modal = document.getElementById("time-expired-modal");
        if (modal) modal.classList.add("hidden");
        if (this.onReturnToArchive) this.onReturnToArchive();
      };
    }

    // Mobile touch controls for shuttle flight
    this.initShuttleTouchControls();

    // Native Mobile Tactical Inspect Floating Button
    const mobileInspectBtn = document.getElementById("btn-mobile-inspect");
    if (mobileInspectBtn) {
      mobileInspectBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.activeMobileTarget) {
          this.triggerHotspotAction(this.activeMobileTarget);
        } else if (this.hotspots.length > 0) {
          this.triggerHotspotAction(this.hotspots[0]);
        }
      };
    }

    // Student Field Guide Modal
    const guideBtn = document.getElementById("btn-student-guide");
    const guideModal = document.getElementById("student-guide-modal");
    const guideClose = document.getElementById("guide-close-btn");
    const guideAck = document.getElementById("btn-close-guide");

    if (guideBtn && guideModal) {
      guideBtn.onclick = () => {
        AudioSynth.playClick();
        guideModal.classList.remove("hidden");
        refreshIcons(guideModal);
      };
    }
    if (guideClose && guideModal) {
      guideClose.onclick = () => guideModal.classList.add("hidden");
    }
    if (guideAck && guideModal) {
      guideAck.onclick = () => guideModal.classList.add("hidden");
    }

    // Sound toggle
    const soundBtn = document.getElementById("btn-toggle-sound");
    if (soundBtn) {
      soundBtn.onclick = () => {
        const isMuted = AudioSynth.toggleMute();
        soundBtn.innerHTML = isMuted ? `<i data-lucide="volume-x"></i>` : `<i data-lucide="volume-2"></i>`;
        refreshIcons(soundBtn);
      };
    }

    // Memory Vault Toggle
    const vaultBtn = document.getElementById("btn-toggle-vault");
    const vaultModal = document.getElementById("vault-modal");
    const vaultClose = document.getElementById("vault-close-btn");

    if (vaultBtn && vaultModal) {
      vaultBtn.onclick = () => {
        AudioSynth.playClick();
        this.renderVaultModal();
        vaultModal.classList.remove("hidden");
        refreshIcons(vaultModal);
      };
    }
    if (vaultClose && vaultModal) {
      vaultClose.onclick = () => vaultModal.classList.add("hidden");
    }

    // Interactive Solar System Mission Select Modal
    const missionBtn = document.getElementById("btn-mission-select");
    const missionModal = document.getElementById("mission-select-modal");
    const missionClose = document.getElementById("mission-select-close");

    if (missionBtn && missionModal) {
      missionBtn.onclick = () => {
        AudioSynth.playClick();
        missionModal.classList.remove("hidden");
        refreshIcons(missionModal);

        if (!this.solarSystemMap) {
          this.solarSystemMap = new SolarSystemMap("solar-system-canvas", (mId) => {
            this.selectedModalMissionId = mId;
            this.updateMissionBriefing(mId);
          });
        }
        this.solarSystemMap.resize();
        setTimeout(() => this.solarSystemMap?.resize(), 60);
        setTimeout(() => this.solarSystemMap?.resize(), 240);

        this.selectedModalMissionId = this.currentMissionId;
        this.updateMissionBriefing(this.currentMissionId);
        this.solarSystemMap.setSelectedMission(this.currentMissionId);
      };
    }
    if (missionClose && missionModal) {
      missionClose.onclick = () => missionModal.classList.add("hidden");
    }

    // Quick navigation pills
    document.querySelectorAll(".quick-pill").forEach(pill => {
      pill.onclick = () => {
        AudioSynth.playClick();
        const mId = pill.getAttribute("data-mission");
        if (mId && MISSIONS_DATA[mId]) {
          this.selectedModalMissionId = mId;
          this.updateMissionBriefing(mId);
          if (this.solarSystemMap) this.solarSystemMap.setSelectedMission(mId);
        }
      };
    });

    // Launch Selected Mission Button
    const launchSelectedBtn = document.getElementById("btn-launch-selected-mission");
    if (launchSelectedBtn) {
      launchSelectedBtn.onclick = () => {
        AudioSynth.playClick();
        if (this.selectedModalMissionId && MISSIONS_DATA[this.selectedModalMissionId]) {
          this.loadMission(this.selectedModalMissionId);
          if (missionModal) missionModal.classList.add("hidden");
        }
      };
    }

    // Debrief Continue button
    const nextBtn = document.getElementById("debrief-next-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        AudioSynth.playClick();
        document.getElementById("debrief-modal").classList.add("hidden");
        if (this.currentMissionId === "mission-01") {
          this.loadMission("mission-02");
        } else if (this.currentMissionId === "mission-02") {
          this.loadMission("mission-03");
        } else if (this.currentMissionId === "mission-03") {
          this.loadMission("mission-04");
        } else if (this.currentMissionId === "mission-04") {
          this.loadMission("mission-05");
        } else if (this.currentMissionId === "mission-05") {
          this.loadMission("mission-06");
        } else if (this.currentMissionId === "mission-06") {
          this.loadMission("mission-07");
        } else if (this.currentMissionId === "mission-07") {
          this.loadMission("mission-08");
        } else if (this.currentMissionId === "mission-08") {
          this.loadMission("mission-09");
        } else if (this.currentMissionId === "mission-09") {
          this.loadMission("mission-10");
        } else {
          if (this.onReturnToArchive) this.onReturnToArchive();
        }
      };
    }

    // NASA Chronological Timeline Directory Modal Wiring (PDF Archive)
    const timelineBtn = document.getElementById("btn-hud-timeline");
    const timelinePill = document.getElementById("btn-open-timeline-catalog");
    const timelineModal = document.getElementById("timeline-catalog-modal");
    const timelineClose = document.getElementById("timeline-catalog-close");
    const timelineSearch = document.getElementById("timeline-search-input");

    const openTimeline = () => {
      AudioSynth.playClick();
      if (timelineModal) {
        timelineModal.classList.remove("hidden");
        this.renderTimelineCatalog();
        refreshIcons(timelineModal);
      }
    };

    if (timelineBtn) timelineBtn.onclick = openTimeline;
    if (timelinePill) timelinePill.onclick = openTimeline;
    if (timelineClose) {
      timelineClose.onclick = () => {
        AudioSynth.playClick();
        if (timelineModal) timelineModal.classList.add("hidden");
      };
    }

    document.querySelectorAll(".era-tab").forEach(tab => {
      tab.onclick = () => {
        AudioSynth.playClick();
        document.querySelectorAll(".era-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const era = tab.getAttribute("data-era");
        const query = timelineSearch ? timelineSearch.value : "";
        this.renderTimelineCatalog(era, query);
      };
    });

    if (timelineSearch) {
      timelineSearch.oninput = (e) => {
        const activeTab = document.querySelector(".era-tab.active");
        const era = activeTab ? activeTab.getAttribute("data-era") : "all";
        this.renderTimelineCatalog(era, e.target.value);
      };
    }

    refreshIcons(document.getElementById("three-container"));
  }

  renderTimelineCatalog(filterEra = 'all', searchQuery = '') {
    const listEl = document.getElementById("timeline-catalog-list");
    if (!listEl) return;

    const query = searchQuery.trim().toLowerCase();

    let erasToRender = NASA_TIMELINE_CATALOG;
    if (filterEra !== 'all') {
      const eraIdx = parseInt(filterEra, 10);
      erasToRender = [NASA_TIMELINE_CATALOG[eraIdx]].filter(Boolean);
    }

    let html = "";
    erasToRender.forEach(eraGroup => {
      const filteredItems = eraGroup.items.filter(item => {
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          item.target.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.year.toLowerCase().includes(query)
        );
      });

      if (filteredItems.length === 0) return;

      html += `
        <div class="timeline-era-block">
          <div class="timeline-era-header">
            <h3><i data-lucide="clock"></i> ${eraGroup.era}</h3>
            <span class="timeline-era-sub">${eraGroup.subtitle}</span>
          </div>
          <div class="timeline-items-grid">
            ${filteredItems.map(item => `
              <div class="timeline-item-card">
                <div class="timeline-card-top">
                  <span class="timeline-year"><i data-lucide="calendar"></i> ${item.year}</span>
                  <span class="timeline-type">${item.type}</span>
                </div>
                <h4 class="timeline-hw-name">${item.name}</h4>
                <div class="timeline-target"><i data-lucide="map-pin"></i> <strong>Target:</strong> ${item.target}</div>
                <p class="timeline-disposition"><strong>Final Disposition:</strong> ${item.status}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    if (!html) {
      html = `
        <div class="timeline-empty-state">
          <i data-lucide="search-x"></i>
          <p>No historical records match your search criteria. Try searching for "Apollo", "Moon", "Mars", "Rover", or "Venus".</p>
        </div>
      `;
    }

    listEl.innerHTML = html;
    refreshIcons(listEl);
  }

  updateMissionBriefing(missionId) {
    const data = MISSIONS_DATA[missionId];
    if (!data) return;

    const numEl = document.getElementById("briefing-num");
    const eraEl = document.getElementById("briefing-era");
    const titleEl = document.getElementById("briefing-title");
    const targetEl = document.getElementById("briefing-target");
    const hwEl = document.getElementById("briefing-hardware");
    const cluesEl = document.getElementById("briefing-clues");
    const objEl = document.getElementById("briefing-objective");

    if (numEl) numEl.textContent = missionId.replace("mission-", "MISSION ");
    if (eraEl) eraEl.textContent = data.era;
    if (titleEl) titleEl.textContent = data.title.replace(/MISSION \d+ — /, "");
    if (targetEl) targetEl.innerHTML = `<i data-lucide="map-pin"></i> Target: ${data.destination}`;
    if (hwEl) hwEl.textContent = data.hardware;
    if (cluesEl) cluesEl.textContent = `${this.vault.getUnlockedCount(missionId)} / 5 CLUES RECOVERED`;
    if (objEl) objEl.textContent = data.objective;

    document.querySelectorAll(".quick-pill").forEach(p => {
      if (p.getAttribute("data-mission") === missionId) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });

    const modal = document.getElementById("mission-select-modal");
    if (modal) refreshIcons(modal);
  }

  renderVaultModal() {
    const listEl = document.getElementById("vault-clues-list");
    if (!listEl) return;

    const data = MISSIONS_DATA[this.currentMissionId];
    listEl.innerHTML = `
      <div class="vault-header-info">
        <h3><i data-lucide="database"></i> ${data.title}</h3>
        <p>${data.hardware} // ${data.era}</p>
      </div>
      <div class="clue-grid">
        ${data.clues.map(c => {
          const unlocked = this.vault.isClueUnlocked(data.id, c.id);
          return `
            <div class="clue-slot ${unlocked ? 'unlocked' : 'locked'} ${c.rarity}">
              <div class="clue-top">
                <span class="clue-code">${c.code} [${c.type}]</span>
                <span class="clue-status">${unlocked ? '<i data-lucide="check"></i> RECOVERED' : '<i data-lucide="search"></i> ENCRYPTED'}</span>
              </div>
              <h4 class="clue-name">${unlocked ? c.title : '????????????'}</h4>
              <p class="clue-body">${unlocked ? c.desc : 'Investigate 3D hardware and solve scientific challenges to reconstruct.'}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
    refreshIcons(listEl);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    // 1. Camera Smooth Transition Lerp
    if (this.camTransition) {
      this.camTransition.progress += delta / this.camTransition.duration;
      const t = Math.min(1.0, this.camTransition.progress);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(this.camTransition.startPos, this.camTransition.endPos, ease);
      this.controls.target.lerpVectors(this.camTransition.startTarget, this.camTransition.endTarget, ease);

      if (t >= 1.0) {
        this.camTransition = null;
      }
    }

    // 2. Space Shuttle Flight Simulator Update
    if (this.spaceShuttle && this.spaceShuttle.isFlying) {
      this.spaceShuttle.update(delta, this.shuttleInput);

      // Update flight HUD elements
      const speedEl = document.getElementById("shuttle-speed-val");
      const throttleEl = document.getElementById("shuttle-throttle-val");
      const throttleFill = document.getElementById("shuttle-throttle-fill");
      const proxEl = document.getElementById("shuttle-proximity-val");

      if (speedEl) speedEl.textContent = `${this.spaceShuttle.speed.toFixed(1)} km/s`;
      if (throttleEl) throttleEl.textContent = `${Math.round(this.spaceShuttle.throttle * 100)}%`;
      if (throttleFill) throttleFill.style.width = `${Math.round(this.spaceShuttle.throttle * 100)}%`;

      if (proxEl) {
        const prox = this.spaceShuttle.getProximityData();
        proxEl.textContent = `${prox.name} (${prox.distKm} km)`;
      }
    }

    // 3. Update Celestial Space Environment (Jupiter rotation & star twinkle)
    if (this.spaceEnv) {
      this.spaceEnv.update(delta);
    }

    // 4. Pulse and spin holographic hotspot beacons (only when not piloting shuttle)
    if (!this.spaceShuttle || !this.spaceShuttle.isFlying) {
      this.hotspots.forEach(h => {
        h.lookAt(this.camera.position);

        const isHov = h.userData.isHovered;
        const targetScale = isHov ? 1.35 : (1.0 + Math.sin(Date.now() / 250) * 0.12);
        h.scale.set(targetScale, targetScale, targetScale);

        // Color shift on hover
        if (h.userData.ringMesh) {
          h.userData.ringMesh.rotation.z += isHov ? 0.04 : 0.015;
          h.userData.ringMesh.material.color.setHex(isHov ? 0xf59e0b : 0x38bdf8);
        }
      });

      // Update Native Mobile Inspect Floating Button
      const mobileInspectBtn = document.getElementById("btn-mobile-inspect");
      const mobileActionName = document.getElementById("mobile-action-name");
      if (mobileInspectBtn && this.hotspots.length > 0) {
        let targetHotspot = this.hoveredObject;
        if (!targetHotspot) {
          let closestDist = Infinity;
          const tempVec = new THREE.Vector3();
          for (const h of this.hotspots) {
            h.getWorldPosition(tempVec);
            tempVec.project(this.camera);
            if (tempVec.z < 1.0) {
              const dist = Math.hypot(tempVec.x, tempVec.y);
              if (dist < 0.65 && dist < closestDist) {
                closestDist = dist;
                targetHotspot = h;
              }
            }
          }
        }

        if (targetHotspot && targetHotspot.userData && targetHotspot.userData.name) {
          if (mobileActionName && mobileActionName.textContent !== targetHotspot.userData.name.toUpperCase()) {
            mobileActionName.textContent = targetHotspot.userData.name.toUpperCase();
          }
          mobileInspectBtn.classList.remove("hidden");
          this.activeMobileTarget = targetHotspot;
        } else {
          mobileInspectBtn.classList.add("hidden");
          this.activeMobileTarget = null;
        }
      } else if (mobileInspectBtn) {
        mobileInspectBtn.classList.add("hidden");
      }
    } else {
      const mobileInspectBtn = document.getElementById("btn-mobile-inspect");
      if (mobileInspectBtn) mobileInspectBtn.classList.add("hidden");
    }

    if (this.controls && (!this.spaceShuttle || !this.spaceShuttle.isFlying || this.spaceShuttle.cameraMode === 'orbit')) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
