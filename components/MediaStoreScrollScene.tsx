'use client';

import {Canvas, useFrame, type ThreeEvent} from '@react-three/fiber';
import {ContactShadows, useGLTF} from '@react-three/drei';
import {Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject} from 'react';
import * as THREE from 'three';
import type {Locale} from '@/lib/types';
import styles from './MediaStoreScrollScene.module.css';

type ShelfProject={number:string;slug:string;title:string;subtitle:string;year:string};
type Props={locale:Locale;projects:ShelfProject[]};

const clamp=(value:number,min=0,max=1)=>Math.min(max,Math.max(min,value));
const smooth=(value:number)=>{const t=clamp(value);return t*t*(3-2*t)};
const mix3=(a:THREE.Vector3,b:THREE.Vector3,t:number)=>a.clone().lerp(b,smooth(t));

function cameraPose(progress:number){
 const overview={position:new THREE.Vector3(0,2.75,12.2),target:new THREE.Vector3(0,2.35,0)};
 const selected={position:new THREE.Vector3(-3.45,2.55,7.15),target:new THREE.Vector3(-3.45,2.35,0)};
 const restricted={position:new THREE.Vector3(3.5,2.5,7.05),target:new THREE.Vector3(3.5,2.3,0)};
 if(progress<.18)return overview;
 if(progress<.38){const t=(progress-.18)/.2;return{position:mix3(overview.position,selected.position,t),target:mix3(overview.target,selected.target,t)}};
 if(progress<.54)return selected;
 if(progress<.7){const t=(progress-.54)/.16;return{position:mix3(selected.position,overview.position,t),target:mix3(selected.target,overview.target,t)}};
 if(progress<.88){const t=(progress-.7)/.18;return{position:mix3(overview.position,restricted.position,t),target:mix3(overview.target,restricted.target,t)}};
 return restricted;
}

function findProjectRoot(object:THREE.Object3D|null){
 let current=object;
 while(current){
  if(/^selected_project_\d{3}$/.test(current.name))return current.name;
  if(current.name==='restricted_shelf'||current.name==='pickup_disc')return current.name;
  current=current.parent;
 }
 return null;
}

function StoreModel({progress,reduceMotion,onHover,onSelect}:{progress:MutableRefObject<number>;reduceMotion:boolean;onHover:(number:string|null)=>void;onSelect:(number:string|null)=>void}){
 const source=useGLTF('/models/media-store/media-store-shelves.glb');
 const model=useMemo(()=>source.scene.clone(true),[source.scene]);
 const targetRef=useRef(new THREE.Vector3(0,2.35,0));
 const pickup=useMemo(()=>model.getObjectByName('pickup_disc'),[model]);
 const pickupStart=useMemo(()=>pickup?{position:pickup.position.clone(),rotation:pickup.rotation.clone(),scale:pickup.scale.clone()}:null,[pickup]);

 useEffect(()=>{
  model.traverse((child:THREE.Object3D)=>{
   if(child instanceof THREE.Mesh){
    child.castShadow=true;
    child.receiveShadow=true;
   }
  });
 },[model]);

 useFrame(({camera,size},delta)=>{
  const pose=cameraPose(progress.current);
  const aspect=size.width/Math.max(1,size.height);
  const portraitDistance=Math.max(1,Math.min(1.75,1.25/aspect));
  pose.position.z*=portraitDistance;
  const damping=reduceMotion?20:5.2;
  const alpha=1-Math.exp(-damping*delta);
  camera.position.lerp(pose.position,alpha);
  targetRef.current.lerp(pose.target,alpha);
  camera.lookAt(targetRef.current);
  if(pickup&&pickupStart){
   const lift=smooth((progress.current-.88)/.12);
   pickup.position.copy(pickupStart.position).add(new THREE.Vector3(0,lift*.28,lift*1.7));
   pickup.rotation.copy(pickupStart.rotation);
   pickup.rotation.y+=lift*.28;
   pickup.scale.copy(pickupStart.scale).multiplyScalar(1+lift*.32);
  }
 });

 const pointerMove=(event:ThreeEvent<PointerEvent>)=>{
  event.stopPropagation();
  const name=findProjectRoot(event.object);
  onHover(name?.startsWith('selected_project_')?name.slice(-3):name==='restricted_shelf'||name==='pickup_disc'?'restricted':null);
  document.body.style.cursor=name?'pointer':'';
 };
 const pointerOut=()=>{onHover(null);document.body.style.cursor=''};
 const click=(event:ThreeEvent<MouseEvent>)=>{
  event.stopPropagation();
  const name=findProjectRoot(event.object);
  onSelect(name?.startsWith('selected_project_')?name.slice(-3):name==='restricted_shelf'||name==='pickup_disc'?'restricted':null);
 };

 return <group scale={.82} position={[0,-.15,0]} onPointerMove={pointerMove} onPointerOut={pointerOut} onClick={click}>
  <primitive object={model}/>
 </group>;
}

function StoreCanvas({progress,reduceMotion,onHover,onSelect}:{progress:MutableRefObject<number>;reduceMotion:boolean;onHover:(number:string|null)=>void;onSelect:(number:string|null)=>void}){
 return <Canvas shadows dpr={[1,1.65]} camera={{position:[0,2.75,12.2],fov:38,near:.1,far:80}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onPointerMissed={()=>onSelect(null)}>
  <ambientLight intensity={1.65}/>
  <hemisphereLight args={['#fff8ed','#777b80',1.45]}/>
  <directionalLight castShadow position={[-5,9,7]} intensity={2.8} color="#fff4df" shadow-mapSize={[1024,1024]}/>
  <directionalLight position={[6,5,3]} intensity={1.7} color="#d6edff"/>
  <Suspense fallback={null}><StoreModel progress={progress} reduceMotion={reduceMotion} onHover={onHover} onSelect={onSelect}/></Suspense>
  <ContactShadows position={[0,-.17,0]} opacity={.22} scale={18} blur={2.5} far={8}/>
 </Canvas>;
}

export default function MediaStoreScrollScene({locale,projects}:Props){
 const sectionRef=useRef<HTMLElement>(null);
 const progress=useRef(0);
 const frame=useRef<number|null>(null);
 const [displayProgress,setDisplayProgress]=useState(0);
 const [hovered,setHovered]=useState<string|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [reduceMotion,setReduceMotion]=useState(false);
 const zh=locale==='zh';

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateMotion=()=>setReduceMotion(media.matches);
  updateMotion();media.addEventListener('change',updateMotion);
  const update=()=>{
   frame.current=null;
   const section=sectionRef.current;if(!section)return;
   const rect=section.getBoundingClientRect();
   const distance=Math.max(1,section.offsetHeight-window.innerHeight);
   const next=clamp(-rect.top/distance);
   progress.current=next;setDisplayProgress(next);
  };
  const onScroll=()=>{if(frame.current===null)frame.current=requestAnimationFrame(update)};
  update();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
  return()=>{media.removeEventListener('change',updateMotion);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);if(frame.current!==null)cancelAnimationFrame(frame.current);document.body.style.cursor=''};
 },[]);

 const phase=displayProgress<.18?'overview':displayProgress<.57?'selected':displayProgress<.7?'choice':'restricted';
 const showRestrictedEntry=displayProgress>=.82||hovered==='restricted'||selected==='restricted';
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});

 return <section ref={sectionRef} className={styles.sequence} aria-label={zh?'作品分区滚动选择器':'Scroll-controlled work selector'}>
  <div className={styles.sticky}>
   <div className={styles.canvas} aria-hidden="true"><StoreCanvas progress={progress} reduceMotion={reduceMotion} onHover={setHovered} onSelect={setSelected}/></div>
   <div className={styles.topline}><span>MEDIA STORE / 00—02</span><span>{String(Math.round(displayProgress*100)).padStart(2,'0')}%</span></div>
   <div className={`${styles.sideLabel} ${styles.leftLabel} ${phase==='selected'?styles.visible:''}`}>
    <span>01 / SELECTED</span><strong>{zh?'精选设计作品':'SELECTED WORKS'}</strong>
    <button type="button" onClick={()=>jump('work')}>{zh?'查看专辑档案 ↘':'OPEN THE ARCHIVE ↘'}</button>
   </div>
   <div className={`${styles.sideLabel} ${styles.rightLabel} ${showRestrictedEntry?styles.visible:''}`}>
    <span>02 / RESTRICTED</span><strong>{zh?'实验作品区':'EXPERIMENTAL MEDIA'}</strong>
    <button type="button" onClick={()=>jump('playground')}>{zh?'进入实验场 ↘':'ENTER PLAYGROUND ↘'}</button>
   </div>
   <div className={`${styles.choice} ${phase==='choice'?styles.visible:''}`}><span>SELECTED</span><i>OR</i><span>RESTRICTED</span></div>
   <div className={styles.scrollRail}><i style={{transform:`scaleY(${Math.max(.025,displayProgress)})`}}/></div>
  </div>
 </section>;
}

useGLTF.preload('/models/media-store/media-store-shelves.glb');
