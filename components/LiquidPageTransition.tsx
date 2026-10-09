'use client';

import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useRef,useState,type MouseEvent,type ReactNode} from 'react';

type Phase='idle'|'covering'|'covered'|'revealing';

export default function LiquidPageTransition({children}:{children:ReactNode}){
 const router=useRouter();
 const [phase,setPhase]=useState<Phase>('idle');
 const phaseRef=useRef<Phase>('idle');
 const timers=useRef<number[]>([]);

 const changePhase=useCallback((next:Phase)=>{
  phaseRef.current=next;
  setPhase(next);
  document.documentElement.classList.toggle('is-page-transitioning',next!=='idle');
 },[]);

 const clearTimers=useCallback(()=>{
  timers.current.forEach(window.clearTimeout);
  timers.current=[];
 },[]);

 const reveal=useCallback(()=>{
  changePhase('revealing');
  timers.current.push(window.setTimeout(()=>changePhase('idle'),900));
 },[changePhase]);

 const handleClick=useCallback((event:MouseEvent<HTMLDivElement>)=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||phaseRef.current!=='idle')return;
  const target=event.target as Element|null;
  const anchor=target?.closest<HTMLAnchorElement>('a[href]');
  if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download')||anchor.dataset.noTransition!==undefined)return;

  const destination=new URL(anchor.href,window.location.href);
  if(destination.origin!==window.location.origin)return;
  const current=`${window.location.pathname}${window.location.search}`;
  const next=`${destination.pathname}${destination.search}`;
  if(current===next)return;

  event.preventDefault();
  clearTimers();
  changePhase('covering');
  timers.current.push(window.setTimeout(()=>{
   changePhase('covered');
   router.push(`${next}${destination.hash}`);
   timers.current.push(window.setTimeout(reveal,80));
  },820));
 },[changePhase,clearTimers,reveal,router]);

 useEffect(()=>()=>{
  clearTimers();
  document.documentElement.classList.remove('is-page-transitioning');
 },[clearTimers]);

 return <div className="siteFrame" onClickCapture={handleClick}>
  {children}
  <div className={`liquidTransition liquidTransition--${phase}`} aria-hidden="true">
   <svg className="liquidFilter" width="0" height="0" focusable="false">
    <filter id="liquid-goo">
     <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
     <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12" result="goo"/>
    </filter>
   </svg>
   <div className="liquidCurtain">
    <div className="liquidEdge liquidEdge--top">{Array.from({length:9},(_,index)=><i key={`top-${index}`}/>)}</div>
    <div className="liquidEdge liquidEdge--bottom">{Array.from({length:9},(_,index)=><i key={`bottom-${index}`}/>)}</div>
   </div>
  </div>
 </div>;
}
