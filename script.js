const video = document.getElementById("camera");
const keyboardCanvas = document.getElementById("keyboard-canvas");
const overlay = document.getElementById("rotate-overlay");
const ctx = keyboardCanvas.getContext("2d");

const NUM_KEYS = 14;
let keyWidthPixels = 0;

/* Orientation handling */

function checkOrientation() {
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape) {
    overlay.style.display = "none";
    resizeCanvas();
  } else {
    overlay.style.display = "flex";
  }
}

function resizeCanvas() {
  keyboardCanvas.width = window.innerWidth;
  keyboardCanvas.height = Math.round(window.innerHeight * 0.4);
  keyWidthPixels = keyboardCanvas.width / NUM_KEYS;
  drawKeyboard();
}

/* Keyboard drawing */

function drawKeyboard(highlightIndex = null) {
  ctx.clearRect(0, 0, keyboardCanvas.width, keyboardCanvas.height);

  for (let i = 0; i < NUM_KEYS; i++) {
    const x = i * keyWidthPixels;
    const isHighlight = highlightIndex === i;

    ctx.fillStyle = isHighlight ? "#44aa88" : "#ffffff";
    ctx.fillRect(x, 0, keyWidthPixels - 1, keyboardCanvas.height);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, keyWidthPixels - 1, keyboardCanvas.height);
  }
}

/* Mapping screen x to key index */

function keyIndexFromX(xPixel) {
  const index = Math.floor(xPixel / keyWidthPixels);
  if (index < 0 || index >= NUM_KEYS) return null;
  return index;
}

/* Touch or click test input, still useful for debugging */

function handlePointerEvent(event) {
  const rect = keyboardCanvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const x = clientX - rect.left;
  const keyIndex = keyIndexFromX(x);
  if (keyIndex !== null) {
    console.log("Pointer on key index:", keyIndex);
    drawKeyboard(keyIndex);
    setTimeout(() => drawKeyboard(), 150);
  }
}

keyboardCanvas.addEventListener("pointerdown", handlePointerEvent);
keyboardCanvas.addEventListener("touchstart", handlePointerEvent);

/* Hook that we call from AI results */

function handleFingerXNormalized(xNorm) {
  const xPixel = xNorm * keyboardCanvas.width;
  const keyIndex = keyIndexFromX(xPixel);
  if (keyIndex !== null) {
    console.log("Finger over key index:", keyIndex);
    // Here you will later trigger audio
    drawKeyboard(keyIndex);
    setTimeout(() => drawKeyboard(), 100);
  }
}

/* MediaPipe Hands integration */

/*
  We use:
  - index finger tip = landmark 8
  - x is in [0, 1] with 0 at left
  Our video is mirrored with CSS scaleX(-1)
  To keep movement intuitive we flip x:
  xScreen = 1 - xModel
*/

function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return;
  }

  const hand = results.multiHandLandmarks[0];
  const indexTip = hand[8]; // landmark 8

  if (!indexTip) return;

  let xNorm = indexTip.x;
  // Flip horizontally to match mirrored video
  xNorm = 1 - xNorm;

  handleFingerXNormalized(xNorm);
}

function initHands() {
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start();
}

/* Init */

window.addEventListener("resize", checkOrientation);
window.addEventListener("load", () => {
  checkOrientation();
  resizeCanvas();
  initHands();
});
