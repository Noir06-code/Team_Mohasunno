import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MemoryVault, MISSIONS_DATA } from './MemoryVault.js';
import { PuzzleManager } from './Puzzles.js';

export class ThreeGame {
  constructor(canvasContainerId, onReturnToArchive) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = document.getElementById("three-canvas");
    this.onReturnToArchive = onReturnToArchive;

    this.currentMissionId = "mission-01";
    this.vault = new MemoryVault();
    this.gltfLoader = new GLTFLoader();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.activeModel = null;
    this.hotspots = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.clock = new THREE.Clock();

    this.initThree();
    this.puzzleManager = new PuzzleManager(
      this.vault,
      (clueId) => this.onClueRecovered(clueId),
      (missionId) => this.onMissionFinished(missionId)
    );

    this.initUI();
    this.loadMission(this.currentMissionId);
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.5, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 15;
    this.controls.minDistance = 1.2;
    this.controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(5, 8, 4);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-6, -2, -4);
    this.scene.add(rimLight);

    // Deep Space Starfield
    this.createStarfield();

    // Event Listeners
    window.addEventListener("resize", () => this.onWindowResize());
    this.canvas.addEventListener("mousemove", (e) => this.onPointerMove(e));
    this.canvas.addEventListener("click", (e) => this.onPointerClick(e));
  }

  createStarfield() {
    const starCount = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      const colorVal = 0.8 + Math.random() * 0.2;
      colors[i] = colorVal;
      colors[i + 1] = colorVal * (0.9 + Math.random() * 0.1);
      colors[i + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }

  loadMission(missionId) {
    this.currentMissionId = missionId;
    const data = MISSIONS_DATA[missionId];
    if (!data) return;

    this.updateHUD(data);

    // Ensure all modals are closed when starting/loading a mission
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));

    // Clear previous model & hotspots
    if (this.activeModel) {
      this.scene.remove(this.activeModel);
      this.activeModel = null;
    }
    this.hotspots.forEach(h => this.scene.remove(h));
    this.hotspots = [];

    // Show loading indicator
    this.showMissionLoading(`RECONSTRUCTING MISSION ARCHIVE...\nLOADING HARDWARE: ${data.hardware}`);

    // Load user GLB model from public/models
    this.gltfLoader.load(
      data.model,
      (gltf) => {
        this.activeModel = gltf.scene;
        this.activeModel.scale.setScalar(data.modelScale || 1.0);
        this.activeModel.position.set(...(data.modelPosition || [0, 0, 0]));
        this.activeModel.rotation.set(...(data.modelRotation || [0, 0, 0]));

        // Enable shadow / enhance materials
        this.activeModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.activeModel);
        this.createInteractiveHotspots(data);
        this.hideMissionLoading();
      },
      undefined,
      (err) => {
        console.error("GLB Load error:", err);
        this.createFallbackModel(data);
        this.hideMissionLoading();
      }
    );
  }

  createInteractiveHotspots(data) {
    if (data.id === "mission-01") {
      // 1. High Gain Antenna (Signal puzzle)
      this.addHotspot(new THREE.Vector3(0, 0.4, 0.8), "High-Gain Parabolic Dish", "signal", "📡");
      // 2. Trajectory Slingshot Vector (Flyby puzzle)
      this.addHotspot(new THREE.Vector3(-1.4, -0.2, 0.2), "RTG & Trajectory Vector", "flyby", "🪐");
      // 3. Telemetry Flight Computer (Sequence puzzle)
      this.addHotspot(new THREE.Vector3(0.8, -0.4, -0.6), "Deep Space Flight Computer", "telemetry", "📋");
      // 4. Golden Plaque (Secret Clue)
      this.addHotspot(new THREE.Vector3(0.2, -0.5, 0.5), "Pioneer Golden Plaque", "plaque", "🔍");
    } else if (data.id === "mission-02") {
      this.addHotspot(new THREE.Vector3(0, -0.4, 0), "Descent Engine Stage", "signal", "🚀");
      this.addHotspot(new THREE.Vector3(1.0, -1.0, 0.5), "EASEP Seismic Unit", "telemetry", "📡");
    } else {
      this.addHotspot(new THREE.Vector3(0, 0, 0), "Surface Instrument Suite", "signal", "🔬");
    }
  }

  addHotspot(pos, name, puzzleType, icon) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Glowing core ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.16, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    group.add(ringMesh);

    // Center pulsating sphere
    const sphereGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphereMesh);

    group.userData = { name, puzzleType, icon, baseScale: 1.0 };
    this.scene.add(group);
    this.hotspots.push(group);
  }

  createFallbackModel(data) {
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
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
      this.hoveredObject = topGroup;
      this.canvas.style.cursor = "pointer";

      if (tooltip) {
        tooltip.innerHTML = `<span class="tip-icon">${topGroup.userData.icon}</span> [E] Inspect ${topGroup.userData.name}`;
        tooltip.style.left = `${event.clientX + 14}px`;
        tooltip.style.top = `${event.clientY - 24}px`;
        tooltip.classList.remove("hidden");
      }
    } else {
      this.hoveredObject = null;
      this.canvas.style.cursor = "default";
      if (tooltip) tooltip.classList.add("hidden");
    }
  }

  onPointerClick(event) {
    if (this.hoveredObject) {
      const { puzzleType, name } = this.hoveredObject.userData;
      if (puzzleType === "plaque") {
        this.vault.unlockClue(this.currentMissionId, "m01-c05");
        this.onClueRecovered("m01-c05");
      } else {
        this.puzzleManager.openPuzzle(this.currentMissionId, puzzleType);
      }
    }
  }

  onClueRecovered(clueId) {
    const hudVaultCount = document.getElementById("hud-clue-count");
    if (hudVaultCount) {
      hudVaultCount.textContent = `${this.vault.getUnlockedCount(this.currentMissionId)} / 5`;
    }

    // Flash toast
    const toast = document.getElementById("clue-toast");
    if (toast) {
      toast.textContent = `CLUE RECOVERED: Added to Memory Vault [${this.vault.getUnlockedCount(this.currentMissionId)}/5]`;
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 3000);
    }
  }

  onMissionFinished(missionId) {
    const data = MISSIONS_DATA[missionId];
    const debriefModal = document.getElementById("debrief-modal");
    if (!debriefModal) return;

    document.getElementById("debrief-title").textContent = `MISSION COMPLETE: ${data.title}`;
    document.getElementById("debrief-history").textContent = data.historicalContext;
    document.getElementById("debrief-science").textContent = data.scientificPrinciple;
    document.getElementById("debrief-score").textContent = `SCORE: ${this.vault.vaultState.score} PTS // RANK: FIELD SCIENTIST`;

    debriefModal.classList.remove("hidden");
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
    if (objectiveEl) objectiveEl.textContent = data.objective;
    if (clueCountEl) clueCountEl.textContent = `${this.vault.getUnlockedCount(data.id)} / 5`;
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

  initUI() {
    // Return button
    const returnBtn = document.getElementById("btn-return-archive");
    if (returnBtn) {
      returnBtn.onclick = () => {
        if (this.onReturnToArchive) this.onReturnToArchive();
      };
    }

    // Memory Vault Toggle
    const vaultBtn = document.getElementById("btn-toggle-vault");
    const vaultModal = document.getElementById("vault-modal");
    const vaultClose = document.getElementById("vault-close-btn");

    if (vaultBtn && vaultModal) {
      vaultBtn.onclick = () => {
        this.renderVaultModal();
        vaultModal.classList.remove("hidden");
      };
    }
    if (vaultClose && vaultModal) {
      vaultClose.onclick = () => vaultModal.classList.add("hidden");
    }

    // Mission Select Toggle
    const missionBtn = document.getElementById("btn-mission-select");
    const missionModal = document.getElementById("mission-select-modal");
    const missionClose = document.getElementById("mission-select-close");

    if (missionBtn && missionModal) {
      missionBtn.onclick = () => missionModal.classList.remove("hidden");
    }
    if (missionClose && missionModal) {
      missionClose.onclick = () => missionModal.classList.add("hidden");
    }

    // Mission Select Cards
    document.querySelectorAll(".mission-card-select").forEach(card => {
      card.onclick = () => {
        const mId = card.getAttribute("data-mission");
        if (mId && MISSIONS_DATA[mId]) {
          this.loadMission(mId);
          if (missionModal) missionModal.classList.add("hidden");
        }
      };
    });

    // Debrief Continue button
    const nextBtn = document.getElementById("debrief-next-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        document.getElementById("debrief-modal").classList.add("hidden");
        if (this.currentMissionId === "mission-01") {
          this.loadMission("mission-02");
        } else if (this.currentMissionId === "mission-02") {
          this.loadMission("mission-04");
        }
      };
    }
  }

  renderVaultModal() {
    const listEl = document.getElementById("vault-clues-list");
    if (!listEl) return;

    const data = MISSIONS_DATA[this.currentMissionId];
    listEl.innerHTML = `
      <div class="vault-header-info">
        <h3>${data.title}</h3>
        <p>${data.hardware} // ${data.era}</p>
      </div>
      <div class="clue-grid">
        ${data.clues.map(c => {
          const unlocked = this.vault.isClueUnlocked(data.id, c.id);
          return `
            <div class="clue-slot ${unlocked ? 'unlocked' : 'locked'} ${c.rarity}">
              <div class="clue-top">
                <span class="clue-code">${c.code} [${c.type}]</span>
                <span class="clue-status">${unlocked ? '✓ RECOVERED' : '🔒 ENCRYPTED'}</span>
              </div>
              <h4 class="clue-name">${unlocked ? c.title : '????????????'}</h4>
              <p class="clue-body">${unlocked ? c.desc : 'Investigate 3D hardware & solve scientific puzzle to reconstruct.'}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
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

    // Pulse hotspots and face camera
    this.hotspots.forEach(h => {
      h.lookAt(this.camera.position);
      const s = 1.0 + Math.sin(Date.now() / 240) * 0.12;
      h.scale.set(s, s, s);
    });

    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
