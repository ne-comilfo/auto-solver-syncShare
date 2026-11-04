(() => {
  if (globalThis.__syncshareFillUiInstalled) return;
  globalThis.__syncshareFillUiInstalled = true;

  const BUTTON_ID = "syncshare-stat-fill-button";

  function hasSyncShareStatistics() {
    if (!document.body || typeof chrome.dom?.openOrClosedShadowRoot !== "function") return false;
    try {
      return Boolean(chrome.dom.openOrClosedShadowRoot(document.body)?.querySelector("ul.syncshare-cm"));
    } catch {
      return false;
    }
  }

  function fill() {
    return globalThis.__syncshareFillPage();
  }

  function updateButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (!hasSyncShareStatistics()) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Заполнить по статистике";
    button.setAttribute("aria-label", "Заполнить ответы по статистике SyncShare");
    button.style.cssText = [
      "all:initial", "position:fixed", "right:16px", "bottom:16px", "z-index:2147483646",
      "padding:12px 16px", "border-radius:8px", "background:#16803D", "color:#fff",
      "font:600 14px/1.3 system-ui,sans-serif", "cursor:pointer",
      "box-shadow:0 4px 16px rgba(0,0,0,.25)"
    ].join(";");
    button.addEventListener("click", fill);
    document.body.appendChild(button);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "SYNC_SHARE_FILL") return;
    sendResponse(fill());
  });

  updateButton();
  const interval = setInterval(updateButton, 1500);
  window.addEventListener("pagehide", () => clearInterval(interval), { once: true });
})();
