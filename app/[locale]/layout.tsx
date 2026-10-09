import {notFound} from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import type {Locale} from '@/lib/types';
export function generateStaticParams(){return [{locale:'zh'},{locale:'en'}]}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!['zh','en'].includes(locale))notFound();return <SiteShell locale={locale as Locale}>{children}</SiteShell>}
