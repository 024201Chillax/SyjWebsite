'use client';

import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import type {Locale,MediaAsset} from '@/lib/types';

export default function CaseGallery({media,locale}:{media:MediaAsset[];locale:Locale}){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const [active,setActive]=useState<number|null>(null);
 const current=active===null?null:media[active];
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(active!==null&&dialog){if(!dialog.open)dialog.showModal();document.body.style.overflow='hidden'}
  return()=>{document.body.style.overflow=''};
 },[active]);
 const close=()=>{dialogRef.current?.close();setActive(null);document.body.style.overflow=''};
 return <>
  <div className="caseGallery">{media.map((item,index)=><figure key={`${item.src}-${index}`} className={`${index===0?'lead ':''}${item.crop?'croppedPlate':''}`}>
   <button className={`caseGalleryOpen${item.crop?' isCrop':''}`} style={item.crop?{aspectRatio:item.crop.aspectRatio}:undefined} onClick={()=>setActive(index)} aria-label={`${locale==='zh'?'放大查看':'Enlarge'}：${item.alt[locale]}`}>
    {item.crop?<Image src={item.src} alt={item.alt[locale]} fill sizes="(max-width: 767px) 100vw, 88vw" style={{objectFit:'cover',objectPosition:item.crop.objectPosition}}/>:<Image src={item.src} alt={item.alt[locale]} width={item.width} height={item.height} sizes="(max-width: 767px) 100vw, 72vw"/>}
   </button>
   <figcaption>{item.alt[locale]}</figcaption>
  </figure>)}</div>
  <dialog ref={dialogRef} className="caseImageLightbox" onClose={()=>setActive(null)} onCancel={(event)=>{event.preventDefault();close()}} onClick={(event)=>{if(event.target===event.currentTarget)close()}}>
   {current&&<div className="caseImageLightboxInner">
    <button className={`caseImageLightboxImage${current.crop?' isCrop':''}`} onClick={close} aria-label={locale==='zh'?'再次点击图片退出':'Click image again to close'}><Image key={`${current.src}-${active}`} src={current.src} alt={current.alt[locale]} fill sizes="100vw" priority style={current.crop?{objectFit:'cover',objectPosition:current.crop.objectPosition}:undefined}/></button>
    <div className="caseImageLightboxBar"><span>{String((active??0)+1).padStart(2,'0')} / {String(media.length).padStart(2,'0')}</span><p>{current.alt[locale]}</p></div>
   </div>}
  </dialog>
 </>;
}
