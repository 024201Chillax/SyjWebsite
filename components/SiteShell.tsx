'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import type {Locale} from '@/lib/types';
import {ui} from '@/lib/content';
import LiquidPageTransition from '@/components/LiquidPageTransition';

export default function SiteShell({locale,children}:{locale:Locale;children:React.ReactNode}){
 const pathname=usePathname(); const [open,setOpen]=useState(false); const [scrolled,setScrolled]=useState(false); const u=ui[locale];
 useEffect(()=>{const fn=()=>setScrolled(scrollY>24);fn();addEventListener('scroll',fn,{passive:true});return()=>removeEventListener('scroll',fn)},[]);
 const other=locale==='zh'?'en':'zh'; const localePath=pathname.replace(/^\/(zh|en)/,`/${other}`);
 const links=[['work',u.work],['playground',u.playground],['about',u.about],['contact',u.contact]];
 return <LiquidPageTransition>
  <a className="skip" href="#main">Skip to content</a>
  <header className={`siteHeader ${/^\/(zh|en)$/.test(pathname)?'homeHeader':''} ${scrolled?'isScrolled':''}`}>
   <Link className="brand" href={`/${locale}`} aria-label="YU.JIE SU home"><b>YU.JIE SU</b><sup>®</sup></Link>
   <nav className={open?'navOpen':''} aria-label="Primary navigation">
    {links.map(([path,label],i)=><Link key={path} href={`/${locale}#${path}`} onClick={()=>setOpen(false)}><span>0{i+1}</span>{label}</Link>)}
   </nav>
   <div className="headerActions"><Link className="locale" href={localePath}>{other.toUpperCase()}</Link><button className="menuButton" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{open?'CLOSE':u.menu}</button></div>
  </header>
  <main id="main" lang={locale} className={`locale-${locale}`}>{children}</main>
  <footer><div><b>YU.JIE SU</b><span>BETWEEN ARCHIVE & RIOT</span></div><div><span>NANJING / CHINA</span><span>© 2026</span></div></footer>
 </LiquidPageTransition>
}
