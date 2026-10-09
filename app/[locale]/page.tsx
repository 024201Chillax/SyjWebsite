import {Suspense} from 'react';
import HomePageExperience from '@/components/HomePageExperience';
import ProjectIndex from '@/components/ProjectIndex';
import DitherField from '@/components/DitherField';
import PlaygroundPage from './playground/page';
import AboutPage from './about/page';
import ContactPage from './contact/page';
import type {Locale} from '@/lib/types';
import MediaStoreNarrative from '@/components/MediaStoreNarrative';

export default async function Home({params}:{params:Promise<{locale:Locale}>}){
 const {locale}=await params;
 return <HomePageExperience locale={locale}>
  <MediaStoreNarrative
   locale={locale}
   work={<section id="work" className="page workPage homeLongSection"><Suspense><ProjectIndex locale={locale} embedded/></Suspense></section>}
   playground={<section id="playground" className="homeLongSection"><PlaygroundPage params={Promise.resolve({locale})}/></section>}
  />
  <section id="about" className="homeLongSection"><AboutPage params={Promise.resolve({locale})}/></section>
  <section id="method" className="method methodSolo"><DitherField/><h2><span>I DON’T REPEAT STYLES</span><i>I BUILD METHODS</i></h2></section>
  <section id="contact" className="homeLongSection"><ContactPage params={Promise.resolve({locale})}/></section>
 </HomePageExperience>;
}
