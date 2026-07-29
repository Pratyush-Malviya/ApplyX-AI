const API_BASE = "https://jobapply-ai.vercel.app";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    apiUrl: API_BASE,
    autoFill: true,
    userToken: null,
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTOFILL") {
    chrome.storage.local.get(["userToken", "apiUrl"], async (result) => {
      if (!result.userToken) {
        sendResponse({ error: "Not authenticated. Please open the dashboard first." });
        return;
      }
      sendResponse({ success: true, data: message.formData });
    });
    return true;
  }

  if (message.type === "SAVE_APPLICATION") {
    saveApplication(message.data);
  }
});

async function saveApplication(data: any) {
  chrome.storage.local.get(["applications"], (result) => {
    const apps = result.applications || [];
    apps.push({ ...data, timestamp: new Date().toISOString() });
    chrome.storage.local.set({ applications: apps });
  });
}