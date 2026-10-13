'use client';

import {useCallback,useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent} from 'react';

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const mix=(from:number,to:number,t:number)=>from+(to-from)*t;
const smooth=(from:number,to:number,value:number)=>{const t=clamp((value-from)/(to-from),0,1);return t*t*(3-2*t)};
type Drag={active:boolean;pointerId:number;x:number;y:number;target:number;moved:boolean;horizontal:boolean};
type Layout={width:number;height:number;diameter:number;compact:boolean};

export default function useVinylArchiveMotion(count:number,enabled=true){
 const sceneRef=useRef<HTMLElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const cameraRef=useRef<HTMLDivElement>(null);
 const recordsRef=useRef<Array<HTMLButtonElement|null>>([]);
 const layoutRef=useRef<Layout>({width:1,height:1,diameter:1,compact:true});
 const frameRef=useRef(0);
 const lastFrameRef=useRef(0);
 const currentRef=useRef(0);
 const targetRef=useRef(0);
 const cameraCurrentRef=useRef(0);
 const cameraTargetRef=useRef(0);
 const tiltRef=useRef(0);
 const tiltTargetRef=useRef(0);
 const activeRef=useRef(0);
 const reducedRef=useRef(false);
 const enabledRef=useRef(enabled);
 const visibleRef=useRef(false);
 const pressedIndexRef=useRef<number|null>(null);
 const hoverPointRef=useRef<{x:number;y:number}|null>(null);
 const dragRef=useRef<Drag>({active:false,pointerId:-1,x:0,y:0,target:0,moved:false,horizontal:false});
 const [activeIndex,setActiveIndex]=useState(0);
 const [reducedMotion,setReducedMotion]=useState(false);

 const apply=useCallback(()=>{
  const {width,height,diameter,compact}=layoutRef.current;
  if(diameter<=1)return;
  const progress=currentRef.current;
  const camera=compact||reducedRef.current?1:cameraCurrentRef.current;
  const corridor=.6+.4*smooth(.14,.72,camera);
  const rig=cameraRef.current;
  if(rig){
   rig.style.transform=compact?'none':`translate3d(0,0,0) rotateZ(${-1.5*corridor}deg)`;
   rig.dataset.phase=camera<.1?'stack':camera<.72?'extract':'select';
  }
  recordsRef.current.forEach((record,index)=>{
   if(!record)return;
   const distance=index-progress;
   const abs=Math.abs(distance);
   const focus=Math.max(0,1-abs);
   const axis=index-(count-1)/2;
   const stepX=Math.min(diameter*.30,Math.max(0,width-diameter-40)/Math.max(1,count-1));
   const stepY=Math.min(diameter*.08,Math.max(0,height-diameter-56)/Math.max(1,count-1));
   const x=compact?distance*diameter*.88:mix(index*diameter*.018,axis*stepX,corridor);
   const y=compact?0:mix(-index*diameter*.009,-axis*stepY,corridor);
   const angle=compact?0:mix(index*.65,-axis*.25,corridor)+tiltRef.current*.65;
   const scale=compact?1:1+focus*.015*corridor;
   const opacity=compact?clamp(1-Math.max(0,abs-.5)*.65,0,1):1;
   // Only compositor properties change during motion. Dimensions are cached on resize.
   record.style.transform=`translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotateZ(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
   record.style.opacity=opacity.toFixed(3);
   record.style.visibility=compact&&abs>1.7?'hidden':'visible';
   record.style.pointerEvents=compact&&abs>1.7?'none':'auto';
   record.style.zIndex=String(20-Math.abs(index-activeRef.current));
   const active=abs<.5;
   record.dataset.active=active?'true':'false';
   record.dataset.side=active?'active':distance<0?'before':'after';
   record.tabIndex=active?0:-1;
  });
 },[count]);

 const stop=useCallback(()=>{if(frameRef.current)cancelAnimationFrame(frameRef.current);frameRef.current=0;lastFrameRef.current=0},[]);
 const animate=useCallback((now:number)=>{
  frameRef.current=0;
  if(!enabledRef.current||!visibleRef.current||document.hidden)return;
  const delta=Math.min(40,lastFrameRef.current?now-lastFrameRef.current:16.67);
  lastFrameRef.current=now;
  const alpha=1-Math.exp(-delta/55);
  const positionDelta=targetRef.current-currentRef.current;
  const cameraDelta=cameraTargetRef.current-cameraCurrentRef.current;
  const tiltDelta=tiltTargetRef.current-tiltRef.current;
  currentRef.current=reducedRef.current||Math.abs(positionDelta)<.003?targetRef.current:currentRef.current+positionDelta*alpha;
  cameraCurrentRef.current=reducedRef.current||Math.abs(cameraDelta)<.003?cameraTargetRef.current:cameraCurrentRef.current+cameraDelta*alpha;
  tiltRef.current=reducedRef.current||Math.abs(tiltDelta)<.003?tiltTargetRef.current:tiltRef.current+tiltDelta*alpha;
  const next=clamp(Math.round(currentRef.current),0,count-1);
  if(next!==activeRef.current){activeRef.current=next;setActiveIndex(next)}
  apply();
  if(!reducedRef.current&&(Math.abs(positionDelta)>.003||Math.abs(cameraDelta)>.003||Math.abs(tiltDelta)>.003))frameRef.current=requestAnimationFrame(animate);
  else lastFrameRef.current=0;
 },[apply,count]);
 const ensureFrame=useCallback(()=>{
  if(!frameRef.current&&enabledRef.current&&visibleRef.current&&!document.hidden)frameRef.current=requestAnimationFrame(animate);
 },[animate]);
 const measureGeometry=useCallback(()=>{
  const rig=cameraRef.current,stage=stageRef.current;
  if(!rig||!stage)return;
  const width=rig.clientWidth,height=rig.clientHeight;
  const compact=window.matchMedia('(max-width: 767px), (max-height: 600px), (max-width: 1023px) and (pointer: coarse)').matches;
  const diameter=Math.max(1,Math.min(width*.78,height*.8,compact?360:480,compact?width*.78:width*.46));
  layoutRef.current={width,height,diameter,compact};
  stage.dataset.layout=compact?'compact':'spatial';
  recordsRef.current.forEach(record=>{if(record)record.style.width=`${diameter}px`});
  if(compact){cameraTargetRef.current=1;cameraCurrentRef.current=1}
  apply();
 },[apply]);
 const measureScroll=useCallback(()=>{
  const scene=sceneRef.current;
  if(!scene)return;
  const bounds=scene.getBoundingClientRect();
  visibleRef.current=bounds.bottom>0&&bounds.top<window.innerHeight;
  if(layoutRef.current.compact)cameraTargetRef.current=1;
  else cameraTargetRef.current=clamp((72-bounds.top)/Math.max(1,scene.offsetHeight-(window.innerHeight-72)),0,1);
  if(visibleRef.current)ensureFrame();else stop();
 },[ensureFrame,stop]);
 const moveTo=useCallback((value:number,immediate=false)=>{
  targetRef.current=clamp(value,0,count-1);
  if(immediate||reducedRef.current){currentRef.current=targetRef.current;activeRef.current=Math.round(targetRef.current);setActiveIndex(activeRef.current);apply()}
  else ensureFrame();
 },[apply,count,ensureFrame]);
 const setRecordRef=useCallback((index:number,node:HTMLButtonElement|null)=>{recordsRef.current[index]=node},[]);
 useEffect(()=>{enabledRef.current=enabled;if(!enabled)stop();else{measureScroll();ensureFrame()}},[enabled,ensureFrame,measureScroll,stop]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateMotion=()=>{reducedRef.current=media.matches;setReducedMotion(media.matches);if(media.matches){currentRef.current=targetRef.current;cameraCurrentRef.current=cameraTargetRef.current;tiltRef.current=0;apply()}else ensureFrame()};
  let scrollFrame=0;
  const onScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;measureScroll()})};
  const resize=()=>{measureGeometry();measureScroll();ensureFrame()};
  const visibility=()=>{if(document.hidden)stop();else resize()};
  const observer=new ResizeObserver(resize);
  if(stageRef.current)observer.observe(stageRef.current);
  measureGeometry();updateMotion();measureScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  media.addEventListener('change',updateMotion);
  return()=>{observer.disconnect();stop();cancelAnimationFrame(scrollFrame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',updateMotion)};
 },[apply,ensureFrame,measureGeometry,measureScroll,stop]);

 const indexFromPoint=useCallback((x:number,y:number)=>{
  const element=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-vinyl-index]');
  if(!element||!stageRef.current?.contains(element))return null;
  return Number(element.dataset.vinylIndex);
 },[]);
 const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabledRef.current||!event.isPrimary||dragRef.current.active)return;
  pressedIndexRef.current=indexFromPoint(event.clientX,event.clientY);
  if(event.pointerType==='mouse'&&!layoutRef.current.compact&&pressedIndexRef.current!==null)moveTo(pressedIndexRef.current,true);
  dragRef.current={active:true,pointerId:event.pointerId,x:event.clientX,y:event.clientY,target:targetRef.current,moved:false,horizontal:false};
 };
 const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabledRef.current||!event.isPrimary)return;
  const drag=dragRef.current;
  if(!drag.active){
   if(event.pointerType==='mouse'){
    const previous=hoverPointRef.current;
    if(previous?.x===event.clientX&&previous.y===event.clientY)return;
    hoverPointRef.current={x:event.clientX,y:event.clientY};
    const index=indexFromPoint(event.clientX,event.clientY);
    if(!layoutRef.current.compact){
     // Selection and preview share the actual painted circle hit, including overlap.
     // Commit the selected project immediately; camera and tilt retain their easing.
     if(index!==null&&index!==activeRef.current)moveTo(index,true);
     tiltTargetRef.current=clamp(event.movementX/80,-.3,.3);ensureFrame();
    }
    return index;
   }
   return;
  }
  if(drag.pointerId!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(Math.hypot(dx,dy)>8)drag.moved=true;
  if(!drag.horizontal&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3){drag.horizontal=true;event.currentTarget.setPointerCapture(event.pointerId)}
  if(drag.horizontal){event.preventDefault();targetRef.current=clamp(drag.target-dx/Math.max(92,layoutRef.current.diameter*.7),0,count-1);ensureFrame()}
 };
 const endPointer=(event:ReactPointerEvent<HTMLDivElement>)=>{
  const drag=dragRef.current;
  if(!drag.active||drag.pointerId!==event.pointerId)return;
  drag.active=false;tiltTargetRef.current=0;
  if(drag.horizontal)moveTo(Math.round(targetRef.current));
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 const onPointerLeave=(_event?:ReactPointerEvent<HTMLDivElement>)=>{hoverPointRef.current=null;if(!dragRef.current.active){tiltTargetRef.current=0;ensureFrame()}};
 const focusIndex=useCallback((index:number)=>{moveTo(index,true);requestAnimationFrame(()=>recordsRef.current[index]?.focus({preventScroll:true}))},[moveTo]);
 const getRecordOrigin=useCallback((index:number)=>{
  const bounds=recordsRef.current[index]?.getBoundingClientRect();
  return bounds?{x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2,size:bounds.width}:undefined;
 },[]);
 const onKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(!enabledRef.current)return;
  const next=event.key==='ArrowLeft'?activeRef.current-1:event.key==='ArrowRight'?activeRef.current+1:event.key==='Home'?0:event.key==='End'?count-1:undefined;
  if(next===undefined)return;
  event.preventDefault();focusIndex(clamp(next,0,count-1));
 };
 return{activeIndex,reducedMotion,sceneRef,stageRef,cameraRef,setRecordRef,moveTo,focusIndex,indexFromPoint,getRecordOrigin,canActivate:(index:number)=>index===activeRef.current&&!dragRef.current.moved,getPressedIndex:()=>pressedIndexRef.current,didDrag:()=>dragRef.current.moved,handlers:{onPointerDown,onPointerMove,onPointerUp:endPointer,onPointerCancel:endPointer,onPointerLeave,onKeyDown}};
}
