'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {Locale} from '@/lib/types';
import styles from './MediaStoreNarrative.module.css';

type Sequence='selected'|'restricted';
type Props={locale:Locale;work:ReactNode;playground:ReactNode};
const clamp=(value:number)=>Math.min(1,Math.max(0,value));
const smooth=(value:number)=>{const t=clamp(value);return t*t*(3-2*t)};
const range=(value:number,start:number,end:number)=>smooth((value-start)/(end-start));

export default function MediaStoreNarrative({locale,work,playground}:Props){
 const layerRef=useRef<HTMLDivElement>(null);
 const modelRef=useRef<HTMLDivElement>(null);
 const posterRef=useRef<HTMLImageElement>(null);
 const introRef=useRef<HTMLElement>(null);
 const returnRef=useRef<HTMLElement>(null);
 const progressRef=useRef<HTMLSpanElement>(null);
 const [visible,setVisible]=useState(false);
 const [entry,setEntry]=useState<Sequence|null>(null);
 const [reduceMotion,setReduceMotion]=useState(false);
 const zh=locale==='zh';

 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,lastTime=0,dirty=true,disposed=false;
  let width=1,height=1,fitWidth=1,maxScale=1;
  let x=0,scale=1,opacity=0,progress=0;
  let targetX=0,targetScale=1,targetOpacity=0,targetProgress=0;
  let sequence:Sequence='selected';
  let shown=false,label:Sequence|null=null;
  const measure=()=>{
   const model=modelRef.current;if(!model)return;
   width=model.clientWidth;height=model.clientHeight;
   fitWidth=Math.min(width,height*2160/1215);
   const fitHeight=fitWidth*1215/2160;
   maxScale=Math.max(1,Math.min(width<=767?2.2:1.6,height*.84/(fitHeight*.60),width*.90/(fitWidth*.36)));
  };
  const readTarget=()=>{
   const intro=introRef.current,returning=returnRef.current;
   if(!intro||!returning)return;
   const a=intro.getBoundingClientRect(),b=returning.getBoundingClientRect();
   const section=a.top<=1&&a.bottom>0?intro:b.top<=1&&b.bottom>0?returning:null;
   if(!section){targetOpacity=0;if(label!==null){label=null;setEntry(null)};return}
   sequence=section===intro?'selected':'restricted';
   const rect=section===intro?a:b;
   const p=clamp(-rect.top/Math.max(1,section.offsetHeight));
   const zoom=range(p,.03,.78);
   targetProgress=p;
   targetScale=media.matches?1:1+(maxScale-1)*zoom;
   // A single decoded texture stays on the compositor. No frame fetching or canvas paints.
   const sideComposition=window.innerWidth>=1024||window.innerHeight<=600?width*.06:0;
   targetX=media.matches?0:(sequence==='selected'?1:-1)*(fitWidth*.2023*targetScale+sideComposition)*zoom;
   targetOpacity=1-range(p,.86,1);
   const labelStart=window.innerWidth<=767&&window.innerHeight>600?.12:.69;
   const nextLabel=p>labelStart&&p<.88?sequence:null;
   if(nextLabel!==label){label=nextLabel;setEntry(label)}
   if(!shown){shown=true;setVisible(true)}
  };
  const tick=(now:number)=>{
   frame=0;if(document.hidden||disposed){lastTime=0;return}
   if(dirty){dirty=false;readTarget()}
   const delta=Math.min(50,lastTime?now-lastTime:16.67);lastTime=now;
   const alpha=1-Math.exp(-delta/(media.matches?30:75));
   const settle=(current:number,target:number,threshold:number)=>Math.abs(target-current)<threshold?target:current+(target-current)*alpha;
   x=settle(x,targetX,.02);scale=settle(scale,targetScale,.0001);
   opacity=settle(opacity,targetOpacity,.001);progress=settle(progress,targetProgress,.0001);
   const poster=posterRef.current,layer=layerRef.current;
   if(poster)poster.style.transform=`translate3d(${x.toFixed(3)}px,0,0) scale(${scale.toFixed(5)})`;
   if(layer){layer.style.opacity=opacity.toFixed(4);layer.dataset.sequence=sequence;layer.dataset.progress=progress.toFixed(4)}
   if(progressRef.current)progressRef.current.textContent=`${String(Math.round(progress*100)).padStart(2,'0')}%`;
   if(shown&&opacity===0&&targetOpacity===0){shown=false;setVisible(false)}
   if(dirty||x!==targetX||scale!==targetScale||opacity!==targetOpacity||progress!==targetProgress)frame=requestAnimationFrame(tick);
   else lastTime=0;
  };
  const request=()=>{dirty=true;if(!frame&&!document.hidden)frame=requestAnimationFrame(tick)};
  const resize=()=>{measure();request()};
  const preference=()=>{setReduceMotion(media.matches);request()};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0}else resize()};
  const observer=new ResizeObserver(resize);
  if(modelRef.current)observer.observe(modelRef.current);
  const destinations=new IntersectionObserver(entries=>{
   for(const item of entries)if(item.isIntersecting){
    item.target.querySelectorAll<HTMLImageElement>('img').forEach((image,index)=>{if(index<3)image.loading='eager'});
    destinations.unobserve(item.target);
   }
  },{rootMargin:'160px'});
  for(const id of ['work','playground']){const target=document.getElementById(id);if(target)destinations.observe(target)}
  measure();preference();request();
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  media.addEventListener('change',preference);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();destinations.disconnect();window.removeEventListener('scroll',request);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference)};
 },[]);

 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
 return <div className={styles.narrative}>
  <div ref={layerRef} className={`${styles.canvasLayer} ${visible?styles.canvasVisible:''}`} aria-hidden={!visible}>
   <div ref={modelRef} className={styles.renderedModel}>
    {/* This existing high-resolution overview replaces both 60-frame sequences. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={posterRef} data-camera-poster className={styles.cameraPoster} src="/models/media-store/sequences/desktop/selected/frame-000.webp" width={2160} height={1215} alt="" decoding="async" loading="eager"/>
   </div>
   <div className={styles.topline}><span>MEDIA STORE / 00—02</span><span ref={progressRef}>00%</span></div>
   <div className={`${styles.sideLabel} ${styles.leftLabel} ${entry==='selected'?styles.visible:''}`}>
    <div className={styles.labelIndex}><b>01</b><span>SELECTED</span></div>
    <strong>{zh?'精选设计作品':'SELECTED WORKS'}</strong>
    <button type="button" onClick={()=>jump('work')}><span>{zh?'查看专辑档案':'OPEN THE ARCHIVE'}</span><i>↘</i></button>
   </div>
   <div className={`${styles.sideLabel} ${styles.rightLabel} ${entry==='restricted'?styles.visible:''}`}>
    <div className={styles.labelIndex}><b>02</b><span>RESTRICTED</span></div>
    <strong>{zh?'实验作品区':'EXPERIMENTAL MEDIA'}</strong>
    <button type="button" onClick={()=>jump('playground')}><span>{zh?'进入实验场':'ENTER PLAYGROUND'}</span><i>↘</i></button>
   </div>
   <div className={styles.chapterRail} aria-hidden="true"><span>01 / SELECTED — 02 / RESTRICTED</span><i/></div>
  </div>
  <section ref={introRef} className={`${styles.bridge} ${styles.introBridge}`} aria-label={zh?'进入精选作品':'Enter selected works'}/>
  <div className={styles.contentSlot}><div className={styles.contentBody}>{work}</div></div>
  <section ref={returnRef} className={`${styles.bridge} ${styles.returnBridge}`} aria-label={zh?'从作品档案进入实验场':'From work archive to playground'}/>
  <div className={styles.contentSlot}><div className={styles.contentBody}>{playground}</div></div>
 </div>;
}
