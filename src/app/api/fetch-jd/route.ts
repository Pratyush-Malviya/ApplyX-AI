import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
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
        },
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
        // LinkedIn
        ".description__text",
        ".show-more-less-html__markup",
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
        ".job-description",
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
      // Remove hidden elements
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
