// Space Environment & Realistic Solar System Engine
// Uses authentic high-resolution NASA planetary texture maps downloaded from GitHub
// Features Sun, Earth, Moon, Mars, Venus, Jupiter, Saturn, atmospheric scattering, and starfields

import * as THREE from 'three';

export class SpaceEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();

    // Planet mesh references
    this.sun = null;
    this.sunCorona = null;
    this.mercury = null;
    this.venus = null;
    this.earth = null;
    this.earthClouds = null;
    this.moon = null;
    this.mars = null;
    this.ceres = null;
    this.asteroidBelt = null;
    this.jupiter = null;
    this.saturn = null;
    this.saturnRings = null;
    this.uranus = null;
    this.uranusRings = null;
    this.neptune = null;

    // Realistic Orbital Space Debris & Galilean Moons
    this.spaceDebrisGroup = null;
    this.debrisObjects = [];
    this.galileanMoons = [];

    // Interactive planet list for raycaster inspection
    this.celestialBodies = [];

    // Background elements
    this.stars = null;
    this.twinklePoints = null;
    this.nebulaGroup = null;

    this.init();
  }

  init() {
    this.createMultiTierStarfield();
    this.createCosmicNebulae();
    this.createRealSolarSystem();
    this.createOrbitalSpaceDebris();
    this.createGalileanMoons();
  }

  createMultiTierStarfield() {
    // 5,000 background stars with realistic astronomical spectral distribution
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    // Stellar spectral classes: Blue-white (O/B), White (A), Yellow-white (F/G), Orange (K), Red (M)
    const spectralColors = [
      new THREE.Color(0xa5b4fc), // Blue-white (Hot young star)
      new THREE.Color(0xc7d2fe), // Pure white
      new THREE.Color(0xffffff), // Bright white
      new THREE.Color(0xfef08a), // Solar yellow (G-type like Sun)
      new THREE.Color(0xfed7aa), // Soft amber
      new THREE.Color(0xfca5a5)  // Red giant (M-type)
    ];

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 220 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i] = color.r * brightness;
      colors[i + 1] = color.g * brightness;
      colors[i + 2] = color.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Crisp circular star particle canvas
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const starTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      map: starTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);

    // Twinkling navigation stars
    const twinkleCount = 200;
    const twinkleGeo = new THREE.BufferGeometry();
    const twinklePos = new Float32Array(twinkleCount * 3);
    for (let i = 0; i < twinkleCount * 3; i += 3) {
      const r = 110 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      twinklePos[i] = r * Math.sin(phi) * Math.cos(theta);
      twinklePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      twinklePos[i + 2] = r * Math.cos(phi);
    }
    twinkleGeo.setAttribute('position', new THREE.BufferAttribute(twinklePos, 3));
    const twinkleMat = new THREE.PointsMaterial({
      size: 3.5,
      color: 0x93c5fd,
      map: starTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.twinklePoints = new THREE.Points(twinkleGeo, twinkleMat);
    this.scene.add(this.twinklePoints);
  }

  createCosmicNebulae() {
    this.nebulaGroup = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.18)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const nebulaTex = new THREE.CanvasTexture(canvas);

    const clouds = [
      { pos: [-110, 45, -150], color: 0x312e81, scale: 90 }, // Deep Cosmic Indigo
      { pos: [90, -50, -160], color: 0x065f46, scale: 95 },  // Cyan Gas Cloud
      { pos: [110, 65, -130], color: 0x831843, scale: 80 },  // Magenta Nebula
      { pos: [-60, -80, -140], color: 0x7c2d12, scale: 85 }  // Interstellar Amber
    ];

    clouds.forEach(c => {
      const mat = new THREE.SpriteMaterial({
        map: nebulaTex,
        color: c.color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...c.pos);
      sprite.scale.set(c.scale, c.scale, 1);
      this.nebulaGroup.add(sprite);
    });

    this.scene.add(this.nebulaGroup);
  }

  // ==========================================
  // REAL SOLAR SYSTEM ENGINE
  // ==========================================
  createRealSolarSystem() {
    // 1. THE SUN (Real NASA Sun Texture + Animated Corona Flare)
    this.createRealSun();

    // 2. MERCURY (Cratered Rocky Terrestrial World)
    this.createRealMercury();

    // 3. VENUS (Dense Sulfuric Cloud Map)
    this.createRealVenus();

    // 4. EARTH (2K Atmosphere Day Map + Rotating Cloud Layer + Atmosphere Glow)
    this.createRealEarth();

    // 5. THE MOON (1K Lunar Maria & Crater Map)
    this.createRealMoon();

    // 6. MARS (1K Red Topography & Polar Ice Cap Map)
    this.createRealMars();

    // 7. ASTEROID BELT & CERES (Particle Field + Dwarf Planet)
    this.createAsteroidBeltAndCeres();

    // 8. JUPITER (Real Bands & Great Red Spot Texture)
    this.createRealJupiter();

    // 9. SATURN (Banded Gas Giant with 3D Rings)
    this.createRealSaturn();

    // 10. URANUS (Cyan Tilted Ice Giant with Rings)
    this.createRealUranus();

    // 11. NEPTUNE (Azure Deep Gas Giant with Storm Spot)
    this.createRealNeptune();
  }

  createRealSun() {
    const sunTex = this.textureLoader.load('/textures/planets/sunmap.jpg');
    sunTex.colorSpace = THREE.SRGBColorSpace;

    const sunGeo = new THREE.SphereGeometry(18, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: 0xffffff
    });

    this.sun = new THREE.Mesh(sunGeo, sunMat);
    // Sun position in deep space
    this.sun.position.set(110, 50, -150);
    this.sun.userData = {
      name: "THE SUN (Sol)",
      desc: "Yellow Dwarf Star • Surface: 5,500°C • Mass: 99.86% of Solar System",
      iconName: "sun"
    };
    this.scene.add(this.sun);
    this.celestialBodies.push(this.sun);

    // Blazing Solar Corona Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.42, 'rgba(245, 158, 11, 0.55)');
    grad.addColorStop(0.75, 'rgba(234, 88, 12, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const coronaTex = new THREE.CanvasTexture(canvas);

    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunCorona = new THREE.Sprite(coronaMat);
    this.sunCorona.position.copy(this.sun.position);
    this.sunCorona.scale.set(65, 65, 1);
    this.scene.add(this.sunCorona);
  }

  createRealEarth() {
    const earthTex = this.textureLoader.load('/textures/planets/earth_atmos_2048.jpg');
    earthTex.colorSpace = THREE.SRGBColorSpace;

    const earthGeo = new THREE.SphereGeometry(6.2, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.65,
      metalness: 0.1
    });

    this.earth = new THREE.Mesh(earthGeo, earthMat);
    // Positioned in planetary orbit
    this.earth.position.set(-45, 18, -80);
    this.earth.rotation.z = 0.41; // Earth's 23.5 degree axial tilt
    this.earth.userData = {
      name: "EARTH (Terra)",
      desc: "Distance: 1.00 AU • Diameter: 12,742 km • Atmosphere: 78% N2, 21% O2",
      iconName: "globe"
    };
    this.scene.add(this.earth);
    this.celestialBodies.push(this.earth);

    // Multi-Layer Rotating Earth Clouds
    const cloudTex = this.textureLoader.load('/textures/planets/earthcloudmap.jpg');
    const cloudGeo = new THREE.SphereGeometry(6.32, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.earthClouds = new THREE.Mesh(cloudGeo, cloudMat);
    this.earthClouds.position.copy(this.earth.position);
    this.earthClouds.rotation.z = 0.41;
    this.scene.add(this.earthClouds);

    // Atmosphere Blue Rayleigh Scattering Rim
    const atmoGeo = new THREE.SphereGeometry(6.55, 36, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.position.copy(this.earth.position);
    this.scene.add(atmoMesh);
  }

  createRealMoon() {
    const moonTex = this.textureLoader.load('/textures/planets/moon_1024.jpg');
    moonTex.colorSpace = THREE.SRGBColorSpace;

    const moonGeo = new THREE.SphereGeometry(1.68, 36, 36);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.95,
      metalness: 0.05
    });

    this.moon = new THREE.Mesh(moonGeo, moonMat);
    // Positioned near Earth
    this.moon.position.set(-36, 23, -74);
    this.moon.userData = {
      name: "THE MOON (Luna)",
      desc: "Distance: 384,400 km from Earth • Diameter: 3,474 km • Tranquility Base Site",
      iconName: "moon"
    };
    this.scene.add(this.moon);
    this.celestialBodies.push(this.moon);
  }

  createRealMars() {
    const marsTex = this.textureLoader.load('/textures/planets/marsmap1k.jpg');
    marsTex.colorSpace = THREE.SRGBColorSpace;

    const marsGeo = new THREE.SphereGeometry(3.3, 40, 40);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTex,
      roughness: 0.88,
      metalness: 0.08
    });

    this.mars = new THREE.Mesh(marsGeo, marsMat);
    this.mars.position.set(-75, -16, -115);
    this.mars.rotation.z = 0.44; // Mars 25.2 degree axial tilt
    this.mars.userData = {
      name: "MARS",
      desc: "Distance: 1.52 AU • Atmosphere: 95% CO2 (1% Earth density) • Site of Opportunity & Viking",
      iconName: "compass"
    };
    this.scene.add(this.mars);
    this.celestialBodies.push(this.mars);

    // Dusty Martian Atmosphere Haze
    const hazeGeo = new THREE.SphereGeometry(3.48, 32, 32);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
    hazeMesh.position.copy(this.mars.position);
    this.scene.add(hazeMesh);
  }

  createRealVenus() {
    const venusTex = this.textureLoader.load('/textures/planets/venusmap.jpg');
    venusTex.colorSpace = THREE.SRGBColorSpace;

    const venusGeo = new THREE.SphereGeometry(5.9, 44, 44);
    const venusMat = new THREE.MeshStandardMaterial({
      map: venusTex,
      roughness: 0.82,
      metalness: 0.05
    });

    this.venus = new THREE.Mesh(venusGeo, venusMat);
    // Positioned closer to Sun
    this.venus.position.set(48, 14, -105);
    this.venus.rotation.z = 0.05;
    this.venus.userData = {
      name: "VENUS",
      desc: "Distance: 0.72 AU • Diameter: 12,104 km • Runaway Greenhouse (465°C)",
      iconName: "flame"
    };
    this.scene.add(this.venus);
    this.celestialBodies.push(this.venus);

    // Sulfuric Acid Atmosphere Haze
    const vHazeGeo = new THREE.SphereGeometry(6.15, 32, 32);
    const vHazeMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const vHazeMesh = new THREE.Mesh(vHazeGeo, vHazeMat);
    vHazeMesh.position.copy(this.venus.position);
    this.scene.add(vHazeMesh);
  }

  createRealJupiter() {
    const jupiterTex = this.textureLoader.load('/textures/planets/jupitermap.jpg');
    jupiterTex.colorSpace = THREE.SRGBColorSpace;

    // Sized large for Pioneer 10 flyby proximity
    const jupiterGeo = new THREE.SphereGeometry(26, 64, 64);
    const jupiterMat = new THREE.MeshStandardMaterial({
      map: jupiterTex,
      roughness: 0.82,
      metalness: 0.05
    });

    this.jupiter = new THREE.Mesh(jupiterGeo, jupiterMat);
    this.jupiter.position.set(-36, -8, -62);
    this.jupiter.rotation.z = 0.05;
    this.jupiter.userData = {
      name: "JUPITER",
      desc: "Distance: 5.20 AU • Diameter: 139,820 km • Pioneer 10 Gravity Assist Target",
      iconName: "orbit"
    };
    this.scene.add(this.jupiter);
    this.celestialBodies.push(this.jupiter);

    // Jovian Atmosphere Rim Scattering
    const jAtmoGeo = new THREE.SphereGeometry(26.7, 48, 48);
    const jAtmoMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const jAtmoMesh = new THREE.Mesh(jAtmoGeo, jAtmoMat);
    jAtmoMesh.position.copy(this.jupiter.position);
    this.scene.add(jAtmoMesh);
  }

  createRealSaturn() {
    const saturnTex = this.textureLoader.load('/textures/planets/saturnmap.jpg');
    saturnTex.colorSpace = THREE.SRGBColorSpace;

    const saturnGeo = new THREE.SphereGeometry(12, 44, 44);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: saturnTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.saturn = new THREE.Mesh(saturnGeo, saturnMat);
    this.saturn.position.set(88, -28, -170);
    this.saturn.rotation.z = 0.47; // Saturn's 26.7 degree ring tilt
    this.saturn.userData = {
      name: "SATURN",
      desc: "Distance: 9.58 AU • Diameter: 116,460 km • Water-Ice Ring System with Cassini Division",
      iconName: "orbit"
    };
    this.scene.add(this.saturn);
    this.celestialBodies.push(this.saturn);

    // High-Definition Cassini Division Saturn Ring Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.12, 'rgba(180, 160, 135, 0.25)'); // Ring C
    grad.addColorStop(0.28, 'rgba(210, 190, 165, 0.45)');
    grad.addColorStop(0.30, 'rgba(235, 218, 190, 0.95)'); // Ring B
    grad.addColorStop(0.58, 'rgba(245, 230, 205, 0.98)');
    grad.addColorStop(0.68, 'rgba(225, 205, 180, 0.85)');
    grad.addColorStop(0.70, 'rgba(0, 0, 0, 0.02)');       // CASSINI DIVISION GAP!
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
    grad.addColorStop(0.77, 'rgba(215, 195, 170, 0.88)'); // Ring A
    grad.addColorStop(0.88, 'rgba(200, 180, 155, 0.78)');
    grad.addColorStop(0.92, 'rgba(30, 20, 15, 0.08)');    // Encke Gap
    grad.addColorStop(0.94, 'rgba(190, 170, 145, 0.6)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 16);
    const saturnRingTex = new THREE.CanvasTexture(canvas);

    // 3D Planetary Rings
    const ringGeo = new THREE.RingGeometry(14.5, 27, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      map: saturnRingTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.6
    });
    this.saturnRings = new THREE.Mesh(ringGeo, ringMat);
    this.saturnRings.position.copy(this.saturn.position);
    this.saturnRings.rotation.z = 0.47;
    this.scene.add(this.saturnRings);
  }

  createGalileanMoons() {
    if (!this.jupiter) return;

    const moonsData = [
      { name: "Io", r: 35, size: 0.95, color: 0xfacc15, speed: 0.85, desc: "Volcanic Jovian Moon • 400+ Active Sulfur Volcanoes" },
      { name: "Europa", r: 42, size: 0.82, color: 0xe0f2fe, speed: 0.62, desc: "Ice-Crusted Moon • Global Subsurface Saline Ocean" },
      { name: "Ganymede", r: 52, size: 1.35, color: 0x94a3b8, speed: 0.44, desc: "Largest Solar System Moon • Intrinsic Magnetic Field" },
      { name: "Callisto", r: 64, size: 1.25, color: 0x64748b, speed: 0.32, desc: "Heavily Cratered Ancient Icy World" }
    ];

    this.galileanMoons = [];

    moonsData.forEach(m => {
      const geo = new THREE.SphereGeometry(m.size, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: m.color,
        roughness: 0.85,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = {
        name: `JUPITER MOON: ${m.name.toUpperCase()}`,
        desc: m.desc,
        iconName: "moon"
      };

      this.scene.add(mesh);
      this.celestialBodies.push(mesh);
      this.galileanMoons.push({
        mesh,
        r: m.r,
        speed: m.speed,
        angle: Math.random() * Math.PI * 2
      });
    });
  }

  createOrbitalSpaceDebris() {
    this.spaceDebrisGroup = new THREE.Group();
    this.debrisObjects = [];

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25
    });
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.8,
      roughness: 0.25,
      side: THREE.DoubleSide
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.35,
      roughness: 0.88
    });

    const boosterGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.85, 8);
    const foilGeo = new THREE.PlaneGeometry(0.35, 0.4);
    const panelGeo = new THREE.PlaneGeometry(0.65, 0.35);
    const rockGeo = new THREE.DodecahedronGeometry(0.2, 1);

    const geos = [
      { geo: boosterGeo, mat: metalMat },
      { geo: foilGeo, mat: goldFoilMat },
      { geo: panelGeo, mat: solarPanelMat },
      { geo: rockGeo, mat: rockMat }
    ];

    // Earth orbital debris cloud
    const earthPos = new THREE.Vector3(-45, 18, -80);
    for (let i = 0; i < 160; i++) {
      const type = geos[i % geos.length];
      const mesh = new THREE.Mesh(type.geo, type.mat);

      const orbitR = 9.0 + Math.random() * 18.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 1.4;

      mesh.position.set(
        earthPos.x + orbitR * Math.cos(theta),
        earthPos.y + orbitR * Math.sin(phi),
        earthPos.z + orbitR * Math.sin(theta)
      );

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(0.7 + Math.random() * 0.8);

      this.spaceDebrisGroup.add(mesh);
      this.debrisObjects.push({
        mesh,
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5),
        center: earthPos,
        r: orbitR,
        theta,
        speed: 0.04 + Math.random() * 0.06
      });
    }

    // Interplanetary debris & asteroid dust
    for (let i = 0; i < 120; i++) {
      const type = geos[i % geos.length];
      const mesh = new THREE.Mesh(type.geo, type.mat);

      const r = 35 + Math.random() * 110;
      const theta = Math.random() * Math.PI * 2;
      mesh.position.set(
        Math.cos(theta) * r,
        (Math.random() - 0.5) * 35,
        Math.sin(theta) * r - 50
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(0.8 + Math.random() * 1.0);

      this.spaceDebrisGroup.add(mesh);
      this.debrisObjects.push({
        mesh,
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0),
        center: new THREE.Vector3(0, 0, -50),
        r,
        theta,
        speed: 0.01 + Math.random() * 0.02
      });
    }

    this.scene.add(this.spaceDebrisGroup);
  }

  createRealMercury() {
    const mercTex = this.textureLoader.load('/textures/planets/mercurymap.jpg');
    mercTex.colorSpace = THREE.SRGBColorSpace;
    const mercGeo = new THREE.SphereGeometry(2.4, 36, 36);
    const mercMat = new THREE.MeshStandardMaterial({
      map: mercTex,
      roughness: 0.9,
      metalness: 0.1
    });
    this.mercury = new THREE.Mesh(mercGeo, mercMat);
    this.mercury.position.set(72, 32, -125);
    this.mercury.userData = {
      name: "MERCURY",
      desc: "Distance: 0.39 AU • Diameter: 4,879 km • Heavily Cratered Terrestrial World",
      iconName: "circle"
    };
    this.scene.add(this.mercury);
    this.celestialBodies.push(this.mercury);
  }

  createAsteroidBeltAndCeres() {
    // 1. Ceres Dwarf Planet
    const ceresGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 0, 256, 128);
    // Darker crater basins
    ctx.fillStyle = "#334155";
    ctx.beginPath(); ctx.arc(75, 55, 32, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(175, 75, 38, 0, Math.PI * 2); ctx.fill();
    // Bright Occator crater sodium carbonate faculae
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(120, 60, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath(); ctx.arc(120, 60, 10, 0, Math.PI * 2); ctx.fill();
    const ceresTex = new THREE.CanvasTexture(canvas);

    const ceresMat = new THREE.MeshStandardMaterial({ map: ceresTex, roughness: 0.92 });
    this.ceres = new THREE.Mesh(ceresGeo, ceresMat);
    this.ceres.position.set(-62, 8, -102);
    this.ceres.userData = {
      name: "CERES & ASTEROID BELT",
      desc: "Distance: 2.77 AU • 940 km Dwarf Planet • Water Ice Mantle Explored by Dawn",
      iconName: "sparkles"
    };
    this.scene.add(this.ceres);
    this.celestialBodies.push(this.ceres);

    // 2. Asteroid Belt Floating Particle Swarm
    const count = 1800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const radius = 95 + Math.random() * 28;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 16;
      pos[i] = Math.cos(angle) * radius;
      pos[i + 1] = height;
      pos[i + 2] = Math.sin(angle) * radius;
      const shade = 0.35 + Math.random() * 0.45;
      colors[i] = shade; colors[i + 1] = shade * 0.95; colors[i + 2] = shade * 0.9;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });
    this.asteroidBelt = new THREE.Points(geo, mat);
    this.asteroidBelt.position.set(0, 0, -40);
    this.scene.add(this.asteroidBelt);
  }

  createRealUranus() {
    // Canvas texture for Uranus: Pale aquamarine cyan with smooth atmospheric belts
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#7dd3fc');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.5, '#bae6fd');
    grad.addColorStop(0.7, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    const uranusTex = new THREE.CanvasTexture(canvas);

    const geo = new THREE.SphereGeometry(9.0, 40, 40);
    const mat = new THREE.MeshStandardMaterial({
      map: uranusTex,
      roughness: 0.7,
      metalness: 0.05
    });
    this.uranus = new THREE.Mesh(geo, mat);
    this.uranus.position.set(118, -14, -190);
    this.uranus.rotation.x = Math.PI / 2; // Tilted on its side (97.8 degree axial tilt)
    this.uranus.userData = {
      name: "URANUS",
      desc: "Distance: 19.2 AU • Diameter: 50,724 km • Retrograde Tilted Ice Giant",
      iconName: "circle-dot"
    };
    this.scene.add(this.uranus);
    this.celestialBodies.push(this.uranus);

    // Pale thin vertical rings
    const ringGeo = new THREE.RingGeometry(11.0, 16.5, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    this.uranusRings = new THREE.Mesh(ringGeo, ringMat);
    this.uranusRings.position.copy(this.uranus.position);
    this.uranusRings.rotation.x = Math.PI / 2;
    this.scene.add(this.uranusRings);
  }

  createRealNeptune() {
    // Canvas texture for Neptune: Vibrant azure blue with white methane clouds & storm
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1e40af');
    grad.addColorStop(0.25, '#2563eb');
    grad.addColorStop(0.5, '#1d4ed8');
    grad.addColorStop(0.75, '#3b82f6');
    grad.addColorStop(1, '#172554');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Great Dark Spot oval storm
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(220, 140, 26, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Methane cirrus streaks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(170, 130); ctx.lineTo(260, 134);
    ctx.moveTo(80, 80); ctx.lineTo(190, 82);
    ctx.stroke();

    const neptuneTex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.SphereGeometry(8.6, 40, 40);
    const mat = new THREE.MeshStandardMaterial({
      map: neptuneTex,
      roughness: 0.65,
      metalness: 0.05
    });
    this.neptune = new THREE.Mesh(geo, mat);
    this.neptune.position.set(145, -6, -215);
    this.neptune.userData = {
      name: "NEPTUNE",
      desc: "Distance: 30.1 AU • Diameter: 49,244 km • Supersonic Winds (2,100 km/h)",
      iconName: "waves"
    };
    this.scene.add(this.neptune);
    this.celestialBodies.push(this.neptune);
  }

  resetPlanetsToDefault() {
    // 1. Sun: Anchor at (110, 50, -150)
    if (this.sun) {
      this.sun.position.set(110, 50, -150);
      this.sun.scale.set(1, 1, 1);
    }
    // 2. Mercury: (72, 32, -125)
    if (this.mercury) {
      this.mercury.position.set(72, 32, -125);
      this.mercury.scale.set(1, 1, 1);
    }
    // 3. Venus: (50, 16, -115)
    if (this.venus) {
      this.venus.position.set(50, 16, -115);
      this.venus.scale.set(1, 1, 1);
    }
    // 4. Earth & Clouds: (-52, 18, -95)
    if (this.earth) {
      this.earth.position.set(-52, 18, -95);
      this.earth.scale.set(1, 1, 1);
    }
    if (this.earthClouds) {
      this.earthClouds.position.copy(this.earth.position);
      this.earthClouds.scale.set(1, 1, 1);
    }
    // 5. Moon: (-42, 24, -88)
    if (this.moon) {
      this.moon.position.set(-42, 24, -88);
      this.moon.scale.set(1, 1, 1);
    }
    // 6. Mars: (-80, -16, -125)
    if (this.mars) {
      this.mars.position.set(-80, -16, -125);
      this.mars.scale.set(1, 1, 1);
    }
    // 7. Ceres & Asteroid Belt: (-62, 8, -102)
    if (this.ceres) {
      this.ceres.position.set(-62, 8, -102);
      this.ceres.scale.set(1, 1, 1);
    }
    // 8. Jupiter: (-45, -20, -135)
    if (this.jupiter) {
      this.jupiter.position.set(-45, -20, -135);
      this.jupiter.scale.set(1, 1, 1);
    }
    // 9. Saturn & Rings: (85, -28, -160)
    if (this.saturn) {
      this.saturn.position.set(85, -28, -160);
      this.saturn.scale.set(1, 1, 1);
      if (this.saturnRings) {
        this.saturnRings.position.copy(this.saturn.position);
        this.saturnRings.scale.set(1, 1, 1);
      }
    }
    // 10. Uranus & Rings: (118, -14, -190)
    if (this.uranus) {
      this.uranus.position.set(118, -14, -190);
      this.uranus.scale.set(1, 1, 1);
      if (this.uranusRings) {
        this.uranusRings.position.copy(this.uranus.position);
        this.uranusRings.scale.set(1, 1, 1);
      }
    }
    // 11. Neptune: (145, -6, -215)
    if (this.neptune) {
      this.neptune.position.set(145, -6, -215);
      this.neptune.scale.set(1, 1, 1);
    }
  }

  setMissionBackdrop(missionId) {
    this.resetPlanetsToDefault();

    if (missionId === "mission-01") {
      // PIONEER 10: Jupiter is the close encounter target!
      if (this.jupiter) {
        this.jupiter.position.set(-36, -8, -62);
        this.jupiter.scale.set(1.0, 1.0, 1.0);
      }
      if (this.earth) this.earth.position.set(-58, 20, -100);
      if (this.moon) this.moon.position.set(-48, 25, -94);
    } else if (missionId === "mission-02") {
      // APOLLO 11 / LADEE: Moon is foreground below Eagle LM, Earth is in the lunar sky!
      if (this.moon) {
        this.moon.position.set(0, -32, -16);
        this.moon.scale.set(16.0, 16.0, 16.0); // Gentle curved lunar horizon below
      }
      if (this.earth) {
        this.earth.position.set(30, 22, -60); // Prominent Earthrise
        this.earth.scale.set(1.5, 1.5, 1.5);
      }
      if (this.earthClouds) {
        this.earthClouds.position.copy(this.earth.position);
        this.earthClouds.scale.set(1.5, 1.5, 1.5);
      }
      // Push Jupiter and Mars far into deep background to ensure clean lunar sky
      if (this.jupiter) this.jupiter.position.set(-110, -40, -220);
      if (this.mars) this.mars.position.set(-130, -30, -240);
    } else if (missionId === "mission-03") {
      // DAWN: Asteroid Belt (Ceres & Vesta). Mars and Jupiter in deep space!
      if (this.ceres) {
        this.ceres.position.set(-25, 4, -45);
        this.ceres.scale.set(2.8, 2.8, 2.8);
      }
      if (this.mars) {
        this.mars.position.set(-34, 15, -78);
        this.mars.scale.set(1.3, 1.3, 1.3);
      }
      if (this.jupiter) {
        this.jupiter.position.set(45, -16, -95);
        this.jupiter.scale.set(0.65, 0.65, 0.65);
      }
      if (this.earth) {
        this.earth.position.set(-62, 22, -110);
        this.earth.scale.set(0.8, 0.8, 0.8);
      }
    } else if (missionId === "mission-04") {
      // VIKING / OPPORTUNITY / INGENUITY: Mars is prominent!
      if (this.mars) {
        this.mars.position.set(-28, -14, -50);
        this.mars.scale.set(2.4, 2.4, 2.4);
      }
      if (this.earth) {
        this.earth.position.set(50, 25, -95);
        this.earth.scale.set(0.7, 0.7, 0.7);
      }
    } else if (missionId === "mission-05") {
      // SPITZER: Infrared Cosmic Observatory
      if (this.earth) {
        this.earth.position.set(-42, 16, -85);
        this.earth.scale.set(1.1, 1.1, 1.1);
      }
      if (this.sun) this.sun.position.set(120, 55, -160);
    } else if (missionId === "mission-06") {
      // DAWN: Dwarf Planet Ceres & Asteroid Belt
      if (this.ceres) {
        this.ceres.position.set(-25, 4, -45);
        this.ceres.scale.set(3.0, 3.0, 3.0);
      }
      if (this.mars) this.mars.position.set(-40, 16, -85);
    } else if (missionId === "mission-07") {
      // KEPLER: Cygnus Exoplanet Field
      if (this.earth) {
        this.earth.position.set(-46, 18, -90);
        this.earth.scale.set(1.0, 1.0, 1.0);
      }
      if (this.sun) this.sun.position.set(110, 50, -150);
    } else if (missionId === "mission-08") {
      // LADEE: Moon Far Side Exosphere & Regolith Dust
      if (this.moon) {
        this.moon.position.set(0, -28, -20);
        this.moon.scale.set(14.0, 14.0, 14.0);
      }
      if (this.earth) this.earth.position.set(35, 24, -70);
    } else if (missionId === "mission-09") {
      // INGENUITY: Mars Jezero Crater Skies
      if (this.mars) {
        this.mars.position.set(0, -30, -22);
        this.mars.scale.set(15.0, 15.0, 15.0);
      }
    } else if (missionId === "mission-10") {
      // SPACE SHUTTLE: Low Earth Orbit
      if (this.earth) {
        this.earth.position.set(0, -32, -24);
        this.earth.scale.set(16.0, 16.0, 16.0);
      }
      if (this.moon) this.moon.position.set(40, 26, -85);
    }
  }

  update(delta) {
    // 1. Earth rotation & cloud drift
    if (this.earth) {
      this.earth.rotation.y += delta * 0.035;
    }
    if (this.earthClouds) {
      this.earthClouds.rotation.y += delta * 0.052; // Clouds drift faster than surface
    }

    // 2. Moon orbit around Earth
    if (this.moon && this.earth) {
      this.moon.rotation.y += delta * 0.02;
    }

    // 3. Mars rotation
    if (this.mars) {
      this.mars.rotation.y += delta * 0.032;
    }

    // 4. Venus retrograde slow rotation
    if (this.venus) {
      this.venus.rotation.y -= delta * 0.015;
    }

    // 5. Mercury rotation
    if (this.mercury) {
      this.mercury.rotation.y += delta * 0.012;
    }

    // 6. Ceres & Asteroid Belt
    if (this.ceres) {
      this.ceres.rotation.y += delta * 0.035;
    }
    if (this.asteroidBelt) {
      this.asteroidBelt.rotation.y += delta * 0.008;
    }

    // 7. Jupiter massive cloud deck spin
    if (this.jupiter) {
      this.jupiter.rotation.y += delta * 0.065;
    }

    // 8. Galilean Moons orbital motion around Jupiter
    if (this.jupiter && this.galileanMoons.length) {
      const jPos = this.jupiter.position;
      this.galileanMoons.forEach(m => {
        m.angle += delta * m.speed * 0.15;
        m.mesh.position.set(
          jPos.x + Math.cos(m.angle) * m.r,
          jPos.y + Math.sin(m.angle * 0.5) * 4,
          jPos.z + Math.sin(m.angle) * m.r
        );
      });
    }

    // 9. Saturn spin
    if (this.saturn) {
      this.saturn.rotation.y += delta * 0.055;
    }

    // 10. Uranus tilted spin
    if (this.uranus) {
      this.uranus.rotation.z += delta * 0.04;
    }

    // 11. Neptune spin
    if (this.neptune) {
      this.neptune.rotation.y += delta * 0.045;
    }

    // 12. Sun corona soft pulse
    if (this.sunCorona) {
      const s = 65 + Math.sin(Date.now() / 600) * 3.5;
      this.sunCorona.scale.set(s, s, 1);
    }

    // 13. Twinkling stars pulsation
    if (this.twinklePoints) {
      const s = 3.2 + Math.sin(Date.now() / 450) * 0.7;
      this.twinklePoints.material.size = s;
    }

    // 14. Orbital Space Debris tumbling & orbit
    if (this.debrisObjects && this.debrisObjects.length) {
      this.debrisObjects.forEach(d => {
        d.mesh.rotation.x += d.rotSpeed.x * delta;
        d.mesh.rotation.y += d.rotSpeed.y * delta;
        d.mesh.rotation.z += d.rotSpeed.z * delta;

        d.theta += d.speed * delta * 0.2;
        d.mesh.position.x = d.center.x + Math.cos(d.theta) * d.r;
        d.mesh.position.z = d.center.z + Math.sin(d.theta) * d.r;
      });
    }
  }
}
