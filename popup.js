const toggle = document.getElementById("enabled");
const state = document.getElementById("state");

function render(enabled) {
  toggle.checked = enabled;
  state.textContent = enabled ? "Расширение включено" : "Расширение выключено";
}

chrome.storage.local.get({ enabled: true }, (settings) => {
  const error = chrome.runtime.lastError;
  render(settings?.enabled !== false);
  if (error) state.textContent = "Не удалось загрузить настройку";
  toggle.disabled = false;
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  toggle.disabled = true;
  chrome.storage.local.set({ enabled }, () => {
    const error = chrome.runtime.lastError;
    render(error ? !enabled : enabled);
    if (error) state.textContent = "Не удалось сохранить настройку";
    toggle.disabled = false;
  });
});
