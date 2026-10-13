'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {projects} from '@/lib/content';
import type {VinylArtwork} from '@/lib/vinylArtwork';
import type {Locale} from '@/lib/types';
import {motionTokens} from '@/lib/motionTokens';
import VinylFocusView from './VinylFocusView';
import VinylProjectInfo from './VinylProjectInfo';
import VinylRecord from './VinylRecord';
import VinylSleevePreview from './VinylSleevePreview';
import useVinylArchiveMotion from './useVinylArchiveMotion';
import useVinylSleevePreview from './useVinylSleevePreview';
import styles from './VinylProjectArchive.module.css';

type FocusOrigin={x:number;y:number;size:number};

export default function VinylProjectArchive({locale,artwork}:{locale:Locale;artwork:VinylArtwork[]}){
 const [mode,setMode]=useState<'browse'|'focus'>('browse');
 const [focusedIndex,setFocusedIndex]=useState<number|null>(null);
 const [focusOrigin,setFocusOrigin]=useState<FocusOrigin|null>(null);
 const [closing,setClosing]=useState(false);
 const closeTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const motion=useVinylArchiveMotion(projects.length,mode==='browse');
 const sleeve=useVinylSleevePreview(mode==='browse');
 const activeProject=projects[motion.activeIndex];
 const artworkBySlug=new Map(artwork.map(item=>[item.slug,item]));

 const openFocus=(index:number,keyboard=false,origin?:FocusOrigin)=>{
  if(mode!=='browse')return;
  if(!keyboard&&!motion.canActivate(index))return;
  sleeve.closeImmediate();
  motion.moveTo(index,true);
  setFocusOrigin(origin??null);
  setFocusedIndex(index);
  setClosing(false);
  setMode('focus');
 };

 const finishClose=useCallback(()=>{
  if(closeTimerRef.current){clearTimeout(closeTimerRef.current);closeTimerRef.current=null}
  const returnIndex=focusedIndex??motion.activeIndex;
  setMode('browse');setFocusedIndex(null);setFocusOrigin(null);setClosing(false);
  motion.focusIndex(returnIndex);
 },[focusedIndex,motion.activeIndex,motion.focusIndex]);

 const closeFocus=useCallback((immediate=false)=>{
  if(mode!=='focus'||closing)return;
  if(immediate||motion.reducedMotion){finishClose();return}
  setFocusOrigin(motion.getRecordOrigin(focusedIndex??motion.activeIndex)??null);
  setClosing(true);
  closeTimerRef.current=setTimeout(finishClose,motionTokens.detail+80);
 },[closing,focusedIndex,mode,motion,finishClose]);

 useEffect(()=>()=>{if(closeTimerRef.current)clearTimeout(closeTimerRef.current)},[]);

 const focusedProject=focusedIndex===null?null:projects[focusedIndex];
 const focusedArtwork=focusedProject
  ? artworkBySlug.get(focusedProject.slug)??{slug:focusedProject.slug,plannedPath:'',fallbackColor:'#aaa'}
  : null;

 return <section ref={motion.sceneRef} className={styles.archive} data-mode={mode} data-closing={closing?'true':'false'} aria-label={locale==='zh'?'全部设计作品档案':'Complete project archive'}>
  <div className={styles.archiveSticky}>
  <div className={styles.archiveGrid} aria-hidden={mode==='focus'}>
   <VinylProjectInfo project={activeProject} locale={locale}/>
   <VinylSleevePreview
    project={sleeve.previewIndex===null?null:projects[sleeve.previewIndex]}
    locale={locale}
    state={sleeve.state}
    visible={sleeve.isVisible}
    index={sleeve.previewIndex??0}
    total={projects.length}
    onPointerEnter={sleeve.keepOpen}
    onPointerLeave={sleeve.scheduleClose}
   />

   <div
    ref={motion.stageRef}
    className={styles.stage}
    data-reduced-motion={motion.reducedMotion?'true':'false'}
    onClickCapture={event=>{
     if(event.detail===0)return;
     if(motion.didDrag()){event.preventDefault();event.stopPropagation();return}
     const index=motion.getPressedIndex()??motion.indexFromPoint(event.clientX,event.clientY);
     if(index===null)return;
     event.preventDefault();
     event.stopPropagation();
     if(motion.canActivate(index)){
      const origin=motion.getRecordOrigin(index);
      if(origin)openFocus(index,false,origin);
     }else{
      motion.moveTo(index);
     }
    }}
    {...motion.handlers}
    onPointerMove={event=>{
     motion.handlers.onPointerMove(event);
     if(event.pointerType!=='mouse'||!event.isPrimary)return;
     const index=motion.indexFromPoint(event.clientX,event.clientY);
     if(index===null)sleeve.scheduleClose();
     else sleeve.preview(index);
    }}
    onPointerLeave={event=>{
     motion.handlers.onPointerLeave(event);
     sleeve.scheduleClose();
    }}
   >
    <div className={styles.stageCaption}><span>VINYL ARCHIVE</span></div>
    <div ref={motion.cameraRef} className={styles.cameraRig}>
    <div className={styles.recordStack}>
     {projects.map((project,index)=><VinylRecord
      key={project.slug}
      project={project}
      artwork={artworkBySlug.get(project.slug)??{slug:project.slug,plannedPath:'',fallbackColor:'#aaa'}}
      index={index}
      active={motion.activeIndex===index}
      expanded={mode==='focus'&&focusedIndex===index}
      locale={locale}
      setRef={motion.setRecordRef}
      onFocus={motion.moveTo}
      onPreview={sleeve.preview}
      onPreviewLeave={sleeve.scheduleClose}
      onOpen={openFocus}
     />)}
    </div>
    </div>
   </div>
  </div>

  <div className={styles.archiveFooter} aria-label={locale==='zh'?'浏览全部作品':'Browse every project'}>
   <div className={styles.archiveCounter} aria-live="polite"><b>{String(motion.activeIndex+1).padStart(2,'0')}</b><span>/ {String(projects.length).padStart(2,'0')}</span></div>
   <span>{locale==='zh'?'左右滑动浏览，点击光碟展开':'Browse with arrows or swipe; select a disc to open'}</span>
   <div className={styles.archiveControls}>
    <button type="button" disabled={motion.activeIndex===0} aria-label={locale==='zh'?'上一个作品':'Previous project'} onClick={event=>motion.moveTo(motion.activeIndex-1,event.detail===0)}>←</button>
    <button type="button" disabled={motion.activeIndex===projects.length-1} aria-label={locale==='zh'?'下一个作品':'Next project'} onClick={event=>motion.moveTo(motion.activeIndex+1,event.detail===0)}>→</button>
   </div>
  </div>

  </div>

  {mode==='focus'&&focusedProject&&focusedArtwork&&<VinylFocusView
   project={focusedProject}
   artwork={focusedArtwork}
   locale={locale}
   closing={closing}
   origin={focusOrigin}
   onDismiss={closeFocus}
   onExited={finishClose}
  />}
 </section>;
}
