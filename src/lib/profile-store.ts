export interface CandidateProfile {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
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

const PROFILE_KEY = "applyx_candidate_profile";
const RESUMES_KEY = "applyx_saved_resumes";

// Retrieve candidate profile from LocalStorage (with fallback)
export function getLocalProfile(): CandidateProfile {
  if (typeof window === "undefined") {
    return createEmptyProfile();
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return createEmptyProfile();
    return JSON.parse(raw);
  } catch {
    return createEmptyProfile();
  }
}

// Save candidate profile to LocalStorage
export function saveLocalProfile(profile: Partial<CandidateProfile>): CandidateProfile {
  if (typeof window === "undefined") return createEmptyProfile();
  const current = getLocalProfile();
  const updated: CandidateProfile = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

// Retrieve saved resumes list
export function getLocalResumes(): SavedResume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESUMES_KEY);
    if (!raw) return [];
    const list: SavedResume[] = JSON.parse(raw);
    return list.map((r) => ({ ...r, isActive: !!r.isActive }));
  } catch {
    return [];
  }
}

// Save new resume to LocalStorage and update candidate active profile
export function saveLocalResume(resume: Omit<SavedResume, "id" | "createdAt" | "isActive">): SavedResume {
  if (typeof window === "undefined") {
    return { id: "temp", ...resume, createdAt: new Date().toISOString(), isActive: true };
  }

  const resumes = getLocalResumes();
  const newResume: SavedResume = {
    ...resume,
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  // Mark other resumes as non-active
  const updatedList: SavedResume[] = resumes.map((r) => ({ ...r, isActive: false }));
  updatedList.unshift(newResume);

  localStorage.setItem(RESUMES_KEY, JSON.stringify(updatedList));

  // Extract skills from resume text
  const extractedSkills = extractSkillsFromText(resume.parsedText);

  // Automatically update candidate profile active resume
  saveLocalProfile({
    activeResumeId: newResume.id,
    activeResumeName: newResume.fileName,
    activeResumeText: newResume.parsedText,
    activeResumeSections: newResume.parsedSections,
    skills: extractedSkills.length > 0 ? extractedSkills : ["React", "TypeScript", "Node.js"],
  });

  return newResume;
}

// Set a specific saved resume as active
export function setActiveLocalResume(id: string): SavedResume | null {
  const resumes = getLocalResumes();
  const target = resumes.find((r) => r.id === id);
  if (!target) return null;

  const updatedList: SavedResume[] = resumes.map((r) => ({
    ...r,
    isActive: r.id === id,
  }));

  localStorage.setItem(RESUMES_KEY, JSON.stringify(updatedList));

  saveLocalProfile({
    activeResumeId: target.id,
    activeResumeName: target.fileName,
    activeResumeText: target.parsedText,
    activeResumeSections: target.parsedSections,
  });

  return { ...target, isActive: true };
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
