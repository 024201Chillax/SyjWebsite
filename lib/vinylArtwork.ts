export type VinylArtwork={
 slug:string;
 discArtwork?:string;
 plannedPath:string;
 fallbackColor:string;
};

export const vinylArtwork:VinylArtwork[]=[
 {slug:'long-yun-hua-cai',plannedPath:'/portfolio/vinyl/001.webp',fallbackColor:'#b8b8b3'},
 {slug:'nine-sons',plannedPath:'/portfolio/vinyl/002.webp',fallbackColor:'#989894'},
 {slug:'gotz-workshop',plannedPath:'/portfolio/vinyl/003.webp',fallbackColor:'#c4c4bf'},
 {slug:'safe',plannedPath:'/portfolio/vinyl/004.webp',fallbackColor:'#858581'},
 {slug:'omni',plannedPath:'/portfolio/vinyl/005.webp',fallbackColor:'#ababaa'},
 {slug:'type-encounter',plannedPath:'/portfolio/vinyl/006.webp',fallbackColor:'#d0d0ca'},
 {slug:'oracle-code',plannedPath:'/portfolio/vinyl/007.webp',fallbackColor:'#92928e'},
];

export const vinylArtworkBySlug=new Map(vinylArtwork.map(item=>[item.slug,item]));
