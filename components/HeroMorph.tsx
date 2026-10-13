'use client';

import {useEffect,useRef} from 'react';

export default function HeroMorph({revealed,onToggle}:{revealed:boolean;onToggle:()=>void}){
 const videoRef=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  const video=videoRef.current;if(!video)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false;
  const update=()=>{if(visible&&!document.hidden&&!reduced.matches&&!revealed)void video.play().catch(()=>{});else video.pause()};
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;update()});
  observer.observe(video);
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  return()=>{observer.disconnect();video.pause();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update)};
 },[revealed]);
 return <div className={`heroExperience${revealed?' isRevealed':''}`}>
  <button className="heroMorph heroMorphTrigger" type="button" aria-label={revealed?'Return to initial homepage':'Reveal Between Archive and Riot'} aria-expanded={revealed} onClick={onToggle}>
   <div className="heroMorphCanvas">
    <video ref={videoRef} className="heroMorphVideo" muted loop playsInline preload="metadata" poster="/hero/hero-01.png">
     <source src="/hero/hero-loop-60.webm" type="video/webm"/>
    </video>
   </div>
  </button>
  <div className="heroTheme" aria-hidden={!revealed}>
   <h1><span>BETWEEN</span><span>ARCHIVE</span><span>&amp; RIOT</span></h1>
  </div>
 </div>
}
