'use client';

import {useEffect,useRef} from 'react';
import {DITHER_FRAGMENT_SHADER,DITHER_VERTEX_SHADER} from './dither/ditherShaders';

export default function DitherField(){
 const canvasRef=useRef<HTMLCanvasElement>(null);

 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas)return;
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});
  if(!gl)return;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer=window.matchMedia('(pointer: coarse)').matches;
  let animation=0;
  let previousFrame=0;
  let visible=false;
  let width=1;
  let height=1;
  let pointerX=.5;
  let pointerY=.5;

  const compile=(type:number,source:string)=>{
   const shader=gl.createShader(type);
   if(!shader)return null;
   gl.shaderSource(shader,source);
   gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    gl.deleteShader(shader);
    return null;
   }
   return shader;
  };

  const vertex=compile(gl.VERTEX_SHADER,DITHER_VERTEX_SHADER);
  const fragment=compile(gl.FRAGMENT_SHADER,DITHER_FRAGMENT_SHADER);
  if(!vertex||!fragment)return;
  const program=gl.createProgram();
  if(!program)return;
  gl.attachShader(program,vertex);
  gl.attachShader(program,fragment);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);

  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolutionLocation=gl.getUniformLocation(program,'resolution');
  const pointerLocation=gl.getUniformLocation(program,'pointer');
  const timeLocation=gl.getUniformLocation(program,'time');

  const resize=()=>{
   const bounds=canvas.getBoundingClientRect();
   const ratio=Math.min(window.devicePixelRatio||1,coarsePointer?1:1.25);
   width=Math.max(1,Math.round(bounds.width*ratio));
   height=Math.max(1,Math.round(bounds.height*ratio));
   canvas.width=width;
   canvas.height=height;
   gl.viewport(0,0,width,height);
  };

  const render=(timestamp:number)=>{
   gl.uniform2f(resolutionLocation,width,height);
   gl.uniform2f(pointerLocation,pointerX*width,(1-pointerY)*height);
   gl.uniform1f(timeLocation,reducedMotion.matches?0:timestamp);
   gl.drawArrays(gl.TRIANGLES,0,6);
  };

  const frame=(timestamp:number)=>{
   if(!visible||document.hidden){animation=0;return}
   const interval=coarsePointer?1000/24:1000/40;
   if(timestamp-previousFrame>=interval){previousFrame=timestamp;render(timestamp)}
   if(!reducedMotion.matches)animation=requestAnimationFrame(frame);
  };
  const onPointerMove=(event:PointerEvent)=>{
   const bounds=canvas.getBoundingClientRect();
   pointerX=(event.clientX-bounds.left)/bounds.width;
   pointerY=(event.clientY-bounds.top)/bounds.height;
  };
  const onMotionChange=()=>{
   cancelAnimationFrame(animation);
   animation=0;
   render(0);
   if(visible&&!document.hidden&&!reducedMotion.matches)animation=requestAnimationFrame(frame);
  };
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0]?.isIntersecting??false;
   onMotionChange();
  });
  observer.observe(canvas);

  resize();
  render(0);
  canvas.addEventListener('pointermove',onPointerMove);
  window.addEventListener('resize',resize);
  reducedMotion.addEventListener('change',onMotionChange);
  document.addEventListener('visibilitychange',onMotionChange);

  return()=>{
   cancelAnimationFrame(animation);
   canvas.removeEventListener('pointermove',onPointerMove);
   window.removeEventListener('resize',resize);
   reducedMotion.removeEventListener('change',onMotionChange);
   document.removeEventListener('visibilitychange',onMotionChange);
   observer.disconnect();
   gl.deleteBuffer(buffer);
   gl.deleteProgram(program);
   gl.deleteShader(vertex);
   gl.deleteShader(fragment);
  };
 },[]);

 return <canvas ref={canvasRef} className="ditherField" aria-hidden="true"/>;
}
