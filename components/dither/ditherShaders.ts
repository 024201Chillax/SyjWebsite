export const DITHER_VERTEX_SHADER=`
attribute vec2 position;
void main(){
 gl_Position=vec4(position,0.0,1.0);
}`;

export const DITHER_FIELD_GLSL=`
float bayer4(vec2 position){
 vec2 cell=mod(floor(position),4.0);
 float x=cell.x;
 float y=cell.y;
 float value=0.0;
 if(y<1.0){
  if(x<1.0)value=0.0;else if(x<2.0)value=8.0;else if(x<3.0)value=2.0;else value=10.0;
 }else if(y<2.0){
  if(x<1.0)value=12.0;else if(x<2.0)value=4.0;else if(x<3.0)value=14.0;else value=6.0;
 }else if(y<3.0){
  if(x<1.0)value=3.0;else if(x<2.0)value=11.0;else if(x<3.0)value=1.0;else value=9.0;
 }else{
  if(x<1.0)value=15.0;else if(x<2.0)value=7.0;else if(x<3.0)value=13.0;else value=5.0;
 }
 return (value+0.5)/16.0;
}

float ditherField(vec2 uv,vec2 mouse,float t){
 float field=0.48;
 field+=sin(uv.x*3.2+t*2.4)*0.13;
 field+=cos(uv.y*4.6-t*1.8)*0.11;
 field+=sin((uv.x+uv.y)*7.0+t*3.0)*0.055;

 vec2 orbA=vec2(sin(t*1.35)*0.55,cos(t*.92)*0.32);
 vec2 orbB=vec2(cos(t*.78)*0.68,sin(t*1.18)*0.38);
 field+=exp(-dot(uv-orbA,uv-orbA)*3.1)*0.36;
 field-=exp(-dot(uv-orbB,uv-orbB)*4.2)*0.29;

 float mouseDistance=length(uv-mouse);
 field+=sin(mouseDistance*24.0-t*8.0)*exp(-mouseDistance*3.5)*0.12;
 return clamp(field,0.0,1.0);
}`;

export const DITHER_FRAGMENT_SHADER=`
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
${DITHER_FIELD_GLSL}

void main(){
 float pixelSize=4.0;
 vec2 pixel=floor(gl_FragCoord.xy/pixelSize)*pixelSize;
 vec2 uv=(pixel*2.0-resolution)/min(resolution.x,resolution.y);
 vec2 mouse=(pointer*2.0-resolution)/min(resolution.x,resolution.y);
 float field=ditherField(uv,mouse,time*0.00042);
 float threshold=bayer4(floor(gl_FragCoord.xy/pixelSize));
 float monochrome=step(threshold,field);
 gl_FragColor=vec4(vec3(monochrome),1.0);
}`;

export const DITHER_TRANSITION_FRAGMENT_SHADER=`
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform vec2 targetCenter;
uniform float targetRadius;
uniform float time;
uniform float progress;
${DITHER_FIELD_GLSL}

float ease(float start,float end,float value){
 float amount=clamp((value-start)/max(.0001,end-start),0.0,1.0);
 return amount*amount*(3.0-2.0*amount);
}

void main(){
 float pixelSize=4.0;
 vec2 pixel=floor(gl_FragCoord.xy/pixelSize)*pixelSize;
 float minimum=min(resolution.x,resolution.y);
 vec2 uv=(pixel*2.0-resolution)/minimum;
 vec2 mouse=(pointer*2.0-resolution)/minimum;
 vec2 targetUv=(targetCenter*2.0-resolution)/minimum;
 float radius=max(.08,targetRadius*2.0/minimum);
 float t=time*0.00042;
 float base=ditherField(uv,mouse,t);
 float morph=ease(.20,.68,progress);
 float distanceToTarget=length(uv-targetUv);
 float inside=1.0-smoothstep(radius*.93,radius*1.03,distanceToTarget);
 float arcField=.48+sin(distanceToTarget*148.0-t*2.0)*.22+sin(distanceToTarget*71.0+t)*.075;
 float outerFalloff=1.0-ease(radius*1.08,radius*2.45,distanceToTarget)*.72;
 float grooveField=mix(base*outerFalloff,clamp(arcField,0.0,1.0),inside);
 float field=mix(base,grooveField,morph);
 float threshold=bayer4(floor(gl_FragCoord.xy/pixelSize));
 float monochrome=step(threshold,field);
 vec3 paper=vec3(0.961,0.953,0.933);
 float dissolve=ease(.69,.835,progress);
 vec3 color=mix(vec3(monochrome),paper,dissolve);
 gl_FragColor=vec4(color,1.0);
}`;
