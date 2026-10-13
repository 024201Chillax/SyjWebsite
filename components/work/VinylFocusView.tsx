'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import type {Locale,Project} from '@/lib/types';
import type {VinylArtwork} from '@/lib/vinylArtwork';
import {motionTokens} from '@/lib/motionTokens';
import styles from './VinylProjectArchive.module.css';

type Props={
 project:Project;
 artwork:VinylArtwork;
 locale:Locale;
 closing:boolean;
 origin:{x:number;y:number;size:number}|null;
 onDismiss:(immediate?:boolean)=>void;
 onExited:()=>void;
};

export default function VinylFocusView({project,artwork,locale,closing,origin,onDismiss,onExited}:Props){
 const closeRef=useRef<HTMLButtonElement>(null);
 const layerRef=useRef<HTMLElement>(null);
 const sceneRef=useRef<HTMLDivElement>(null);
 const animationRef=useRef<Animation|null>(null);
 const snapshotRef=useRef<{transform:string;opacity:string}|null>(null);
 const dismissRef=useRef(onDismiss);
 const exitedRef=useRef(onExited);
 const [back,setBack]=useState(false);
 dismissRef.current=onDismiss;
 exitedRef.current=onExited;
 const titleId=`vinyl-focus-title-${project.slug}`;

 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  const previousPadding=document.body.style.paddingRight;
  const gap=window.innerWidth-document.documentElement.clientWidth;
  if(gap>0)document.body.style.paddingRight=`${parseFloat(getComputedStyle(document.body).paddingRight)+gap}px`;
  document.body.style.overflow='hidden';
  closeRef.current?.focus({preventScroll:true});
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();dismissRef.current(true);return}
   if(event.key!=='Tab')return;
   const elements=Array.from(layerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')??[]).filter(element=>element.getClientRects().length>0);
   const first=elements[0],last=elements[elements.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  };
  document.addEventListener('keydown',onKeyDown);
  return()=>{document.removeEventListener('keydown',onKeyDown);document.body.style.overflow=previousOverflow;document.body.style.paddingRight=previousPadding};
 },[]);

 useLayoutEffect(()=>{
  const scene=sceneRef.current;
  if(!scene)return;
  const rect=scene.getBoundingClientRect();
  const scale=origin?Math.max(.2,Math.min(3,origin.size/Math.max(1,rect.width))):.97;
  const from=origin?`translate3d(${origin.x-rect.left-rect.width/2}px,${origin.y-rect.top-rect.height/2}px,0) scale(${scale})`:'scale(.97)';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved=snapshotRef.current;
  const animation=scene.animate(closing?
   [{transform:saved?.transform??'none',opacity:saved?.opacity??'1'},{transform:reduced?'none':from,opacity:0}]:
   [{transform:reduced?'none':from,opacity:.82},{transform:'none',opacity:1}],
   {duration:reduced?80:motionTokens.detail,easing:motionTokens.easeOut,fill:'both'});
  animationRef.current=animation;
  if(closing)void animation.finished.then(()=>exitedRef.current()).catch(()=>{});
  return()=>{const style=getComputedStyle(scene);snapshotRef.current={transform:style.transform,opacity:style.opacity};animation.cancel()};
 },[closing,origin,project.slug]);

 const stop=(event:ReactPointerEvent<HTMLElement>)=>event.stopPropagation();
 const labelStyle={'--focus-label':artwork.fallbackColor} as CSSProperties;

 if(typeof document==='undefined')return null;

 return createPortal(<section
  id={`vinyl-focus-${project.slug}`}
  ref={layerRef}
  role="dialog"
  aria-modal="true"
  className={styles.focusLayer}
  data-closing={closing?'true':'false'}
  aria-labelledby={titleId}
  onPointerDown={event=>{if(event.target===event.currentTarget)onDismiss()}}
 >
  <button ref={closeRef} className={styles.focusClose} type="button" onClick={()=>onDismiss()} onPointerDown={stop} aria-label={locale==='zh'?'关闭项目档案':'Close project archive'}>
   <span>{locale==='zh'?'关闭档案':'CLOSE ARCHIVE'}</span><b>×</b>
  </button>

  <div className={`${styles.focusInfo} ${styles.focusTopLeft}`} onPointerDown={stop}>
   <small>PROJECT</small>
   <strong>{project.number}</strong>
   <span>{project.year}</span>
  </div>

  <div className={`${styles.focusInfo} ${styles.focusTopRight}`} onPointerDown={stop}>
   <small>{locale==='zh'?'项目标签':'PROJECT TAGS'}</small>
   <p>{project.tags.join(' / ')}</p>
   <span>{project.mode.toUpperCase()} ARCHIVE</span>
  </div>

  <div ref={sceneRef} className={styles.focusDiscScene} onPointerDown={stop} aria-hidden="true">
   <div className={styles.focusDisc} data-face={back?'back':'front'}>
    <div className={`${styles.focusDiscFace} ${styles.focusDiscFront}`}>
     <span className={styles.focusDiscSheen}/>
     {artwork.discArtwork&&<Image className={styles.focusArtwork} src={artwork.discArtwork} alt="" fill sizes="(max-width: 767px) 84vw, 42vw"/>}
     {!artwork.discArtwork&&<span className={styles.focusFrontLabel} style={labelStyle}>
      <small>{project.number}</small><b>{project.title.en}</b><em>YU.JIE SU / ARCHIVE</em>
     </span>}
     <i className={styles.focusDiscHole}/>
    </div>
    <div className={`${styles.focusDiscFace} ${styles.focusDiscBack}`}>
     <span className={styles.focusDiscSheen}/>
     <span className={styles.focusBackLabel} style={labelStyle}>
      <small>PROJECT ARCHIVE</small>
      <b>{project.number}</b>
      <strong>{project.title.en}</strong>
      <em>{project.year}</em>
     </span>
     <i className={styles.focusDiscHole}/>
    </div>
   </div>
  </div>

  <button className={styles.focusFlip} type="button" aria-pressed={back} onClick={()=>setBack(value=>!value)} onPointerDown={stop}>{locale==='zh'?(back?'查看正面':'查看背面'):(back?'VIEW FRONT':'VIEW BACK')}</button>

  <div className={`${styles.focusInfo} ${styles.focusBottomLeft}`} onPointerDown={stop}>
   <small>{locale==='zh'?'项目名称':'PROJECT TITLE'}</small>
   <h2 id={titleId}>{project.title[locale]}</h2>
   <p>{project.title.en}</p>
  </div>

  <div className={`${styles.focusInfo} ${styles.focusBottomRight}`} onPointerDown={stop}>
   <small>{locale==='zh'?'项目职责':'PROJECT ROLE'}</small>
   <strong>{project.role[locale]}</strong>
   <p>{project.summary[locale]}</p>
   <Link href={`/${locale}/work/${project.slug}`}>{locale==='zh'?'查看完整项目':'VIEW FULL PROJECT'} ↗</Link>
  </div>

  <button className={styles.focusMobileBack} type="button" onClick={()=>onDismiss()} onPointerDown={stop}>
   ← {locale==='zh'?'返回唱片档案':'BACK TO VINYL ARCHIVE'}
  </button>
 </section>,document.body);
}
