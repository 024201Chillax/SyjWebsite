import Image from 'next/image';
import type {Locale} from '@/lib/types';
import ExperienceWall, {type ExperienceWallItem} from '@/components/ExperienceWall';

export default async function About({params}:{params:Promise<{locale:Locale}>}) {
  const {locale}=await params;
  return <AboutContent locale={locale}/>;
}

function AboutContent({locale}:{locale:Locale}) {
  const zh=locale==='zh';
  const rollingItems = zh ? [
    ['PROJECT / 01', '南京博物院建院九十周年礼 · 龙蕴华彩系列', '文创产品设计'],
    ['RESEARCH / 01', '国家社科艺术基金重大项目课题研究', '课题研究'],
    ['AWARD / 01', '“城市未来”长三角视觉设计大赛', '2024 · 全国金奖'],
    ['PROJECT / 02', '南京博物院十二花神系列文创礼盒', '文创礼盒设计'],
    ['RESEARCH / 02', '江苏数字技术赋能非遗活态化课题研究', '主要成员'],
    ['AWARD / 02', '米兰设计周中国高校设计赛', '2025 · 江苏省一等奖'],
    ['PROJECT / 03', '中国科举博物馆文创产品开发设计', '文创产品设计'],
    ['AWARD / 03', 'JAGDA 国际海报大赛', '2025 · 入围奖'],
    ['EXHIBITION / 01', '“雅正和鸣”汉字艺术展', '2025 · 波兰巡展'],
    ['AWARD / 04', 'IAI 学院奖', '2025 · 铜奖'],
  ] : [
    ['PROJECT / 01', 'Nanjing Museum 90th Anniversary · Dragon Brilliance', 'Cultural Product Design'],
    ['RESEARCH / 01', 'National Social Science Fund · Major Art Project', 'Research'],
    ['AWARD / 01', 'Yangtze River Delta “Future City” Competition', '2024 · National Gold'],
    ['PROJECT / 02', 'Nanjing Museum · Twelve Flower Deities Collection', 'Gift Collection'],
    ['RESEARCH / 02', 'Digital Technology for Living Intangible Heritage', 'Core Member'],
    ['AWARD / 02', 'Milan Design Week · China Collegiate Design Competition', '2025 · Jiangsu First Prize'],
    ['PROJECT / 03', 'China Imperial Examination Museum', 'Cultural Product Design'],
    ['AWARD / 03', 'JAGDA International Poster Award', '2025 · Shortlisted'],
    ['EXHIBITION / 01', '“Elegance & Harmony” Chinese Character Art Exhibition', '2025 · Poland Tour'],
    ['AWARD / 04', 'IAI Academy Award', '2025 · Bronze'],
  ];

  const software = [
    ['Ai','Illustrator'],['Ps','Photoshop'],['Id','InDesign'],['Ae','After Effects'],
    ['B','Blender'],['R','Rhino'],['C','Canva'],['T','Topaz'],
    ['P','Procreate'],['N','Nomad'],['⌘','Codex'],['M','Midjourney'],
    ['SD','Stable Diffusion'],['R','Runway'],['P','Pika'],
  ];
  const experienceImages:ExperienceWallItem[] = zh ? [
    ['/about/archive-01.jpg','作品于日本东京国立美术馆展出','TOKYO / 2025','portrait'],
    ['/about/archive-02.jpg','作品于日本东京国立美术馆展出','TOKYO / 2025','wide'],
    ['/about/archive-03.jpg','首次利用 AI 全链路生成短片《乩身》并获奖','AWARD / 2024.12','wide'],
    ['/about/archive-04.jpg','工作坊巡展','WORKSHOP / TOUR','portrait'],
    ['/about/archive-05.jpg','作品于吉尔吉斯斯坦展出','KYRGYZSTAN / EXHIBITION','wide'],
    ['/about/archive-06.jpg','南京博物院特展主题','NANJING MUSEUM / 2023.12','portrait'],
    ['/about/award-2024.jpg','常州市委书记陈金虎为我颁奖','CHANGZHOU / 2024.12','wide'],
  ] : [
    ['/about/archive-01.jpg','Work exhibited at the National Art Center, Tokyo','TOKYO / 2025','portrait'],
    ['/about/archive-02.jpg','Work exhibited at the National Art Center, Tokyo','TOKYO / 2025','wide'],
    ['/about/archive-03.jpg','First fully AI-generated short film “Jishen” received an award','AWARD / 2024.12','wide'],
    ['/about/archive-04.jpg','Workshop touring exhibition','WORKSHOP / TOUR','portrait'],
    ['/about/archive-05.jpg','Work exhibited in Kyrgyzstan','KYRGYZSTAN / EXHIBITION','wide'],
    ['/about/archive-06.jpg','Nanjing Museum special exhibition theme','NANJING MUSEUM / 2023.12','portrait'],
    ['/about/award-2024.jpg','Award presented by Changzhou Party Secretary Chen Jinhu','CHANGZHOU / 2024.12','wide'],
  ];

  return <div className="aboutLoop">
    <section className="aboutLoopFirst">
      <div className="aboutLoopTop"><span>03 / ABOUT</span><span>SU YUJIE · CULTURAL CREATIVE DESIGN</span><span>NANJING / CHINA</span></div>
      <div className="aboutLoopLayout">
      <figure className="aboutLoopPortrait"><Image src="/about/su-yujie-portrait-v2.jpg" alt={zh?'苏禹杰个人照片':'Portrait of Su Yujie'} fill priority sizes="(max-width: 760px) 100vw, 44vw"/></figure>

      <div className="aboutLoopContent">
        <section className="aboutLoopMajor">
          <span>EDUCATION / 001</span>
          <p>{zh?'南京艺术学院 · 硕士研究生':'NANJING UNIVERSITY OF THE ARTS · MA'}</p>
          <h1>{zh?'文创设计与社会创新':'CULTURAL CREATIVE DESIGN & SOCIAL INNOVATION'}</h1>
          <small>2023—2027</small>
        </section>

        <section className="aboutLoopExperience">
          <header><span>{zh?'教育与工作':'EDUCATION & WORK'}</span></header>
          <div><time>2019—2023</time><b>{zh?'山东财经大学':'Shandong University of Finance and Economics'}</b><em>{zh?'视觉传达设计 · 本科':'BA · Visual Communication Design'}</em></div>
          <div><time>2023—2026</time><b>{zh?'江苏字愈文化传媒有限公司':'Jiangsu Ziyu Culture Media'}</b><em>{zh?'主管文创设计':'Lead Cultural & Creative Designer'}</em></div>
          <div><time>2025.07</time><b>{zh?'江苏鱼跃医疗设备股份有限公司':'Jiangsu Yuyue Medical Equipment'}</b><em>{zh?'品牌设计 · 实习':'Brand Design · Internship'}</em></div>
        </section>

        <section className="aboutLoopDirectory" aria-label={zh?'代表项目、科研实践与获奖展览循环目录':'Looping directory of projects, research and awards'}>
          <header><span>{zh?'项目 / 科研 / 获奖与展览':'PROJECTS / RESEARCH / RECOGNITION'}</span></header>
          <div className="aboutLoopWindow">
            <div className="aboutLoopTrack">
              {[0,1].map(copy=><div className="aboutLoopSet" key={copy} aria-hidden={copy===1}>
                {rollingItems.map(([type,title,meta])=><article key={`${copy}-${type}`}><span>{type}</span><h2>{title}</h2><p>{meta}</p></article>)}
              </div>)}
            </div>
          </div>
        </section>
      </div>
      </div>
    </section>

    <section className="aboutDetails" id="profile-details">
      <div className="aboutDetailsGrid">
        <section className="aboutDetailBlock aboutAbility">
          <span>01 / {zh?'个人技能':'SKILLS'}</span>
          <h2>{zh?'从调研到落地':'FROM RESEARCH TO DELIVERY'}</h2>
          <div><b>{zh?'能力方向':'CAPABILITY'}</b><p>{zh?'用户调研 / 市场调研 / 文案撰写 / 文化溯源 / 项目管理':'User research / Market research / Copywriting / Cultural research / Project management'}</p></div>
          <div><b>{zh?'设计方向':'DESIGN'}</b><p>{zh?'平面设计 / 手绘 / 三维建模 / 动态设计 / AI 设计':'Graphic design / Drawing / 3D modelling / Motion / AI design'}</p></div>
        </section>

        <section className="aboutDetailBlock aboutCertificates">
          <span>02 / {zh?'证书':'CERTIFICATES'}</span>
          <ul>
            <li>{zh?'教师资格证（高中美术）':'Teacher Qualification · High School Art'}</li>
            <li>{zh?'高级信息系统项目管理师':'Senior Information Systems Project Manager'}</li>
            <li>CET-4 / CET-6</li>
          </ul>
        </section>

        <section className="aboutDetailBlock aboutSummary">
          <span>03 / {zh?'个人总结':'PROFILE'}</span>
          <div className="aboutSummaryInner">
            <div className="aboutSummaryCopy">
              <p>{zh?'四年以上文创设计工作经验，参与多个知名设计项目落地，并与南京博物院、中国科举博物馆、金陵刻经处等机构保持长期合作。':'Over four years of cultural creative design experience, delivering projects with institutions including Nanjing Museum, the China Imperial Examination Museum and Jinling Buddhist Press.'}</p>
              <p>{zh?'具备项目整体把控能力，熟悉从文化研究、概念建立到产品生产与销售路径复盘的完整链路。':'Experienced across the full process—from cultural research and concept development to production and post-launch review.'}</p>
              <p>{zh?'持续关注设计动向和消费趋势，并将 AI 技术融入设计链路。':'Attentive to design and consumer trends, integrating AI into the design process.'}</p>
              <p>{zh?'主要方向包括衍生品开发、平面设计、IP 转化、文创产品与周边设计。':'Focus areas include merchandise, graphic design, IP transformation and cultural product development.'}</p>
            </div>
          </div>
        </section>
      </div>

      <ExperienceWall items={experienceImages} title={zh?'展览与经历':'EXHIBITIONS & EXPERIENCE'}/>

      <section className="softwareMarquee" aria-label={zh?'软件技能循环列表':'Looping software skills'}>
        <header><span>05 / SOFTWARE</span><span>{zh?'软件工具':'TOOLS'}</span></header>
        <div className="softwareWindow"><div className="softwareTrack">
          {[0,1].map(copy=><div className="softwareSet" key={copy} aria-hidden={copy===1}>{software.map(([icon,name],index)=><div className="softwareItem" key={`${copy}-${name}`}><i className={`softwareIcon softwareIcon${index}`}>{icon}</i><b>{name}</b></div>)}</div>)}
        </div></div>
      </section>
    </section>
  </div>
}
