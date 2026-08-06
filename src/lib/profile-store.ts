export interface CandidateProfile {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  targetRole: string;
  location: string;
  skills: string[];
  experienceYears?: string;
  activeResumeId?: string;
  activeResumeName?: string;
  activeResumeText?: string;
  activeResumeSections?: Record<string, string>;
  updatedAt: string;
}

export interface SavedResume {
  id: string;
  fileName: string;
  fileType: string;
  parsedText: string;
  parsedSections: Record<string, string>;
  createdAt: string;
  isActive: boolean;
}

export interface SavedApplication {
  id: string;
  company: string;
  role: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  date: string;
  jobUrl?: string;
  notes?: string;
  matchScore?: number;
}

const PROFILE_KEY = "applyx_candidate_profile";
const RESUMES_KEY = "applyx_saved_resumes";
const APPLICATIONS_KEY = "applyx_job_applications";

function getScopedKey(baseKey: string, userId?: string): string {
  if (userId) return `${baseKey}_${userId}`;
  if (typeof window !== "undefined") {
    // Try to retrieve active user email/id from Supabase auth cookie or cached session
    try {
      const activeUserStr = localStorage.getItem("applyx_active_user_id");
      if (activeUserStr) return `${baseKey}_${activeUserStr}`;
    } catch {}
  }
  return baseKey;
}

export function setActiveUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem("applyx_active_user_id", userId);
  } else {
    localStorage.removeItem("applyx_active_user_id");
  }
}

export function clearAllLocalStores() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("applyx_")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Retrieve candidate profile from LocalStorage (with fallback)
export function getLocalProfile(userId?: string): CandidateProfile {
  if (typeof window === "undefined") {
    return createEmptyProfile();
  }
  try {
    const key = getScopedKey(PROFILE_KEY, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return createEmptyProfile();
    return JSON.parse(raw);
  } catch {
    return createEmptyProfile();
  }
}

// Save candidate profile to LocalStorage
export function saveLocalProfile(profile: Partial<CandidateProfile>, userId?: string): CandidateProfile {
  if (typeof window === "undefined") return createEmptyProfile();
  const current = getLocalProfile(userId);
  const updated: CandidateProfile = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  const key = getScopedKey(PROFILE_KEY, userId);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

// Retrieve saved resumes list
export function getLocalResumes(userId?: string): SavedResume[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getScopedKey(RESUMES_KEY, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const list: SavedResume[] = JSON.parse(raw);
    return list.map((r) => ({ ...r, isActive: !!r.isActive }));
  } catch {
    return [];
  }
}

// Save new resume to LocalStorage and update candidate active profile
export function saveLocalResume(resume: Omit<SavedResume, "id" | "createdAt" | "isActive">, userId?: string): SavedResume {
  if (typeof window === "undefined") {
    return { id: "temp", ...resume, createdAt: new Date().toISOString(), isActive: true };
  }

  const resumes = getLocalResumes(userId);
  const newResume: SavedResume = {
    ...resume,
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  // Mark other resumes as non-active
  const updatedList: SavedResume[] = resumes.map((r) => ({ ...r, isActive: false }));
  updatedList.unshift(newResume);

  const key = getScopedKey(RESUMES_KEY, userId);
  localStorage.setItem(key, JSON.stringify(updatedList));

  // Extract skills from resume text
  const extractedSkills = extractSkillsFromText(resume.parsedText);
  const details = extractProfileDetails(resume.parsedSections, resume.parsedText);

  // Automatically update candidate profile active resume
  saveLocalProfile({
    activeResumeId: newResume.id,
    activeResumeName: newResume.fileName,
    activeResumeText: newResume.parsedText,
    activeResumeSections: newResume.parsedSections,
    skills: extractedSkills.length > 0 ? extractedSkills : ["React", "TypeScript", "Node.js"],
    fullName: details.fullName !== "Job Seeker" ? details.fullName : undefined,
    email: details.email || undefined,
    phone: details.phone || undefined,
    linkedin: details.linkedin || undefined,
    targetRole: details.targetRole,
    location: details.location,
  }, userId);

  return newResume;
}

// Set a specific saved resume as active
export function setActiveLocalResume(id: string, userId?: string): SavedResume | null {
  const resumes = getLocalResumes(userId);
  const target = resumes.find((r) => r.id === id);
  if (!target) return null;

  const updatedList: SavedResume[] = resumes.map((r) => ({
    ...r,
    isActive: r.id === id,
  }));

  const key = getScopedKey(RESUMES_KEY, userId);
  localStorage.setItem(key, JSON.stringify(updatedList));

  const details = extractProfileDetails(target.parsedSections, target.parsedText);

  saveLocalProfile({
    activeResumeId: target.id,
    activeResumeName: target.fileName,
    activeResumeText: target.parsedText,
    activeResumeSections: target.parsedSections,
    fullName: details.fullName !== "Job Seeker" ? details.fullName : undefined,
    email: details.email || undefined,
    phone: details.phone || undefined,
    linkedin: details.linkedin || undefined,
    targetRole: details.targetRole,
    location: details.location,
  }, userId);

  return { ...target, isActive: true };
}

// ── Applications Tracker Helpers ──

export function getLocalApplications(userId?: string): SavedApplication[] {
  if (typeof window === "undefined") return getInitialApplications();
  try {
    const key = getScopedKey(APPLICATIONS_KEY, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = getInitialApplications();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialApplications();
  }
}

export function saveLocalApplication(app: Omit<SavedApplication, "id" | "date">, userId?: string): SavedApplication {
  const current = getLocalApplications(userId);
  const newApp: SavedApplication = {
    ...app,
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toLocaleDateString("en-IN"),
  };

  const updated = [newApp, ...current];
  if (typeof window !== "undefined") {
    const key = getScopedKey(APPLICATIONS_KEY, userId);
    localStorage.setItem(key, JSON.stringify(updated));
  }
  return newApp;
}

export function updateLocalApplicationStatus(id: string, newStatus: SavedApplication["status"], userId?: string): SavedApplication[] {
  const current = getLocalApplications(userId);
  const updated = current.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
  if (typeof window !== "undefined") {
    const key = getScopedKey(APPLICATIONS_KEY, userId);
    localStorage.setItem(key, JSON.stringify(updated));
  }
  return updated;
}

export function deleteLocalApplication(id: string, userId?: string): SavedApplication[] {
  const current = getLocalApplications(userId);
  const updated = current.filter((a) => a.id !== id);
  if (typeof window !== "undefined") {
    const key = getScopedKey(APPLICATIONS_KEY, userId);
    localStorage.setItem(key, JSON.stringify(updated));
  }
  return updated;
}

function getInitialApplications(): SavedApplication[] {
  return [
    {
      id: "app_1",
      company: "Swiggy",
      role: "Senior Frontend Engineer",
      status: "interview",
      date: new Date().toLocaleDateString("en-IN"),
      jobUrl: "https://linkedin.com",
      notes: "Round 1 System Design scheduled",
      matchScore: 94,
    },
    {
      id: "app_2",
      company: "Flipkart",
      role: "Full Stack Engineer",
      status: "applied",
      date: new Date().toLocaleDateString("en-IN"),
      notes: "Tailored resume submitted via portal",
      matchScore: 88,
    },
  ];
}

// Helper to create initial blank profile
function createEmptyProfile(): CandidateProfile {
  return {
    fullName: "Job Seeker",
    targetRole: "Software Engineer",
    location: "Bengaluru, India / Remote",
    skills: ["React", "TypeScript", "Node.js", "Python", "SQL"],
    experienceYears: "3-5 Years",
    updatedAt: new Date().toISOString(),
  };
}

// Simple skill extraction helper from resume text
function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const knownSkills = [
    "React", "Next.js", "Vue", "Angular", "TypeScript", "JavaScript",
    "Node.js", "Express", "Python", "Django", "FastAPI", "Java", "Spring Boot",
    "C++", "Go", "Rust", "SQL", "PostgreSQL", "MongoDB", "Redis",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git",
    "REST API", "GraphQL", "Tailwind CSS", "Redux", "Microservices",
    "Agile", "System Design", "Unit Testing", "Jest", "Jira"
  ];
  
  const found = new Set<string>();
  const lowerText = text.toLowerCase();
  
  for (const skill of knownSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      found.add(skill);
    }
  }
  
  return Array.from(found);
}

function extractProfileDetails(sections: Record<string, string>, fullText?: string): {
  fullName: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  targetRole: string;
  location: string;
} {
  let fullName = "Job Seeker";
  let email: string | undefined;
  let phone: string | undefined;
  let linkedin: string | undefined;
  let targetRole = "Software Engineer";
  let location = "Bengaluru / Remote";

  const allText = (fullText || Object.values(sections).join("\n")).trim();
  const lines = allText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // 1. Extract Full Name from top lines
  for (const line of lines.slice(0, 5)) {
    // Ignore line if it looks like email, phone, url or contains section header keywords
    if (
      !line.includes("@") &&
      !line.includes("http") &&
      !line.includes("linkedin") &&
      !/\d/.test(line) &&
      line.length >= 3 &&
      line.length <= 40
    ) {
      fullName = line.replace(/^#+\s*/, "").trim();
      break;
    }
  }

  // 2. Extract Email
  const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  // 3. Extract Phone Number
  const phoneMatch = allText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/);
  if (phoneMatch && phoneMatch[0].length >= 8) phone = phoneMatch[0].trim();

  // 4. Extract LinkedIn
  const linkedinMatch = allText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) linkedin = linkedinMatch[0];

  // 5. Extract Target Role
  const topText = lines.slice(0, 15).join(" ").toLowerCase();
  const roles = [
    "Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
    "Full Stack", "Product Manager", "Data Scientist", "UI/UX Designer", "DevOps Engineer",
    "Engineering Manager", "Technical Architect", "Data Analyst", "System Architect"
  ];
  for (const role of roles) {
    if (topText.includes(role.toLowerCase())) {
      targetRole = role;
      break;
    }
  }

  // 6. Extract Location
  const locations = ["Bengaluru", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida", "Remote", "New York", "San Francisco", "London"];
  for (const loc of locations) {
    if (topText.includes(loc.toLowerCase())) {
      location = loc.toLowerCase().includes("remote") ? "Remote / India" : `${loc}, India`;
      break;
    }
  }

  return { fullName, email, phone, linkedin, targetRole, location };
}
