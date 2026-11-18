const ambience = document.querySelector(".ambience");
const poster = ambience.querySelector(".airwave-background");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let halo;
let frame;
let frameRateTimer;
let usePoster = navigator.deviceMemory < 4 || navigator.hardwareConcurrency < 4;

function showPoster() {
  cancelAnimationFrame(frame);
  clearTimeout(frameRateTimer);
  ambience.classList.remove("is-live");
  halo?.remove();
  halo = null;
}

function monitorFrameRate() {
  // Give the renderer two consecutive seconds below 24 fps before falling back.
  let start = performance.now();
  let frames = 0;
  let slowWindows = 0;
  function sample(now) {
    frames++;
    const elapsed = now - start;
    if (elapsed >= 1000) {
      if (frames * 1000 / elapsed >= 24) {
        // A healthy animation can run on the compositor between checks.
        frameRateTimer = setTimeout(monitorFrameRate, 15000);
        return;
      }
      frames = 0;
      start = now;
      slowWindows++;
      if (slowWindows >= 2) {
        usePoster = true;
        showPoster();
        return;
      }
    }
    frame = requestAnimationFrame(sample);
  }
  frame = requestAnimationFrame(sample);
}

function reconcileMotion() {
  poster.style.animationPlayState = document.hidden ? "paused" : "running";
  if (document.hidden || usePoster || reducedMotion.matches || navigator.connection?.saveData) {
    showPoster();
    return;
  }
  if (halo) return;

  const template = document.querySelector("#live-background");
  const layer = document.importNode(template.content.firstElementChild, true);
  halo = layer;
  ambience.append(layer);
  Promise.all(Array.from(layer.querySelectorAll("img"), image => image.decode()))
    .then(() => {
      if (layer !== halo) return;
      ambience.classList.add("is-live");
      monitorFrameRate();
    })
    .catch(() => {
      if (layer === halo) showPoster();
    });
}

reconcileMotion();
reducedMotion.addEventListener("change", reconcileMotion);
document.addEventListener("visibilitychange", reconcileMotion);
navigator.connection?.addEventListener("change", reconcileMotion);

const brewButton = document.querySelector(".brew-install");
const brewCode = document.querySelector("#brew-command");
const brewStatus = document.querySelector("#brew-status");
const brewCommand = brewCode.textContent.trim().replace(/\s+/g, " ");
let resetCopy;

brewButton.addEventListener("click", async () => {
  clearTimeout(resetCopy);
  try {
    await navigator.clipboard.writeText(brewCommand);
    brewButton.dataset.state = "copied";
    brewButton.setAttribute("aria-label", "Homebrew command copied");
    brewStatus.textContent = "Copied";
    resetCopy = setTimeout(() => {
      delete brewButton.dataset.state;
      brewButton.setAttribute("aria-label", "Copy Homebrew install command");
      brewStatus.textContent = "";
    }, 2000);
  } catch {
    delete brewButton.dataset.state;
    brewButton.setAttribute("aria-label", "Copy Homebrew install command");
    const range = document.createRange();
    range.selectNodeContents(brewCode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    brewStatus.textContent = "Command selected. Press Command+C to copy.";
  }
});
