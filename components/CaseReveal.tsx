'use client';

import {useLayoutEffect} from 'react';

export default function CaseReveal(){
 useLayoutEffect(()=>{
  const root=document.querySelector('.caseStudy');
  if(!root)return;
  root.classList.add('caseRevealEnabled');
  const targets=Array.from(root.querySelectorAll<HTMLElement>('.caseMeta,.caseHero h1,.caseHero>p,.caseHero>.projectVisual,.caseFacts>div,.caseIntro p,.nineSonsIntro>*,.nineSonsFilm,.sonsMotionHead>*,.sonMotionCard,.chapterIndex,.chapterBody>h2,.chapterBody>p,.caseGallery figure,.nextProject>span,.nextProject>b,.nextProject>i'));
  targets.forEach((target,index)=>{target.classList.add('caseRevealTarget');target.style.setProperty('--reveal-delay',`${(index%4)*55}ms`)});
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){targets.forEach(target=>target.classList.add('isVisible'));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('isVisible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -7%'});
  targets.forEach(target=>observer.observe(target));
  return()=>{observer.disconnect();root.classList.remove('caseRevealEnabled')};
 },[]);
 return null;
}
