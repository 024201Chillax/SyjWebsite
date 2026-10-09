export type Locale = 'zh' | 'en';
export type LocalizedText = Record<Locale, string>;
export type ProjectMode = 'archive' | 'riot' | 'hybrid';

export type MediaAsset = {
  type: 'image' | 'video' | 'canvas' | 'model';
  src: string;
  poster?: string;
  alt: LocalizedText;
  aspectRatio: `${number}/${number}`;
  width: number;
  height: number;
  crop?: {
    aspectRatio: `${number}/${number}`;
    objectPosition: string;
  };
};

export type CaseChapter = {
  id: string;
  type: 'overview' | 'context' | 'research' | 'transformation' | 'system' | 'applications' | 'outcome' | 'reflection';
  index: string;
  label: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  layout: 'text' | 'split' | 'sticky' | 'gallery' | 'full-bleed';
  media: MediaAsset[];
};

export type Project = {
  slug: string;
  number: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  summary: LocalizedText;
  year: string;
  mode: ProjectMode;
  categories: string[];
  tags: string[];
  role: LocalizedText;
  cover: MediaAsset;
  chapters: CaseChapter[];
  featured: boolean;
  featuredOrder: number;
};
