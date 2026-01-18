import Stats from "./Stats.min.js";
import { OrbitControls } from "./OrbitControls.js";
import * as THREE from "./three.module.min.js";

// RENDERER

function getRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    preserveDrawingBuffer: true,
    alpha: true,
  });

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor("#000", 1);

  return renderer;
}

// RECORDER

function getRecorder(canvas, chunks) {
  const stream = canvas.captureStream(0);

  const track = stream.getVideoTracks()[0];

  if (!track.requestFrame) {
    track.requestFrame = () => stream.requestFrame();
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm",
  });

  recorder.ondataavailable = (e) => chunks.push(e.data);

  recorder.onstop = (e) => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("download", `art_${new Date().toISOString()}.webm`);
    a.setAttribute("href", url);
    a.click();
    URL.revokeObjectURL(url);
    chunks.length = 0;
  };

  return { track, recorder };
}

// STATS

function getStats() {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  return stats;
}

// CAMERA

function getCamera() {
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.001,
    100
  );

  camera.position.set(0, 0, 20);

  return camera;
}

// CONTROLS

function getControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.saveState();

  return controls;
}

// SECTION

export const scene = new THREE.Scene();
export const camera = getCamera();
export const canvas = document.getElementById("canvas");
export const renderer = getRenderer(canvas);
export const controls = getControls(camera, renderer);
export const clock = new THREE.Clock();
export const stats = getStats();

const chunks = [];
const { track, recorder } = getRecorder(canvas, chunks);
export { track, recorder };

scene.add(camera);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(window.innerWidth, window.innerHeight);
});

export function render() {
  renderer.render(scene, camera);
}

export function startAnimation(updateCallback, recording) {
  function animate() {
    const delta = clock.getDelta();
    render();
    updateCallback(delta, recording);
    if (recording.value) track.requestFrame();
    requestAnimationFrame(animate);
  }
  animate();
}
