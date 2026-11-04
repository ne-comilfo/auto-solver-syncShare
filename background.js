chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["fill.js"]
    });

    const result = injection?.result;
    const text = result?.applied ? String(result.applied) : result?.ok ? "0" : "!";
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: result?.ok ? "#16803D" : "#B42318" });
    await chrome.action.setBadgeText({ tabId: tab.id, text });
  } catch (error) {
    console.error("Не удалось запустить надстройку SyncShare:", error);
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#B42318" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
  }
});
