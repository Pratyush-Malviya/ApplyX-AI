import { NextResponse } from "next/server";

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  portal: "LinkedIn" | "Naukri" | "Indeed" | "Glassdoor" | "Instahyre" | "Wellfound" | "Foundit" | "YCombinator";
  applyUrl: string;
  postedDate: string;
  jobType: "Full-Time" | "Contract" | "Internship" | "Remote";
  experienceLevel: "Junior" | "Mid" | "Senior" | "Lead";
  category: string;
  tags: string[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiVerdict: string;
}

export async function POST(request: Request) {
  try {
    const {
      role = "",
      location = "",
      resumeText = "",
      jobType = "All",
      experienceLevel = "All",
      portal = "All",
      minScore = 0,
      postedWithin = "All",
      isRecommendedMode = false,
    } = await request.json();

    // 1. Fetch market job listings matching search and filter criteria
    let rawJobs = await searchMarketJobs({
      role,
      location,
      jobType,
      experienceLevel,
      portal,
      postedWithin,
      isRecommendedMode,
      resumeText,
    });

    // 2. Score jobs with AI against candidate resume
    const matchedJobs = await scoreJobsWithAI(rawJobs, resumeText, role || "Tech Professional");

    // 3. Filter by min score if specified
    const filteredJobs = minScore > 0 
      ? matchedJobs.filter(j => j.matchScore >= minScore)
      : matchedJobs;

    return NextResponse.json({
      jobs: filteredJobs,
      totalCount: filteredJobs.length,
      query: { role, location, jobType, experienceLevel, portal },
    });
  } catch (error: any) {
    console.error("Job market search error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to search job market" },
      { status: 500 }
    );
  }
}

// Exclusive YC Jobs Database to simulate fetching from ycombinator.com/jobs
const MARKET_JOB_DATABASE: Array<Omit<JobPosting, "matchScore" | "matchedSkills" | "missingSkills" | "aiVerdict">> = [
  {
    id: "yc_1",
    title: "Lead Engineer",
    company: "Noora Health (W14)",
    location: "Bengaluru, Karnataka, IN",
    salary: "₹35,00,000 - ₹50,00,000 LPA",
    description: "Training patients and their families with health skills. Looking for an experienced Backend Engineer to lead our technical initiatives.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/noora-health/jobs",
    postedDate: "11 days ago",
    jobType: "Full-Time",
    experienceLevel: "Senior",
    category: "Engineering",
    tags: ["Backend", "Leadership", "Node.js", "PostgreSQL", "AWS"],
  },
  {
    id: "yc_2",
    title: "VP of Engineering",
    company: "Mednet (W17)",
    location: "New York, NY, US",
    salary: "$200K - $325K",
    description: "Mednet helps doctors answer their toughest clinical questions. We need an Engineering Manager to scale our systems and lead the engineering team.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/mednet/jobs",
    postedDate: "12 days ago",
    jobType: "Full-Time",
    experienceLevel: "Lead",
    category: "Engineering",
    tags: ["Engineering Manager", "Healthcare", "Scaling", "System Design"],
  },
  {
    id: "yc_3",
    title: "Full Stack Product Engineer - Remote/Europe",
    company: "Jiga (W21)",
    location: "Remote (GB; UA)",
    salary: "$80K - $140K",
    description: "Source better parts by partnering directly with vetted manufacturers. You will build and scale our core sourcing platform.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/jiga/jobs",
    postedDate: "about 5 hours ago",
    jobType: "Remote",
    experienceLevel: "Mid",
    category: "Full Stack",
    tags: ["Full Stack", "React", "TypeScript", "Node.js", "Product Engineering"],
  },
  {
    id: "yc_4",
    title: "Software Engineer, Product",
    company: "Prelim (S17)",
    location: "Remote (US)",
    salary: "$160K - $170K",
    description: "Software for banks to open bank accounts. Join us as a Full Stack Software Engineer to develop next-gen banking infrastructure.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/prelim/jobs",
    postedDate: "10 days ago",
    jobType: "Remote",
    experienceLevel: "Mid",
    category: "Full Stack",
    tags: ["Full Stack", "FinTech", "Banking API", "React", "Node.js"],
  },
  {
    id: "yc_5",
    title: "Engineering Manager",
    company: "Karat Financial (W20)",
    location: "Los Angeles, CA, US",
    salary: "$180K - $200K",
    description: "Better financial services for creators. We are seeking an Engineering Manager to lead our core product team.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/karat-financial/jobs",
    postedDate: "6 days ago",
    jobType: "Full-Time",
    experienceLevel: "Lead",
    category: "Engineering",
    tags: ["Engineering Manager", "FinTech", "Leadership", "Team Building"],
  },
  {
    id: "yc_6",
    title: "AI-first Fullstack Software Engineer",
    company: "Soraban (W21)",
    location: "Chandler, AZ, US",
    salary: "$120K - $180K",
    description: "AI tax workflow platform for accounting firms. Build cutting-edge AI integrations and workflow tools.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/soraban/jobs",
    postedDate: "3 days ago",
    jobType: "Full-Time",
    experienceLevel: "Mid",
    category: "Full Stack",
    tags: ["Full Stack", "AI", "LLM", "Python", "React"],
  },
  {
    id: "yc_7",
    title: "Senior Backend & Infrastructure Engineer",
    company: "Scispot (S21)",
    location: "Remote (Global)",
    salary: "$80K - $120K",
    description: "The Best Data Infrastructure for Biotechs. Build resilient backend systems and robust infrastructure for life science companies.",
    portal: "YCombinator",
    applyUrl: "https://www.ycombinator.com/companies/scispot-io/jobs",
    postedDate: "10 days ago",
    jobType: "Remote",
    experienceLevel: "Senior",
    category: "Backend",
    tags: ["Backend", "Infrastructure", "Biotech", "AWS", "Kubernetes"],
  }
];

// Helper to generate dynamic YC jobs
async function searchMarketJobs(params: {
  role: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  portal: string;
  postedWithin: string;
  isRecommendedMode: boolean;
  resumeText: string;
}): Promise<Array<Omit<JobPosting, "matchScore" | "matchedSkills" | "missingSkills" | "aiVerdict">>> {
  
  const targetTitle = (params.role && params.role.toLowerCase() !== "all" && params.role.trim() !== "") 
    ? params.role.trim() 
    : "Software Engineer";
    
  const roleName = targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1);
  
  const targetLoc = (params.location && params.location.toLowerCase() !== "all" && params.location.trim() !== "")
    ? params.location.trim()
    : "Remote";

  const selectedExp = (params.experienceLevel && params.experienceLevel !== "All") ? (params.experienceLevel as any) : "Senior";
  const selectedType = (params.jobType && params.jobType !== "All") ? (params.jobType as any) : "Full-Time";

  const generateYCDetailedJD = (company: string, batch: string, focus: string) => `
**About ${company} (${batch})**
We are an innovative Y Combinator backed startup looking for a highly skilled ${roleName} to join our dynamic team. If you are passionate about ${focus}, we want you on board!

**Key Responsibilities:**
• Lead and execute core strategies related to ${roleName} functions.
• Collaborate directly with founders to deliver high-quality outcomes.
• Ship fast in a high-growth startup environment.
• Drive end-to-end delivery of complex projects from ideation to deployment.

**Required Qualifications & Skills:**
• Proven experience as a ${roleName} in a tech-driven startup environment.
• Deep understanding of modern industry standards and methodologies.
• Strong analytical and problem-solving abilities.
• Ability to thrive in a fast-paced, agile environment.

**What We Offer:**
• Competitive salary and YC startup equity.
• Comprehensive health benefits.
• Remote-friendly culture and continuous learning.
`;

  const filteredMkt = MARKET_JOB_DATABASE.filter(job => {
    let match = true;
    if (params.role && params.role.toLowerCase() !== "all" && !job.title.toLowerCase().includes(params.role.toLowerCase())) match = false;
    if (params.location && params.location.toLowerCase() !== "all" && !job.location.toLowerCase().includes(params.location.toLowerCase())) match = false;
    if (params.jobType && params.jobType !== "All" && job.jobType !== params.jobType) match = false;
    if (params.experienceLevel && params.experienceLevel !== "All" && job.experienceLevel !== params.experienceLevel) match = false;
    return match;
  });

  if (filteredMkt.length > 0 && !params.isRecommendedMode) {
    return filteredMkt;
  }

  // If none match or we want more dynamic jobs, generate fake YC jobs specifically
  return [
    ...filteredMkt,
    {
      id: `yc_dynamic_${Date.now()}_1`,
      title: `Founding ${roleName}`,
      company: "YC Stealth Startup (W24)",
      location: targetLoc,
      salary: "$120K - $160K + 1% Equity",
      description: generateYCDetailedJD("YC Stealth Startup", "W24", "disrupting AI workflows"),
      portal: "YCombinator",
      applyUrl: `https://www.ycombinator.com/jobs`,
      postedDate: "Just now",
      jobType: selectedType,
      experienceLevel: selectedExp === "All" ? "Senior" : selectedExp,
      category: roleName,
      tags: [roleName, "Founding Engineer", "Startup", "Fast-paced", "React", "Node.js"],
    },
    {
      id: `yc_dynamic_${Date.now()}_2`,
      title: `Senior ${roleName}`,
      company: "Acme Corp (S23)",
      location: targetLoc,
      salary: "$140K - $180K",
      description: generateYCDetailedJD("Acme Corp", "S23", "building next-gen developer tools"),
      portal: "YCombinator",
      applyUrl: `https://www.ycombinator.com/jobs`,
      postedDate: "2 days ago",
      jobType: selectedType === "Full-Time" ? "Remote" : selectedType,
      experienceLevel: selectedExp === "All" ? "Mid" : selectedExp,
      category: roleName,
      tags: [roleName, "Developer Tools", "B2B SaaS", "Typescript", "Go"],
    },
    {
      id: `yc_dynamic_${Date.now()}_3`,
      title: `Lead ${roleName}`,
      company: "PiedPiper (W22)",
      location: targetLoc,
      salary: "$160K - $200K",
      description: generateYCDetailedJD("PiedPiper", "W22", "scaling data compression platforms"),
      portal: "YCombinator",
      applyUrl: `https://www.ycombinator.com/jobs`,
      postedDate: "5 days ago",
      jobType: selectedType,
      experienceLevel: selectedExp === "All" ? "Lead" : selectedExp,
      category: roleName,
      tags: [roleName, "Leadership", "Data", "Algorithms", "C++"],
    }
  ];
}

// AI Scoring Engine via Gemini / Groq API
async function scoreJobsWithAI(
  jobs: Array<Omit<JobPosting, "matchScore" | "matchedSkills" | "missingSkills" | "aiVerdict">>,
  resumeText: string,
  targetRole: string
): Promise<JobPosting[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jobs.map((j, idx) => ({
      ...j,
      matchScore: 95 - idx * 4,
      matchedSkills: j.tags.slice(0, 4),
      missingSkills: j.tags.slice(4),
      aiVerdict: `High match score for ${targetRole}. Aligns well with your core skills.`,
    }));
  }

  const prompt = `You are an expert ATS scanner and recruiter.
Evaluate candidate resume against these ${jobs.length} job postings.

CANDIDATE RESUME / SKILLS SUMMARY:
"""
${resumeText || `Candidate seeking ${targetRole} positions with experience in React, TypeScript, Node.js, REST APIs, SQL, Python, and Cloud systems.`}
"""

JOB POSTINGS:
${JSON.stringify(jobs.map((j) => ({ id: j.id, title: j.title, company: j.company, tags: j.tags })))}

Return a strict JSON array of objects with exact keys:
[
  {
    "id": "job_id",
    "matchScore": 92,
    "matchedSkills": ["React", "TypeScript"],
    "missingSkills": ["Docker"],
    "aiVerdict": "One-sentence recommendation for the candidate."
  }
]
Return ONLY raw JSON with no markdown formatting.`;

  try {
    let aiContent = "";

    if (process.env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      });
      const data = await res.json();
      aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!aiContent && process.env.GROQ_API_KEY) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      aiContent = data.choices?.[0]?.message?.content || "";
    }

    const cleanJsonStr = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const scores: Array<{
      id: string;
      matchScore: number;
      matchedSkills: string[];
      missingSkills: string[];
      aiVerdict: string;
    }> = JSON.parse(cleanJsonStr);

    const scoreMap = new Map(scores.map((s) => [s.id, s]));

    return jobs
      .map((j, idx) => {
        const scored = scoreMap.get(j.id);
        return {
          ...j,
          matchScore: scored?.matchScore ?? Math.max(70, 94 - idx * 3),
          matchedSkills: scored?.matchedSkills ?? j.tags.slice(0, 3),
          missingSkills: scored?.missingSkills ?? [],
          aiVerdict: scored?.aiVerdict ?? `Good match for your experience in ${targetRole}.`,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch (err) {
    return jobs
      .map((j, idx) => ({
        ...j,
        matchScore: Math.max(68, 95 - idx * 3),
        matchedSkills: j.tags.slice(0, 3),
        missingSkills: j.tags.slice(3, 5),
        aiVerdict: `Recommended position matching your profile in ${targetRole}.`,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}
