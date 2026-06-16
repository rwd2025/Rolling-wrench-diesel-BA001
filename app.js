// BA001 RWD Ghost Shield Visual Add-on
// Safe drop-in helper. Does not create test data.
(function () {
  function applyRwdGhostVisuals() {
    document.documentElement.classList.add("ba001-rwd-green");
    if (document.body) document.body.classList.add("rwd-ghost-shell");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyRwdGhostVisuals);
  } else {
    applyRwdGhostVisuals();
  }
})();
