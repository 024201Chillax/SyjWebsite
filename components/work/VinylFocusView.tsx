'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import type {Locale,Project} from '@/lib/types';
import type {VinylArtwork} from '@/lib/vinylArtwork';
import styles from './VinylProjectArchive.module.css';

type Props={
 project:Project;
 artwork:VinylArtwork;
 locale:Locale;
 closing:boolean;
 origin:{x:number;y:number;size:number}|null;
 onDismiss:()=>void;
};

export default function VinylFocusView({project,artwork,locale,closing,origin,onDismiss}:Props){
 const closeRef=useRef<HTMLButtonElement>(null);
 const titleId=`vinyl-focus-title-${project.slug}`;

 useEffect(()=>{
  closeRef.current?.focus({preventScroll:true});
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key!=='Escape')return;
   event.preventDefault();
   onDismiss();
  };
  document.addEventListener('keydown',onKeyDown);
  return()=>document.removeEventListener('keydown',onKeyDown);
 },[onDismiss]);

 const stop=(event:ReactPointerEvent<HTMLElement>)=>event.stopPropagation();
 const labelStyle={'--focus-label':artwork.fallbackColor} as CSSProperties;
 const viewportWidth=typeof window==='undefined'?1440:window.innerWidth;
 const viewportHeight=typeof window==='undefined'?900:window.innerHeight;
 const targetSize=Math.min(viewportWidth*.42,592);
 const layerTop=viewportWidth<=767?60:72;
 const targetY=layerTop+(viewportHeight-layerTop)*.43;
 const focusStyle={
  '--focus-from-x':`${(origin?.x??viewportWidth/2)-viewportWidth/2}px`,
  '--focus-from-y':`${(origin?.y??targetY)-targetY}px`,
  '--focus-from-scale':String(Math.max(.72,Math.min(1.28,(origin?.size??targetSize)/targetSize))),
 } as CSSProperties;

 if(typeof document==='undefined')return null;

 return createPortal(<section
  id={`vinyl-focus-${project.slug}`}
  className={styles.focusLayer}
  data-closing={closing?'true':'false'}
  aria-labelledby={titleId}
  aria-live="polite"
  style={focusStyle}
  onPointerDown={event=>{if(event.target===event.currentTarget)onDismiss()}}
 >
  <button ref={closeRef} className={styles.focusClose} type="button" onClick={onDismiss} onPointerDown={stop} aria-label={locale==='zh'?'关闭项目档案':'Close project archive'}>
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

  <div className={styles.focusDiscScene} onPointerDown={stop} aria-hidden="true">
   <div className={styles.focusDisc}>
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

  <button className={styles.focusMobileBack} type="button" onClick={onDismiss} onPointerDown={stop}>
   ← {locale==='zh'?'返回唱片档案':'BACK TO VINYL ARCHIVE'}
  </button>
 </section>,document.body);
}
