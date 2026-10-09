'use client';

import type {Locale,Project} from '@/lib/types';
import styles from './VinylProjectArchive.module.css';

export default function VinylProjectInfo({project,locale}:{project:Project;locale:Locale}){
 return <section key={`primary-${project.slug}`} className={`${styles.info} ${styles.primaryInfo}`}>
  <span className={styles.infoKicker}>PROJECT / {project.number}</span>
  <h2>{project.title[locale]}</h2>
  <p className={styles.englishTitle}>{project.title.en}</p>
  <div className={styles.primaryMeta}><span>YEAR</span><b>{project.year}</b></div>
 </section>;
}
