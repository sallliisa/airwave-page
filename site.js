const ambience = document.querySelector(".ambience");
const poster = ambience.querySelector(".airwave-background");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let halo;
let frame;
let usePoster = navigator.deviceMemory < 4 || navigator.hardwareConcurrency < 4;

function showPoster() {
  cancelAnimationFrame(frame);
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
      slowWindows = frames * 1000 / elapsed < 24 ? slowWindows + 1 : 0;
      frames = 0;
      start = now;
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

  const image = new Image();
  halo = image;
  image.alt = "";
  image.className = "live-halo";
  image.addEventListener("load", () => {
    if (image !== halo) return;
    ambience.classList.add("is-live");
    monitorFrameRate();
  });
  image.addEventListener("error", () => {
    if (image === halo) showPoster();
  });
  image.src = "design/background.svg";
  ambience.append(image);
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
