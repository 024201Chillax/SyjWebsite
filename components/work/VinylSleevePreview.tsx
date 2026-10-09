'use client';

import Image from 'next/image';
import type {CSSProperties} from 'react';
import type {Locale,Project} from '@/lib/types';
import type {SleeveState} from './useVinylSleevePreview';
import styles from './VinylProjectArchive.module.css';

type Props={
 project:Project|null;
 locale:Locale;
 state:SleeveState;
 visible:boolean;
 index:number;
 total:number;
 onPointerEnter:()=>void;
 onPointerLeave:()=>void;
};

export default function VinylSleevePreview({project,locale,state,visible,index,total,onPointerEnter,onPointerLeave}:Props){
 const archivePosition=String(index+1).padStart(2,'0');
 const archiveTotal=String(total).padStart(2,'0');
 const progress=`${((index+1)/Math.max(1,total))*100}%`;
 const preserveArtwork=project?project.cover.height>project.cover.width*1.08:false;

 return <aside
  className={styles.archivePlayer}
  data-visible={visible?'true':'false'}
  data-state={state}
  aria-hidden={!visible}
  aria-label={project?`${locale==='zh'?'项目档案播放器':'Project archive player'}：${project.title[locale]}`:undefined}
  onPointerEnter={onPointerEnter}
  onPointerLeave={onPointerLeave}
 >
  <div className={styles.playerPanel}>
   <header className={styles.playerTopBar}>
    <span className={styles.playerStatus}><i aria-hidden="true"/>PROJECT PLAYER</span>
    <b>{project?.number??'---'}</b>
   </header>

   {project&&<div className={styles.playerContent}>
    <span className={styles.playerEyebrow}>{locale==='zh'?'当前项目':'NOW VIEWING'}</span>

    <figure className={styles.playerArtwork} data-fit={preserveArtwork?'contain':'cover'}>
     <Image
      src={project.cover.src}
      alt={project.cover.alt[locale]}
      fill
      sizes="(min-width: 1200px) 25vw, 320px"
      className={styles.playerImage}
     />
    </figure>

    <div className={styles.playerIdentity}>
     <h3>{project.title[locale]}</h3>
     <span>{project.title.en}</span>
    </div>

    <div className={styles.playerMeta}>
     <p>{project.tags.join(' · ')}</p>
     <b>{project.year}</b>
     <span>{project.role[locale]}</span>
    </div>

    <div className={styles.playerProgress} style={{'--player-progress':progress} as CSSProperties}>
     <span>{archivePosition}</span>
     <i aria-hidden="true"><b/><em/></i>
     <span>{archiveTotal}</span>
    </div>

    <div className={styles.playerControls} aria-hidden="true">
     <span className={styles.playerPrevious}/>
     <strong><i/></strong>
     <span className={styles.playerNext}/>
    </div>

    <div className={styles.playerNotes}>
     <small>PROJECT NOTES</small>
     <b>{project.subtitle[locale]}</b>
     <p>{project.summary[locale]}</p>
    </div>
   </div>}
   </div>
 </aside>;
}
