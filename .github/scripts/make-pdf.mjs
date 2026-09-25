// Print index.html to resume-zh.pdf / resume-en.pdf with Chromium, using the page's own print stylesheet.
// Fails (and so leaves the old PDFs alone) if either sheet no longer fits on one A4 page.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const url = pathToFileURL('index.html').href;
const browser = await chromium.launch();
for (const lang of ['zh', 'en']) {
  const page = await browser.newPage();
  await page.goto(url + (lang === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ path: `resume-${lang}.pdf`, preferCSSPageSize: true, printBackground: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`resume-${lang}.pdf: ${pages} page(s), ${Math.round(pdf.length / 1024)} KB`);
  if (pages !== 1) throw new Error(`resume-${lang}.pdf has ${pages} pages; shorten the content or the print styles`);
  await page.close();
}
await browser.close();
