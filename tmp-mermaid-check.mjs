import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3002/introduction/how-it-works", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Open Full Screen" }).first().click();
await page.waitForTimeout(1200);

const readState = async (label) => {
  const result = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    const zoomEls = Array.from(modal?.querySelectorAll('span') ?? []).map((el) => el.textContent?.trim()).filter(Boolean);
    const zoomText = zoomEls.find((text) => /^\d+%$/.test(text || '')) ?? null;
    const transformed = Array.from(modal?.querySelectorAll('div') ?? []).find((el) => el instanceof HTMLElement && el.style.transform);
    const viewport = Array.from(modal?.querySelectorAll('div') ?? []).find((el) => el instanceof HTMLElement && el.className.includes('touch-none') && el.className.includes('overflow-hidden'));
    return {
      zoomText,
      transform: transformed instanceof HTMLElement ? transformed.style.transform : null,
      viewport: viewport instanceof HTMLElement ? { width: viewport.clientWidth, height: viewport.clientHeight } : null,
      devicePixelRatio: window.devicePixelRatio,
      outerWidth: window.outerWidth,
      innerWidth: window.innerWidth,
    };
  });
  return { label, ...result };
};

const states = [];
states.push(await readState('initial'));
await page.mouse.move(720, 560);
await page.mouse.wheel(0, 120);
await page.waitForTimeout(300);
states.push(await readState('wheel'));
await page.mouse.move(720, 560);
await page.mouse.down();
await page.mouse.move(860, 620, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
states.push(await readState('drag'));
await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
await page.mouse.wheel(0, -120);
await page.waitForTimeout(300);
await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
states.push(await readState('modWheel'));
console.log(JSON.stringify(states, null, 2));
await browser.close();
