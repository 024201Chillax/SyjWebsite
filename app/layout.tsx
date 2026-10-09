import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {default:'YU.JIE SU — Visual Designer',template:'%s — YU.JIE SU'},
  description:'A bilingual portfolio across cultural research, visual identity, objects and motion.',
  icons:{icon:'/favicon.svg'}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html data-scroll-behavior="smooth"><body>{children}</body></html>;
}
