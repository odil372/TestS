// Three.js sahna yaratish
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

// Zarralar container
let particles = [];

// Shakl yaratish funksiyasi
function createShape(type="Sphere", scale=1, position={x:0,y:0}) {
  let geometry;
  if(type==="Sphere") geometry = new THREE.SphereGeometry(0.2*scale,16,16);
  else if(type==="Cube") geometry = new THREE.BoxGeometry(0.3*scale,0.3*scale,0.3*scale);
  else if(type==="Star") geometry = new THREE.ConeGeometry(0.2*scale,0.4*scale,5);
  else if(type==="Heart") geometry = new THREE.TorusKnotGeometry(0.15*scale,0.05*scale,100,16);
  else geometry = new THREE.SphereGeometry(0.2*scale,16,16);

  const material = new THREE.MeshBasicMaterial({color:0xff007b});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, 0);
  scene.add(mesh);
  particles.push(mesh);
}

// Animate loop
function animate() {
  requestAnimationFrame(animate);
  particles.forEach(p=>{ p.rotation.x += 0.01; p.rotation.y += 0.01; });
  renderer.render(scene, camera);
}
animate();

// Mediapipe Hands
const videoElement = document.getElementById('input_video');
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({
  maxNumHands:1,
  minDetectionConfidence:0.7,
  minTrackingConfidence:0.5
});

hands.onResults((results)=>{
  if(!results.multiHandLandmarks) return;
  const landmarks = results.multiHandLandmarks[0];

  // Qo‘l barmog‘i soni
  let fingers = 0;
  if(landmarks[8].y < landmarks[6].y) fingers++;
  if(landmarks[12].y < landmarks[10].y) fingers++;
  if(landmarks[16].y < landmarks[14].y) fingers++;
  if(landmarks[20].y < landmarks[18].y) fingers++;
  if(landmarks[4].y < landmarks[3].y) fingers++;

  // Shakl tanlash
  let shape="Sphere";
  if(fingers===5) shape="Heart";
  else if(fingers===4) shape="Star";
  else if(fingers===3) shape="Cube";
  else if(fingers===0) shape="Heart"; // Musht
  document.getElementById('shape-name').textContent=shape;

  // Ok belgisi (👌) - Sevinch yozuvi
  if(fingers===2 && landmarks[8].x < landmarks[12].x && landmarks[8].y > landmarks[12].y){
    createShape("Sphere",{text:"Sevinch\n31.09.2022"});
    return;
  }

  // Qo‘l pozitsiyasi sahnaga
  const posX = (landmarks[0].x-0.5)*10;
  const posY = -(landmarks[0].y-0.5)*10;

  createShape(shape, 1, {x:posX,y:posY});
});

// Kamera ishga tushirish
const cameraUtils = new Camera(videoElement, { onFrame: async ()=>{ await hands.send({image:videoElement}); }, width:640, height:480 });
cameraUtils.start();

// Window resize
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});