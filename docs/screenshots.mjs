// Regenerates the README screenshots in this folder. Puppeteer is a tooling-only
// dependency: the app itself stays dependency-free and this is never shipped.
//
//   python3 -m http.server 8777 &          # from the repo root
//   npm i puppeteer                        # or point CHROME_PATH at an existing Chrome
//   node docs/screenshots.mjs docs "http://localhost:8777/?ror=03yrm5c26&byName=0&max=16&current=1&started=1&lang=en"
//
// The California Digital Library (ROR 03yrm5c26) at max=16 is the reference
// sample: small enough to run in seconds, and it exercises every filter, since
// some of its records lack a start date and some appointments have ended.
// ORCID is live data, so the counts drift. Change the query and the README alt
// text needs updating with the numbers actually on screen.

import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'docs';
const URL = process.argv[3];
if (!URL) {
  console.error('usage: node docs/screenshots.mjs <out-dir> <url>');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.CHROME_PATH || undefined,
  defaultViewport: { width: 1180, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });

// The search runs from the URL on load; wait for the table rather than a timer.
await page.waitForSelector('#tablewrap tbody tr', { timeout: 90000 });

// The sticky command bar would overlap the top of any element shot.
await page.evaluate(() => { document.querySelector('.cmdbar').style.visibility = 'hidden'; });

const shots = [
  ['filters.png', '#search'],
  ['results.png', '#results'],
];

for (const [file, selector] of shots) {
  const handle = await page.$(selector);
  if (!handle) { console.log(`SKIP ${file}, no ${selector}`); continue; }
  await handle.scrollIntoView();
  await new Promise((r) => setTimeout(r, 300));
  await handle.screenshot({ path: `${OUT}/${file}` });
  console.log(`OK   ${file}`);
}

await browser.close();
