import * as THREE from 'three';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) throw new Error('#app is missing from index.html');

app.innerHTML = `
  <div id="stage"></div>
  <div id="status">starting WebGL…</div>
`;

const stage = document.querySelector<HTMLDivElement>('#stage')!;
const status = document.querySelector<HTMLDivElement>('#status')!;

function fail(message: string): void {
  status.textContent = message;
  status.classList.add('error');
}

function start(): void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (error) {
    fail(`WebGL FAILED: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  const gl = renderer.getContext();
  const version = gl.getParameter(gl.VERSION) as string;
  status.textContent = `WebGL OK · ${version} · frame 0 · angle 0°`;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101018);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(2.6, 2.0, 3.4);
  camera.lookAt(0, 0, 0);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshNormalMaterial(),
  );
  scene.add(cube);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
  );
  cube.add(edges);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let frame = 0;
  const tick = (): void => {
    cube.rotation.x += 0.008;
    cube.rotation.y += 0.013;
    renderer.render(scene, camera);
    frame += 1;
    if (frame % 20 === 0) {
      const degrees = Math.round(((cube.rotation.y * 180) / Math.PI) % 360);
      status.textContent = `WebGL OK · ${version} · frame ${frame} · angle ${degrees}°`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

start();
