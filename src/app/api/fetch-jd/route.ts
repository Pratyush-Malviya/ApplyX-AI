import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not access this URL (${res.status}). Try pasting the job description manually.` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $("script, style, nav, header, footer, iframe, noscript, svg, [aria-hidden='true']").remove();

    let text = "";

    // ── Strategy 1: JSON-LD JobPosting schema ──
    $('script[type="application/ld+json"]').each((_, el) => {
      if (text) return;
      try {
        const raw = $(el).html() || "";
        const json = JSON.parse(raw);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const type = (item["@type"] || "") as string;
          if (type === "JobPosting" || type.toLowerCase().includes("job")) {
            const parts = [
              item.title,
              item.description,
              item.qualifications,
              item.responsibilities,
              item.skills,
            ]
              .filter(Boolean)
              .map((s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
              .join("\n\n");
            if (parts.length > 100) text = parts;
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    });

    // ── Strategy 2: Common job board CSS selectors ──
    if (!text) {
      const selectors = [
        // LinkedIn
        ".description__text",
        ".show-more-less-html__markup",
        // Indeed
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
        // Greenhouse
        "#content",
        ".job__description",
        // Lever
        ".posting-description",
        // Workday
        "[data-automation-id='jobPostingDescription']",
        // Glassdoor
        ".JobDetails_jobDescription__uW_fK",
        // Generic
        "[class*='job-description']",
        "[class*='jobDescription']",
        "[class*='job_description']",
        "[id*='job-description']",
        "[id*='jobDescription']",
        "article",
        "main",
      ];

      for (const sel of selectors) {
        const el = $(sel).first();
        if (el.length) {
          const candidate = el.text().replace(/\s+/g, " ").trim();
          if (candidate.length > 200) {
            text = candidate;
            break;
          }
        }
      }
    }

    // ── Strategy 3: meta description + full body text ──
    if (!text) {
      const meta = $('meta[name="description"]').attr("content") || "";
      const body = $("body").text().replace(/\s+/g, " ").trim();
      text = (meta ? meta + "\n\n" : "") + body;
    }

    const result = text.slice(0, 8000).trim();

    if (result.length < 100) {
      return NextResponse.json(
        { error: "Could not extract job description from this page. Please paste it manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: result });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out. The site took too long to respond. Please paste the JD manually." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch job description. Please paste it manually." },
      { status: 500 }
    );
  }
}
