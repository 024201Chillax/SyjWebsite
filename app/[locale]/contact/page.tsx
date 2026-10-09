import ContactCard from '@/components/ContactCard';import type {Locale} from '@/lib/types';
function ContactContent({locale}:{locale:Locale}){return <div className="contactPage"><span>04 / CONTACT</span><h1>LET’S MAKE<br/><i>CULTURE</i> MOVE.</h1><p>{locale==='zh'?'视觉识别 / 文化创意 / 产品 / 动态':'VISUAL IDENTITY / CULTURAL CREATIVE / OBJECT / MOTION'}</p><ContactCard locale={locale}/></div>}
export default async function Contact({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <ContactContent locale={locale}/>}
