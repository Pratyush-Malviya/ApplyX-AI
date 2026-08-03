import * as cheerio from "cheerio";

async function run() {
  console.log("Fetching YC jobs...");
  const res = await fetch("https://www.ycombinator.com/jobs", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const jobs = [];
  
  // Try to find __NEXT_DATA__ script
  const nextDataStr = $("#__NEXT_DATA__").html();
  if (nextDataStr) {
    try {
      const nextData = JSON.parse(nextDataStr);
      console.log("Found __NEXT_DATA__!");
      // We'll just print keys to see structure
      console.log(Object.keys(nextData.props.pageProps));
    } catch (e) {
      console.error("Failed to parse __NEXT_DATA__");
    }
  } else {
    console.log("No __NEXT_DATA__ found.");
  }
}

run();
