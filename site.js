const background = document.querySelector(".airwave-background");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function reconcileMotion() {
  if (reducedMotion.matches || document.visibilityState !== "visible") background.pauseAnimations();
  else background.unpauseAnimations();
}

background.setCurrentTime(8);
reconcileMotion();
reducedMotion.addEventListener("change", reconcileMotion);
document.addEventListener("visibilitychange", reconcileMotion);

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
