const fs = require('fs');

async function run() {
  console.log("Fetching...");
  try {
    const res = await fetch("https://www.ycombinator.com/jobs");
    const text = await res.text();
    fs.writeFileSync('yc_jobs.html', text);
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
}
run();
