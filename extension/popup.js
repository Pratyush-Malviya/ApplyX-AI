document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn") as HTMLButtonElement;
  const fillBtn = document.getElementById("fillBtn") as HTMLButtonElement;
  const openDashboardBtn = document.getElementById("openDashboardBtn") as HTMLButtonElement;
  const statusText = document.getElementById("statusText") as HTMLDivElement;
  const fieldList = document.getElementById("fieldList") as HTMLDivElement;
  const fieldsSection = document.getElementById("fieldsSection") as HTMLDivElement;
  const errorMsg = document.getElementById("errorMsg") as HTMLDivElement;

  let detectedFields: any[] = [];
  let currentUrl = "";

  function showError(msg: string) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    setTimeout(() => { errorMsg.style.display = "none"; }, 5000);
  }

  function setStatus(text: string, type: string = "default") {
    statusText.textContent = text;
    statusText.style.color = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#1e293b";
  }

  async function queryCurrentTab(action: string, data?: any): Promise<any> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!, { type: action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error("Content script not loaded. Refresh the page."));
        } else {
          resolve(response);
        }
      });
    });
  }

  scanBtn.addEventListener("click", async () => {
    scanBtn.disabled = true;
    setStatus("Scanning page...");
    fieldList.innerHTML = "";

    try {
      const result = await queryCurrentTab("SCAN_FIELDS");
      detectedFields = result.fields || [];
      currentUrl = result.url || "";

      if (detectedFields.length === 0) {
        setStatus("No form fields detected", "error");
        fieldsSection.style.display = "none";
        fillBtn.disabled = true;
      } else {
        setStatus(`Found ${detectedFields.length} fields`, "success");
        fieldsSection.style.display = "block";
        fieldList.innerHTML = detectedFields
          .map((f: any) =>
            `<div class="field-item">
              <span class="field-name">${f.label || f.name}</span>
              <span class="field-status">${f.type}</span>
            </div>`
          ).join("");
        fillBtn.disabled = false;
      }
    } catch (err: any) {
      setStatus("Scan failed", "error");
      showError(err.message);
    }

    scanBtn.disabled = false;
  });

  fillBtn.addEventListener("click", async () => {
    fillBtn.disabled = true;
    setStatus("Filling fields...");

    chrome.storage.local.get(["userData"], async (result) => {
      const data = result.userData || {
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        company: "",
        jobTitle: "",
        skills: "",
        location: "",
      };

      try {
        const result = await queryCurrentTab("FILL_FIELDS", data);
        setStatus(`Filled ${result.count} fields`, "success");
      } catch (err: any) {
        setStatus("Fill failed", "error");
        showError(err.message);
      }

      fillBtn.disabled = false;
    });
  });

  openDashboardBtn.addEventListener("click", () => {
    chrome.storage.local.get(["apiUrl"], (result) => {
      chrome.tabs.create({ url: result.apiUrl || "https://jobapply-ai.vercel.app/dashboard" });
    });
  });

  setStatus("Ready — click Scan to detect fields");
});