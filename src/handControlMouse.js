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

  if (predictions.length > 0) {
    const hand = predictions[0];
    const cursorX = video.width - hand.landmarks[9][0];
    const cursorY = hand.landmarks[9][1];

    if (isHandClosed(hand)) {
      document.getElementById("title").innerText = "Mão fechada!";
      debouncePlayPause();
    } else {
      document.getElementById("title").innerText = "Mão aberta!";
    }

    moveCursor(cursorX, cursorY);
  }

  requestAnimationFrame(detectHand);
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

function debouncePlayPause() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

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
