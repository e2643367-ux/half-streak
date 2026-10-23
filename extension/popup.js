const enabledInput = document.querySelector("#enabled");
const status = document.querySelector("#status");
const notice = document.querySelector("#notice");

function render(enabled) {
  enabledInput.checked = enabled;
  status.textContent = enabled ? "有効" : "無効";
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => render(enabled));

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });
  const response = await chrome.runtime.sendMessage({ type: "set-enabled", enabled });
  render(enabled);
  notice.textContent = response?.ok ? "設定を保存しました" : "設定の保存に失敗しました";
  setTimeout(() => { notice.textContent = ""; }, 1800);
});
