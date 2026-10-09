import type {MetadataRoute} from 'next';
import {projects} from '@/lib/content';
export default function sitemap():MetadataRoute.Sitemap{
 const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 return (['zh','en'] as const).flatMap(locale=>[
  {url:`${base}/${locale}`,lastModified:new Date()},
  ...['playground','about','contact'].map(path=>({url:`${base}/${locale}/${path}`,lastModified:new Date()})),
  ...projects.map(p=>({url:`${base}/${locale}/work/${p.slug}`,lastModified:new Date()}))
 ]);
}
