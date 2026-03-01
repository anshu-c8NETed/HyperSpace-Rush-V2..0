import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass.js';
import spline from './spline.js';

// ─── Tunnel Interior Shader ────────────────────────────────────────────────
const TunnelShader = {
  uniforms: {
    uTime:  { value: 0 },
    uSpeed: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uSpeed;

    float grid(vec2 uv, float repeat, float lineWidth) {
      vec2 g = fract(uv * repeat);
      float lx = step(lineWidth, g.x) * step(lineWidth, 1.0 - g.x);
      float ly = step(lineWidth, g.y) * step(lineWidth, 1.0 - g.y);
      return 1.0 - lx * ly;
    }

    void main() {
      vec2 uv = vUv;
      uv.y = fract(uv.y * 24.0 - uTime * uSpeed * 0.0004);
      uv.x = fract(uv.x * 10.0);

      float coarseGrid = grid(uv, 1.0, 0.028);
      float fineGrid   = grid(uv, 4.0, 0.06) * 0.35;

      vec3 base  = vec3(0.004, 0.004, 0.008);
      vec3 lines = vec3(0.08,  0.11,  0.18);
      vec3 col   = mix(base, lines, max(coarseGrid, fineGrid));

      float seam = abs(vUv.x - 0.5) * 2.0;
      col *= 1.0 - seam * 0.35;

      gl_FragColor = vec4(col, 0.82);
    }
  `,
};

// ─── Screen-space pass ────────────────────────────────────────────────────
const ScreenPass = {
  uniforms: {
    tDiffuse: { value: null },
    uBoost:   { value: 0 },
    uDamage:  { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uBoost;
    uniform float uDamage;
    varying vec2 vUv;

    void main() {
      float ca  = uBoost * 0.004 + 0.0008;
      vec2  dir = vUv - 0.5;
      vec4  r   = texture2D(tDiffuse, vUv + dir * ca);
      vec4  g   = texture2D(tDiffuse, vUv);
      vec4  b   = texture2D(tDiffuse, vUv - dir * ca);

      vec4 col = vec4(r.r, g.g, b.b, 1.0);

      float d = length(dir) * 1.4;
      col.rgb *= 1.0 - d * d * (0.45 + uBoost * 0.10);
      col.rgb  = mix(col.rgb, vec3(1.0, 0.05, 0.05), uDamage * (1.0 - d * 0.4) * 0.42);

      gl_FragColor = col;
    }
  `,
};

// ─── Config ───────────────────────────────────────────────────────────────
const CONFIG = {
  tubeRadius:               0.65,
  tubeSegments:             320,
  tubeRadialSegments:       24,
  playerRadius:             0.06,
  maxOffset:                0.42,
  baseSpeed:                2.0,
  baseMoveSpeed:            1.25,
  speedIncrement:           0.15,
  moveSpeedIncrement:       0.02,
  scorePerSecond:           10,
  levelScoreThreshold:      150,
  obstacleBaseCount:        5,
  obstacleIncrementPerLevel:2,
  obstacleMaxCount:         50,
  obstacleSize:             0.075,
  collectibleSize:          0.072,
  collectibleCount:         8,
  collectibleScoreValue:    50,
  boostPower:               2.0,
  boostDuration:            1500,
  boostRechargeRate:        15,
  healthMax:                3,

  camBack:    0.55,
  camUp:      0.18,
  camLagPos:  0.08,
  camLagLook: 0.10,
};

const ICE   = 0xc8e8ff;
const WHITE = 0xffffff;
const CRIM  = 0xff1a2e;

// ─── Ship builder ─────────────────────────────────────────────────────────
function buildShip(scene) {
  const ship = new THREE.Group();

  const MAT_HULL = new THREE.MeshStandardMaterial({
    color:            0x0d0d14,
    metalness:        0.95,
    roughness:        0.12,
    envMapIntensity:  1.0,
  });
  const MAT_ACCENT = new THREE.MeshStandardMaterial({
    color:     ICE,
    emissive:  ICE,
    emissiveIntensity: 0.45,
    metalness: 0.8,
    roughness: 0.2,
  });
  const MAT_ENGINE = new THREE.MeshStandardMaterial({
    color:     WHITE,
    emissive:  WHITE,
    emissiveIntensity: 1.2,
    metalness: 0.5,
    roughness: 0.3,
  });

  const fuseGeo = new THREE.ConeGeometry(0.018, 0.17, 6, 1);
  fuseGeo.rotateX(-Math.PI / 2);
  const fuse = new THREE.Mesh(fuseGeo, MAT_HULL);
  ship.add(fuse);

  const rearGeo = new THREE.BoxGeometry(0.028, 0.016, 0.08);
  const rear = new THREE.Mesh(rearGeo, MAT_HULL);
  rear.position.z = 0.06;
  ship.add(rear);

  const makeWing = (side) => {
    const geo = new THREE.BufferGeometry();
    const s   = side;
    const v   = new Float32Array([
       0.0,  0.0,     -0.015,
       0.0,  0.0,      0.065,
       s*0.095, -0.006, 0.05,
       s*0.095, -0.006, 0.005,
    ]);
    const idx = new Uint16Array([0,1,2, 0,2,3]);
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, MAT_HULL);
  };
  ship.add(makeWing(1));
  ship.add(makeWing(-1));

  const addAccentBar = (side) => {
    const geo = new THREE.BoxGeometry(0.004, 0.003, 0.07);
    const bar = new THREE.Mesh(geo, MAT_ACCENT);
    bar.position.set(side * 0.052, -0.004, 0.025);
    bar.rotation.y = side * 0.28;
    ship.add(bar);
  };
  addAccentBar(1); addAccentBar(-1);

  const podGeo = new THREE.CylinderGeometry(0.010, 0.007, 0.065, 8);
  podGeo.rotateX(Math.PI / 2);

  const makePod = (side) => {
    const pod = new THREE.Mesh(podGeo, MAT_HULL);
    pod.position.set(side * 0.038, -0.004, 0.058);
    ship.add(pod);

    const discGeo = new THREE.CircleGeometry(0.007, 16);
    const disc    = new THREE.Mesh(discGeo, MAT_ENGINE);
    disc.position.set(side * 0.038, -0.004, 0.092);
    disc.rotation.y = Math.PI;
    ship.add(disc);

    const lt = new THREE.PointLight(ICE, 0.25, 0.18);
    lt.position.set(side * 0.038, -0.004, 0.095);
    ship.add(lt);
  };
  makePod(1); makePod(-1);

  const canopyGeo = new THREE.BoxGeometry(0.014, 0.007, 0.04);
  const canopy    = new THREE.Mesh(canopyGeo, MAT_ACCENT);
  canopy.position.set(0, 0.013, -0.02);
  ship.add(canopy);

  const wireGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.05, 0.022, 0.175), 15);
  const wire    = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({
    color: ICE, transparent: true, opacity: 0.12,
  }));
  ship.add(wire);

  scene.add(ship);
  return ship;
}

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas      = canvas;
    this.callbacks   = callbacks;
    this.isMobile    = window.innerWidth <= 768 || 'ontouchstart' in window;
    this.animFrameId = null;
    this.isPaused    = false;

    this.state = {
      isPlaying: false,
      score: 0,
      highScore: parseInt(localStorage.getItem('hyperspace_highscore')) || 0,
      bestLevel: parseInt(localStorage.getItem('hyperspace_bestlevel')) || 1,
      level: 1,
      speedMultiplier: CONFIG.baseSpeed,
      moveSpeed:       CONFIG.baseMoveSpeed,
      elapsedMs:       0,
      loopTime:        10000,
      offsetX: 0, offsetY: 0,
      velocityX: 0, velocityY: 0,
      currentObstacleCount: CONFIG.obstacleBaseCount,
      boostActive:   false,
      boostCharge:   100,
      boostCooldown: false,
      health:       CONFIG.healthMax,
      invulnerable: false,
    };

    this._camPos        = new THREE.Vector3();
    this._camTarget     = new THREE.Vector3();
    this._shipBankAngle = 0;
    this._shakeMag      = 0;
    this._damageAmt     = 0;
    this._boostAmt      = 0;

    // ── Pre-allocated temporaries — no heap churn per frame ──
    this._v0       = new THREE.Vector3();
    this._v1       = new THREE.Vector3();
    this._v2       = new THREE.Vector3();
    this._fwd      = new THREE.Vector3();
    this._right    = new THREE.Vector3();
    this._up       = new THREE.Vector3();
    this._worldUp  = new THREE.Vector3(0, 1, 0);
    this._bankAxis = new THREE.Vector3(0, 0, 1);
    this._mat4     = new THREE.Matrix4();
    this._qBase    = new THREE.Quaternion();
    this._qBank    = new THREE.Quaternion();

    this.keys = {
      w:false, a:false, s:false, d:false,
      arrowup:false, arrowleft:false, arrowdown:false, arrowright:false,
      space:false,
    };

    this._init();
    this._setupInput();
  }

  _init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.022);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.005, 300);

    this.renderer = new THREE.WebGLRenderer({
      canvas:          this.canvas,
      antialias:       !this.isMobile,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled   = false;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.isMobile ? 0.18 : 0.22,
      0.25,
      0.92,
    );
    this.composer.addPass(this.bloomPass);

    this.screenPass = new ShaderPass(ScreenPass);
    this.composer.addPass(this.screenPass);

    this.scene.add(new THREE.AmbientLight(0x0c0c18, 2.0));
    this.shipLight = new THREE.PointLight(0x8899cc, 0.5, 1.2);
    this.scene.add(this.shipLight);
    this.rimLight = new THREE.PointLight(ICE, 0.3, 1.0);
    this.scene.add(this.rimLight);

    this._buildTunnel();
    this._buildStarfield();
    this._buildPools();

    this.ship = buildShip(this.scene);

    const startPos = spline.getPointAt(0);
    this.ship.position.copy(startPos);
    this._camPos.copy(startPos);
    this._camPos.z += CONFIG.camBack * 2;

    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this.clock = new THREE.Clock();
    this._time = 0;
  }

  _buildTunnel() {
    const tubeGeo = new THREE.TubeGeometry(
      spline, CONFIG.tubeSegments, CONFIG.tubeRadius, CONFIG.tubeRadialSegments, true,
    );
    this._tunnelUniforms = { uTime: { value: 0 }, uSpeed: { value: 0 } };
    this.scene.add(new THREE.Mesh(tubeGeo, new THREE.ShaderMaterial({
      uniforms:       this._tunnelUniforms,
      vertexShader:   TunnelShader.vertexShader,
      fragmentShader: TunnelShader.fragmentShader,
      side:           THREE.BackSide,
      transparent:    true,
      depthWrite:     false,
    })));
    this.tubeEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(tubeGeo, 12),
      new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: 0.18 }),
    );
    this.scene.add(this.tubeEdge);
  }

  _buildStarfield() {
    const COUNT   = this.isMobile ? 300 : 700;
    const geo     = new THREE.BufferGeometry();
    const pos     = new Float32Array(COUNT * 3);
    this._starVel = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      pos[i3]   = (Math.random() - 0.5) * 140;
      pos[i3+1] = (Math.random() - 0.5) * 140;
      pos[i3+2] = (Math.random() - 0.5) * 220;
      this._starVel[i] = Math.random() * 0.8 + 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._starCount = COUNT;
    this.starfield = new THREE.Points(geo, new THREE.PointsMaterial({
      size: this.isMobile ? 0.09 : 0.13,
      color: WHITE, transparent: true, opacity: 0.25, sizeAttenuation: true,
    }));
    this.scene.add(this.starfield);
  }

  _buildPools() {
    this.obstaclePool       = [];
    this.activeObstacles    = [];
    this.collectiblePool    = [];
    this.activeCollectibles = [];
    this._createObstaclePool(CONFIG.obstacleMaxCount);
    this._createCollectiblePool(20);
  }

  _createObstaclePool(count) {
    const geo     = new THREE.TetrahedronGeometry(CONFIG.obstacleSize * 1.6, 0);
    const wireGeo = new THREE.EdgesGeometry(geo);
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.add(new THREE.LineSegments(wireGeo,
        new THREE.LineBasicMaterial({ color: CRIM, transparent: true, opacity: 0.95 })));
      group.add(new THREE.Mesh(geo,
        new THREE.MeshBasicMaterial({ color: 0x1a0006, transparent: true, opacity: 0.65 })));
      group.add(Object.assign(new THREE.PointLight(CRIM, 0.2, 0.7), {}));
      group.visible = false;
      this.scene.add(group);
      this.obstaclePool.push({
        mesh: group, active: false, pathPos: 0,
        rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        rotSpeed: (Math.random() - 0.5) * 2.2 + (Math.random() > 0.5 ? 0.8 : -0.8),
      });
    }
  }

  _createCollectiblePool(count) {
    const geo     = new THREE.IcosahedronGeometry(CONFIG.collectibleSize, 0);
    const wireGeo = new THREE.EdgesGeometry(geo);
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const wire  = new THREE.LineSegments(wireGeo,
        new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.80 }));
      group.add(wire);
      group.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(CONFIG.collectibleSize * 0.45, 0),
        new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.55 })));
      group.add(Object.assign(new THREE.PointLight(WHITE, 0.2, 0.6), {}));
      group.visible = false;
      this.scene.add(group);
      this.collectiblePool.push({ mesh: group, wire, active: false, pathPos: 0 });
    }
  }

  _spawnObstacles(count) {
    this.activeObstacles.length = 0;
    this.obstaclePool.forEach(o => { o.active = false; o.mesh.visible = false; });
    const actual = Math.min(count, this.obstaclePool.length);
    for (let i = 0; i < actual; i++) {
      const o   = this.obstaclePool[i];
      const p   = 0.15 + (i / actual) * 0.78;
      const pos = spline.getPointAt(p % 1);
      const ang = Math.random() * Math.PI * 2;
      const r   = (Math.random() * 0.38 + 0.10) * CONFIG.tubeRadius;
      pos.x += Math.cos(ang) * r; pos.y += Math.sin(ang) * r;
      o.mesh.position.copy(pos);
      o.mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      o.pathPos = p; o.active = true; o.mesh.visible = true;
      this.activeObstacles.push(o);
    }
  }

  _spawnCollectibles() {
    this.activeCollectibles.length = 0;
    this.collectiblePool.forEach(c => { c.active = false; c.mesh.visible = false; });
    for (let i = 0; i < CONFIG.collectibleCount; i++) {
      const c   = this.collectiblePool[i];
      const p   = 0.12 + (i / CONFIG.collectibleCount) * 0.82;
      const pos = spline.getPointAt(p % 1);
      const ang = Math.random() * Math.PI * 2;
      const r   = (Math.random() * 0.28 + 0.07) * CONFIG.tubeRadius;
      pos.x += Math.cos(ang) * r; pos.y += Math.sin(ang) * r;
      c.mesh.position.copy(pos);
      c.pathPos = p; c.active = true; c.mesh.visible = true;
      this.activeCollectibles.push(c);
    }
  }

  _setupInput() {
    let lastBoost = 0;
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === 'Escape' && this.state.isPlaying) { this.togglePause(); e.preventDefault(); return; }
      if (k in this.keys) { this.keys[k] = true; e.preventDefault(); }
      if (e.code === 'Space' || k === ' ') {
        const now = Date.now();
        if (now - lastBoost > 100) { this.keys.space = true; lastBoost = now; }
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = false;
      if (e.code === 'Space' || k === ' ') this.keys.space = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  _handleResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  setJoystick(dx, dy) {
    const t = 15;
    this.keys.a = dx < -t; this.keys.d = dx > t;
    this.keys.w = dy < -t; this.keys.s = dy > t;
  }
  clearJoystick() { this.keys.a = this.keys.d = this.keys.w = this.keys.s = false; }
  setBoost(v)     { this.keys.space = v; }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.callbacks.onPause?.(this.isPaused);
    if (!this.isPaused) this.clock.getDelta();
  }

  startGame() {
    const s = this.state;
    Object.assign(s, {
      isPlaying:true, score:0, level:1,
      speedMultiplier:CONFIG.baseSpeed, moveSpeed:CONFIG.baseMoveSpeed,
      offsetX:0, offsetY:0, velocityX:0, velocityY:0, elapsedMs:0,
      currentObstacleCount:CONFIG.obstacleBaseCount,
      boostActive:false, boostCharge:100, boostCooldown:false,
      health:CONFIG.healthMax, invulnerable:false,
    });
    this.isPaused = false;
    this._shakeMag = this._damageAmt = this._boostAmt = 0;
    this._spawnObstacles(s.currentObstacleCount);
    this._spawnCollectibles();
    this.callbacks.onHealthChange?.(s.health);
    this.callbacks.onScoreChange?.(0);
    this.callbacks.onLevelChange?.(1);
  }

  endGame() {
    const s = this.state;
    s.isPlaying = false;
    const isNew = s.score > s.highScore;
    if (isNew) { s.highScore = s.score; localStorage.setItem('hyperspace_highscore', s.highScore); }
    if (s.level > s.bestLevel) { s.bestLevel = s.level; localStorage.setItem('hyperspace_bestlevel', s.bestLevel); }
    this.callbacks.onGameOver?.({
      score: Math.floor(s.score), highScore: Math.floor(s.highScore),
      level: s.level, isNewHighScore: isNew,
    });
  }

  cleanup() {
    this.activeObstacles.forEach(o    => { o.active = false; o.mesh.visible = false; });
    this.activeCollectibles.forEach(c => { c.active = false; c.mesh.visible = false; });
    this.activeObstacles.length = this.activeCollectibles.length = 0;
  }

  _activateBoost() {
    const s = this.state;
    if (s.boostActive || s.boostCooldown || s.boostCharge < 30) return;
    s.boostActive = true;
    navigator.vibrate?.(30);
    setTimeout(() => {
      s.boostActive = false; s.boostCooldown = true;
      setTimeout(() => { s.boostCooldown = false; }, 500);
    }, CONFIG.boostDuration);
  }

  _takeDamage() {
    const s = this.state;
    if (s.invulnerable) return;
    s.health--; s.invulnerable = true;
    this._shakeMag = 0.06; this._damageAmt = 1.0;
    navigator.vibrate?.([80,40,80]);
    this.callbacks.onHealthChange?.(s.health);
    this.callbacks.onDamage?.();
    setTimeout(() => { s.invulnerable = false; }, 1200);
    if (s.health <= 0) this.endGame();
  }

  _collectItem() {
    this.state.score += CONFIG.collectibleScoreValue;
    navigator.vibrate?.(40);
    this.callbacks.onCollect?.(CONFIG.collectibleScoreValue);
  }

  // ── Ship + camera — zero heap allocations per frame ───────────────────────
  _updateShipAndCamera(delta) {
    const s = this.state;

    const t = s.elapsedMs * 0.1;
    const p = (t % s.loopTime) / s.loopTime;

    this._v0.copy(spline.getPointAt(p));
    this._v1.copy(spline.getPointAt((p + 0.018) % 1));

    // Local spline frame
    this._fwd.subVectors(this._v1, this._v0).normalize();
    this._right.crossVectors(this._fwd, this._worldUp).normalize();
    this._up.crossVectors(this._right, this._fwd).normalize();

    // Lateral movement
    const acc = s.moveSpeed * delta * 2.4;
    const damp = 0.87;
    if (this.keys.a || this.keys.arrowleft)  s.velocityX -= acc;
    if (this.keys.d || this.keys.arrowright) s.velocityX += acc;
    if (this.keys.w || this.keys.arrowup)    s.velocityY += acc;
    if (this.keys.s || this.keys.arrowdown)  s.velocityY -= acc;
    s.velocityX *= damp; s.velocityY *= damp;
    s.offsetX   += s.velocityX * delta;
    s.offsetY   += s.velocityY * delta;

    const mag = Math.hypot(s.offsetX, s.offsetY);
    if (mag > CONFIG.maxOffset) { s.offsetX *= CONFIG.maxOffset/mag; s.offsetY *= CONFIG.maxOffset/mag; }

    // Ship world pos → _v2
    this._v2.copy(this._v0)
      .addScaledVector(this._right, s.offsetX)
      .addScaledVector(this._up,    s.offsetY);

    // Ship orientation
    const targetBank = s.velocityX * -2.8;
    this._shipBankAngle += (targetBank - this._shipBankAngle) * 0.09;

    this._mat4.makeBasis(this._right, this._up, this._v1.copy(this._fwd).negate());
    this._qBase.setFromRotationMatrix(this._mat4);
    this._qBank.setFromAxisAngle(this._bankAxis, this._shipBankAngle);
    this._qBase.multiply(this._qBank);

    this.ship.position.lerp(this._v2, 0.25);
    this.ship.quaternion.slerp(this._qBase, 0.18);

    // Lights
    this.shipLight.position.copy(this.ship.position);
    this.rimLight.position.copy(this.ship.position)
      .addScaledVector(this._fwd, -0.15)
      .addScaledVector(this._right, -0.10);

    // Camera position: behind + above ship
    this._v1.copy(this._v2)
      .addScaledVector(this._fwd, -CONFIG.camBack)
      .addScaledVector(this._up,   CONFIG.camUp);
    this._camPos.lerp(this._v1, CONFIG.camLagPos);

    if (this._shakeMag > 0.001) {
      this._camPos.x += (Math.random()-0.5) * this._shakeMag;
      this._camPos.y += (Math.random()-0.5) * this._shakeMag;
      this._shakeMag *= 0.76;
    }

    // Look-at: slightly ahead of ship
    this._v1.copy(this._v2).addScaledVector(this._fwd, 0.4);
    this._camTarget.lerp(this._v1, CONFIG.camLagLook);

    this.camera.position.copy(this._camPos);
    this.camera.lookAt(this._camTarget);
    // FOV stays fixed at 75 — no push-back when boost fires

    if (this.keys.space && s.isPlaying) this._activateBoost();
  }

  _checkCollisions() {
    const s = this.state;
    if (!s.isPlaying) return;
    const pp = this.ship.position;

    const obsSq = (CONFIG.playerRadius + CONFIG.obstacleSize * 1.6) ** 2;
    for (const o of this.activeObstacles) {
      if (!o.active) continue;
      const dx = pp.x - o.mesh.position.x;
      const dy = pp.y - o.mesh.position.y;
      const dz = pp.z - o.mesh.position.z;
      if (dx*dx + dy*dy + dz*dz < obsSq) {
        this._takeDamage(); o.active = false; o.mesh.visible = false; return;
      }
    }

    const colSq = (CONFIG.playerRadius + CONFIG.collectibleSize * 2.0) ** 2;
    for (const c of this.activeCollectibles) {
      if (!c.active) continue;
      const dx = pp.x - c.mesh.position.x;
      const dy = pp.y - c.mesh.position.y;
      const dz = pp.z - c.mesh.position.z;
      if (dx*dx + dy*dy + dz*dz < colSq) {
        this._collectItem(); c.active = false; c.mesh.visible = false;
      }
    }
  }

  _levelUp() {
    const s = this.state;
    s.speedMultiplier += CONFIG.speedIncrement;
    s.moveSpeed       += CONFIG.moveSpeedIncrement;
    s.currentObstacleCount = Math.min(
      CONFIG.obstacleBaseCount + (s.level-1)*CONFIG.obstacleIncrementPerLevel,
      CONFIG.obstacleMaxCount,
    );
    this._spawnObstacles(s.currentObstacleCount);
    this._spawnCollectibles();
    navigator.vibrate?.([40,20,40,20,80]);
    this.callbacks.onLevelUp?.(s.level);
    const orig = this.bloomPass.strength;
    this.bloomPass.strength = 0.80;
    setTimeout(() => { this.bloomPass.strength = orig; }, 380);
  }

  // ── Main loop — rAF already syncs to display refresh rate ─────────────────
  // Removed the manual dt < frameTime limiter that caused judder on high-hz
  // screens and accumulated clock drift when frames were skipped.
  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());
    if (this.isPaused) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this._time += delta;
    const t = this._time;
    const s = this.state;

    if (s.isPlaying) {
      const eff = s.boostActive ? s.speedMultiplier * CONFIG.boostPower : s.speedMultiplier;
      s.elapsedMs += delta * 1000 * eff;
      s.score     += delta * CONFIG.scorePerSecond * eff;
      const newLvl = Math.floor(s.score / CONFIG.levelScoreThreshold) + 1;
      if (newLvl > s.level) { s.level = newLvl; this._levelUp(); }
      if (!s.boostActive && s.boostCharge < 100)
        s.boostCharge = Math.min(100, s.boostCharge + CONFIG.boostRechargeRate * delta);
      if (s.boostActive)
        s.boostCharge = Math.max(0, s.boostCharge - 40 * delta);

      this._updateShipAndCamera(delta);
      this._checkCollisions();

      this.callbacks.onHUDUpdate?.({
        score: Math.floor(s.score), level: s.level,
        boostCharge: s.boostCharge, boostActive: s.boostActive,
      });
    } else {
      // Attract mode — reuse pre-allocated vectors
      const idleP = (t * 0.04) % 1;
      this._v0.copy(spline.getPointAt(idleP));
      this._v1.copy(spline.getPointAt((idleP + 0.022) % 1));
      this._fwd.subVectors(this._v1, this._v0).normalize();
      this._right.crossVectors(this._fwd, this._worldUp).normalize();
      this._up.crossVectors(this._right, this._fwd).normalize();

      this.ship.position.copy(this._v0);
      this._mat4.makeBasis(this._right, this._up, this._v1.copy(this._fwd).negate());
      this.ship.quaternion.slerp(this._qBase.setFromRotationMatrix(this._mat4), 0.08);

      this._v1.copy(this._v0)
        .addScaledVector(this._fwd, -CONFIG.camBack * 2.2)
        .addScaledVector(this._up,   CONFIG.camUp * 1.4);
      this._camPos.lerp(this._v1, 0.04);
      this.camera.position.copy(this._camPos);
      this.camera.lookAt(this._v0);
    }

    const eff2 = s.isPlaying
      ? (s.boostActive ? s.speedMultiplier * CONFIG.boostPower : s.speedMultiplier)
      : 1.0;
    this._tunnelUniforms.uTime.value  = s.elapsedMs;
    this._tunnelUniforms.uSpeed.value = eff2;

    const invFlicker = s.invulnerable ? (Math.sin(t * 28) * 0.5 + 0.5) * 0.35 : 0;
    this.tubeEdge.material.opacity = 0.16 + Math.sin(t * 0.8) * 0.02 + invFlicker;

    this.shipLight.intensity = s.boostActive ? 0.8 : 0.5;

    for (const o of this.activeObstacles) {
      if (!o.active) continue;
      o.mesh.rotateOnAxis(o.rotAxis, delta * o.rotSpeed);
      o.mesh.scale.setScalar(1 + Math.sin(t * 3.5 + o.pathPos * 8) * 0.05);
    }

    for (const c of this.activeCollectibles) {
      if (!c.active) continue;
      c.mesh.rotation.y += delta * 1.4;
      c.mesh.rotation.x += delta * 0.7;
      c.mesh.scale.setScalar(1 + Math.sin(t * 2.8 + c.pathPos * 10) * 0.12);
      c.wire.material.opacity = 0.65 + Math.sin(t * 3 + c.pathPos * 8) * 0.25;
    }

    const starPos = this.starfield.geometry.attributes.position.array;
    const starSpd = eff2 * (s.boostActive ? 18 : 8);
    for (let i = 0; i < this._starCount; i++) {
      const i3 = i * 3;
      starPos[i3+2] += this._starVel[i] * starSpd * delta;
      if (starPos[i3+2] > 100) {
        starPos[i3+2] = -120;
        starPos[i3]   = (Math.random()-0.5)*140;
        starPos[i3+1] = (Math.random()-0.5)*140;
      }
    }
    this.starfield.geometry.attributes.position.needsUpdate = true;

    this._damageAmt *= 0.92;
    this._boostAmt  += ((s.isPlaying && s.boostActive ? 1 : 0) - this._boostAmt) * 0.1;
    this.screenPass.uniforms.uDamage.value = this._damageAmt;
    this.screenPass.uniforms.uBoost.value  = this._boostAmt;

    this.composer.render();
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
    window.removeEventListener('resize',  this._onResize);
    this.renderer.dispose();
  }

  getHighScore() { return this.state.highScore; }
  getBestLevel()  { return this.state.bestLevel; }
}
