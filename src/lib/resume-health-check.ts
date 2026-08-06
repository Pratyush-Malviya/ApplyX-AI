/**
 * Resume Health Check Engine
 * Analyzes parsed resume text/sections and evaluates formatting completeness,
 * section presence, impact metrics, and ATS compatibility.
 */

export interface HealthCheckResult {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D";
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    severity: "critical" | "warning" | "good";
    message: string;
  }>;
  missingSections: string[];
}

export function checkResumeHealth(parsedText: string, sections?: Record<string, string>): HealthCheckResult {
  const text = (parsedText || "").toLowerCase();
  const checks: HealthCheckResult["checks"] = [];
  const missingSections: string[] = [];

  // Check 1: Contact Information (email / phone)
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(parsedText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(parsedText);

  checks.push({
    id: "contact_info",
    label: "Contact Details (Email & Phone)",
    passed: hasEmail && hasPhone,
    severity: hasEmail || hasPhone ? "warning" : "critical",
    message: hasEmail && hasPhone
      ? "Email and Phone number detected."
      : !hasEmail
      ? "Missing valid email address."
      : "Missing phone number for recruiters.",
  });

  // Check 2: Quantifiable Impact Metrics (numbers, percentages, currency)
  const metricMatches = parsedText.match(/(\d+%\b|\$\d+|\b\d+\s*(k|m|b|lakh|crore|users|clients|projects|hrs|hours|%)\b)/gi) || [];
  const metricCount = metricMatches.length;

  checks.push({
    id: "metrics",
    label: "Quantified Results & Metrics",
    passed: metricCount >= 3,
    severity: metricCount >= 3 ? "good" : metricCount > 0 ? "warning" : "critical",
    message: metricCount >= 3
      ? `Strong impact metrics detected (${metricCount} quantifiable data points found).`
      : "Add more quantified results (e.g., 'Increased efficiency by 35%', 'Managed 50K users').",
  });

  // Check 3: Essential Resume Sections
  const requiredSections = [
    { name: "Experience", regex: /\b(experience|employment|work history|career)\b/i },
    { name: "Education", regex: /\b(education|academic|degree|university|college)\b/i },
    { name: "Skills", regex: /\b(skills|technologies|proficiencies|competencies)\b/i },
  ];

  requiredSections.forEach((sec) => {
    const present = Boolean(sec.regex.test(text) || (sections && Object.keys(sections).some((k) => sec.regex.test(k))));
    if (!present) missingSections.push(sec.name);

    checks.push({
      id: `section_${sec.name.toLowerCase()}`,
      label: `${sec.name} Section`,
      passed: present,
      severity: present ? "good" : "critical",
      message: present ? `${sec.name} section present.` : `Missing dedicated ${sec.name} section header.`,
    });
  });

  // Check 4: Action Verbs
  const actionVerbs = /\b(engineered|architected|spearheaded|developed|launched|optimized|reduced|increased|led|managed|implemented|created|built)\b/gi;
  const verbMatches = parsedText.match(actionVerbs) || [];

  checks.push({
    id: "action_verbs",
    label: "High-Impact Action Verbs",
    passed: verbMatches.length >= 4,
    severity: verbMatches.length >= 4 ? "good" : "warning",
    message: verbMatches.length >= 4
      ? `Excellent use of strong action verbs (${verbMatches.length} verbs found).`
      : "Use more past-tense action verbs to start bullet points (e.g. Engineered, Spearheaded, Optimized).",
  });

  // Score Calculation
  const passedCount = checks.filter((c) => c.passed).length;
  const rawScore = Math.round((passedCount / checks.length) * 100);

  let grade: HealthCheckResult["grade"] = "B";
  if (rawScore >= 90) grade = "A+";
  else if (rawScore >= 80) grade = "A";
  else if (rawScore >= 65) grade = "B";
  else if (rawScore >= 50) grade = "C";
  else grade = "D";

  return {
    score: rawScore,
    grade,
    summary:
      rawScore >= 80
        ? "Your resume has a strong foundation and is ready for ATS tailoring!"
        : "Your resume is missing a few key elements. Address the highlighted checks to boost your callback rate.",
    checks,
    missingSections,
  };
}
