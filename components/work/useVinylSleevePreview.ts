'use client';

import {useCallback,useEffect,useRef,useState} from 'react';

export type SleeveState='closed'|'opening'|'open'|'switching'|'closing';

const OPEN_DELAY=115;
const CLOSE_DELAY=270;
const OPEN_DURATION=560;
const SWITCH_DURATION=360;

export default function useVinylSleevePreview(enabled:boolean){
 const [previewIndex,setPreviewIndex]=useState<number|null>(null);
 const [state,setState]=useState<SleeveState>('closed');
 const [desktopEnabled,setDesktopEnabled]=useState(false);
 const previewRef=useRef<number|null>(null);
 const stateRef=useRef<SleeveState>('closed');
 const openTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const closeTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const settleTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);

 const clearTimer=(ref:typeof openTimerRef)=>{
  if(ref.current){clearTimeout(ref.current);ref.current=null}
 };
 const clearAll=useCallback(()=>{
  clearTimer(openTimerRef);
  clearTimer(closeTimerRef);
  clearTimer(settleTimerRef);
 },[]);
 const updateState=useCallback((next:SleeveState)=>{
  stateRef.current=next;
  setState(next);
 },[]);

 useEffect(()=>{
  const query=window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  const update=()=>setDesktopEnabled(query.matches);
  update();
  query.addEventListener('change',update);
  return()=>query.removeEventListener('change',update);
 },[]);

 const closeImmediate=useCallback(()=>{
  clearAll();
  previewRef.current=null;
  updateState('closed');
  setPreviewIndex(null);
 },[clearAll,updateState]);

 useEffect(()=>{
  if(!enabled||!desktopEnabled)closeImmediate();
 },[closeImmediate,desktopEnabled,enabled]);

 useEffect(()=>clearAll,[clearAll]);

 const preview=useCallback((index:number)=>{
  if(!enabled||!desktopEnabled)return;
  clearTimer(closeTimerRef);
  if(previewRef.current===index&&(stateRef.current==='opening'||stateRef.current==='open'||stateRef.current==='switching'))return;

  if(previewRef.current!==null&&stateRef.current!=='closed'&&stateRef.current!=='closing'){
   clearTimer(openTimerRef);
   clearTimer(settleTimerRef);
   previewRef.current=index;
   setPreviewIndex(index);
   updateState('switching');
   settleTimerRef.current=setTimeout(()=>updateState('open'),SWITCH_DURATION);
   return;
  }

  clearTimer(openTimerRef);
  updateState('opening');
  openTimerRef.current=setTimeout(()=>{
   previewRef.current=index;
   setPreviewIndex(index);
   settleTimerRef.current=setTimeout(()=>updateState('open'),OPEN_DURATION);
  },OPEN_DELAY);
 },[desktopEnabled,enabled,updateState]);

 const keepOpen=useCallback(()=>{
  if(!enabled||!desktopEnabled)return;
  clearTimer(closeTimerRef);
 },[desktopEnabled,enabled]);

 const scheduleClose=useCallback(()=>{
  if(!enabled||!desktopEnabled||stateRef.current==='closed')return;
  clearTimer(openTimerRef);
  clearTimer(closeTimerRef);
  closeTimerRef.current=setTimeout(()=>{
   updateState('closing');
   settleTimerRef.current=setTimeout(()=>{
    previewRef.current=null;
    setPreviewIndex(null);
    updateState('closed');
   },520);
  },CLOSE_DELAY);
 },[desktopEnabled,enabled,updateState]);

 return {previewIndex,state,isVisible:previewIndex!==null&&state!=='closed',desktopEnabled,preview,keepOpen,scheduleClose,closeImmediate};
}
