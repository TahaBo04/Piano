const video = document.getElementById("camera");
const keyboardCanvas = document.getElementById("keyboard-canvas");
const overlay = document.getElementById("rotate-overlay");
const ctx = keyboardCanvas.getContext("2d");

const NUM_KEYS = 14;        // white keys along the width
let keyWidthPixels = 0;

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

/* Map a screen x coordinate to key index */
function keyIndexFromX(xPixel) {
  const index = Math.floor(xPixel / keyWidthPixels);
  if (index < 0 || index >= NUM_KEYS) return null;
  return index;
}

/* Simulate fingertip with touch or click so you can test the mapping */
function handlePointerEvent(event) {
  const rect = keyboardCanvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const x = clientX - rect.left;
  const keyIndex = keyIndexFromX(x);
  if (keyIndex !== null) {
    console.log("Pointer on key index:", keyIndex);
    drawKeyboard(keyIndex);

    // After a short delay, remove highlight
    setTimeout(() => drawKeyboard(), 150);
  }
}

keyboardCanvas.addEventListener("pointerdown", handlePointerEvent);
keyboardCanvas.addEventListener("touchstart", handlePointerEvent);

/*
  This is the hook for AI hand tracking.
  Later, when you use MediaPipe Hands, you will have fingertip x in [0,1].
  Call this function with that normalized value to reuse the same mapping logic.
*/
function handleFingerXNormalized(xNorm) {
  const xPixel = xNorm * keyboardCanvas.width;
  const keyIndex = keyIndexFromX(xPixel);
  if (keyIndex !== null) {
    console.log("Finger over key index:", keyIndex);
    drawKeyboard(keyIndex);
    setTimeout(() => drawKeyboard(), 150);
  }
}

/* Camera setup */
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
  }
}

/* Init */
window.addEventListener("resize", checkOrientation);
window.addEventListener("load", () => {
  checkOrientation();
  initCamera();
});
