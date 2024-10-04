const cursorIndicator = document.createElement("div");
Object.assign(cursorIndicator.style, {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: "red",
  position: "absolute",
  pointerEvents: "none",
  zIndex: 999999,
});
document.body.appendChild(cursorIndicator);

let model;
let video;
let lastPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let debounceTimeout;

async function startCamera() {
  video = document.createElement("video");
  video.style.transform = "scaleX(-1)";
  video.width = 640;
  video.height = 480;
  document.body.appendChild(video);

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
}

async function loadModel() {
  model = await handpose.load();
}

async function detectHand() {
  const predictions = await model.estimateHands(video);
  handleHandDetection(predictions);
  requestAnimationFrame(detectHand);
}

function handleHandDetection(predictions) {
  if (predictions.length > 0) {
    const hand = predictions[0];
    const cursorX = video.videoWidth - hand.landmarks[9][0];
    const cursorY = hand.landmarks[9][1];

    if (isHandClosed(hand) && isArmRaised(hand)) {
      document.getElementById("title").innerText =
        "Mão fechada e braço levantado!";
      debouncePlayPause();
    } else {
      document.getElementById("title").innerText =
        "Mão aberta ou braço abaixado!";
    }

    moveCursor(cursorX, cursorY);
  }
}

function moveCursor(x, y) {
  cursorIndicator.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
}

function isHandClosed(hand) {
  const thumbTipY = hand.landmarks[4][1];
  const indexTipY = hand.landmarks[8][1];
  const middleTipY = hand.landmarks[12][1];
  const ringTipY = hand.landmarks[16][1];
  const pinkyTipY = hand.landmarks[20][1];

  const threshold = 25;
  return (
    thumbTipY < indexTipY + threshold &&
    thumbTipY < middleTipY + threshold &&
    thumbTipY < ringTipY + threshold &&
    thumbTipY < pinkyTipY + threshold
  );
}

function isArmRaised(hand) {
  const wristY = hand.landmarks[0][1];
  const elbowY = hand.landmarks[7][1];

  return elbowY < wristY;
}

function debouncePlayPause() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    playPauseVideo();
  }, 200);
}

function playPauseVideo() {
  const audio = document.getElementById("audio");

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

async function init() {
  await startCamera();
  await loadModel();
  document.getElementById("title").innerText = "Movimente sua mão!";
  detectHand();
}

init();
