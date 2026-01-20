// ==== Three.js sahnasi va renderer ====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ==== Yorug'lik ====
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);

// ==== Shakllar uchun array ====
let shapes = [];

// ==== Qo'l shakllarini aniqlash funksiyasi ====
function createShape(type, size = 1, position = { x: 0, y: 0 }) {
  let geometry;
  let material = new THREE.MeshStandardMaterial({ color: 0xff007b });

  switch (type) {
    case "heart":
      geometry = new THREE.SphereGeometry(size, 32, 32);
      break;
    case "star":
      geometry = new THREE.OctahedronGeometry(size);
      break;
    case "cube":
      geometry = new THREE.BoxGeometry(size, size, size);
      break;
    case "house":
      geometry = new THREE.ConeGeometry(size, size * 1.5, 4);
      break;
    case "text":
      const loader = new THREE.FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        function (font) {
          const textGeo = new THREE.TextGeometry("Sevinch\n31.09.2022", {
            font: font,
            size: 0.5,
            height: 0.1,
          });
          const textMesh = new THREE.Mesh(
            textGeo,
            new THREE.MeshStandardMaterial({ color: 0xffeb3b })
          );
          textMesh.position.set(position.x, position.y, 0);
          scene.add(textMesh);
        }
      );
      return;
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, 0);
  scene.add(mesh);
  shapes.push(mesh);
}

// ==== Mediapipe Hands ====
const videoElement = document.getElementById("input_video");
const hands = new Hands({
  locateFile: (file) =>
    https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file},
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
  // Qol barmoqlarini hisoblash
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const fingersUp = [0, 0, 0, 0, 0]; // Thumb → Pinky

    // Oddiy misol: agar musht bo'lsa (barchasi pastda)
    const threshold = 0.2;
    for (let i = 0; i < 5; i++) {
      if (landmarks[i].y < landmarks[i + 1]?.y) fingersUp[i] = 1;
    }

    // Shakl tanlash
    let shape = null;
    if (fingersUp.join("") === "11111") shape = "heart";
    else if (fingersUp.join("") === "11110") shape = "star";
    else if (fingersUp.join("") === "11100") shape = "cube";
    else if (fingersUp.join("") === "10000") shape = "house";
    else if (
      fingersUp[0] === 1 &&
      fingersUp[1] === 1 &&
      fingersUp[2] === 0 &&
      fingersUp[3] === 0 &&
      fingersUp[4] === 0
    )
      shape = "text";

    if (shape) {
      const x = (landmarks[0].x - 0.5) * 10;
      const y = -(landmarks[0].y - 0.5) * 10;
      createShape(shape, 0.5, { x, y });
    }
  }
});

// ==== Kamera ishga tushirish ====
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
cameraUtils.start();

// ==== Animatsiya ====
function animate() {
  requestAnimationFrame(animate);
  shapes.forEach((s) => (s.rotation.y += 0.01));
  renderer.render(scene, camera);
}
animate();

// ==== Window resize uchun ====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});