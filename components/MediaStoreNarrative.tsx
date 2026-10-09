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
 const motionVideoRefs=useRef(new Map<string,HTMLVideoElement>());
 const transitionRef=useRef<HTMLDivElement>(null);
 const anchorBypassRef=useRef<{target:'work'|'playground';settled:boolean}|null>(null);
 const touchStartYRef=useRef(0);
 const touchLastYRef=useRef(0);
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
  const drawImage=(image:HTMLImageElement)=>{
   const canvas=sequenceCanvasRef.current;if(!canvas||!image.complete||!image.naturalWidth)return;
   const bounds=canvas.getBoundingClientRect();
   const cssWidth=bounds.width>0&&bounds.width<=window.innerWidth*1.5?bounds.width:window.innerWidth*.94;
   const cssHeight=bounds.height>0&&bounds.height<=window.innerHeight*1.2?bounds.height:window.innerHeight*.86;
   const sourceDpr=Math.max(1,Math.min(image.naturalWidth/Math.max(1,cssWidth),image.naturalHeight/Math.max(1,cssHeight)));
   const dpr=Math.min(window.devicePixelRatio||1,2,sourceDpr);
   const width=Math.max(1,Math.round(cssWidth*dpr));
   const height=Math.max(1,Math.round(cssHeight*dpr));
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
   while(cache.size>12&&guard++<32){
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
   if(pendingFramesRef.current.has(key)||pendingFramesRef.current.size>=4)return;
   pendingFramesRef.current.add(key);
   const image=new window.Image();image.decoding='async';
   image.onload=()=>{
    void image.decode().catch(()=>undefined).then(()=>{
     pendingFramesRef.current.delete(key);cache.set(key,image);trimCache();
     const desired=desiredFrameRef.current;
     if(desired.assetSet===assetSet&&desired.sequence===sequence&&desired.index===safeIndex)drawImage(image);
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
   for(let offset=1;offset<=3&&pendingFramesRef.current.size<4;offset+=1){
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
  const idleWindow=window as Window&{requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number;cancelIdleCallback?:(id:number)=>void};
  const warmId=idleWindow.requestIdleCallback?.(()=>{warmDestination('work');warmDestination('playground')},{timeout:1200})
   ??window.setTimeout(()=>{warmDestination('work');warmDestination('playground')},250);
  const commitPhase=(next:Phase)=>{if(phaseRef.current!==next){phaseRef.current=next;setPhase(next)}};
  const transitionSpanForViewport=()=>{
   const mobile=window.innerWidth<=767;
   return clamp(window.innerHeight*(mobile?.72:.9),mobile?520:680,mobile?760:980);
  };
  const setPanel=(variant:TransitionVariant,state:TransitionState,progress:number,direction:1|-1)=>{
   const layer=transitionRef.current;if(!layer)return;
   const amount=clamp(progress);
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

   if((introActive||returnActive)&&!motionActive){
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
  type NavigationSegment={element:HTMLElement;name:Segment;progress:number};
  let cameraMotionFrame:number|null=null;
  let wheelAccumulator=0;
  let wheelDirection:1|-1=1;
  let lastWheelTime=0;
  let gestureArmed=true;
  let gestureRearmTimer:number|null=null;
  let motionActive=false;
  let previousScrollBehavior:string|null=null;
  const navigationStops:Record<Segment,number[]>={
   intro:[0,.82,1],
   return:[0,.48,.86,1]
  };
  const rearmAfterQuiet=()=>{
   gestureArmed=false;
   if(gestureRearmTimer!==null)window.clearTimeout(gestureRearmTimer);
   gestureRearmTimer=window.setTimeout(()=>{
    gestureArmed=true;
    wheelAccumulator=0;
    gestureRearmTimer=null;
   },90);
  };
  const activeNavigationSegment=():NavigationSegment|null=>{
   if(anchorBypassRef.current)return null;
   const introElement=introRef.current;
   const returnElement=returnRef.current;
   if(!introElement||!returnElement)return null;
   const candidates:Array<{element:HTMLElement;name:Segment;rect:DOMRect}>= [
    {element:introElement,name:'intro',rect:introElement.getBoundingClientRect()},
    {element:returnElement,name:'return',rect:returnElement.getBoundingClientRect()}
   ];
   const edgeReach=transitionSpanForViewport()*1.08;
   const active=candidates
    .filter(item=>item.rect.top<=window.innerHeight*(item.name==='return' ? .72 : .18)&&item.rect.bottom>-edgeReach)
    .sort((a,b)=>Math.abs(a.rect.top)-Math.abs(b.rect.top))[0];
   return active?{element:active.element,name:active.name,progress:sectionProgress(active.element)}:null;
  };
  const nextNavigationStop=(segment:NavigationSegment,direction:1|-1)=>{
   const epsilon=.035;
   const stops=navigationStops[segment.name];
   if(direction>0)return stops.find(stop=>stop>segment.progress+epsilon)??null;
   return [...stops].reverse().find(stop=>stop<segment.progress-epsilon)??null;
  };
  const scrollTopForStop=(element:HTMLElement,stop:number)=>{
   const sectionTop=window.scrollY+element.getBoundingClientRect().top;
   const boundaryNudge=stop>=.999?2:0;
   return Math.round(sectionTop+element.offsetHeight*stop+boundaryNudge);
  };
  const easeInOutCubic=(value:number)=>value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2;
  const forceInstantProgrammaticScroll=()=>{
   if(previousScrollBehavior!==null)return;
   previousScrollBehavior=document.documentElement.style.scrollBehavior;
   document.documentElement.style.scrollBehavior='auto';
  };
  const restorePageScrollBehavior=()=>{
   if(previousScrollBehavior===null)return;
   document.documentElement.style.scrollBehavior=previousScrollBehavior;
   previousScrollBehavior=null;
  };
  const setProgrammaticScrollTop=(value:number)=>{
   document.documentElement.scrollTop=value;
   document.body.scrollTop=value;
  };
  const motionClipForMove=(segment:NavigationSegment,stop:number):{sequence:Sequence;direction:'forward'|'reverse'}|null=>{
   const from=segment.progress;
   if(segment.name==='intro'){
    if(stop===.82&&from<stop)return{sequence:'selected',direction:'forward'};
    if(stop===0&&from>stop)return{sequence:'selected',direction:'reverse'};
    return null;
   }
   if(stop===.86&&from<stop)return{sequence:'restricted',direction:'forward'};
   if(stop===.48&&from>stop)return{sequence:'restricted',direction:'reverse'};
   return null;
  };
  let motionVideoRequest=0;
  const stopMotionVideo=()=>{
   motionVideoRequest+=1;
   motionVideoRefs.current.forEach(video=>{
    video.pause();
    video.dataset.active='false';
   });
   renderedModelRef.current?.setAttribute('data-motion-active','false');
  };
  const playMotionVideo=(clip:ReturnType<typeof motionClipForMove>,duration:number)=>{
   if(!clip)return;
   const video=motionVideoRefs.current.get(`${clip.sequence}-${clip.direction}`);if(!video)return;
   const request=++motionVideoRequest;
   video.pause();
   video.currentTime=0;
   video.playbackRate=Math.min(1.5,Math.max(.75,1000/duration));
   const activate=()=>{
    if(request!==motionVideoRequest)return;
    motionVideoRefs.current.forEach(candidate=>{
     if(candidate===video)return;
     candidate.pause();
     candidate.dataset.active='false';
    });
    video.dataset.active='true';
    renderedModelRef.current?.setAttribute('data-motion-active','true');
   };
   if('requestVideoFrameCallback' in video)video.requestVideoFrameCallback(()=>activate());
   else requestAnimationFrame(activate);
   void video.play().catch(()=>{
    if(request!==motionVideoRequest)return;
    video.dataset.active='false';
    const fallback=Array.from(motionVideoRefs.current.values()).some(candidate=>candidate.dataset.active==='true');
    renderedModelRef.current?.setAttribute('data-motion-active',fallback?'true':'false');
   });
  };
  const startCameraMove=(segment:NavigationSegment,stop:number)=>{
   const from=window.scrollY;
   const to=scrollTopForStop(segment.element,stop);
   if(Math.abs(to-from)<2)return;
   if(cameraMotionFrame!==null)cancelAnimationFrame(cameraMotionFrame);
   const directOverview=segment.name==='return'&&((stop===.48&&segment.progress<.48)||(stop===0&&segment.progress>.035));
   if(directOverview){
    motionActive=true;
    gestureArmed=false;
    wheelAccumulator=0;
    forceInstantProgrammaticScroll();
    renderSequenceFrame('selected',0);
    stopMotionVideo();
    setProgrammaticScrollTop(to);
    update();
    motionActive=false;
    restorePageScrollBehavior();
    rearmAfterQuiet();
    onScroll();
    return;
   }
   motionActive=true;
   gestureArmed=false;
   wheelAccumulator=0;
   forceInstantProgrammaticScroll();
   const startedAt=performance.now();
   const distanceInViewports=Math.abs(to-from)/Math.max(1,window.innerHeight);
   const duration=reducedMotionRef.current?260:Math.min(1120,Math.max(860,800+distanceInViewports*145));
   const motionClip=motionClipForMove(segment,stop);
   playMotionVideo(motionClip,duration);
   const step=(now:number)=>{
    const progress=clamp((now-startedAt)/duration);
    setProgrammaticScrollTop(mix(from,to,easeInOutCubic(progress)));
    if(progress<1){cameraMotionFrame=requestAnimationFrame(step);return}
    setProgrammaticScrollTop(to);
    cameraMotionFrame=null;
    motionActive=false;
    update();
    restorePageScrollBehavior();
    rearmAfterQuiet();
    onScroll();
   };
   cameraMotionFrame=requestAnimationFrame(step);
  };
  const normalizeWheelDelta=(event:WheelEvent)=>{
   if(event.deltaMode===WheelEvent.DOM_DELTA_LINE)return event.deltaY*16;
   if(event.deltaMode===WheelEvent.DOM_DELTA_PAGE)return event.deltaY*window.innerHeight;
   return event.deltaY;
  };
  const onScroll=()=>{if(frame.current===null)frame.current=requestAnimationFrame(update)};
  const onHashChange=()=>{
   if(location.hash==='#work'||location.hash==='#playground')anchorBypassRef.current={target:location.hash.slice(1) as 'work'|'playground',settled:false};
   onScroll();
  };
  const onAnchorClick=(event:MouseEvent)=>{
   const anchor=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[href$="#work"],a[href$="#playground"]');
   if(anchor)anchorBypassRef.current={target:anchor.hash.slice(1) as 'work'|'playground',settled:false};
  };
  const onWheelIntent=(event:WheelEvent)=>{
   const delta=normalizeWheelDelta(event);
   if(delta<0&&anchorBypassRef.current?.settled){anchorBypassRef.current=null;onScroll();return}
   const segment=activeNavigationSegment();
   if(!segment||Math.abs(delta)<.5)return;
   const direction:1|-1=delta>0?1:-1;
   const targetStop=nextNavigationStop(segment,direction);
   if(targetStop===null)return;
   event.preventDefault();
   const now=performance.now();
   if(motionActive){
    lastWheelTime=now;
    rearmAfterQuiet();
    return;
   }
   if(!gestureArmed){
    if(now-lastWheelTime<=90){rearmAfterQuiet();return}
    gestureArmed=true;
    wheelAccumulator=0;
   }
   if(direction!==wheelDirection||now-lastWheelTime>140)wheelAccumulator=0;
   wheelDirection=direction;
   lastWheelTime=now;
   wheelAccumulator+=Math.abs(delta);
   if(wheelAccumulator<.75)return;
   startCameraMove(segment,targetStop);
  };
  const onKeyDown=(event:KeyboardEvent)=>{
   if(!['ArrowDown','ArrowUp','PageDown','PageUp','Down','Up','Page_Down','Page_Up'].includes(event.key))return;
   const segment=activeNavigationSegment();if(!segment||motionActive)return;
   const direction:1|-1=['ArrowDown','PageDown','Down','Page_Down'].includes(event.key)?1:-1;
   const targetStop=nextNavigationStop(segment,direction);if(targetStop===null)return;
   event.preventDefault();startCameraMove(segment,targetStop);
  };
  const onTouchStart=(event:TouchEvent)=>{
   touchStartYRef.current=event.touches[0]?.clientY??0;
   touchLastYRef.current=touchStartYRef.current;
  };
  const onTouchMove=(event:TouchEvent)=>{
   const currentY=event.touches[0]?.clientY??touchStartYRef.current;
   touchLastYRef.current=currentY;
   if(currentY-touchStartYRef.current>8&&anchorBypassRef.current?.settled){anchorBypassRef.current=null;onScroll()}
  };
  const onTouchEnd=()=>{
   const distance=touchStartYRef.current-touchLastYRef.current;
   if(Math.abs(distance)<44||motionActive)return;
   const segment=activeNavigationSegment();if(!segment)return;
   const direction:1|-1=distance>0?1:-1;
   const targetStop=nextNavigationStop(segment,direction);if(targetStop===null)return;
   startCameraMove(segment,targetStop);
  };
  if(location.hash==='#work'||location.hash==='#playground')anchorBypassRef.current={target:location.hash.slice(1) as 'work'|'playground',settled:false};
  update();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);window.addEventListener('hashchange',onHashChange);window.addEventListener('wheel',onWheelIntent,{passive:false});window.addEventListener('keydown',onKeyDown);window.addEventListener('touchstart',onTouchStart,{passive:true});window.addEventListener('touchmove',onTouchMove,{passive:true});window.addEventListener('touchend',onTouchEnd,{passive:true});document.addEventListener('click',onAnchorClick,true);
  return()=>{media.removeEventListener('change',updateMotion);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);window.removeEventListener('hashchange',onHashChange);window.removeEventListener('wheel',onWheelIntent);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('touchstart',onTouchStart);window.removeEventListener('touchmove',onTouchMove);window.removeEventListener('touchend',onTouchEnd);document.removeEventListener('click',onAnchorClick,true);if(frame.current!==null)cancelAnimationFrame(frame.current);if(cameraMotionFrame!==null)cancelAnimationFrame(cameraMotionFrame);if(gestureRearmTimer!==null)window.clearTimeout(gestureRearmTimer);stopMotionVideo();restorePageScrollBehavior();if(idleWindow.cancelIdleCallback&&typeof warmId==='number')idleWindow.cancelIdleCallback(warmId);else window.clearTimeout(warmId);document.body.style.cursor=''};
 },[]);

 const rightEntry=phase==='approach-restricted'||phase==='pickup-restricted-disc'||phase==='handoff-to-playground';
 const leftEntry=phase==='approach-selected';
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});

 return <div ref={rootRef} className={styles.narrative} data-phase={phase}>
  <div className={`${styles.canvasLayer} ${canvasVisible?styles.canvasVisible:''}`} aria-hidden="true">
   <div ref={renderedModelRef} className={styles.renderedModel}>
    <canvas ref={sequenceCanvasRef} className={styles.sequenceRender}/>
    {(['selected-forward','selected-reverse','restricted-forward','restricted-reverse'] as const).map(clip=>{
     const [sequence,direction]=clip.split('-') as [Sequence,'forward'|'reverse'];
     return <video key={clip} ref={node=>{if(node)motionVideoRefs.current.set(clip,node);else motionVideoRefs.current.delete(clip)}} className={styles.motionVideo} muted playsInline preload="auto">
      <source src={`/models/media-store/motion/mobile/${sequence}-${direction}.webm`} media="(max-width: 767px)" type="video/webm"/>
      <source src={`/models/media-store/motion/desktop/${sequence}-${direction}.webm`} type="video/webm"/>
     </video>;
    })}
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
