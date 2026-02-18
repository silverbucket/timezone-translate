chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-timezone",
    title: "Timezone Translate",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "translate-timezone") return;
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, {
    type: "TRANSLATE_TIMEZONE",
    selectedText: info.selectionText,
  });
});
