import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3000';
const output = process.env.UI_AUDIT_OUTPUT || 'ui-audit';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true});
const profiles = [
  {name: 'phone-small', width: 320, height: 568, mobile: true},
  {name: 'phone', width: 390, height: 844, mobile: true},
  {name: 'landscape', width: 844, height: 390, mobile: true},
  {name: 'tablet', width: 768, height: 1024, mobile: true},
  {name: 'laptop', width: 1024, height: 768},
  {name: 'desktop', width: 1440, height: 900}
];
const report = [];
for (const profile of profiles) {
  const context = await browser.newContext({viewport: {width: profile.width, height: profile.height}, isMobile: !!profile.mobile, hasTouch: !!profile.mobile, deviceScaleFactor: 1});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', {rate: profile.mobile ? 4 : 2});
  await page.goto(`${base}/zh/work`, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-vinyl-index="0"]').waitFor();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const scene = document.querySelector('section[aria-label="全部设计作品档案"]');
    if (scene) window.scrollTo(0, window.scrollY + scene.getBoundingClientRect().top - 72);
  });
  await page.waitForTimeout(600);
  const bounds = await page.evaluate(() => {
    const record = document.querySelector('[data-vinyl-index="0"]');
    const stage = record?.parentElement?.parentElement?.parentElement;
    const r = record?.getBoundingClientRect(), s = stage?.getBoundingClientRect();
    return {width: innerWidth, height: innerHeight, pageOverflow: document.documentElement.scrollWidth - innerWidth, record: r?.toJSON(), stage: s?.toJSON(), clipped: !!r && !!s && (r.left < s.left - 1 || r.right > s.right + 1 || r.top < s.top - 1 || r.bottom > s.bottom + 1)};
  });
  const timing = await page.evaluate(() => new Promise(resolve => {
    const values = []; let previous = performance.now(); const start = previous;
    function tick(now) {values.push(now - previous); previous = now; if (now - start < 1000) requestAnimationFrame(tick); else resolve({frames: values.length, p95: [...values].sort((a,b) => a-b)[Math.floor(values.length * .95)], slowFrames: values.filter(value => value > 34).length});}
    requestAnimationFrame(tick);
  }));
  await page.screenshot({path: `${output}/${profile.name}-archive.png`});
  await page.locator('[data-vinyl-index="0"]').press('Enter');
  const focus = page.locator('[id^="vinyl-focus-"]');
  await focus.waitFor();
  await page.waitForTimeout(700);
  const focusBounds = await page.evaluate(() => {
    const layer = document.querySelector('[id^="vinyl-focus-"]');
    const disc = layer?.querySelector('[class*="focusDiscScene"]');
    const r = disc?.getBoundingClientRect();
    return {disc: r?.toJSON(), horizontalOverflow: !!r && (r.left < -1 || r.right > innerWidth + 1), layerOverflow: layer ? layer.scrollWidth - layer.clientWidth : null};
  });
  await page.screenshot({path: `${output}/${profile.name}-focus.png`});
  const closeStart = Date.now();
  await page.keyboard.press('Escape');
  await focus.waitFor({state: 'detached', timeout: 4000});
  report.push({profile: profile.name, bounds, timing, focus: focusBounds, closeMs: Date.now() - closeStart, errors});
  await context.close();
}
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
