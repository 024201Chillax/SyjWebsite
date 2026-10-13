'use client';

import Image from 'next/image';
import type {CSSProperties} from 'react';
import type {Project} from '@/lib/types';
import type {VinylArtwork} from '@/lib/vinylArtwork';
import styles from './VinylProjectArchive.module.css';

type Props={
 project:Project;
 artwork:VinylArtwork;
 index:number;
 active:boolean;
 expanded:boolean;
 locale:'zh'|'en';
 setRef:(index:number,node:HTMLButtonElement|null)=>void;
 onFocus:(index:number)=>void;
 onPreview:(index:number)=>void;
 onPreviewLeave:()=>void;
 onOpen:(index:number,keyboard:boolean,origin:{x:number;y:number;size:number})=>void;
};

export default function VinylRecord({project,artwork,index,active,expanded,locale,setRef,onFocus,onPreview,onPreviewLeave,onOpen}:Props){
 const initialStyle={
  '--vinyl-x':`${index*5}px`,
  '--vinyl-y':`${index*-3}px`,
  '--vinyl-z':`${index*-18}px`,
  '--vinyl-rotate-x':'0deg',
  '--vinyl-rotate-y':'0deg',
  '--vinyl-rotate-z':`${Math.min(index*1.05,7)}deg`,
  '--vinyl-scale':'1',
  '--vinyl-opacity':'1',
  '--vinyl-brightness':active?'1':'.66',
  '--vinyl-label-light':active?'1':'.62',
  '--vinyl-shadow':active?'.32':'.12',
  zIndex:1000-index*100,
 } as CSSProperties;

 return <button
  ref={node=>setRef(index,node)}
  type="button"
  className={styles.record}
  data-vinyl-index={index}
  style={initialStyle}
  data-active={active?'true':'false'}
  tabIndex={active?0:-1}
  aria-current={active?'true':undefined}
  aria-expanded={active?expanded:undefined}
  aria-controls={active?`vinyl-focus-${project.slug}`:undefined}
  aria-label={`${locale==='zh'?(active?'展开项目档案':'选择项目'):(active?'Open project archive':'Select project')} ${project.number} ${project.title[locale]}`}
  onFocus={event=>{
   if(event.currentTarget.matches(':focus-visible')){
    onFocus(index);
    onPreview(index);
   }
  }}
  onBlur={onPreviewLeave}
  onClick={event=>{
   if(!active){
    onFocus(index);
    return;
   }
   const bounds=event.currentTarget.getBoundingClientRect();
   onOpen(index,event.detail===0,{x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2,size:bounds.width});
  }}
 >
  <span className={styles.discSurface} aria-hidden="true">
   <span className={styles.discSheen}/>
   {artwork.discArtwork&&<Image className={styles.discArtwork} src={artwork.discArtwork} alt="" fill sizes="(max-width: 767px) 78vw, 45vw"/>}
   {!artwork.discArtwork&&<span className={styles.discLabel} style={{'--label-color':artwork.fallbackColor} as CSSProperties}>
    <small>{project.number}</small><b>{project.title.en}</b><em>YU.JIE SU / ARCHIVE</em>
    <i className={styles.discHole}/>
   </span>}
   <span className={styles.recordMarker}>{project.number}</span>
  </span>
 </button>;
}
