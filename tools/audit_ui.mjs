import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
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
    return {width: innerWidth, height: innerHeight, pageOverflow: document.documentElement.scrollWidth - innerWidth, record: r?.toJSON(), stage: s?.toJSON(), viewportClipped: !!r && (r.left < -1 || r.right > innerWidth+1 || r.bottom > innerHeight+1), clipped: !!r && !!s && (r.left < s.left - 1 || r.right > s.right + 1 || r.top < s.top - 1 || r.bottom > s.bottom + 1)};
  });
  const timing = await page.evaluate(() => new Promise(resolve => {
    const values = []; let previous = performance.now(); const start = previous;
    function tick(now) {values.push(now - previous); previous = now; if (now - start < 1000) requestAnimationFrame(tick); else resolve({frames: values.length, p95: [...values].sort((a,b) => a-b)[Math.floor(values.length * .95)], slowFrames: values.filter(value => value > 34).length});}
    requestAnimationFrame(tick);
  }));
  await page.screenshot({path: `${output}/${profile.name}-archive.png`});
  await page.locator('[data-vinyl-index="0"]').press('Enter');
  const focus = page.locator('section[id^="vinyl-focus-"]');
  await focus.waitFor();
  await page.waitForTimeout(700);
  const focusBounds = await page.evaluate(() => {
    const layer = document.querySelector('section[id^="vinyl-focus-"]');
    const disc = layer?.querySelector('[class*="focusDiscScene"]');
    const r = disc?.getBoundingClientRect();
    return {disc: r?.toJSON(), horizontalOverflow: !!r && (r.left < -1 || r.right > innerWidth + 1), layerOverflow: layer ? layer.scrollWidth - layer.clientWidth : null};
  });
  await page.screenshot({path: `${output}/${profile.name}-focus.png`});
  const closeStart = Date.now();
  await page.keyboard.press('Escape');
  await focus.waitFor({state: 'detached', timeout: 4000});
  const closeMs=Date.now()-closeStart;
  const next=page.getByRole('button',{name:'下一个作品',exact:true});
  const selections=[];
  if(await next.count()){
    for(let index=1;index<7;index++){
      await next.click();
      await page.waitForFunction(index=>document.querySelector(`[data-vinyl-index="${index}"]`)?.getAttribute('data-active')==='true',index);
      await page.waitForTimeout(260);
      selections.push(await page.evaluate(index=>{
        const r=document.querySelector(`[data-vinyl-index="${index}"]`)?.getBoundingClientRect();
        return {index,fullyVisible:!!r&&r.left>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};
      },index));
    }
    await page.locator('[data-vinyl-index="6"]').press('Home');
    await page.locator('[data-vinyl-index="0"]').press('Enter');
    await focus.waitFor();
    await page.waitForTimeout(60);
    await page.getByRole('button',{name:'关闭项目档案',exact:true}).click();
    await focus.waitFor({state:'detached'});
  }
  const scrollRestored=await page.evaluate(()=>document.body.style.overflow!=='hidden');
  let swipe=null;
  if(profile.mobile&&await next.count()){
    await page.locator('[data-vinyl-index="0"]').scrollIntoViewIfNeeded();
    // Keep the gesture target below the fixed navigation after footer controls scroll it.
    await page.evaluate(()=>{
      const record=document.querySelector('[data-vinyl-index="0"]');
      if(record)window.scrollBy({top:record.getBoundingClientRect().top-96,behavior:'instant'});
    });
    await page.waitForTimeout(100);
    const point=await page.locator('[data-vinyl-index="0"]').boundingBox();
    if(point){
      const x=point.x+point.width*.65,y=point.y+point.height/2;
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20,y}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-130,y}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(350);
      swipe=await page.evaluate(()=>({selected:document.querySelector('[data-vinyl-index][data-active="true"]')?.getAttribute('data-vinyl-index'),accidentalDialog:!!document.querySelector('section[id^="vinyl-focus-"]')}));
    }
  }
  report.push({profile: profile.name, bounds, timing, focus: focusBounds, closeMs, selections,swipe,scrollRestored,errors});
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await context.close();
}
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
const homepage=[];
for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(`${base}/zh#work`,{waitUntil:'networkidle'});
  await page.locator('section[aria-label="进入精选作品"]').waitFor();
  await page.waitForTimeout(500);
  const before=await page.evaluate(()=>scrollY);
  await page.mouse.move(width/2,450);
  await page.mouse.wheel(0,240);
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>({scrollY,overflow:document.documentElement.scrollWidth-innerWidth,heroPaused:document.querySelector('.heroMorphVideo')?.paused,backgroundVideos:document.querySelectorAll('[class*="narrative"] video').length}));
  homepage.push({width,before,...state,nativeScroll:state.scrollY>before});
  await page.screenshot({path:`${output}/home-${width}-reduced-motion.png`});
  await context.close();
}
await writeFile(`${output}/homepage.json`,JSON.stringify(homepage,null,2));
await browser.close();
for(const entry of report){
  assert.equal(entry.bounds.pageOverflow,0,`${entry.profile}: horizontal page overflow`);
  assert.equal(entry.bounds.clipped,false,`${entry.profile}: record clipped by stage`);
  assert.equal(entry.bounds.viewportClipped,false,`${entry.profile}: initial record outside viewport`);
  assert.equal(entry.focus.horizontalOverflow,false,`${entry.profile}: expanded disc outside viewport`);
  assert.equal(entry.focus.layerOverflow,0,`${entry.profile}: expanded contents overflow`);
  assert(entry.selections.every(item=>item.fullyVisible),`${entry.profile}: selected record outside viewport`);
  assert.equal(entry.scrollRestored,true,`${entry.profile}: page remains scroll locked`);
  assert.deepEqual(entry.errors,[],`${entry.profile}: browser errors`);
  if(entry.swipe){assert.equal(entry.swipe.selected,'1',`${entry.profile}: swipe does not select next record`);assert.equal(entry.swipe.accidentalDialog,false,`${entry.profile}: swipe opens dialog`)}
}
for(const entry of homepage){assert.equal(entry.overflow,0);assert.equal(entry.heroPaused,true);assert.equal(entry.backgroundVideos,0);assert.equal(entry.nativeScroll,true)}
