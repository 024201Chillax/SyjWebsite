'use client';

import {useEffect,useRef} from 'react';
import type {Locale} from '@/lib/types';

const sons=[
 {file:'01-qiuniu.webm',zh:'囚牛',en:'QIU NIU',noteZh:'喜音乐，常饰于琴头。纵向骨架与收束线条将琴弦、共鸣和字形压缩在同一结构中。',noteEn:'Associated with music and often found on instruments. Vertical strokes and gathered lines compress strings, resonance and character into one structure.'},
 {file:'02-yazi.webm',zh:'睚眦',en:'YA ZI',noteZh:'嗜争斗，常见于刀剑吞口。锐利切口与向内挤压的笔画形成紧张、锋利的视觉重心。',noteEn:'Linked to combat and sword fittings. Sharp cuts and compressed strokes create a tense, blade-like centre of gravity.'},
 {file:'03-chaofeng.webm',zh:'嘲风',en:'CHAO FENG',noteZh:'好登高、勤远眺，常立于殿角。向上挑起的长笔与高位结构回应其登临与远望的特征。',noteEn:'Known for climbing high and looking afar. An elevated structure and rising stroke echo its place on palace corners.'},
 {file:'04-pulao.webm',zh:'蒲牢',en:'PU LAO',noteZh:'好鸣，常刻于钟纽。横向钟梁与下垂长笔建立声音向外扩散的节奏。',noteEn:'Known for its powerful cry and associated with bells. A broad upper beam and hanging stroke suggest resonance spreading outward.'},
 {file:'05-suanni.webm',zh:'狻猊',en:'SUAN NI',noteZh:'形如狮，喜烟火，常藏于香炉。厚重曲线与内嵌负形让兽形和烟气在字内交叠。',noteEn:'Lion-like and associated with incense burners. Heavy curves and inset negative space overlap animal form with drifting smoke.'},
 {file:'06-baxia.webm',zh:'霸下',en:'BA XIA',noteZh:'身似龟，善负重，常作碑座。低重心、宽横梁与层叠结构强调承托感。',noteEn:'Turtle-like and known for bearing weight beneath monuments. A low centre, broad beam and stacked form convey support.'},
 {file:'07-bian.webm',zh:'狴犴',en:'BI AN',noteZh:'形似虎，明辨是非，常见于官衙与狱门。对称框架和门形结构传达秩序与威严。',noteEn:'Tiger-like and associated with justice and official gates. A symmetrical, gate-like frame conveys order and authority.'},
 {file:'08-fuxi.webm',zh:'负屃',en:'FU XI',noteZh:'好文采，常盘踞碑额。横向展开的碑形笔画与内层曲线共同形成稳定的文字容器。',noteEn:'Associated with literature and stone inscriptions. Monument-like horizontal strokes and an inner curve form a stable vessel for text.'},
 {file:'09-chiwen.webm',zh:'螭吻',en:'CHI WEN',noteZh:'口善吞，寓意消灾避火，常置屋脊。咬合般的负形与上下互锁结构表现吞纳动作。',noteEn:'Known for swallowing and placed on roof ridges as protection from fire. Interlocking forms and biting negative space express that action.'}
];

export default function NineSonsMotion({locale}:{locale:Locale}){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const videos=Array.from(root.current?.querySelectorAll<HTMLVideoElement>('video[data-son-motion]')??[]);
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const video=entry.target as HTMLVideoElement;if(entry.isIntersecting)video.play().catch(()=>{});else video.pause()}),{threshold:.2});
  videos.forEach(video=>observer.observe(video));
  return()=>observer.disconnect();
 },[]);
 return <section className="nineSonsMotion" ref={root}>
  <div className="nineSonsIntro"><span>00 / MOTION FILM</span><div><h2>{locale==='zh'?'九组性格，一套运动语言':'NINE CHARACTERS, ONE MOTION LANGUAGE'}</h2><p>{locale==='zh'?'完整影像依次呈现九组合体字从拆分、挤压到互锁成形的过程。运动不只是展示手段，也承担角色塑造：速度、方向和停顿分别回应九子的性格与传说。':'The full film follows nine compound characters as they split, compress and interlock. Motion also builds character: speed, direction and pause respond to each son’s traits and legend.'}</p></div></div>
  <div className="nineSonsFilm"><video src="/portfolio/nine-sons/nine-sons-full.mp4" controls playsInline preload="metadata" aria-label={locale==='zh'?'龙生九子完整动态影像':'Full Nine Sons motion film'}/></div>
  <div className="sonsMotionHead"><span>01–09 / GLYPH STUDIES</span><h2>{locale==='zh'?'九个字体的动态变化':'NINE GLYPHS IN MOTION'}</h2></div>
  <div className="sonsMotionGrid">{sons.map((son,index)=><article className="sonMotionCard" key={son.file}>
   <video data-son-motion src={`/portfolio/nine-sons/${son.file}`} muted loop playsInline preload="metadata" aria-label={`${son.zh} ${locale==='zh'?'字体变化':'glyph transformation'}`}/>
   <div className="sonMotionMeta"><span>{String(index+1).padStart(2,'0')}</span><h3>{son.zh}<small>{son.en}</small></h3><p>{locale==='zh'?son.noteZh:son.noteEn}</p></div>
  </article>)}</div>
 </section>;
}
