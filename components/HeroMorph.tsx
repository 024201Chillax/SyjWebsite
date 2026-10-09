'use client';

export default function HeroMorph({revealed,onToggle}:{revealed:boolean;onToggle:()=>void}){
 return <div className={`heroExperience${revealed?' isRevealed':''}`}>
  <button className="heroMorph heroMorphTrigger" type="button" aria-label={revealed?'Return to initial homepage':'Reveal Between Archive and Riot'} aria-expanded={revealed} onClick={onToggle}>
   <div className="heroMorphCanvas">
    <video className="heroMorphVideo" autoPlay muted loop playsInline preload="metadata" poster="/hero/hero-01.png">
     <source src="/hero/hero-loop-60.webm" type="video/webm"/>
    </video>
   </div>
  </button>
  <div className="heroTheme" aria-hidden={!revealed}>
   <h1><span>BETWEEN</span><span>ARCHIVE</span><span>&amp; RIOT</span></h1>
  </div>
 </div>
}
