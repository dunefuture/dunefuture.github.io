import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const url = pathToFileURL(resolve('championship-account-preview.html')).href;
await mkdir('artifacts/closed-preview', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const { name, width, height } of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const externalRequests = [];
    page.on('request', request => {
      if (!request.url().startsWith('file:')) externalRequests.push(request.url());
    });
    await page.goto(url, { waitUntil: 'load' });
    const heading = await page.locator('h1').innerText();
    if (!heading.includes('not available yet')) throw new Error(name + ': missing CLOSED heading');
    if (await page.locator('form, input, script, iframe').count()) throw new Error(name + ': active form or script detected');
    if (await page.locator('a[href="./championship.html"]').count() !== 1) throw new Error(name + ': return link missing');
    if (externalRequests.length) throw new Error(name + ': unexpected external request');
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (horizontalOverflow) throw new Error(name + ': horizontal overflow');
    await page.screenshot({ path: 'artifacts/closed-preview/' + name + '.png', fullPage: true });
    console.log(name + ': CLOSED preview PASS, no external requests, no horizontal overflow');
    await context.close();
  }
} finally {
  await browser.close();
}
