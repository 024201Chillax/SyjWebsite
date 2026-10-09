'use client';

import {useEffect,useState,type ReactNode} from 'react';
import HeroMorph from './HeroMorph';
import type {Locale} from '@/lib/types';

export default function HomePageExperience({locale,children}:{locale:Locale;children:ReactNode}){
 const [expanded,setExpanded]=useState(false);
 const [targetHash,setTargetHash]=useState('');
 useEffect(()=>{
  const readHash=()=>{const hash=window.location.hash;setTargetHash(hash);if(hash)setExpanded(true)};
  readHash();window.addEventListener('hashchange',readHash);return()=>window.removeEventListener('hashchange',readHash);
 },[]);
 useEffect(()=>{
  if(!expanded||!targetHash)return;
  let cancelled=false;
  let attempts=0;
  let timer=0;
  const alignTarget=()=>{
   if(cancelled)return;
   const target=document.getElementById(targetHash.slice(1));
   if(!target){
    if(attempts++<30)timer=window.setTimeout(alignTarget,60);
    return;
   }
   const previous=document.documentElement.style.scrollBehavior;
   document.documentElement.style.scrollBehavior='auto';
   const absoluteTop=window.scrollY+target.getBoundingClientRect().top;
   window.scrollTo(0,absoluteTop);
   requestAnimationFrame(()=>{document.documentElement.style.scrollBehavior=previous});
  };
  timer=window.setTimeout(alignTarget,120);
  return()=>{cancelled=true;window.clearTimeout(timer)};
 },[expanded,targetHash]);
 const toggle=()=>{
  if(expanded){window.scrollTo({top:0,behavior:'smooth'});setExpanded(false);return}
  setTargetHash('');
  if(window.location.hash)window.history.replaceState(null,'',`${window.location.pathname}${window.location.search}`);
  setExpanded(true);
 };
 return <div className={`homePage${expanded?' isExpanded':''}`}>
  <section className="hero heroSwiss">
   <div className="heroMeta"><span>VISUAL / CULTURE / OBJECT / MOTION</span><span>NANJING, CN<br/>2026</span></div>
   <div className="heroStage"><HeroMorph revealed={expanded} onToggle={toggle}/></div>
  </section>
  {expanded&&<div className="homeSecondary">{children}</div>}
 </div>;
}
