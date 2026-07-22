// grass.js — secret option 5: a three.js render of grass.
// pure vibes. no app logic touched.
import * as THREE from 'https://esm.sh/three@0.160.0';

const GRASS_VERT = `
uniform float uTime;
attribute float aPhase;
attribute float aHeight;
varying float vY;
void main() {
  vec3 p = position;
  float sway = sin(uTime * 1.5 + aPhase) * 0.18 * (p.y / aHeight);
  p.x += sway;
  p.z += cos(uTime * 1.1 + aPhase) * 0.10 * (p.y / aHeight);
  vY = p.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const GRASS_FRAG = `
varying float vY;
void main() {
  float t = clamp(vY / 2.0, 0.0, 1.0);
  vec3 base = mix(vec3(0.10, 0.35, 0.08), vec3(0.45, 0.85, 0.30), t);
  gl_FragColor = vec4(base, 1.0);
}
`;

let _scene = null;
let _raf = 0;

function buildGrass(canvas, opts = {}) {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 12, 30);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 1.4, 6);
  camera.lookAt(0, 1.0, 0);

  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(4, 8, 5);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x3a5f0a, 0.6));

  const COUNT = 9000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 6 * 3);
  const phase = new Float32Array(COUNT * 6);
  const height = new Float32Array(COUNT * 6);
  const blade = (cx, cz, i) => {
    const bladeH = 0.7 + Math.random() * 1.6;
    const halfW = 0.018 + Math.random() * 0.02;
    const b = i * 6 * 3;
    const set = (v, x, y, z) => { pos[b + v * 3] = x; pos[b + v * 3 + 1] = y; pos[b + v * 3 + 2] = z; };
    set(0, cx - halfW, 0, cz);
    set(1, cx, bladeH, cz);
    set(2, cx + halfW, 0, cz);
    set(3, cx + halfW, 0, cz);
    set(4, cx, bladeH, cz);
    set(5, cx - halfW, 0, cz);
    for (let k = 0; k < 6; k++) { phase[i * 6 + k] = Math.random() * Math.PI * 2; height[i * 6 + k] = bladeH; }
  };
  for (let i = 0; i < COUNT; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()) * 11;
    blade(Math.cos(ang) * rad, Math.sin(ang) * rad, i);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aHeight', new THREE.BufferAttribute(height, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: GRASS_VERT,
    fragmentShader: GRASS_FRAG,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const start = performance.now();
  const clock = { t: 0 };
  const loop = () => {
    clock.t = (performance.now() - start) / 1000;
    mat.uniforms.uTime.value = clock.t;
    camera.position.x = Math.sin(clock.t * 0.15) * 1.2;
    camera.lookAt(0, 1.0, 0);
    renderer.render(scene, camera);
    _raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    stop() { cancelAnimationFrame(_raf); renderer.dispose(); },
    resize() { const nw = canvas.clientWidth, nh = canvas.clientHeight; renderer.setSize(nw, nh, false); camera.aspect = nw / nh; camera.updateProjectionMatrix(); },
  };
}

window.grass = (target) => {
  const mount = typeof target === 'string' ? document.querySelector(target) : (target || document.body);
  if (!mount) { console.warn('grass: no mount'); return null; }
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;pointer-events:none;';
  if (mount === document.body) document.body.appendChild(canvas);
  else mount.appendChild(canvas);
  const ctrl = buildGrass(canvas);
  const onR = () => ctrl.resize();
  window.addEventListener('resize', onR);
  console.log('%c🌱 grass engaged. window.grassOff() to stop.', 'color:#2f9e44');
  window.grassOff = () => { ctrl.stop(); window.removeEventListener('resize', onR); canvas.remove(); delete window.grassOff; };
  return ctrl;
};
