'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';

export type ExperienceWallItem = [src:string, caption:string, meta:string, ratio:string];

export default function ExperienceWall({items,title}:{items:ExperienceWallItem[];title:string}) {
  const trackRef=useRef<HTMLDivElement>(null);
  const firstSetRef=useRef<HTMLDivElement>(null);
  const positionRef=useRef(0);
  const pausedRef=useRef(false);
  const [activeItem,setActiveItem]=useState<number|null>(null);

  useEffect(()=>{
    let frame=0;
    const tick=()=>{
      const track=trackRef.current;
      const first=firstSetRef.current;
      if(track&&first){
        const width=first.getBoundingClientRect().width;
        if(!pausedRef.current) positionRef.current-=1.25;
        if(width>0){
          while(positionRef.current<=-width) positionRef.current+=width;
          while(positionRef.current>0) positionRef.current-=width;
        }
        track.style.transform=`translate3d(${positionRef.current}px,0,0)`;
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[]);

  return <section className="experienceWall" aria-label={title}>
    <header><span>04 / ARCHIVE WALL</span><span>{title}</span><small>AUTO / ←</small></header>
    <div className="experienceWallWindow">
      <div className="experienceWallTrack" ref={trackRef}>
        {[0,1].map(copy=><div className="experienceWallSet" key={copy} ref={copy===0?firstSetRef:undefined} aria-hidden={copy===1}>
          {items.map(([src,caption,meta,ratio],index)=><figure className={`experienceCard ${ratio}`} key={`${copy}-${index}`} onMouseEnter={()=>{pausedRef.current=true;setActiveItem(index)}} onMouseLeave={()=>{pausedRef.current=false;setActiveItem(null)}}>
            <div><Image src={src} alt={caption} fill sizes="(max-width: 900px) 78vw, 32vw"/></div>
            <figcaption><span>{caption}</span><small>{meta}</small></figcaption>
          </figure>)}
        </div>)}
      </div>
    </div>
    {activeItem!==null&&<aside className="experiencePreview" aria-live="polite">
      <div><Image src={items[activeItem][0]} alt={items[activeItem][1]} fill sizes="70vw" priority/></div>
      <p>{items[activeItem][1]}<small>{items[activeItem][2]}</small></p>
    </aside>}
  </section>;
}
