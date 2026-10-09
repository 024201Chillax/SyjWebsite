import PlaygroundWall from '@/components/PlaygroundWall';import type {Locale} from '@/lib/types';
function PlaygroundContent({locale}:{locale:Locale}){return <div className="playgroundPage"><header className="playHead"><span>02 / PLAYGROUND</span><h1>NO BRIEF.<br/>NO CLIENT.<br/><i>CONTROLLED CHAOS.</i></h1><p>{locale==='zh'?'个人创作':'PERSONAL WORK'}</p></header><PlaygroundWall locale={locale}/></div>}
export default async function Playground({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <PlaygroundContent locale={locale}/>}
