'use client';

import {useCallback,useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent} from 'react';

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const mix=(from:number,to:number,amount:number)=>from+(to-from)*amount;
const smooth=(from:number,to:number,value:number)=>{
 const normalized=clamp((value-from)/(to-from),0,1);
 return normalized*normalized*(3-2*normalized);
};

type DragState={active:boolean;pointerId:number;startX:number;startY:number;startTarget:number;moved:boolean;horizontal:boolean};

export default function useVinylArchiveMotion(count:number,enabled=true){
 const sceneRef=useRef<HTMLElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const cameraRef=useRef<HTMLDivElement>(null);
 const recordsRef=useRef<Array<HTMLButtonElement|null>>([]);
 const frameRef=useRef(0);
 const currentRef=useRef(0);
 const targetRef=useRef(0);
 const cameraCurrentRef=useRef(0);
 const cameraTargetRef=useRef(0);
 const tiltRef=useRef(0);
 const tiltTargetRef=useRef(0);
 const dragRef=useRef<DragState>({active:false,pointerId:-1,startX:0,startY:0,startTarget:0,moved:false,horizontal:false});
 const pressedIndexRef=useRef<number|null>(null);
 const activeRef=useRef(0);
 const reducedRef=useRef(false);
 const enabledRef=useRef(enabled);
 const visibleRef=useRef(true);
 const [activeIndex,setActiveIndex]=useState(0);
 const [reducedMotion,setReducedMotion]=useState(false);

 useEffect(()=>{enabledRef.current=enabled},[enabled]);

 const apply=useCallback(()=>{
  const stage=stageRef.current;
  if(!stage)return;
  const width=stage.clientWidth;
  const height=stage.clientHeight;
  const mobile=width<768;
  const discSize=recordsRef.current[0]?.offsetWidth||Math.min(width*(mobile?.78:.31),500);
  const progress=currentRef.current;
  const velocity=targetRef.current-progress;
  const tilt=tiltRef.current;
  const camera=mobile?1:cameraCurrentRef.current;
  const corridor=smooth(.22,.62,camera);
  const selection=smooth(.46,.76,camera);
  const settle=smooth(.72,1,camera);
  const rig=cameraRef.current;

  if(rig){
   rig.style.setProperty('--camera-x',`${(-width*.018*corridor).toFixed(2)}px`);
   rig.style.setProperty('--camera-y',`${(height*.02*corridor-height*.025*settle).toFixed(2)}px`);
   rig.style.setProperty('--camera-rotate-x',`${(mobile?0:mix(0,4.2,corridor)).toFixed(3)}deg`);
   rig.style.setProperty('--camera-rotate-y',`${(mobile?0:mix(0,-12.5,corridor)).toFixed(3)}deg`);
   rig.style.setProperty('--camera-rotate-z',`${(mobile?0:mix(0,-3.6,corridor)).toFixed(3)}deg`);
   rig.style.setProperty('--camera-scale',`${(mobile?1:mix(1,.975,corridor)+settle*.018).toFixed(4)}`);
   rig.dataset.phase=camera<.06?'stack':camera<.34?'extract':camera<.7?'corridor':'select';
  }

  recordsRef.current.forEach((record,index)=>{
   if(!record)return;
   const distance=index-progress;
   const abs=Math.abs(distance);
   const focus=Math.max(0,1-abs);
   let x=0;
   let y=0;
   let z=0;
   let rotateX=0;
   let rotateY=0;
   let rotateZ=0;
   let scale=1;
   let opacity=1;

   if(mobile){
    x=distance*discSize*.72;
    y=abs*5-focus*8;
    z=focus*34-abs*8;
    rotateZ=clamp(distance*3.4+tilt*1.8+velocity*2.4,-10,10);
    scale=1+focus*.025-Math.min(abs,5)*.018;
    opacity=clamp(1-Math.max(0,abs-1.25)*.34,.18,1);
   }else{
    const axisIndex=index-(count-1)/2;
    const itemReveal=smooth(.01+index*.018,.32+index*.022,camera);
    const unfoldX=index*discSize*.034*itemReveal;
    const unfoldY=-index*discSize*.017*itemReveal;
    const stepX=Math.min(discSize*.35,Math.max(72,(width-discSize*.76)/Math.max(1,count-1)));
    const stepY=Math.min(discSize*.14,Math.max(34,(height-discSize*.9)/Math.max(1,count-1)));
    const finalX=axisIndex*stepX;
    const finalY=-axisIndex*stepY;
    const yieldDirection=distance===0?0:distance>0?1:-1;
    const neighbourYield=Math.max(0,1-abs/2.25)*yieldDirection*discSize*.042*selection;

    x=mix(unfoldX,finalX,corridor)+neighbourYield-focus*discSize*.018*selection;
    y=mix(unfoldY,finalY,corridor)-neighbourYield*.52+focus*discSize*.026*selection;
    z=mix(-index*21*itemReveal,-index*32,corridor)+focus*148*selection;
    rotateX=focus*4.5*selection;
    rotateY=focus*11.5*selection;
    rotateZ=mix(index*1.05,-axisIndex*.42,corridor)+tilt*1.25+velocity*1.8;
    scale=1+focus*.058*selection-Math.min(abs,5)*.008*selection;
    opacity=1;
   }

   record.style.setProperty('--vinyl-x',`${x.toFixed(2)}px`);
   record.style.setProperty('--vinyl-y',`${y.toFixed(2)}px`);
   record.style.setProperty('--vinyl-z',`${z.toFixed(2)}px`);
   record.style.setProperty('--vinyl-rotate-x',`${rotateX.toFixed(3)}deg`);
   record.style.setProperty('--vinyl-rotate-y',`${rotateY.toFixed(3)}deg`);
   record.style.setProperty('--vinyl-rotate-z',`${rotateZ.toFixed(3)}deg`);
   record.style.setProperty('--vinyl-scale',scale.toFixed(4));
   record.style.setProperty('--vinyl-opacity',opacity.toFixed(3));
   record.style.setProperty('--vinyl-brightness',`${(.7+focus*.3).toFixed(3)}`);
   record.style.setProperty('--vinyl-label-light',`${(.67+focus*.33).toFixed(3)}`);
   record.style.setProperty('--vinyl-shadow',`${(.07+focus*.12*selection).toFixed(3)}`);
   record.style.zIndex=String(focus>.5?2000:1000-index*10-Math.round(abs));
   record.dataset.active=abs<.5?'true':'false';
   record.dataset.side=abs<.5?'active':distance<0?'before':'after';
   record.tabIndex=abs<.5?0:-1;
  });
 },[count]);

 const stop=useCallback(()=>{if(frameRef.current){cancelAnimationFrame(frameRef.current);frameRef.current=0}},[]);

 const animate=useCallback(()=>{
  frameRef.current=0;
  const reduced=reducedRef.current;
  const positionDelta=targetRef.current-currentRef.current;
  const cameraDelta=cameraTargetRef.current-cameraCurrentRef.current;
  const tiltDelta=tiltTargetRef.current-tiltRef.current;
  currentRef.current=reduced?targetRef.current:currentRef.current+positionDelta*.12;
  cameraCurrentRef.current=reduced?cameraTargetRef.current:cameraCurrentRef.current+cameraDelta*.12;
  tiltRef.current=reduced?0:tiltRef.current+tiltDelta*.1;
  const nextActive=clamp(Math.round(currentRef.current),0,count-1);
  if(nextActive!==activeRef.current){activeRef.current=nextActive;setActiveIndex(nextActive)}
  apply();
  if(!reduced&&visibleRef.current&&(Math.abs(positionDelta)>.001||Math.abs(cameraDelta)>.001||Math.abs(tiltDelta)>.001))frameRef.current=requestAnimationFrame(animate);
 },[apply,count]);

 const ensureFrame=useCallback(()=>{if(!frameRef.current&&!document.hidden&&visibleRef.current)frameRef.current=requestAnimationFrame(animate)},[animate]);

 const measureScroll=useCallback(()=>{
  const scene=sceneRef.current;
  if(!scene)return;
  const mobile=window.innerWidth<768;
  if(mobile){cameraTargetRef.current=1;cameraCurrentRef.current=1;apply();return}
  const bounds=scene.getBoundingClientRect();
  const stickyTop=72;
  const stickyHeight=Math.max(1,window.innerHeight-stickyTop);
  const distance=Math.max(1,scene.offsetHeight-stickyHeight);
  cameraTargetRef.current=clamp((stickyTop-bounds.top)/distance,0,1);
  visibleRef.current=bounds.bottom>0&&bounds.top<window.innerHeight;
  if(enabledRef.current&&visibleRef.current)ensureFrame();
 },[apply,ensureFrame]);

 const moveTo=useCallback((value:number,immediate=false)=>{
  const next=clamp(value,0,count-1);
  targetRef.current=next;
  if(immediate||reducedRef.current){currentRef.current=next;activeRef.current=Math.round(next);setActiveIndex(Math.round(next));apply()}
  else ensureFrame();
 },[apply,count,ensureFrame]);

 const setRecordRef=useCallback((index:number,node:HTMLButtonElement|null)=>{
  recordsRef.current[index]=node;
  if(node)ensureFrame();
 },[ensureFrame]);

 useEffect(()=>{
  if(enabled)return;
  stop();
  tiltTargetRef.current=0;
 },[enabled,stop]);

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{
   reducedRef.current=media.matches;
   setReducedMotion(media.matches);
   if(media.matches){currentRef.current=Math.round(targetRef.current);cameraCurrentRef.current=cameraTargetRef.current;apply()}
   else ensureFrame();
  };
  const resize=()=>{measureScroll();ensureFrame()};
  const visibility=()=>{if(document.hidden)stop();else{measureScroll();ensureFrame()}};
  const scroll=()=>measureScroll();
  update();
  measureScroll();
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('scroll',scroll,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  media.addEventListener('change',update);
  return()=>{
   stop();
   window.removeEventListener('resize',resize);
   window.removeEventListener('scroll',scroll);
   document.removeEventListener('visibilitychange',visibility);
   media.removeEventListener('change',update);
  };
 },[apply,ensureFrame,measureScroll,stop]);

 const indexFromPoint=useCallback((clientX:number,clientY:number)=>{
  const stage=stageRef.current;
  if(!stage||stage.clientWidth<768)return null;
  let resolvedIndex:number|null=null;
  let closestDistance=Number.POSITIVE_INFINITY;

  recordsRef.current.forEach((record,index)=>{
   if(!record)return;
   const bounds=record.getBoundingClientRect();
   const radius=Math.min(bounds.width,bounds.height)/2;
   const centerX=bounds.left+bounds.width/2;
   const centerY=bounds.top+bounds.height/2;
   const distance=Math.hypot(clientX-centerX,clientY-centerY);
   if(distance<=radius*1.025&&distance<closestDistance){
    resolvedIndex=index;
    closestDistance=distance;
   }
  });

  return resolvedIndex;
 },[]);

 const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabled||!event.isPrimary)return;
  pressedIndexRef.current=event.pointerType==='mouse'?indexFromPoint(event.clientX,event.clientY):null;
  dragRef.current={active:true,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startTarget:targetRef.current,moved:false,horizontal:false};
 };

 const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabled||!event.isPrimary)return;
  const stage=stageRef.current;
  if(!stage)return;
  const bounds=stage.getBoundingClientRect();
  const drag=dragRef.current;
  const mobile=bounds.width<768;

  if(event.pointerType==='mouse'){
   if(drag.active&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;
   if(drag.active)return;
   if(cameraTargetRef.current<.5)return;
   const startX=bounds.left+bounds.width*.14;
   const startY=bounds.top+bounds.height*.78;
   const vectorX=bounds.width*.72;
   const vectorY=-bounds.height*.55;
   const pointerX=event.clientX-startX;
   const pointerY=event.clientY-startY;
   const projected=(pointerX*vectorX+pointerY*vectorY)/(vectorX*vectorX+vectorY*vectorY);
   targetRef.current=clamp(projected,0,1)*(count-1);
   const perpendicular=(pointerX*(-vectorY)+pointerY*vectorX)/Math.max(1,Math.hypot(vectorX,vectorY));
   tiltTargetRef.current=clamp(perpendicular/Math.max(90,bounds.height*.3),-1,1);
   ensureFrame();
   return;
  }

  if(!mobile||!drag.active||drag.pointerId!==event.pointerId)return;
  const dx=event.clientX-drag.startX;
  const dy=event.clientY-drag.startY;
  if(Math.hypot(dx,dy)>6)drag.moved=true;
  if(!drag.horizontal&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.12){
   drag.horizontal=true;
   event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  if(drag.horizontal){
   event.preventDefault();
   targetRef.current=clamp(drag.startTarget-dx/Math.max(92,bounds.width*.24),0,count-1);
   tiltTargetRef.current=clamp(dx/Math.max(1,bounds.width),-1,1);
   ensureFrame();
  }
 };

 const endPointer=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabled)return;
  const drag=dragRef.current;
  if(!drag.active||drag.pointerId!==event.pointerId)return;
  if(drag.moved)event.preventDefault();
  drag.active=false;
  tiltTargetRef.current=0;
  if(event.pointerType!=='mouse')moveTo(Math.round(targetRef.current));
  else ensureFrame();
  if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };

 const onPointerLeave=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!enabled)return;
  if(event.pointerType==='mouse'&&!dragRef.current.active){tiltTargetRef.current=0;moveTo(Math.round(targetRef.current))}
 };

 const focusIndex=(index:number)=>{
  moveTo(index);
  requestAnimationFrame(()=>recordsRef.current[index]?.focus({preventScroll:true}));
 };

 const getRecordOrigin=useCallback((index:number)=>{
  const record=recordsRef.current[index];
  if(!record)return undefined;
  const bounds=record.getBoundingClientRect();
  return {x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2,size:bounds.width};
 },[]);

 const onKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(!enabled)return;
  let next:number|undefined;
  if(event.key==='ArrowLeft')next=activeRef.current-1;
  if(event.key==='ArrowRight')next=activeRef.current+1;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=count-1;
  if(next===undefined)return;
  event.preventDefault();
  focusIndex(clamp(next,0,count-1));
 };

 const canActivate=(index:number)=>index===activeRef.current&&!dragRef.current.moved;
 const getPressedIndex=()=>pressedIndexRef.current;

 return {
  activeIndex,reducedMotion,sceneRef,stageRef,cameraRef,setRecordRef,moveTo,focusIndex,canActivate,indexFromPoint,getRecordOrigin,getPressedIndex,
  handlers:{onPointerDown,onPointerMove,onPointerUp:endPointer,onPointerCancel:endPointer,onPointerLeave,onKeyDown},
 };
}
