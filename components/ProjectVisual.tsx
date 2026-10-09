import Image from 'next/image';
import type {Project} from '@/lib/types';
export default function ProjectVisual({project,large=false}:{project:Project;large?:boolean}){
 return <div className={`projectVisual artwork ${project.mode} ${large?'large':''}`}>
  <Image src={project.cover.src} alt={project.cover.alt.zh} fill sizes={large?'(max-width: 767px) 100vw, 90vw':'(max-width: 767px) 100vw, 36vw'} priority={large}/>
  <span className="visualNumber">{project.number}</span>
 </div>
}
