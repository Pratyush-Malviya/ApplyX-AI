export async function parseResume(file: File): Promise<{ text: string; sections: Record<string, string> }> {
  const text = await extractText(file);
  const sections = extractSections(text);
  return { text, sections };
}

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return extractPDFText(file);
  } else if (ext === "docx") {
    return extractDOCXText(file);
  } else {
    return await file.text();
  }
}

async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    let lastY: number | null = null;
    let pageText = "";

    for (const item of content.items as any[]) {
      if (item.str === undefined) continue;
      const y = item.transform ? item.transform[5] : null;
      
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        pageText += "\n";
      } else if (item.hasEOL) {
        pageText += "\n";
      } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
        pageText += " ";
      }
      
      pageText += item.str;
      if (y !== null) lastY = y;
    }
    
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

async function extractDOCXText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionHeaders = [
    "summary", "objective", "experience", "work history", "employment",
    "education", "skills", "certifications", "projects", "publications",
    "languages", "interests", "references", "achievements", "awards",
    "volunteer", "leadership", "contact", "profile",
  ];

  const lines = text.split("\n");
  let currentSection = "header";
  const sectionLines: Record<string, string[]> = { header: [] };

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    const matched = sectionHeaders.find((h) => trimmed.includes(h));

    if (matched && line.trim().length < 60) {
      currentSection = matched;
      if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
    } else {
      if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
      sectionLines[currentSection].push(line);
    }
  }

  for (const [key, lines] of Object.entries(sectionLines)) {
    sections[key] = lines.join("\n").trim();
  }

  return sections;
}