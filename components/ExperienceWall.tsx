'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import styles from './ExperienceWall.module.css';

export type ExperienceWallItem = [src:string, caption:string, meta:string, ratio:string];

export default function ExperienceWall({items,title}:{items:ExperienceWallItem[];title:string}) {
  const trackRef=useRef<HTMLDivElement>(null);
  const firstSetRef=useRef<HTMLDivElement>(null);
  const positionRef=useRef(0);
  const pausedRef=useRef(false);
  const resumeRef=useRef<()=>void>(()=>{});
  const [activeItem,setActiveItem]=useState<number|null>(null);

  useEffect(()=>{
    let frame=0;
    let width=0,last=0,visible=false;
    const media=matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse), (max-width: 767px)');
    const tick=(now:number)=>{
      frame=0;
      if(!visible||document.hidden||media.matches||pausedRef.current){last=0;return}
      const track=trackRef.current;
      if(track){
        const delta=Math.min(40,last?now-last:16.67);last=now;
        positionRef.current-=delta*.04;
        if(width>0){
          while(positionRef.current<=-width) positionRef.current+=width;
          while(positionRef.current>0) positionRef.current-=width;
        }
        track.style.transform=`translate3d(${positionRef.current}px,0,0)`;
      }
      frame=requestAnimationFrame(tick);
    };
    const start=()=>{if(!frame&&visible&&!document.hidden&&!media.matches&&!pausedRef.current)frame=requestAnimationFrame(tick);if(media.matches&&trackRef.current)trackRef.current.style.transform='none'};
    resumeRef.current=start;
    const sizes=new ResizeObserver(()=>{width=firstSetRef.current?.clientWidth??0;start()});
    if(firstSetRef.current)sizes.observe(firstSetRef.current);
    const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible)start();else{cancelAnimationFrame(frame);frame=0;last=0}});
    if(trackRef.current)observer.observe(trackRef.current);
    document.addEventListener('visibilitychange',start);media.addEventListener('change',start);
    return()=>{cancelAnimationFrame(frame);sizes.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',start);media.removeEventListener('change',start)};
  },[]);

  return <section className={`experienceWall ${styles.wall}`} aria-label={title}>
    <header><span>04 / ARCHIVE WALL</span><span>{title}</span><small>AUTO / ←</small></header>
    <div className="experienceWallWindow">
      <div className="experienceWallTrack" ref={trackRef}>
        {[0,1].map(copy=><div className="experienceWallSet" key={copy} ref={copy===0?firstSetRef:undefined} aria-hidden={copy===1}>
          {items.map(([src,caption,meta,ratio],index)=><figure className={`experienceCard ${ratio}`} key={`${copy}-${index}`} onMouseEnter={()=>{pausedRef.current=true;setActiveItem(index)}} onMouseLeave={()=>{pausedRef.current=false;setActiveItem(null);resumeRef.current()}}>
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
