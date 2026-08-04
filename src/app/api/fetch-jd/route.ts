import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ── LinkedIn guest API connector ──────────────────────────────────────────────
// LinkedIn blocks regular page scraping but exposes an unofficial guest endpoint
// for public job postings that returns the full JD without requiring a login.
function extractLinkedInJobId(url: string): string | null {
  // Handles all LinkedIn job URL formats:
  // /jobs/view/1234567890
  // /jobs/view/title-at-company-1234567890
  // in.linkedin.com/jobs/view/...
  const match = url.match(/\/jobs\/view\/(?:[^/]+-)?(\d{8,})/);
  return match ? match[1] : null;
}

async function fetchLinkedInJD(jobId: string): Promise<string | null> {
  const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

  const res = await fetch(guestApiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.linkedin.com/",
    },
    redirect: "follow",
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  // The guest API returns a snippet — job details are in these selectors
  const titleEl =
    $(".top-card-layout__title").text().trim() ||
    $("h2").first().text().trim() ||
    "";

  const companyEl =
    $(".topcard__org-name-link").text().trim() ||
    $(".top-card-layout__second-subline").text().trim() ||
    "";

  const locationEl =
    $(".topcard__flavor--bullet").text().trim() ||
    "";

  const descEl =
    $(".show-more-less-html__markup").html() ||
    $(".description__text").html() ||
    $(".job-description").html() ||
    "";

  // Strip HTML tags from description
  const desc = descEl
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!desc) return null;

  const header = [titleEl && `Role: ${titleEl}`, companyEl && `Company: ${companyEl}`, locationEl && `Location: ${locationEl}`]
    .filter(Boolean)
    .join("\n");

  return (header ? header + "\n\n" : "") + desc;
}
// ─────────────────────────────────────────────────────────────────────────────

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // ── LinkedIn connector: use guest API instead of page scraping ──
    if (url.includes("linkedin.com/jobs")) {
      const jobId = extractLinkedInJobId(url);
      if (!jobId) {
        return NextResponse.json(
          {
            error:
              "Could not parse LinkedIn job ID from this URL. Make sure it's a direct job post link (e.g. linkedin.com/jobs/view/1234567890).",
          },
          { status: 400 }
        );
      }

      const jdText = await fetchLinkedInJD(jobId);
      if (jdText && jdText.length >= 50) {
        return NextResponse.json({ text: jdText.slice(0, 10000) });
      }

      return NextResponse.json(
        {
          error:
            "LinkedIn returned an empty response (the post may be expired or requires login). Please paste the job description manually.",
        },
        { status: 422 }
      );
    }

    // ── Generic fetch for all other job boards ──
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not access this page (HTTP ${res.status}). Please paste the job description manually.`,
        },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let text = "";

    // ── Strategy 1: JSON-LD JobPosting schema (MUST run before removing scripts) ──
    $('script[type="application/ld+json"]').each((_, el) => {
      if (text) return;
      try {
        const raw = $(el).html() || "";
        const json = JSON.parse(raw);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const type = (item["@type"] || "") as string;
          const types = Array.isArray(type) ? type : [type];
          if (types.some((t) => t === "JobPosting" || t.toLowerCase().includes("job"))) {
            const parts = [
              item.title,
              item.description,
              item.qualifications,
              item.responsibilities,
              item.experienceRequirements,
              item.skills,
              item.educationRequirements,
            ]
              .filter(Boolean)
              .map((s: string) =>
                typeof s === "string"
                  ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
                  : JSON.stringify(s)
              )
              .join("\n\n");
            if (parts.length > 80) text = parts;
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    });

    // Now remove noise for DOM-based strategies
    $("script, style, nav, header, footer, iframe, noscript, svg").remove();

    // ── Strategy 2: Platform-specific + generic CSS selectors ──
    if (!text) {
      const selectors = [
        // Indeed
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
        // Naukri.com
        ".styles_JD__row__",
        ".job-description",
        ".jd-desc",
        "#job_description",
        "[class*='JD__row']",
        "[class*='job-desc']",
        "[class*='jobDesc']",
        // Internshala
        ".internship_other_details_container",
        ".internship-details",
        ".detail-container",
        "[class*='internship_details']",
        // Shine.com
        ".job-full-desc",
        "[class*='jobFullDesc']",
        // Greenhouse / Lever / Workday
        "#content .job__description",
        ".job__description",
        ".posting-description",
        "[data-automation-id='jobPostingDescription']",
        // Glassdoor
        "[class*='jobDescription']",
        "[class*='JobDetails']",
        // AngelList / Wellfound
        "[data-testid='jobDescription']",
        // Generic semantic selectors
        "[class*='job-description']",
        "[class*='job_description']",
        "[id*='job-description']",
        "[id*='jobDescription']",
        "[id*='job_desc']",
        "[class*='job-detail']",
        "[class*='jobDetail']",
        // Broad fallbacks
        "article",
        "[role='main']",
        "main",
      ];

      for (const sel of selectors) {
        try {
          const el = $(sel).first();
          if (el.length) {
            const candidate = el.text().replace(/\s+/g, " ").trim();
            if (candidate.length > 80) {
              text = candidate;
              break;
            }
          }
        } catch {
          // skip invalid selectors
        }
      }
    }

    // ── Strategy 3: Grab all visible body text as last resort ──
    if (!text || text.length < 80) {
      const meta = $('meta[name="description"]').attr("content") || "";
      const ogDesc = $('meta[property="og:description"]').attr("content") || "";
      $("[hidden], [style*='display:none'], [style*='display: none']").remove();
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      const combined = [meta, ogDesc, bodyText].filter(Boolean).join("\n\n");
      if (combined.length > text.length) text = combined;
    }

    const result = text.slice(0, 10000).trim();

    if (result.length < 50) {
      return NextResponse.json(
        {
          error:
            "This page requires a login or uses JavaScript rendering — content could not be extracted. Please copy-paste the job description manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: result });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return NextResponse.json(
        {
          error:
            "Request timed out — the job site took too long to respond. Please paste the JD manually.",
        },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch job description. Please paste it manually." },
      { status: 500 }
    );
  }
}
