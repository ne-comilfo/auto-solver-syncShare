globalThis.__syncshareFillPage = () => {
  const TOAST_ID = "syncshare-stat-fill-result";

  function showResult(message, isError = false) {
    document.getElementById(TOAST_ID)?.remove();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.textContent = message;
    toast.setAttribute("role", "status");
    toast.style.cssText = [
      "position:fixed", "right:16px", `bottom:${document.getElementById("syncshare-stat-fill-button") ? "72px" : "16px"}`, "z-index:2147483647",
      "max-width:360px", "padding:12px 16px", "border-radius:8px",
      "font:14px/1.4 system-ui,sans-serif", "color:#fff",
      `background:${isError ? "#B42318" : "#16803D"}`,
      "box-shadow:0 4px 16px rgba(0,0,0,.25)"
    ].join(";");
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  }

  function fail(message) {
    showResult(message, true);
    return { ok: false, applied: 0, message };
  }

  if (typeof chrome.dom?.openOrClosedShadowRoot !== "function") {
    return fail("Chrome не поддерживает доступ к меню SyncShare.");
  }

  const getShadowRoot = (element) => {
    try {
      return chrome.dom.openOrClosedShadowRoot(element);
    } catch {
      return null;
    }
  };

  const globalRoot = getShadowRoot(document.body);
  if (!globalRoot) {
    return fail("Меню SyncShare ещё не загружено. Обновите страницу и попробуйте снова.");
  }

  const menus = Array.from(globalRoot.querySelectorAll("ul.syncshare-cm"));
  if (menus.length === 0) {
    return fail("SyncShare пока не показал статистику на этой странице.");
  }

  function isGreenColor(cssColor) {
    const match = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!match) return false;
    const [, red, green, blue] = match.map(Number);
    return green > red + 8 && green > blue + 8;
  }

  function isGreenBadge(badge) {
    const style = getComputedStyle(badge);
    return isGreenColor(style.color) || isGreenColor(style.backgroundColor);
  }

  function getStatisticsRows(menu) {
    const sections = Array.from(menu.children).filter((node) => node.matches("li.menu-item"));
    const statistics = sections.find((section) => {
      const label = section.querySelector(":scope > .item-label")?.textContent?.trim();
      return label === "Статистика" || label === "Submissions";
    });
    const list = statistics?.querySelector(":scope > ul.sub-menu");
    if (!list) return [];

    return Array.from(list.children).flatMap((row) => {
      if (!row.matches("li.menu-item")) return [];
      const badge = Array.from(row.children)
        .find((node) => node.matches(".postfix"))
        ?.querySelector(":scope > .content");
      const countText = badge?.textContent?.trim();
      if (!countText || !/^\d+$/.test(countText)) return [];
      return [{ row, count: Number(countText), green: isGreenBadge(badge) }];
    });
  }

  function findSyncShareButtons() {
    const buttons = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    for (let host = walker.currentNode; host; host = walker.nextNode()) {
      const root = getShadowRoot(host);
      if (!root) continue;
      for (const element of root.children) {
        if (element.matches("span.icon") && element.style.cursor === "pointer") {
          buttons.push(element);
        }
      }
    }
    return buttons;
  }

  const buttons = findSyncShareButtons();
  if (buttons.length === 0) {
    return fail("На этой странице не найдены иконки SyncShare.");
  }
  const inputs = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'));

  let applied = 0;
  let changed = 0;
  let skipped = 0;
  let ties = 0;

  for (const button of buttons) {
    button.click();
    const visibleMenus = menus.filter((menu) => !menu.hidden && getComputedStyle(menu).display !== "none");
    if (visibleMenus.length !== 1) {
      skipped++;
      continue;
    }

    const rows = getStatisticsRows(visibleMenus[0]);
    if (rows.length === 0) {
      skipped++;
      continue;
    }

    const greenRows = rows.filter((entry) => entry.green);
    const pool = greenRows.length ? greenRows : rows;
    const maximum = Math.max(...pool.map((entry) => entry.count));
    const winners = pool.filter((entry) => entry.count === maximum);
    if (winners.length !== 1) {
      ties++;
      continue;
    }

    const winner = winners[0].row;
    if (winner.querySelector(":scope > ul.sub-menu")) {
      skipped++;
      continue;
    }

    const before = inputs.map((input) => input.checked);
    winner.click();
    applied++;
    changed += inputs.filter((input, index) => input.checked !== before[index]).length;
  }

  const details = [`Применено: ${applied}`, `изменено вариантов: ${changed}`];
  if (skipped) details.push(`без данных: ${skipped}`);
  if (ties) details.push(`ничья: ${ties}`);
  showResult(details.join(" · "), applied === 0);
  return { ok: applied > 0, applied, changed, skipped, ties };
};
