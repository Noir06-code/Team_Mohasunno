// Realistic 3D Space Shuttle Orbiter & Interplanetary Flight System
// Authentic aerodynamics, launch from Earth, planetary navigation & multiple camera POVs

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AudioSynth } from '../utils/AudioSynth.js';

export class SpaceShuttle {
  constructor(scene, camera, controls, spaceEnv) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.spaceEnv = spaceEnv;

    this.group = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.proceduralMeshGroup = new THREE.Group();
    this.group.add(this.modelGroup);
    this.group.add(this.proceduralMeshGroup);

    this.isFlying = false;
    this.isLaunching = false;
    this.launchTimer = 0;

    // Flight Dynamics & Inertia
    this.speed = 0; // km/s in simulation units
    this.throttle = 0.6; // 0.0 to 1.0
    this.maxSpeed = 140; // with warp boost
    this.bankAngle = 0; // Aerodynamic roll when yawing
    this.currentPitch = 0;
    this.isWarping = false;

    // Smoothed Angular Velocities for steady, vibration-free flight
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
    this.smoothedCamPos = null;
    this.smoothedCamLook = null;

    // Camera Mode: 'chase', 'cockpit', 'orbit'
    this.cameraMode = 'chase';
    this.baseFov = 45;
    this.targetFov = 45;

    // Particle Plumes
    this.exhaustPlumes = [];
    this.exhaustCore = null;

    // Navigation Autopilot Target
    this.navTarget = null;

    // GLTF / Draco Loaders
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.buildProceduralShuttle();
    this.loadGLBShuttle();
  }
  buildProceduralShuttle() {
    // White upper thermal insulation blankets & black tiles
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.2
    });

    const blackTileMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85
    });

    // Fuselage cylinder & nose
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.72, 3.8, 18);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.proceduralMeshGroup.add(bodyMesh);

    // Aerodynamic Nose Cone (reinforced carbon-carbon nose cap)
    const noseGeo = new THREE.ConeGeometry(0.55, 1.3, 18);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, blackTileMat);
    noseMesh.position.z = 2.5;
    this.proceduralMeshGroup.add(noseMesh);

    // Black Heat Shield Belly (underside)
    const bellyGeo = new THREE.BoxGeometry(1.2, 0.2, 3.8);
    const bellyMesh = new THREE.Mesh(bellyGeo, blackTileMat);
    bellyMesh.position.y = -0.55;
    this.proceduralMeshGroup.add(bellyMesh);

    // Cockpit Canopy & Windshield Windows
    const cockpitGeo = new THREE.BoxGeometry(0.68, 0.38, 0.9);
    const cockpitMesh = new THREE.Mesh(cockpitGeo, glassMat);
    cockpitMesh.position.set(0, 0.45, 1.55);
    cockpitMesh.rotation.x = -0.25;
    this.proceduralMeshGroup.add(cockpitMesh);

    // Double Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.2);
    wingShape.lineTo(2.4, -1.6);
    wingShape.lineTo(2.4, -1.9);
    wingShape.lineTo(-2.4, -1.9);
    wingShape.lineTo(-2.4, -1.6);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);
    const wingMesh = new THREE.Mesh(wingGeo, bodyMat);
    wingMesh.position.set(0, -0.3, 0);
    this.proceduralMeshGroup.add(wingMesh);

    // Black Wing Leading Edges
    const edgeGeo = new THREE.BoxGeometry(0.18, 0.16, 2.8);
    const leftEdge = new THREE.Mesh(edgeGeo, blackTileMat);
    leftEdge.position.set(1.4, -0.3, -0.2);
    leftEdge.rotation.y = 0.55;
    this.proceduralMeshGroup.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, blackTileMat);
    rightEdge.position.set(-1.4, -0.3, -0.2);
    rightEdge.rotation.y = -0.55;
    this.proceduralMeshGroup.add(rightEdge);

    // Vertical Stabilizer / Tail Fin
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.2, 1.6);
    finShape.lineTo(-1.1, 1.6);
    finShape.lineTo(-1.6, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.1, bevelEnabled: false });
    finGeo.rotateY(Math.PI / 2);
    const finMesh = new THREE.Mesh(finGeo, bodyMat);
    finMesh.position.set(0.05, 0.45, -1.9);
    finMesh.rotation.y = Math.PI / 2;
    this.proceduralMeshGroup.add(finMesh);

    // Dual OMS Pods (Orbital Maneuvering System on side of tail)
    const omsGeo = new THREE.CylinderGeometry(0.22, 0.28, 1.1, 12);
    omsGeo.rotateX(Math.PI / 2);
    const leftOms = new THREE.Mesh(omsGeo, bodyMat);
    leftOms.position.set(0.55, 0.42, -1.5);
    this.proceduralMeshGroup.add(leftOms);

    const rightOms = new THREE.Mesh(omsGeo, bodyMat);
    rightOms.position.set(-0.55, 0.42, -1.5);
    this.proceduralMeshGroup.add(rightOms);

    // 3 Space Shuttle Main Engine (SSME) Nozzles
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });

    const nozzleGeo = new THREE.CylinderGeometry(0.16, 0.28, 0.6, 16);
    nozzleGeo.rotateX(Math.PI / 2);

    const enginePositions = [
      [0, 0.48, -2.15],      // Top center
      [0.32, -0.15, -2.15],  // Bottom right
      [-0.32, -0.15, -2.15]  // Bottom left
    ];

    enginePositions.forEach(pos => {
      const nozzle = new THREE.Mesh(nozzleGeo, engineMat);
      nozzle.position.set(...pos);
      this.group.add(nozzle);

      // Glowing flame cones
      const flameGeo = new THREE.ConeGeometry(0.24, 1.8, 16);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos[0], pos[1], pos[2] - 0.95);
      this.group.add(flame);
      this.exhaustPlumes.push(flame);
    });

    // Scale and add to scene
    this.group.scale.set(0.85, 0.85, 0.85);
    this.group.visible = false;
    this.scene.add(this.group);
  }

  loadGLBShuttle() {
    this.gltfLoader.load(
      '/models/space_shuttle.glb',
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center mesh
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        const wrapper = new THREE.Group();
        wrapper.add(model);
        // The GLB shuttle's longitudinal axis is Y; rotate -90 on X so nose points along +Z
        wrapper.rotation.x = -Math.PI / 2;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 4.4 / maxDim;
        wrapper.scale.set(targetScale, targetScale, targetScale);

        wrapper.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.metalness = 0.3;
              child.material.roughness = 0.4;
            }
          }
        });

        this.modelGroup.add(wrapper);
        this.proceduralMeshGroup.visible = false;
        console.log("Real Space Shuttle (B) GLB model loaded and active.");
      },
      undefined,
      (err) => {
        console.warn("Using procedural shuttle fallback:", err);
        this.proceduralMeshGroup.visible = true;
      }
    );
  }

  launchFromEarth() {
    this.isFlying = true;
    this.isLaunching = true;
    this.launchTimer = 0;
    this.throttle = 1.0;
    this.speed = 14.0;
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
    this.smoothedCamPos = null;
    this.smoothedCamLook = null;

    // Anchor at Earth
    const earthPos = this.spaceEnv?.earth ? this.spaceEnv.earth.position.clone() : new THREE.Vector3(-45, 18, -80);
    this.group.position.copy(earthPos).add(new THREE.Vector3(0, 7.5, 3.2));
    this.group.rotation.set(0.35, 0.6, 0);

    this.group.visible = true;

    AudioSynth.playSuccessChord();
    AudioSynth.playTerminalAlert();

    this.cameraMode = 'chase';
    this.updateCamera(0.016);
  }

  exitFlight() {
    this.isFlying = false;
    this.isLaunching = false;
    this.isWarping = false;
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
    this.smoothedCamPos = null;
    this.smoothedCamLook = null;
    this.group.visible = false;
    if (this.controls) {
      this.controls.enabled = true;
      this.controls.target.set(0, 0, 0);
    }
    if (this.camera) {
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
    }
  }

  setThrottle(val) {
    this.throttle = Math.max(0, Math.min(1.0, val));
    AudioSynth.playClick();
  }

  toggleWarpBoost() {
    this.isWarping = !this.isWarping;
    AudioSynth.playClueChime();
  }

  cycleCamera() {
    if (this.cameraMode === 'chase') {
      this.cameraMode = 'cockpit';
    } else if (this.cameraMode === 'cockpit') {
      this.cameraMode = 'orbit';
    } else {
      this.cameraMode = 'chase';
    }
    this.smoothedCamPos = null;
    this.smoothedCamLook = null;
    AudioSynth.playClick();
  }

  setNavTarget(bodyName) {
    const target = this.spaceEnv?.celestialBodies.find(b => b.userData?.name?.toUpperCase().includes(bodyName.toUpperCase()));
    if (target) {
      this.navTarget = target;
      AudioSynth.playSuccessChord();
      return true;
    }
    return false;
  }

  update(delta, inputState) {
    if (!this.isFlying) return;

    // 1. Launch liftoff climb
    if (this.isLaunching) {
      this.launchTimer += delta;
      this.group.translateZ(this.speed * delta * 1.5);
      this.group.rotation.x = Math.max(0, this.group.rotation.x - delta * 0.1);

      if (this.launchTimer > 3.2) {
        this.isLaunching = false;
      }
    } else {
      // 2. Active Aerodynamic Steering with Damped Angular Momentum (Steady & Vibration-Free)
      const pitchInput = (inputState.up ? 1 : 0) - (inputState.down ? 1 : 0);
      const yawInput = (inputState.left ? 1 : 0) - (inputState.right ? 1 : 0);
      const rollInput = (inputState.rollLeft ? 1 : 0) - (inputState.rollRight ? 1 : 0);
      const hasManualInput = (pitchInput !== 0 || yawInput !== 0 || rollInput !== 0);

      // Desired angular targets
      const targetPitchVel = pitchInput * 0.95;
      const targetYawVel = yawInput * 0.95;
      const targetRollVel = (rollInput * 1.15) + (-yawInput * 0.35);

      // Smooth exponential damping to eliminate abrupt turns and vibrations
      const steerDamp = 1 - Math.exp(-6.5 * delta);
      this.angularVelocity.pitch = THREE.MathUtils.lerp(this.angularVelocity.pitch, targetPitchVel, steerDamp);
      this.angularVelocity.yaw = THREE.MathUtils.lerp(this.angularVelocity.yaw, targetYawVel, steerDamp);
      this.angularVelocity.roll = THREE.MathUtils.lerp(this.angularVelocity.roll, targetRollVel, steerDamp);

      this.group.rotateX(this.angularVelocity.pitch * delta);
      this.group.rotateY(this.angularVelocity.yaw * delta);
      this.group.rotateZ(this.angularVelocity.roll * delta);

      // Autopilot correction towards nav target: yields when pilot steers to avoid fighting input
      if (this.navTarget && !hasManualInput) {
        const targetWorldPos = this.navTarget.position.clone();
        const dirToTarget = targetWorldPos.sub(this.group.position).normalize();

        const qTarget = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirToTarget);
        this.group.quaternion.slerp(qTarget, delta * 0.85);
      }

      // 3. Throttle and Acceleration
      const baseSpeed = 22 * this.throttle;
      const warpMultiplier = this.isWarping ? 5.0 : 1.0;
      const targetSpeed = baseSpeed * warpMultiplier;
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, delta * 2.8);

      // Forward flight along +Z
      this.group.translateZ(this.speed * delta);
    }

    // 4. Smooth, Steady Exhaust Plume Glow (No Rapid High-Frequency Flicker)
    const plumeScale = (0.75 + this.throttle * 1.25) * (this.isWarping ? 2.2 : 1.0);
    const plumeFlicker = Math.sin(Date.now() / 400) * 0.03; // Smooth gentle breathing glow
    this.exhaustPlumes.forEach(p => {
      p.scale.set(plumeScale, plumeScale + plumeFlicker, plumeScale * 1.4);
      p.material.color.setHex(this.isWarping ? 0xa855f7 : (this.throttle > 0.8 ? 0x38bdf8 : 0xf97316));
    });

    // 5. Dynamic FOV
    if (this.camera) {
      this.targetFov = this.isWarping ? 58 : 45;
      if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 3.0);
        this.camera.updateProjectionMatrix();
      }
    }

    // 6. Smooth Camera Update
    this.updateCamera(delta);
  }

  updateCamera(delta = 0.016) {
    if (!this.camera || !this.isFlying) return;

    if (this.controls) {
      this.controls.enabled = (this.cameraMode === 'orbit');
    }

    if (this.cameraMode === 'chase') {
      if (!this.smoothedCamPos) this.smoothedCamPos = this.camera.position.clone();
      if (!this.smoothedCamLook) this.smoothedCamLook = this.group.position.clone();

      const offset = new THREE.Vector3(0, 1.7, -7.0).applyQuaternion(this.group.quaternion);
      const targetCamPos = this.group.position.clone().add(offset);
      const posDamp = 1 - Math.exp(-5.5 * delta);
      this.smoothedCamPos.lerp(targetCamPos, posDamp);
      this.camera.position.copy(this.smoothedCamPos);

      const lookAhead = new THREE.Vector3(0, 0.35, 18).applyQuaternion(this.group.quaternion);
      const targetLook = this.group.position.clone().add(lookAhead);
      const lookDamp = 1 - Math.exp(-7.5 * delta);
      this.smoothedCamLook.lerp(targetLook, lookDamp);
      this.camera.lookAt(this.smoothedCamLook);
    } else if (this.cameraMode === 'cockpit') {
      // First-person commander cockpit view through windshield
      const eyePos = new THREE.Vector3(0, 0.52, 1.5).applyQuaternion(this.group.quaternion);
      this.camera.position.copy(this.group.position.clone().add(eyePos));

      const forwardTarget = new THREE.Vector3(0, 0.35, 30).applyQuaternion(this.group.quaternion);
      this.camera.lookAt(this.group.position.clone().add(forwardTarget));
    } else if (this.cameraMode === 'orbit' && this.controls) {
      this.controls.target.copy(this.group.position);
    }
  }

  getProximityData() {
    if (!this.spaceEnv || !this.spaceEnv.celestialBodies.length) {
      return { name: "DEEP SPACE", distKm: "--" };
    }

    let closest = null;
    let minDist = Infinity;

    this.spaceEnv.celestialBodies.forEach(b => {
      const d = this.group.position.distanceTo(b.position);
      if (d < minDist) {
        minDist = d;
        closest = b;
      }
    });

    if (closest) {
      const distKm = Math.round(minDist * 1000);
      return {
        name: closest.userData?.name || "SOLAR SYSTEM BODY",
        distKm: distKm.toLocaleString(),
        isArrived: minDist < (closest.geometry?.parameters?.radius || 10) * 1.6
      };
    }

    return { name: "INTERPLANETARY CRUISE", distKm: "--" };
  }
}
