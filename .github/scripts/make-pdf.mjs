// Print index.html to resume-{,rd-}{zh,en}.pdf with Chromium, using the page's own print stylesheet.
// Fails (and so leaves the old PDFs alone) if either sheet no longer fits on one A4 page.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const url = pathToFileURL('index.html').href;
const browser = await chromium.launch();
// two versions of the site (EHS by default, R&D with ?role=rd), each in two languages
for (const [role, lang] of [['ehs', 'zh'], ['ehs', 'en'], ['rd', 'zh'], ['rd', 'en']]) {
  const page = await browser.newPage();
  const q = [role === 'rd' ? 'role=rd' : '', lang === 'en' ? 'lang=en' : ''].filter(Boolean).join('&');
  await page.goto(url + (q ? '?' + q : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const file = `resume-${role === 'rd' ? 'rd-' : ''}${lang}.pdf`;
  const pdf = await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`${file}: ${pages} page(s), ${Math.round(pdf.length / 1024)} KB`);
  if (pages !== 1) throw new Error(`${file} has ${pages} pages; shorten the content or the print styles`);
  await page.close();
}
await browser.close();
