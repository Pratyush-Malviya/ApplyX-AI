let userData = null;
let detectedFields = new Map();

function detectFormFields() {
  detectedFields.clear();
  const inputs = document.querySelectorAll("input, textarea, select");

  inputs.forEach((el) => {
    const field = identifyField(el);
    if (field) {
      detectedFields.set(field.name, { element: el, type: field.type });
    }
  });

  return Array.from(detectedFields.entries()).map(([name, info]) => ({
    name,
    type: info.type,
    placeholder: info.element.placeholder || "",
    label: getLabel(info.element),
  }));
}

function identifyField(el: HTMLElement): { name: string; type: string } | null {
  const tag = el.tagName.toLowerCase();
  const id = (el as any).id?.toLowerCase() || "";
  const name = (el as any).name?.toLowerCase() || "";
  const placeholder = ((el as any).placeholder || "").toLowerCase();
  const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
  const type = (el as any).type?.toLowerCase() || "";

  const patterns = [
    { keywords: ["name", "fullname", "full-name", "your name"], type: "name" },
    { keywords: ["email", "e-mail", "mail"], type: "email" },
    { keywords: ["phone", "mobile", "telephone", "phone number", "contact"], type: "phone" },
    { keywords: ["linkedin"], type: "linkedin" },
    { keywords: ["github"], type: "github" },
    { keywords: ["resume", "cv", "upload-cv", "upload resume"], type: "resume" },
    { keywords: ["cover letter", "cover-letter"], type: "cover-letter" },
    { keywords: ["company", "organization"], type: "company" },
    { keywords: ["title", "position", "job title"], type: "job-title" },
    { keywords: ["skills", "technologies"], type: "skills" },
    { keywords: ["education", "degree", "school", "university", "college"], type: "education" },
    { keywords: ["experience", "years"], type: "experience" },
    { keywords: ["city", "location", "address"], type: "location" },
    { keywords: ["website", "portfolio", "url"], type: "website" },
    { keywords: ["message", "additional info", "notes", "comment"], type: "message" },
    { keywords: ["hear about us", "referral", "source"], type: "referral" },
  ];

  const text = `${id} ${name} ${placeholder} ${ariaLabel}`;

  for (const pattern of patterns) {
    if (pattern.keywords.some((kw) => text.includes(kw))) {
      return { name: pattern.type, type: pattern.type };
    }
  }

  if ((el as any).type === "file" && (text.includes("resume") || text.includes("cv"))) {
    return { name: "resume", type: "resume" };
  }

  if ((el as any).type === "email" || name.includes("email") || id.includes("email")) {
    return { name: "email", type: "email" };
  }

  if ((el as any).type === "tel" || name.includes("phone") || name.includes("mobile")) {
    return { name: "phone", type: "phone" };
  }

  return null;
}

function getLabel(el: HTMLElement): string {
  const id = (el as any).id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || "";
  }
  const parent = el.closest(".form-group, .field, .input-group");
  if (parent) {
    const label = parent.querySelector("label");
    if (label) return label.textContent?.trim() || "";
  }
  return "";
}

function autofillFields(data: any) {
  const filled: string[] = [];

  detectedFields.forEach((info, fieldName) => {
    const value = getValueForField(fieldName, data);
    if (value) {
      const el = info.element as HTMLInputElement;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(el, value);

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));

      filled.push(fieldName);
    }
  });

  return filled;
}

function getValueForField(fieldName: string, data: any): string {
  const map: Record<string, string> = {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    linkedin: data.linkedin || "",
    github: data.github || "",
    company: data.company || "",
    "job-title": data.jobTitle || "",
    skills: data.skills || "",
    education: data.education || "",
    experience: data.experience || "",
    location: data.location || "",
    website: data.website || "",
  };
  return map[fieldName] || "";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCAN_FIELDS") {
    const fields = detectFormFields();
    sendResponse({ fields, url: window.location.href, title: document.title });
    return true;
  }

  if (message.type === "FILL_FIELDS") {
    const filled = autofillFields(message.data);
    sendResponse({ filled, count: filled.length });
    return true;
  }
});

console.log("JobApplyAI content script loaded");