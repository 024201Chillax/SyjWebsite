'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {Locale} from '@/lib/types';
import styles from './MediaStoreNarrative.module.css';

type Segment='intro'|'return';
type Phase='idle'|'store-overview'|'approach-selected'|'handoff-to-work'|'return-from-work'|'store-overview-return'|'approach-restricted'|'pickup-restricted-disc'|'handoff-to-playground';
type Sequence='selected'|'restricted';
type AssetSet='desktop'|'mobile';
type TransitionVariant='selected'|'restricted';
type TransitionState='idle'|'entering'|'settling'|'scanning'|'verified'|'leaving';
type Props={locale:Locale;work:ReactNode;playground:ReactNode};

const clamp=(value:number,min=0,max=1)=>Math.min(max,Math.max(min,value));
const smooth=(value:number)=>{const t=clamp(value);return t*t*(3-2*t)};
const range=(value:number,start:number,end:number)=>smooth((value-start)/(end-start));
const mix=(from:number,to:number,amount:number)=>from+(to-from)*amount;
const FRAME_COUNT=60;
const frameKey=(assetSet:AssetSet,sequence:Sequence,index:number)=>`${assetSet}-${sequence}-${Math.round(clamp(index,0,FRAME_COUNT-1))}`;
const framePath=(assetSet:AssetSet,sequence:Sequence,index:number)=>`/models/media-store/sequences/${assetSet}/${sequence}/frame-${String(Math.round(clamp(index,0,FRAME_COUNT-1))).padStart(3,'0')}.webp`;

function sectionProgress(section:HTMLElement){
 const rect=section.getBoundingClientRect();
 return clamp(-rect.top/Math.max(1,section.offsetHeight));
}

export default function MediaStoreNarrative({locale,work,playground}:Props){
 const rootRef=useRef<HTMLDivElement>(null);
 const introRef=useRef<HTMLElement>(null);
 const returnRef=useRef<HTMLElement>(null);
 const frame=useRef<number|null>(null);
 const phaseRef=useRef<Phase>('idle');
 const reducedMotionRef=useRef(false);
 const [phase,setPhase]=useState<Phase>('idle');
 const [canvasVisible,setCanvasVisible]=useState(false);
 const [reduceMotion,setReduceMotion]=useState(false);
 const progressLabelRef=useRef<HTMLSpanElement>(null);
 const sequenceCanvasRef=useRef<HTMLCanvasElement>(null);
 const renderedModelRef=useRef<HTMLDivElement>(null);
 const transitionRef=useRef<HTMLDivElement>(null);
 const anchorBypassRef=useRef<{target:'work'|'playground';settled:boolean}|null>(null);
 const activeAssetSetRef=useRef<AssetSet>('desktop');
 const desiredFrameRef=useRef<{assetSet:AssetSet;sequence:Sequence;index:number}>({assetSet:'desktop',sequence:'selected',index:0});
 const previousDesiredFrameRef=useRef<{sequence:Sequence;index:number}>({sequence:'selected',index:0});
 const frameCacheRef=useRef(new Map<string,HTMLImageElement>());
 const pendingFramesRef=useRef(new Set<string>());
 const zh=locale==='zh';

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateMotion=()=>{reducedMotionRef.current=media.matches;setReduceMotion(media.matches)};
  updateMotion();media.addEventListener('change',updateMotion);
  let visible=false;
  let disposed=false;
  let lastDrawn='';
  let canvasWidth=1,canvasHeight=1;
  const measureCanvas=()=>{
   const bounds=renderedModelRef.current?.getBoundingClientRect();
   const dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<=767?1:1.25);
   canvasWidth=Math.max(1,Math.round((bounds?.width||window.innerWidth)*dpr));
   canvasHeight=Math.max(1,Math.round((bounds?.height||window.innerHeight)*dpr));
   lastDrawn='';
  };
  measureCanvas();
  const drawImage=(image:HTMLImageElement)=>{
   const canvas=sequenceCanvasRef.current;if(!canvas||!image.complete||!image.naturalWidth)return;
   const width=canvasWidth,height=canvasHeight;
   const key=`${image.src}:${width}:${height}`;
   if(key===lastDrawn)return;
   lastDrawn=key;
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
   const context=canvas.getContext('2d',{alpha:true});if(!context)return;
   context.clearRect(0,0,width,height);
   context.imageSmoothingEnabled=true;
   context.imageSmoothingQuality='high';
   const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
   const drawWidth=image.naturalWidth*scale;
   const drawHeight=image.naturalHeight*scale;
   const drawX=(width-drawWidth)/2;
   const drawY=(height-drawHeight)/2;
   context.drawImage(image,drawX,drawY,drawWidth,drawHeight);
  };
  const getAssetSet=():AssetSet=>{
   const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
   return window.innerWidth<=767||saveData?'mobile':'desktop';
  };
  const trimCache=()=>{
   const cache=frameCacheRef.current;
   const desired=desiredFrameRef.current;
   const protectedKeys=new Set([
    frameKey(desired.assetSet,desired.sequence,desired.index),
    frameKey(desired.assetSet,'selected',0),
    frameKey(desired.assetSet,'selected',FRAME_COUNT-1),
    frameKey(desired.assetSet,'restricted',0),
    frameKey(desired.assetSet,'restricted',FRAME_COUNT-1)
   ]);
   let guard=0;
   while(cache.size>(window.innerWidth<=767?7:10)&&guard++<32){
    const oldest=cache.keys().next().value as string|undefined;
    if(!oldest)return;
    const image=cache.get(oldest);cache.delete(oldest);
    if(protectedKeys.has(oldest)&&image)cache.set(oldest,image);
   }
  };
  const loadFrame=(assetSet:AssetSet,sequence:Sequence,index:number)=>{
   const safeIndex=Math.round(clamp(index,0,FRAME_COUNT-1));
   const key=frameKey(assetSet,sequence,safeIndex);
   const cache=frameCacheRef.current;
   const cached=cache.get(key);
   if(cached){cache.delete(key);cache.set(key,cached);return}
   if(pendingFramesRef.current.has(key)||pendingFramesRef.current.size>=(window.innerWidth<=767?2:3))return;
   pendingFramesRef.current.add(key);
   const image=new window.Image();image.decoding='async';
   image.onload=()=>{
    void image.decode().catch(()=>undefined).then(()=>{
     if(disposed)return;
     pendingFramesRef.current.delete(key);cache.set(key,image);trimCache();
     const desired=desiredFrameRef.current;
     if(desired.assetSet===assetSet&&desired.sequence===sequence&&desired.index===safeIndex)drawImage(image);
     else loadFrame(desired.assetSet,desired.sequence,desired.index);
    });
   };
   image.onerror=()=>pendingFramesRef.current.delete(key);
   image.src=framePath(assetSet,sequence,safeIndex);
  };
  const renderSequenceFrame=(sequence:Sequence,index:number)=>{
   const assetSet=activeAssetSetRef.current;
   const safeIndex=Math.round(clamp(index,0,FRAME_COUNT-1));
   const previous=previousDesiredFrameRef.current;
   const direction=previous.sequence===sequence?Math.sign(safeIndex-previous.index):1;
   previousDesiredFrameRef.current={sequence,index:safeIndex};
   desiredFrameRef.current={assetSet,sequence,index:safeIndex};
   const cache=frameCacheRef.current;
   const exact=cache.get(frameKey(assetSet,sequence,safeIndex));
   if(exact)drawImage(exact);
   else{
    let nearest:HTMLImageElement|undefined;let distance=Number.POSITIVE_INFINITY;
    cache.forEach((image,key)=>{
     const [cachedSet,cachedSequence,cachedIndex]=key.split('-');
     if(cachedSet!==assetSet||cachedSequence!==sequence)return;
     const nextDistance=Math.abs(Number(cachedIndex)-safeIndex);
     if(image.complete&&nextDistance<distance){nearest=image;distance=nextDistance}
    });
    if(nearest)drawImage(nearest);
   }
   loadFrame(assetSet,sequence,safeIndex);
   const forward=direction<0?-1:1;
   for(let offset=1;offset<=2&&pendingFramesRef.current.size<(window.innerWidth<=767?2:3);offset+=1){
    loadFrame(assetSet,sequence,safeIndex+offset*forward);
    if(offset===1)loadFrame(assetSet,sequence,safeIndex-offset*forward);
   }
  };
  activeAssetSetRef.current=getAssetSet();
  const warmAssetSet=activeAssetSetRef.current;
  loadFrame(warmAssetSet,'selected',0);loadFrame(warmAssetSet,'selected',FRAME_COUNT-1);
  loadFrame(warmAssetSet,'restricted',0);loadFrame(warmAssetSet,'restricted',FRAME_COUNT-1);
  const warmDestination=(id:string)=>{
   const images=Array.from(document.querySelectorAll<HTMLImageElement>(`#${id} img`)).slice(0,6);
   images.forEach((image,index)=>{
    if(index<3)image.loading='eager';
    if(image.complete&&image.naturalWidth)void image.decode().catch(()=>undefined);
    else image.addEventListener('load',()=>void image.decode().catch(()=>undefined),{once:true});
   });
  };
  const destinationObserver=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){warmDestination((entry.target as HTMLElement).id);destinationObserver.unobserve(entry.target)}
  },{rootMargin:'160px'});
  for(const id of ['work','playground']){const target=document.getElementById(id);if(target)destinationObserver.observe(target)}
  const commitPhase=(next:Phase)=>{if(phaseRef.current!==next){phaseRef.current=next;setPhase(next)}};
  const transitionSpanForViewport=()=>{
   const mobile=window.innerWidth<=767;
   return clamp(window.innerHeight*(mobile?.72:.9),mobile?520:680,mobile?760:980);
  };
  let lastPanel='';
  const setPanel=(variant:TransitionVariant,state:TransitionState,progress:number,direction:1|-1)=>{
   const layer=transitionRef.current;if(!layer)return;
   const amount=clamp(progress);
   const key=`${variant}:${state}:${amount.toFixed(3)}:${direction}`;
   if(key===lastPanel)return;
   lastPanel=key;
   const enter=range(amount,0,.18);
   const settle=range(amount,.18,.28);
   const exit=range(amount,.76,1);
   const x=amount<.76?mix(direction*112,0,enter):mix(0,-direction*112,exit);
   const scan=range(amount,.28,.66);
   const verified=range(amount,.66,.76)*(1-range(amount,.76,.9));
   const content=range(amount,.16,.28)*(1-range(amount,.76,.92));
   const active=amount>.001&&amount<.999;
   layer.dataset.variant=variant;
   layer.dataset.state=state;
   layer.style.setProperty('--panel-x',`${x.toFixed(3)}vw`);
   layer.style.setProperty('--panel-drift',`${(direction*mix(7,0,settle)).toFixed(2)}px`);
   layer.style.setProperty('--panel-opacity',active?'1':'0');
   layer.style.setProperty('--content-progress',content.toFixed(4));
   layer.style.setProperty('--content-y',`${mix(8,0,content).toFixed(2)}px`);
   layer.style.setProperty('--scan-progress',scan.toFixed(4));
   layer.style.setProperty('--scan-y',`${mix(28,73,scan).toFixed(2)}dvh`);
   layer.style.setProperty('--scan-opacity',String(range(amount,.26,.31)*(1-range(amount,.66,.71))));
   layer.style.setProperty('--verified-progress',verified.toFixed(4));
   layer.style.setProperty('--verified-y',`${mix(6,0,verified).toFixed(2)}px`);
   layer.style.setProperty('--verified-scale',mix(.96,1,verified).toFixed(4));
   const rows=[range(scan,0,.18),range(scan,.16,.36),range(scan,.34,.56),range(scan,.54,.78),range(scan,.76,1)];
   rows.forEach((row,index)=>{
    layer.style.setProperty(`--row-${index+1}-progress`,row.toFixed(4));
    layer.style.setProperty(`--row-${index+1}-x`,`${mix(8,0,row).toFixed(2)}px`);
   });
  };
  const update=()=>{
   frame.current=null;
   const intro=introRef.current;const returning=returnRef.current;const root=rootRef.current;
   if(!intro||!returning||!root)return;
   const nextAssetSet=getAssetSet();
   if(activeAssetSetRef.current!==nextAssetSet){
    activeAssetSetRef.current=nextAssetSet;
    loadFrame(nextAssetSet,'selected',0);loadFrame(nextAssetSet,'selected',FRAME_COUNT-1);
    loadFrame(nextAssetSet,'restricted',0);loadFrame(nextAssetSet,'restricted',FRAME_COUNT-1);
   }
   const introRect=intro.getBoundingClientRect();const returnRect=returning.getBoundingClientRect();
   const viewportHeight=window.innerHeight;
   const introActive=introRect.top<=1&&introRect.bottom>0;
   const returnActive=returnRect.top<=1&&returnRect.bottom>0;
   const panelSpan=transitionSpanForViewport();
   const panelHalf=panelSpan/2;
   const boundaries:Array<{distance:number;progress:number;variant:TransitionVariant;direction:1|-1}>=[
    {distance:introRect.bottom,progress:clamp((panelHalf-introRect.bottom)/panelSpan),variant:'selected',direction:1},
    {distance:returnRect.bottom,progress:clamp((panelHalf-returnRect.bottom)/panelSpan),variant:'restricted',direction:-1}
   ];
   let suppressPanel=false;
   const bypass=anchorBypassRef.current;
   if(bypass){
    const target=document.getElementById(bypass.target);
    const targetTop=target?.getBoundingClientRect().top??Number.POSITIVE_INFINITY;
    if(!bypass.settled&&Math.abs(targetTop)<40)bypass.settled=true;
    suppressPanel=true;
    if(bypass.settled&&(targetTop<-panelSpan||targetTop>104)){anchorBypassRef.current=null;suppressPanel=false}
   }
   const activeBoundary=suppressPanel?undefined:boundaries.filter(boundary=>Math.abs(boundary.distance)<=panelHalf).sort((a,b)=>Math.abs(a.distance)-Math.abs(b.distance))[0];
   if(activeBoundary){
    const amount=activeBoundary.progress;
    const state:TransitionState=amount<.18?'entering':amount<.28?'settling':amount<.66?'scanning':amount<.76?'verified':'leaving';
    setPanel(activeBoundary.variant,reducedMotionRef.current&&amount>.18&&amount<.76?'verified':state,reducedMotionRef.current?amount<.5?.28:.76:amount,activeBoundary.direction);
   }else setPanel('selected','idle',0,1);
   const nextVisible=introActive||returnActive;
   let nextPhase:Phase='idle';
   let currentProgress=0;
   let activeSegment:Segment|null=null;
   if(introActive){
    activeSegment='intro';currentProgress=sectionProgress(intro);
    nextPhase=currentProgress<.06?'store-overview':currentProgress<.86?'approach-selected':'handoff-to-work';
   }else if(returnActive){
    activeSegment='return';currentProgress=sectionProgress(returning);
    nextPhase=currentProgress<.50?'store-overview-return':currentProgress<.86?'approach-restricted':currentProgress<.94?'pickup-restricted-disc':'handoff-to-playground';
   }
   root.style.setProperty('--intro-progress',activeSegment==='intro'?String(currentProgress):'0');
   root.style.setProperty('--return-progress',activeSegment==='return'?String(currentProgress):'0');

   if(introActive||returnActive){
    let sequence:Sequence='selected';let sequenceFrame=0;
    if(introActive)sequenceFrame=range(currentProgress,.03,.88)*(FRAME_COUNT-1);
    else if(currentProgress<.50)sequenceFrame=0;
    else{sequence='restricted';sequenceFrame=range(currentProgress,.50,.88)*(FRAME_COUNT-1)}
    renderSequenceFrame(sequence,reducedMotionRef.current?(sequenceFrame<FRAME_COUNT/2?0:FRAME_COUNT-1):sequenceFrame);
   }
   if(progressLabelRef.current)progressLabelRef.current.textContent=`${String(Math.round(currentProgress*100)).padStart(2,'0')}%`;
   if(visible!==nextVisible){visible=nextVisible;setCanvasVisible(nextVisible)}
   commitPhase(nextPhase);
  };
  // Native scrolling owns the camera. No wheel, keyboard or touch interception.
  const onScroll=()=>{if(!document.hidden&&frame.current===null)frame.current=requestAnimationFrame(update)};
  const onResize=()=>{measureCanvas();onScroll()};
  const onVisibility=()=>{if(document.hidden){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null}else onResize()};
  const onHashChange=()=>{
   if(location.hash==='#work'||location.hash==='#playground')anchorBypassRef.current={target:location.hash.slice(1) as 'work'|'playground',settled:false};
   onScroll();
  };
  const onAnchorClick=(event:MouseEvent)=>{
   const anchor=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[href$="#work"],a[href$="#playground"]');
   if(anchor)anchorBypassRef.current={target:anchor.hash.slice(1) as 'work'|'playground',settled:false};
  };
  if(location.hash==='#work'||location.hash==='#playground')anchorBypassRef.current={target:location.hash.slice(1) as 'work'|'playground',settled:false};
  const canvasObserver=new ResizeObserver(onResize);
  if(renderedModelRef.current)canvasObserver.observe(renderedModelRef.current);
  update();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onResize,{passive:true});
  window.addEventListener('hashchange',onHashChange);
  document.addEventListener('visibilitychange',onVisibility);
  document.addEventListener('click',onAnchorClick,true);
  return()=>{
   disposed=true;
   media.removeEventListener('change',updateMotion);
   window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);window.removeEventListener('hashchange',onHashChange);
   document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('click',onAnchorClick,true);
   if(frame.current!==null)cancelAnimationFrame(frame.current);
   canvasObserver.disconnect();destinationObserver.disconnect();
   frameCacheRef.current.clear();pendingFramesRef.current.clear();
  };

 },[]);

 const rightEntry=phase==='approach-restricted'||phase==='pickup-restricted-disc'||phase==='handoff-to-playground';
 const leftEntry=phase==='approach-selected';
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});

 return <div ref={rootRef} className={styles.narrative} data-phase={phase}>
  <div className={`${styles.canvasLayer} ${canvasVisible?styles.canvasVisible:''}`} aria-hidden="true">
   <div ref={renderedModelRef} className={styles.renderedModel}>
    <canvas ref={sequenceCanvasRef} className={styles.sequenceRender}/>

   </div>
   <div className={styles.topline}><span>MEDIA STORE / 00—02</span><span ref={progressLabelRef}>00%</span></div>
   <div className={`${styles.sideLabel} ${styles.leftLabel} ${leftEntry?styles.visible:''}`}>
    <div className={styles.labelIndex}><b>01</b><i/><span>SELECTED</span></div>
    <strong>{zh?'精选设计作品':'SELECTED WORKS'}</strong>
    <button type="button" onClick={()=>jump('work')}><span>{zh?'查看专辑档案':'OPEN THE ARCHIVE'}</span><i>↘</i></button>
   </div>
   <div className={`${styles.sideLabel} ${styles.rightLabel} ${rightEntry?styles.visible:''}`}>
    <div className={styles.labelIndex}><b>02</b><i/><span>RESTRICTED</span></div>
    <strong>{zh?'实验作品区':'EXPERIMENTAL MEDIA'}</strong>
    <button type="button" onClick={()=>jump('playground')}><span>{zh?'进入实验场':'ENTER PLAYGROUND'}</span><i>↘</i></button>
   </div>
  </div>

  <div ref={transitionRef} className={styles.aisleTransition} data-variant="selected" data-state="idle" aria-hidden="true">
   <div className={styles.shelfEndPanel}>
    <i className={`${styles.panelEdge} ${styles.panelEdgeLeading}`}/>
    <i className={`${styles.panelEdge} ${styles.panelEdgeTrailing}`}/>
    <div className={styles.panelFasteners}><i/><i/><i/><i/></div>
    <div className={styles.terminalRail}>
     <span>YS—MS / TERMINAL</span><i/><b>CHANNEL 01—02</b>
    </div>
    <div className={styles.panelLabelSlot}><i/><span>PHYSICAL MEDIA / INDEX CONTROL</span><b>NO. 0917</b></div>

    <div className={`${styles.terminalContent} ${styles.selectedStatus}`}>
     <header className={styles.terminalHeader}>
      <div><span>YU.JIE SU / MEDIA STORE</span><b>ARCHIVE READER — UNIT 01</b></div>
      <div className={styles.headerState}><i/>STATUS / ONLINE</div>
     </header>
     <div className={styles.terminalGrid}>
      <section className={styles.terminalPrimary}>
       <span className={styles.terminalEyebrow}>SELECTED ARCHIVE / P.01—07</span>
       <h2>READING<br/>INDEX <em>01</em></h2>
       <p>CURATED WORKS / DESIGN ARCHIVE<br/>{zh?'精选设计作品目录':'SELECTED DESIGN CATALOGUE'}</p>
       <div className={styles.registrationMark}>＋</div>
       <div className={styles.verticalCode}>CURATED MEDIA / PUBLIC ACCESS / NKG</div>
      </section>
      <ol className={styles.readoutList}>
       <li><b>001</b><span>PROJECT IDENTIFICATION</span><em>READ</em></li>
       <li><b>002</b><span>COVER ARTWORK</span><em>READ</em></li>
       <li><b>003</b><span>VISUAL SYSTEM</span><em>READ</em></li>
       <li><b>004</b><span>OBJECT / PUBLICATION</span><em>READ</em></li>
       <li><b>005</b><span>ARCHIVE READY</span><em>OK</em></li>
      </ol>
      <dl className={styles.terminalSpecs}>
       <div><dt>MEDIA TYPE</dt><dd>COMPACT DISC</dd></div>
       <div><dt>CATALOGUE</dt><dd>SEL—001</dd></div>
       <div><dt>ACCESS</dt><dd>PUBLIC</dd></div>
       <div><dt>INDEX</dt><dd>01 / 07</dd></div>
       <div><dt>SOURCE</dt><dd>NKG—ARCHIVE</dd></div>
      </dl>
     </div>
    </div>

    <div className={`${styles.terminalContent} ${styles.restrictedStatus}`}>
     <header className={styles.terminalHeader}>
      <div><span>RESTRICTED MEDIA CONTROL</span><b>INSPECTION UNIT — R02</b></div>
      <div className={styles.headerState}><i/>SECURITY / LEVEL 02</div>
     </header>
     <div className={styles.terminalGrid}>
      <section className={styles.terminalPrimary}>
       <span className={styles.terminalEyebrow}>CONTROLLED MEDIA / X—02 / Y—17</span>
       <h2>VERIFYING<br/><em>ACCESS</em></h2>
       <p>RESTRICTED MEDIA / CULT ARCHIVE<br/>{zh?'危险媒体检查终端':'MEDIA INSPECTION TERMINAL'}</p>
       <div className={styles.registrationMark}>×</div>
       <div className={styles.verticalCode}>CONTROLLED MEDIA / ISOLATED ROUTE / R02</div>
      </section>
      <ol className={styles.readoutList}>
       <li><b>01</b><span>MEDIA SIGNATURE</span><em>VERIFIED</em></li>
       <li><b>02</b><span>ARCHIVE ORIGIN</span><em>UNKNOWN</em></li>
       <li><b>03</b><span>CONTENT CLASS</span><em>CULT MEDIA</em></li>
       <li><b>04</b><span>ACCESS PERMISSION</span><em>CHECKING</em></li>
       <li><b>05</b><span>PLAYBACK ROUTE</span><em>ISOLATED</em></li>
      </ol>
      <dl className={styles.terminalSpecs}>
       <div><dt>MEDIA TYPE</dt><dd>OPTICAL DISC</dd></div>
       <div><dt>CATALOGUE</dt><dd>RST—002</dd></div>
       <div><dt>CONDITION</dt><dd>UNSTABLE</dd></div>
       <div><dt>CLEARANCE</dt><dd>LEVEL 02</dd></div>
       <div><dt>ROUTE</dt><dd>ISOLATED</dd></div>
      </dl>
     </div>
    </div>

    <div className={styles.scanProgressTrack}><span/><i className={styles.scanProgressValue}/><b>00</b><em>100</em></div>
    <div className={styles.scanLine}/>
    <div className={styles.statusLamp}/>
    <div className={styles.verificationStamp}><i>✓</i><span className={styles.selectedStatus}>MEDIA VERIFIED</span><span className={styles.restrictedStatus}>ACCESS GRANTED</span></div>
    <div className={styles.terminalFooter}>
     <span className={styles.selectedStatus}>INSERTED MEDIA VERIFIED / CONTINUE TO ARCHIVE →</span>
     <span className={styles.restrictedStatus}>CONTROLLED ACCESS ONLY / ENTER EXPERIMENTAL ARCHIVE →</span>
     <b>SYS: 2026.10 / FRAME 00—02 / NKG</b>
    </div>
   </div>
  </div>

  <section ref={introRef} className={`${styles.bridge} ${styles.introBridge}`} aria-label={zh?'进入精选作品':'Enter selected works'}/>
  <div className={styles.contentSlot}><div className={styles.contentBody}>{work}</div></div>
  <section ref={returnRef} className={`${styles.bridge} ${styles.returnBridge}`} aria-label={zh?'从作品档案进入实验场':'From work archive to playground'}/>
  <div className={styles.contentSlot}><div className={styles.contentBody}>{playground}</div></div>
 </div>;
}
