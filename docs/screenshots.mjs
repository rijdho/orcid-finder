// Regenerates the README screenshots in this folder. Puppeteer is a tooling-only
// dependency: the app itself stays dependency-free and this is never shipped.
//
//   python3 -m http.server 8777 &          # from the repo root
//   npm i puppeteer                        # or point CHROME_PATH at an existing Chrome
//   node docs/screenshots.mjs docs "http://localhost:8777/?ror=056d84691&byName=0&max=40&asserted=1&country=SE&lang=en"
//
// Karolinska Institutet (ROR 056d84691) at max=40 with the asserted-only filter
// is the reference sample: it is the case that exposed the RINGGOLD matching
// defect, so it exercises ROR name resolution and the assertion column at once.
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

// The whole shell first: rail, command bar and the filter panel, which is what
// the reader sees on arrival.
await page.screenshot({ path: `${OUT}/app.png` });
console.log('OK   app.png');

// Then the result on its own. The sticky command bar would overlap the top of
// an element shot, so it is hidden for the rest.
await page.evaluate(() => { document.querySelector('.cmdbar').style.visibility = 'hidden'; });

for (const [file, selector] of [['results.png', '#results']]) {
  const handle = await page.$(selector);
  if (!handle) { console.log(`SKIP ${file}, no ${selector}`); continue; }
  await handle.scrollIntoView();
  await new Promise((r) => setTimeout(r, 300));
  await handle.screenshot({ path: `${OUT}/${file}` });
  console.log(`OK   ${file}`);
}

await browser.close();
