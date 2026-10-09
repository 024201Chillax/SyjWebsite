'use client';

import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {categories} from '@/lib/content';
import type {Locale,Project} from '@/lib/types';

const selectedCover:Record<string,string>={
 'long-yun-hua-cai':'/portfolio/selected/cover-long-yun-hua-cai.png',
 'nine-sons':'/portfolio/selected/cover-nine-sons.png',
 'type-encounter':'/portfolio/selected/cover-type-encounter.png',
 'oracle-code':'/portfolio/oracle-code/cover.png',
 'gotz-workshop':'/portfolio/selected/cover-gotz-workshop.png',
 safe:'/portfolio/selected/cover-safe.png'
};

type CardStyle=CSSProperties&Record<'--ice-x'|'--ice-y'|'--ice-scale'|'--ice-rotation'|'--ice-depth',string>;

export default function HomeSelectedWorks({locale,projects}:{locale:Locale;projects:Project[]}){
 const router=useRouter();
 const [filter,setFilter]=useState('all');
 const visible=useMemo(()=>filter==='all'?projects:projects.filter(project=>project.categories.includes(filter)),[filter,projects]);
 const [rotation,setRotation]=useState(0);
 const [activeSlug,setActiveSlug]=useState(projects[0]?.slug??'');
 const rotationRef=useRef(0);
 const velocityRef=useRef(.000045);
 const frameRef=useRef<number|null>(null);
 const lastRef=useRef(0);
 const draggingRef=useRef(false);
 const movedRef=useRef(false);
 const pointerRef=useRef({x:0,time:0});
 const hoverRef=useRef(false);

 const updateActive=useCallback((value:number,list=visible)=>{
  if(!list.length)return;
  let best=list[0];let score=-Infinity;
  list.forEach((project,index)=>{const angle=value+(index/list.length)*Math.PI*2;const next=Math.cos(angle);if(next>score){score=next;best=project}});
  setActiveSlug(current=>current===best.slug?current:best.slug);
 },[visible]);

 useEffect(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){updateActive(rotationRef.current);return}
  const tick=(now:number)=>{
   const dt=Math.min(32,now-(lastRef.current||now));lastRef.current=now;
   if(!draggingRef.current){
    const cruise=hoverRef.current?0:.000045;
    velocityRef.current+=(cruise-velocityRef.current)*.018;
    rotationRef.current+=velocityRef.current*dt;
    velocityRef.current*=Math.pow(.992,dt/16.67);
   }
   setRotation(rotationRef.current);
   updateActive(rotationRef.current);
   frameRef.current=requestAnimationFrame(tick);
  };
  frameRef.current=requestAnimationFrame(tick);
  return()=>{if(frameRef.current!==null)cancelAnimationFrame(frameRef.current)};
 },[updateActive]);

 useEffect(()=>{rotationRef.current=0;setRotation(0);setActiveSlug(visible[0]?.slug??'')},[filter,visible]);

 const pointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  movedRef.current=false;
  if((event.target as HTMLElement).closest('button')){draggingRef.current=false;return}
  draggingRef.current=true;pointerRef.current={x:event.clientX,time:performance.now()};velocityRef.current=0;
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const pointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!draggingRef.current)return;
  const now=performance.now();const dx=event.clientX-pointerRef.current.x;const dt=Math.max(8,now-pointerRef.current.time);
  if(Math.abs(dx)>2)movedRef.current=true;
  const turn=dx*.0065;rotationRef.current+=turn;velocityRef.current=turn/dt;
  pointerRef.current={x:event.clientX,time:now};setRotation(rotationRef.current);updateActive(rotationRef.current);
 };
 const pointerUp=(event:ReactPointerEvent<HTMLDivElement>)=>{
  draggingRef.current=false;event.currentTarget.releasePointerCapture?.(event.pointerId);
 };
 const openProject=(project:Project)=>{if(!movedRef.current)router.push(`/${locale}/work/${project.slug}`)};
 const active=visible.find(project=>project.slug===activeSlug)??visible[0];

 return <div className="iceWorks" onMouseEnter={()=>{hoverRef.current=true}} onMouseLeave={()=>{hoverRef.current=false}}>
  <svg className="iceGooFilter" aria-hidden="true"><defs><filter id="ice-works-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"/></filter></defs></svg>
  <div className="iceFilters" aria-label={locale==='zh'?'作品分类':'Project filters'}>{categories.map((category,index)=><button key={category.id} type="button" className={filter===category.id?'isActive':''} aria-pressed={filter===category.id} onClick={()=>setFilter(category.id)}><span>{String(index+1).padStart(2,'0')}</span><b>{locale==='zh'?category.zh:category.en}</b></button>)}</div>
  <div className="iceStage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
   <div className="iceFluidLayer" aria-hidden="true"><div className="iceFluidOrbit"/>{visible.map((project,index)=>{const angle=rotation+(index/Math.max(1,visible.length))*Math.PI*2;const style={'--ice-x':`${Math.cos(angle)*36}vw`,'--ice-y':`${Math.sin(angle)*30}vh`,'--ice-scale':`${.78+(Math.sin(angle)+1)*.14}`,'--ice-rotation':`${angle*180/Math.PI+90}deg`,'--ice-depth':`${Math.round((Math.sin(angle)+1)*10)}`} as CardStyle;return <i key={project.slug} style={style}/>})}</div>
   <div className="iceIntro" aria-hidden="true"><span>LIQUID</span><strong>WORKS</strong><small>{String(visible.length).padStart(2,'0')} / ARCHIVE</small></div>
   <div className="iceCardLayer">{visible.map((project,index)=>{const angle=rotation+(index/Math.max(1,visible.length))*Math.PI*2;const scale=.78+(Math.sin(angle)+1)*.14;const style={'--ice-x':`${Math.cos(angle)*36}vw`,'--ice-y':`${Math.sin(angle)*30}vh`,'--ice-scale':`${scale}`,'--ice-rotation':`${angle*180/Math.PI+90}deg`,'--ice-depth':`${Math.round((Math.sin(angle)+1)*10)}`} as CardStyle;const src=selectedCover[project.slug]??project.cover.src;return <button key={project.slug} type="button" className={`iceCard ${project.slug===active?.slug?'isActive':''}`} style={style} onClick={()=>openProject(project)} onFocus={()=>setActiveSlug(project.slug)} aria-label={`${project.number} ${project.title[locale]}`}><Image src={src} alt={project.cover.alt[locale]} fill sizes="(max-width: 767px) 82vw, 18vw" draggable={false}/><span>{project.number}</span></button>})}</div>
   {active?<div className="iceMeta" aria-live="polite"><div><span>{active.number}</span><h2>{active.title[locale]}</h2></div><div><p>{active.tags.slice(0,2).join(' / ')}</p><span>{active.year}</span></div><button type="button" onClick={()=>router.push(`/${locale}/work/${active.slug}`)}>{locale==='zh'?'查看项目':'VIEW PROJECT'} ↗</button></div>:<div className="iceEmpty"><span>—</span><p>{locale==='zh'?'该分类作品正在整理中':'PROJECTS IN THIS CATEGORY ARE BEING PREPARED'}</p></div>}
   <p className="iceHint">{locale==='zh'?'拖动浏览 · 点击进入项目':'DRAG TO BROWSE · CLICK TO OPEN'}</p>
  </div>
  <div className="iceMobileList">{visible.map(project=><button type="button" key={project.slug} onClick={()=>router.push(`/${locale}/work/${project.slug}`)}><span><b>{project.number}</b><em>{project.year}</em></span><Image src={selectedCover[project.slug]??project.cover.src} alt={project.cover.alt[locale]} width={project.cover.width} height={project.cover.height}/><strong>{project.title[locale]}</strong><small>{project.tags.slice(0,2).join(' / ')} ↗</small></button>)}</div>
 </div>;
}
