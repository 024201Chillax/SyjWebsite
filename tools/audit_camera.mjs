import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.UI_AUDIT_OUTPUT||'ui-audit';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
for(const {width,height} of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1440,height:844}]){
 const mobile=width!==1440;
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{
  window.__cameraSource='';
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0] instanceof HTMLImageElement&&args[0].src.includes('/media-store/'))window.__cameraSource=args[0].src;return draw.apply(this,args)};
 });
 const page=await context.newPage();
 const requests=new Set();
 page.on('request',request=>{if(request.url().includes('/media-store/'))requests.add(new URL(request.url()).pathname)});
 const client=await context.newCDPSession(page);
 await client.send('Emulation.setCPUThrottlingRate',{rate:mobile?4:2});
 await client.send('Network.enable');
 await client.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:1250000,uploadThroughput:1250000});
 await page.goto(`${process.env.UI_BASE_URL||'http://127.0.0.1:3000'}/zh#work`,{waitUntil:'networkidle'});
 for(const [name,label] of [['selected','进入精选作品'],['restricted','从作品档案进入实验场']]){
  const result=await page.evaluate(async label=>{
   document.documentElement.style.scrollBehavior='auto';
   const section=document.querySelector(`section[aria-label="${label}"]`);
   const top=scrollY+section.getBoundingClientRect().top,height=section.offsetHeight;
   const poster=document.querySelector('[data-camera-poster]');
   window.scrollTo(0,top+height*.12);
   await new Promise(resolve=>setTimeout(resolve,500));
   const deltas=[],states=[];
   let previous=performance.now(),lastStep=-1;
   await new Promise(resolve=>{
    const start=performance.now();
    function tick(now){
     const elapsed=now-start,step=Math.min(30,Math.floor(elapsed/80));
     if(step!==lastStep){window.scrollTo(0,top+height*(.12+.63*step/30));lastStep=step}
     deltas.push(now-previous);previous=now;
     states.push(poster?.style.transform||window.__cameraSource||'empty');
     if(elapsed<2400)requestAnimationFrame(tick);else resolve();
    }
    requestAnimationFrame(tick);
   });
   const changes=states.slice(1).filter((state,index)=>state!==states[index]).length;
   const sorted=[...deltas].sort((a,b)=>a-b);
   const settledAt=scrollY;
   await new Promise(resolve=>setTimeout(resolve,600));
   const ahead=poster?.style.transform;
   window.scrollTo(0,top+height*.2);
   await new Promise(resolve=>setTimeout(resolve,600));
   return {samples:states.length,visualChanges:changes,changeRatio:changes/Math.max(1,states.length-1),p95:sorted[Math.floor(sorted.length*.95)],slowFrames:deltas.filter(d=>d>34).length,continuous:!!poster,reverseChanged:!!poster&&ahead!==poster.style.transform,settledAt,canvas:document.querySelectorAll('[class*="sequenceRender"]').length};
  },label);
  await page.screenshot({path:`${output}/camera-${width}-${name}.png`});
  const focused=await page.evaluate(async ({label,name})=>{
   const section=document.querySelector(`section[aria-label="${label}"]`);
   window.scrollTo(0,scrollY+section.getBoundingClientRect().top+section.offsetHeight*.75);
   await new Promise(resolve=>setTimeout(resolve,600));
   const poster=document.querySelector('[data-camera-poster]');
   if(!poster)return null;
   const model=poster.parentElement.getBoundingClientRect(),matrix=new DOMMatrix(poster.style.transform);
   const fw=Math.min(model.width,model.height*2160/1215),fh=fw*1215/2160;
   const xs=name==='selected'?[.12,.474]:[.526,.88],ys=name==='selected'?[.20,.80]:[.18,.80];
   const shelf={left:model.left+model.width/2+(xs[0]-.5)*fw*matrix.a+matrix.m41,right:model.left+model.width/2+(xs[1]-.5)*fw*matrix.a+matrix.m41,top:model.top+model.height/2+(ys[0]-.5)*fh*matrix.a+matrix.m42,bottom:model.top+model.height/2+(ys[1]-.5)*fh*matrix.a+matrix.m42};
   const card=Array.from(document.querySelectorAll('[class*="sideLabel"]')).find(element=>getComputedStyle(element).visibility==='visible')?.getBoundingClientRect();
   return {shelf,complete:shelf.left>=-1&&shelf.right<=innerWidth+1&&shelf.top>=60&&shelf.bottom<=innerHeight+1,cardOverlap:!!card&&Math.min(card.right,shelf.right)>Math.max(card.left,shelf.left)&&Math.min(card.bottom,shelf.bottom)>Math.max(card.top,shelf.top),overflow:document.documentElement.scrollWidth-innerWidth};
  },{label,name});
  await page.screenshot({path:`${output}/camera-${width}-${name}-focused.png`});
  report.push({width,height,sequence:name,...result,focused});
 }
 report.push({width,resourceRequests:requests.size,resources:[...requests]});
 await context.close();
}
await browser.close();
await writeFile(`${output}/camera.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
for(const row of report)if(row.continuous){assert(row.changeRatio>.7,'Camera holds between wheel steps');assert(row.reverseChanged,'Camera fails to reverse');assert.equal(row.canvas,0);assert.equal(row.focused.complete,true,`${row.width}: focused shelf clipped`);assert.equal(row.focused.cardOverlap,false,`${row.width}: entry card covers shelf`);assert.equal(row.focused.overflow,0)}
