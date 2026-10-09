import {Suspense} from 'react';
import ProjectIndex from '@/components/ProjectIndex';
import type {Locale} from '@/lib/types';

export default async function Work({params}:{params:Promise<{locale:Locale}>}){
 const {locale}=await params;
 return <div className="page workPage"><Suspense><ProjectIndex locale={locale}/></Suspense></div>;
}
