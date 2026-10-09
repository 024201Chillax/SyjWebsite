import {existsSync} from 'node:fs';
import {join} from 'node:path';
import VinylProjectArchive from '@/components/work/VinylProjectArchive';
import {vinylArtwork} from '@/lib/vinylArtwork';
import type {Locale} from '@/lib/types';

export default function ProjectIndex({locale}: {locale: Locale; embedded?: boolean}) {
  const artwork = vinylArtwork.map((item) => ({
    ...item,
    discArtwork: existsSync(join(process.cwd(), 'public', item.plannedPath.replace(/^\//, '')))
      ? item.plannedPath
      : undefined,
  }));

  return <VinylProjectArchive locale={locale} artwork={artwork} />;
}
