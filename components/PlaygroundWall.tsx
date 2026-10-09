'use client';

import Image from 'next/image';
import {useEffect,useRef,useState,type WheelEvent} from 'react';
import type {Locale,LocalizedText} from '@/lib/types';

type PlaygroundPage={
 image?:string;
 images?:string[];
 video?:string;
 kicker:LocalizedText;
 title:LocalizedText;
 body:LocalizedText;
 layout?:'image'|'notes'|'gallery'|'video'|'final'|'details';
};
type PlaygroundItem={title:string;zh:string;meta:string;year?:string;image?:string;pages?:PlaygroundPage[]};

const oraclePosterPages:PlaygroundPage[]=[
 {images:['/playground/oracle-hanzi-posters/jiu.webp','/playground/oracle-hanzi-posters/xue.webp','/playground/oracle-hanzi-posters/yue.webp'],kicker:{zh:'01 / 入选展览',en:'01 / SELECTED EXHIBITION'},title:{zh:'月 · 酒 · 雪：\u200b从甲骨文出发的\u200b汉字海报组',en:'MOON · WINE · SNOW: AN ORACLE-SCRIPT POSTER SERIES'},body:{zh:'项目源于教育部中外语言交流合作中心组织的汉字海报活动。展览围绕“山、漠、笛、月、酒、雪、路、关、风、合”十个主题汉字展开；我负责“月、酒、雪”三字的海报创作。整套作品入选，并于乌兹别克斯坦与塔吉克斯坦展出。',en:'Created for a Chinese-character poster programme organised by the Ministry of Education’s Center for Language Education and Cooperation. The exhibition explored ten characters—mountain, desert, flute, moon, wine, snow, road, pass, wind and harmony. I designed Moon, Wine and Snow; the complete set was selected and exhibited in Uzbekistan and Tajikistan.'},layout:'gallery'},
 {image:'/playground/oracle-hanzi-posters/jiu.webp',kicker:{zh:'02 / 酒 · 甲骨文',en:'02 / WINE · ORACLE SCRIPT'},title:{zh:'从器皿轮廓中\u200b提取“酒”的\u200b古文字结构',en:'RECASTING WINE THROUGH THE SILHOUETTE OF AN ANCIENT VESSEL'},body:{zh:'“酒”以甲骨文字形为核心，将器皿、液体与举杯动作压入同一画面。高反差黑底、荧光黄与洋红网点让古老字形进入当代海报语境，同时保留盛装与流动的视觉联想。',en:'Wine centres the oracle-bone glyph, compressing vessel, liquid and the gesture of drinking into one field. Fluorescent yellow and magenta halftones pull the ancient form into a contemporary poster language while retaining a sense of containment and flow.'},layout:'image'},
 {image:'/playground/oracle-hanzi-posters/xue.webp',kicker:{zh:'03 / 雪 · 甲骨文',en:'03 / SNOW · ORACLE SCRIPT'},title:{zh:'让“雪”的落点\u200b穿过山川与颗粒',en:'SNOWFALL CUTS THROUGH MOUNTAIN, VALLEY AND GRAIN'},body:{zh:'“雪”以甲骨文中向下坠落的笔势组织画面，把字形嵌入山谷、积雪和深色天空。白色字形既像符号，也像一组正在下降的雪片，在连续的网点纹理中保持清晰而直接的识别。',en:'Snow uses the descending strokes of its oracle form to organise mountain, valley and dark sky. The white glyph reads simultaneously as a sign and a cluster of falling flakes, remaining immediate against the continuous halftone terrain.'},layout:'image'},
 {image:'/playground/oracle-hanzi-posters/yue.webp',kicker:{zh:'04 / 月 · 甲骨文',en:'04 / MOON · ORACLE SCRIPT'},title:{zh:'月相、夜色与古文字\u200b在同一轨道中嵌合',en:'LUNAR PHASE, NIGHT AND ANCIENT GLYPH SHARE ONE ORBIT'},body:{zh:'“月”将甲骨文的弧形结构放大为主要视觉骨架，并与月面、夜空和地景叠合。密集网点在远看时形成光影层次，近看则暴露印刷颗粒，使“月”的古老象形与现代复制技术产生张力。',en:'Moon enlarges the curved oracle form into the poster’s structural spine, overlaying lunar surface, night sky and landscape. Dense halftones form light at a distance and reveal printed grain up close, placing the pictographic past in tension with modern reproduction.'},layout:'image'}
];

const chaoYunPages:PlaygroundPage[]=[
 {images:['/playground/chao-yun-2025-ktk/poster-01.webp','/playground/chao-yun-2025-ktk/poster-02.webp','/playground/chao-yun-2025-ktk/poster-03.webp'],kicker:{zh:'01 / 2025 KTK 设计展',en:'01 / 2025 KTK DESIGN EXHIBITION'},title:{zh:'“潮”被拆解为\u200b点、线、块与\u200b迁移的颗粒',en:'TIDE DECONSTRUCTED INTO DOTS, BARS AND SHIFTING GRAIN'},body:{zh:'作品围绕“潮”展开，将汉字笔画拆解为矩形、圆点、留白与网点渐变。三张海报保持同一套黑白语法，却分别从节奏、结构和涌动状态切入，形成一组可连续阅读的字体实验。项目参加靳埭强 KTK 设计展。',en:'Developed around the theme of “tide”, the series breaks the Chinese character into bars, dots, negative space and halftone gradients. Three posters share one black-and-white language while approaching rhythm, structure and movement from different angles. The project was created for the Kan Tai-keung KTK Design Exhibition.'},layout:'gallery'},
 {image:'/playground/chao-yun-2025-ktk/poster-02.webp',kicker:{zh:'02 / 结构拆解',en:'02 / STRUCTURAL DECONSTRUCTION'},title:{zh:'把“潮”的笔画\u200b转译成可移动、\u200b错位的模块',en:'THE STROKES OF TIDE BECOME MOVABLE, MISALIGNED MODULES'},body:{zh:'横、竖笔画被压缩为大小不同的矩形单元，带有透视的折面打断原本平整的字形。中央骨架仍保留“潮”的辨识线索，而边缘颗粒逐渐消隐，让结构像被潮水冲刷后重新显现。',en:'Horizontal and vertical strokes are compressed into rectangular units at different scales, while folded planes interrupt the flat character. Its central skeleton remains legible as grain dissolves the edges, as if the form were erased and revealed again by water.'},layout:'image'},
 {image:'/playground/chao-yun-2025-ktk/poster-01.webp',kicker:{zh:'03 / 节奏与潮汐',en:'03 / RHYTHM AND TIDE'},title:{zh:'长条与圆点\u200b建立涨落之间的节拍',en:'BARS AND DOTS SCORE THE RHYTHM BETWEEN RISE AND FALL'},body:{zh:'错落的长条与圆点从字形中被抽离，依靠位置、密度和渐变方向构成新的阅读节奏。重复而不完全对称的排列模拟潮汐推进与回撤，使静止画面保留连续运动的暗示。',en:'Staggered bars and dots are extracted from the character and reorganised through position, density and gradient direction. Repetition without perfect symmetry suggests the advance and retreat of a tide, carrying continuous motion into a still image.'},layout:'image'},
 {image:'/playground/chao-yun-2025-ktk/poster-03.webp',kicker:{zh:'04 / 扩散与回流',en:'04 / DISPERSION AND RETURN'},title:{zh:'圆形空腔让字形\u200b在聚合与消散之间往复',en:'CIRCULAR VOIDS MOVE THE FORM BETWEEN GATHERING AND DISPERSAL'},body:{zh:'圆、半圆和十字形模块构成更具流体感的一张。网点从黑到白向内扩散，实体与空腔不断交换角色，让“潮”的结构在聚合、穿透与回流之间保持张力。',en:'Circles, semicircles and cross-shaped modules create the most fluid composition in the series. Halftones spread inward from black to white as solids and voids exchange roles, keeping the character in tension between gathering, penetration and return.'},layout:'image'}
];

const maranathaPages:PlaygroundPage[]=[
 {images:['/playground/maranatha-2026/illustration.webp'],kicker:{zh:'01 / 原创插画',en:'01 / ORIGINAL ILLUSTRATION'},title:{zh:'玛拉拿他：\u200b2026',en:'MARANATHA: 2026'},body:{zh:'以荆棘般的流动形态、黑黄红高对比配色，建立直接而有张力的视觉语言。',en:'Flowing thorn-like forms and a high-contrast black, yellow and red palette create a direct, tense visual language.'},layout:'gallery'},
 {image:'/playground/maranatha-2026/stickers.webp',kicker:{zh:'02 / 贴纸套装',en:'02 / STICKER SET'},title:{zh:'图形被拆分为\u200b可组合的模切贴纸',en:'THE ILLUSTRATION BECOMES A MODULAR DIE-CUT STICKER SET'},body:{zh:'保留原画轮廓与配色，以哑光表面和独立图形适配日常使用。',en:'Original contours and colours are retained across matte, individually cut pieces.'},layout:'image'},
 {image:'/playground/maranatha-2026/magnets.webp',kicker:{zh:'03 / 冰箱贴',en:'03 / FRIDGE MAGNETS'},title:{zh:'柔软磁与立体色块\u200b强化触感',en:'SOFT MAGNETS AND RAISED COLOUR BUILD A TACTILE OBJECT'},body:{zh:'不同图形以软胶厚度和克制高光形成一组可陈列的磁贴。',en:'Soft depth and restrained highlights turn the motifs into a displayable magnet family.'},layout:'image'},
 {image:'/playground/maranatha-2026/car-scent.webp',kicker:{zh:'04 / 车载香片',en:'04 / CAR SCENT CARDS'},title:{zh:'纤维香片\u200b把图形带入移动场景',en:'FIBRE SCENT CARDS TAKE THE GRAPHIC INTO MOTION'},body:{zh:'吸香纸板、黑色挂绳与深色金属孔眼构成轻量而完整的车载产品。',en:'Absorbent board, black cord and dark eyelets form a light, complete automotive product.'},layout:'image'}
];

const possessionPages:PlaygroundPage[]=[
 {image:'/playground/possession/cover.webp',kicker:{zh:'01 / 2024 获奖原创短片',en:'01 / 2024 AWARD-WINNING ORIGINAL FILM'},title:{zh:'乩身：\u200b一起赛博污染\u200b与数码寄生事件',en:'THE POSSESSION: A CYBER POLLUTION AND DIGITAL PARASITE INCIDENT'},body:{zh:'《乩身》是一部全流程采用 AI 工作流制作的原创视频短片。作品把扶乩、太空帝国和机械改造置于同一条叙事线上，讨论技术高速进入日常生活后，人如何逐渐接受媒介与设备对身体、思想和生态的植入。作品于 2024 年获奖。',en:'The Possession is an original short film produced through an end-to-end AI workflow. It connects spirit writing, a space empire and mechanical body modification to examine how people gradually accept technology entering the body, thought and ecology. The film received an award in 2024.'},layout:'image'},
 {image:'/playground/possession/concept.webp',kicker:{zh:'02 / 世界观与命题',en:'02 / WORLD AND PREMISE'},title:{zh:'科技崇拜\u200b成为一种会扩散的“乩”',en:'TECHNOLOGY WORSHIP SPREADS AS A FORM OF POSSESSION'},body:{zh:'故事从资源枯竭后的太空迁徙开始。帝国建立后，一种与机械、科技和肉体改造相连的“乩”在民间与朝廷扩散。权力更替之后，改造成为新的秩序，最终感染人类、植物与动物。短片借这套寓言追问技术投入应用的速度与后果。',en:'After resource collapse drives an empire into space, a form of possession tied to machinery and body modification spreads through the court and its people. Following a struggle for power, augmentation becomes the new order and reaches humans, plants and animals. The story questions the speed and consequences of technological adoption.'},layout:'image'},
 {images:['/playground/possession/scene-01.webp','/playground/possession/scene-02.webp','/playground/possession/scene-03.webp'],kicker:{zh:'03 / 影像语言',en:'03 / VISUAL LANGUAGE'},title:{zh:'中式仪式、宋代审美\u200b与宇宙尺度并置',en:'CHINESE RITUAL, SONG AESTHETICS AND COSMIC SCALE'},body:{zh:'影像将戏台、寺庙、礼仪秩序与机械身体并置，再以行星和太空建筑扩展尺度。红、金、黑构成主要色调，强对称构图维持仪式感，机械细节则不断破坏传统场景的完整性。',en:'The imagery places theatre, temples and ritual order beside mechanical bodies, then expands the setting through planets and architecture in space. Red, gold and black dominate. Symmetry establishes ceremony while mechanical details disturb the traditional scenes.'},layout:'gallery'},
 {image:'/playground/possession/workflow-01.webp',kicker:{zh:'04 / 脚本与连续性图像',en:'04 / SCRIPT AND CONTINUITY IMAGES'},title:{zh:'从叙事大纲到\u200b可连续生成的镜头素材',en:'FROM STORY OUTLINE TO CONTINUOUS SHOT MATERIAL'},body:{zh:'工作流先用 ChatGPT 整理想法、润色脚本并生成镜头提示词，再在 Midjourney 中通过风格参考、局部变化和放大建立连续图像。筛选并锁定角色、环境与色彩后，静态画面才能进入运动阶段。',en:'The workflow begins with ChatGPT for story development, script refinement and shot prompts. Midjourney style references, subtle variations and upscaling then establish continuity. Character, environment and colour are selected and stabilised before motion work begins.'},layout:'image'},
 {image:'/playground/possession/workflow-02.webp',kicker:{zh:'05 / 图像放大与图转视频',en:'05 / UPSCALING AND IMAGE-TO-VIDEO'},title:{zh:'清晰度修复之后\u200b再建立镜头运动',en:'IMAGE REPAIR PRECEDES CAMERA MOTION'},body:{zh:'定稿图像先经 Topaz Gigapixel AI 补缺、放大并提升清晰度。随后使用 Runway、Pika 与即梦完成图转视频，并继续通过提示词控制机位、排除错误内容、测试适合的场景种子。',en:'Final stills pass through Topaz Gigapixel AI for repair, enlargement and clarity. Runway, Pika and Jimeng then generate motion. Camera descriptions, negative prompts and scene seeds are adjusted until the shots remain usable and visually consistent.'},layout:'image'},
 {image:'/playground/possession/workflow-03.webp',kicker:{zh:'06 / 补帧与后期整合',en:'06 / INTERPOLATION AND POST-PRODUCTION'},title:{zh:'AI 生成素材\u200b最终进入传统后期流程',en:'AI-GENERATED MATERIAL ENTERS A CONVENTIONAL POST WORKFLOW'},body:{zh:'生成片段使用 Topaz Video AI 进行补帧和画质调整，最后在 After Effects 与 Premiere Pro 中统一节奏、字幕、声音和特效。AI 负责提供与扩展素材，最终的镜头组织和叙事判断仍在后期剪辑中完成。',en:'Topaz Video AI handles frame interpolation and image adjustments. After Effects and Premiere Pro bring the clips together through editing, subtitles, sound and effects. AI supplies and extends the material, while shot structure and narrative decisions are completed in post-production.'},layout:'image'}
];

const horseIncensePages:PlaygroundPage[]=[
 {image:'/playground/horse-incense-plaque/hero.webp',kicker:{zh:'01 / 灵山集团 · 马年文创',en:'01 / LINGSHAN · YEAR OF THE HORSE'},title:{zh:'把马年祝愿\u200b收进一枚随身携带的\u200b木质香牌',en:'A YEAR-OF-THE-HORSE BLESSING SHAPED AS A PORTABLE WOODEN INCENSE PLAQUE'},body:{zh:'项目为灵山集团设计马年香牌文创。造型以双马首、拱券轮廓与中心浮雕建立正面识别，并通过分层结构、顶部穿孔和圆润外缘兼顾悬挂、握持与陈列。',en:'Designed for Lingshan Group, the incense plaque combines paired horse heads, an arched silhouette and a central relief. Layered construction, a hanging hole and softened edges support carrying, display and tactile use.'},layout:'image'},
 {images:['/playground/horse-incense-plaque/original-01.webp','/playground/horse-incense-plaque/original-02.webp','/playground/horse-incense-plaque/original-03.webp'],kicker:{zh:'02 / 原始造型与结构',en:'02 / ORIGINAL FORM AND CONSTRUCTION'},title:{zh:'从正反两面与侧向厚度\u200b校准产品结构',en:'FRONT, REVERSE AND SIDE VIEWS DEFINE THE OBJECT'},body:{zh:'原始三维方案用于确认香牌的双面图形、浮雕层级、侧边厚度与悬挂节点。保留模型比例和雕刻语言的同时，后续重点转向真实材料表现与使用情境。',en:'The original 3D studies establish the two-sided graphics, relief depth, edge thickness and hanging point. Their proportions and engraving language remain intact while later development focuses on material realism and use context.'},layout:'gallery'},
 {image:'/playground/horse-incense-plaque/detail.webp',kicker:{zh:'03 / 木质与雕刻精修',en:'03 / WOOD AND ENGRAVING REFINEMENT'},title:{zh:'用木纹方向、端面和\u200b烧灼深浅建立真实触感',en:'GRAIN DIRECTION, END GRAIN AND LASER BURN BUILD A CREDIBLE SURFACE'},body:{zh:'材质调整为暖色实木：木纹沿不同构件自然延伸，切割端面与轻微加工痕迹保留手作尺度，激光雕刻则以更深的焦色区分线条和浮雕。表面仅保留克制的天然蜡光，避免塑料般的统一高光。',en:'The surface is rebuilt as warm natural wood. Grain follows each component, cut edges and subtle machining marks preserve a crafted scale, and darker laser-burned recesses separate engraving from relief. A restrained wax finish avoids a plastic sheen.'},layout:'image'},
 {image:'/playground/horse-incense-plaque/scene.webp',kicker:{zh:'04 / 香事场景',en:'04 / INCENSE RITUAL CONTEXT'},title:{zh:'让香牌回到\u200b安静、可触摸的东方日常',en:'RETURNING THE PLAQUE TO A QUIET, TACTILE RITUAL'},body:{zh:'场景以深木、浅石、亚麻和晨间侧光构成，香牌通过红色挂绳与小型木架进入陈列状态。轻微香雾提示其使用属性，但不让道具和氛围遮盖产品本身。',en:'Dark timber, pale stone, linen and morning sidelight form the setting. A red cord and compact wood stand place the plaque in use, while a trace of incense haze suggests function without overwhelming the object.'},layout:'image'}
];

const pigeonPages:PlaygroundPage[]=[
 {image:'/portfolio/page-28.jpg',kicker:{zh:'01 / 项目概念',en:'01 / CONCEPT'},title:{zh:'把校园记忆\u200b变成气味对象',en:'CAMPUS MEMORY AS A SCENT OBJECT'},body:{zh:'“鸽门”将南京艺术学院的校园意象转译为一件可携带、可使用的固体香薰。它介于纪念物、日用品与视觉符号之间。',en:'Pigeonbro Gate translates a Nanjing University of the Arts campus motif into a portable solid fragrance—part keepsake, part daily object, part visual sign.'},layout:'image'},
 {image:'/portfolio/page-29.jpg',kicker:{zh:'02 / 产品与包装',en:'02 / OBJECT & PACKAGE'},title:{zh:'造型、开合与展示\u200b保持同一语言',en:'ONE LANGUAGE FOR FORM, OPENING AND DISPLAY'},body:{zh:'产品轮廓、容器开合和包装陈列共同构成体验，使它在实际使用与展示状态中都保持完整。',en:'Silhouette, opening mechanism and packaging work as one experience, keeping the object coherent in both use and display.'},layout:'image'},
 {kicker:{zh:'03 / 设计信息',en:'03 / DESIGN NOTES'},title:{zh:'鸽门 / 固体香薰文创设计',en:'PIGEONBRO GATE / SOLID FRAGRANCE'},body:{zh:'类别：文创产品、造型、包装。设计重点：校园符号转译、便携尺度、触觉开合与系列化陈列。项目暂归入实验场，用来展示对象设计中的轻量叙事与形式探索。',en:'Fields: cultural product, form and packaging. Focus: translating a campus symbol, portable scale, tactile opening and serial display. The project sits in Playground as a compact study in object-based storytelling.'},layout:'notes'}
];

const maxxxinePages:PlaygroundPage[]=[
 {image:'/playground/maxxxine/hero.webp',kicker:{zh:'01 / 视觉母题',en:'01 / VISUAL MOTIF'},title:{zh:'把银幕中的野心\u200b转化为一件可以拥有的物品',en:'TURNING CINEMATIC AMBITION INTO AN OBJECT TO OWN'},body:{zh:'项目以《玛克辛》的明星欲望与八十年代好莱坞想象为起点，将失真肖像、红色星章和夸张的 X 形结构组合成周边文创产品的核心识别。',en:'Starting from Maxxxine’s star-making ambition and an imagined 1980s Hollywood, the project combines a distorted portrait, red star badge and oversized X structure into a collectible visual identity.'},layout:'image'},
 {video:'/playground/maxxxine/motion-web.mp4',kicker:{zh:'02 / 动态展示',en:'02 / MOTION'},title:{zh:'让陈列框成为一块\u200b持续播放的电影界面',en:'A DISPLAY FRAME THAT BEHAVES LIKE A MOVIE SCREEN'},body:{zh:'动态影像强化透明板材、铆钉结构和层叠图像之间的景深，让产品不只是静态纪念品，也保留电影预告与片头般的观看节奏。',en:'Motion emphasizes the depth between clear panels, exposed fasteners and layered graphics, preserving the rhythm of a trailer or title sequence inside the object.'},layout:'video'},
 {images:['/playground/maxxxine/render-01.webp','/playground/maxxxine/render-02.webp','/playground/maxxxine/render-03.webp'],kicker:{zh:'03 / 三维构建',en:'03 / 3D DEVELOPMENT'},title:{zh:'透明、反射与硬质边框\u200b共同建立舞台感',en:'TRANSPARENCY, REFLECTION AND A HARD FRAME CREATE THE STAGE'},body:{zh:'三维渲染用于校准板材厚度、螺丝节点、画面层级与观看角度。红、黑、白构成主体，蓝橙车牌作为高对比信息层插入其中。',en:'3D studies calibrate panel depth, fasteners, graphic layers and viewing angles. Red, black and white form the body while the blue-and-orange plate acts as a high-contrast information layer.'},layout:'gallery'},
 {image:'/playground/maxxxine/product-flatlay-white.png',kicker:{zh:'04 / 周边系统',en:'04 / MERCHANDISE SYSTEM'},title:{zh:'从主装置延伸到\u200b车牌、肖像卡与星形徽章',en:'FROM THE HERO OBJECT TO PLATE, PORTRAIT CARD AND STAR PIN'},body:{zh:'同一套图形语言被拆分为不同尺度的周边：可独立使用，也能与主装置组合陈列。材质从纸张、金属延伸至透明亚克力，形成清晰的收藏层级。',en:'One graphic language is distributed across multiple scales. Each piece works independently or as part of the hero display, moving from paper and metal to clear acrylic as a collectible system.'},layout:'image'},
 {images:['/playground/maxxxine/product-03.webp','/playground/maxxxine/product-04.webp','/playground/maxxxine/product-05-upright.webp'],kicker:{zh:'05 / 成品落地',en:'05 / FINAL OBJECT'},title:{zh:'巨大的 X\u200b同时承担包装、背景与识别符号',en:'THE OVERSIZED X IS PACKAGE, BACKDROP AND IDENTITY'},body:{zh:'成品将黑红 X 形底板、失真人物图像和加州车牌式标题叠合在一起。可见的连接件保留了舞台道具的机械感，也让更换与重新组合成为产品体验的一部分。',en:'The final object layers a black-and-red X, distorted portrait and California-plate title. Visible fittings retain a prop-like mechanical quality and make replacement and rearrangement part of the experience.'},layout:'final'},
 {images:['/playground/maxxxine/detail-01.webp','/playground/maxxxine/detail-02.webp'],kicker:{zh:'06 / 识别细节',en:'06 / IDENTITY DETAILS'},title:{zh:'一枚星章和一块车牌\u200b完成角色身份',en:'A STAR BADGE AND A LICENSE PLATE COMPLETE THE CHARACTER'},body:{zh:'红色星章浓缩了“成为明星”的叙事，蓝橙车牌则把片名转化为带有地点、年代和身份暗示的物件。两者共同构成整套文创中最易识别和携带的部分。',en:'The red badge condenses the desire to become a star, while the blue-and-orange plate turns the title into an object suggesting place, period and identity—the most portable signatures of the collection.'},layout:'details'}
];

const sevenPages:PlaygroundPage[]=[
 {image:'/playground/777/render-hero.png',kicker:{zh:'01 / 项目定位',en:'01 / PROJECT POSITIONING'},title:{zh:'把幸运符号\u200b转化为可随身携带的\u200b筹码钥匙扣',en:'A LUCKY SYMBOL BECOMES A POCKET-SIZED CHIP KEYCHAIN'},body:{zh:'项目以赌场筹码的双面结构为基础，将 777、眼睛与三角形组合成一件具有护符感的随身物。重新建模后，筹码不再只是平面图案载体，而是由橡胶包边、石墨灰分区、金属侧脊与双层钥匙环共同构成的完整产品。',en:'Built on the two-sided logic of a casino chip, the object combines 777, an eye and a triangle into a portable talisman. The rebuilt model turns a flat graphic into a complete product with rubber edging, graphite inserts, metal ribs and a split key ring.'},layout:'image'},
 {video:'/playground/777/777-turntable.mp4',kicker:{zh:'02 / 产品展示',en:'02 / PRODUCT DISPLAY'},title:{zh:'产品展示',en:'PRODUCT DISPLAY'},body:{zh:'',en:''},layout:'video'},
 {images:['/playground/777/render-front.png','/playground/777/render-edge.png','/playground/777/render-back.png'],kicker:{zh:'03 / 造型与材质',en:'03 / FORM & MATERIAL'},title:{zh:'正反双面识别与侧边结构\u200b共同完成产品性格',en:'TWO-SIDED IDENTITY AND A STRUCTURED EDGE DEFINE THE OBJECT'},body:{zh:'正面以大面积红色与 777 建立直接识别；背面用眼睛与三角形形成警示感。外圈采用黑色软胶、石墨灰嵌件和金属环形脊，橙色连接孔把平面视觉延伸到真实装配节点。',en:'A red 777 creates the immediate front identity, while the eye and triangle give the reverse a warning-sign quality. Black rubber, graphite inserts and metal ribs build the edge, with an orange eyelet extending the graphic system into the assembly.'},layout:'gallery'},
 {images:['/playground/777/chip-front.png','/playground/777/chip-back.png','/playground/777/reference-sample.png'],kicker:{zh:'04 / 图形系统',en:'04 / GRAPHIC SYSTEM'},title:{zh:'两套圆形图案\u200b围绕下注、直觉与保持清醒展开',en:'TWO CIRCULAR FACES BUILT AROUND RISK, INSTINCT AND CONTROL'},body:{zh:'“BLUFF TIII DEATH!”与“KEEP YOUR MIND”形成一组相互拉扯的文案：一面鼓励冒险，一面提醒保持判断。黑、红、橙和灰被限制在高对比范围内，使小尺度物件仍能保持清晰辨识。',en:'“BLUFF TIII DEATH!” and “KEEP YOUR MIND” pull in opposite directions: one invites risk, the other insists on control. Black, red, orange and grey stay within a high-contrast system that remains legible at keychain scale.'},layout:'final'}
];

const works:PlaygroundItem[]=[
 {title:'MAXXXINE',zh:'玛克辛',meta:'MERCH / OBJECT / 3D',image:'/playground/maxxxine/render-01.webp',pages:maxxxinePages},
 {title:'777',zh:'777',meta:'OBJECT / KEYCHAIN / 3D',image:'/playground/777/render-hero.png',pages:sevenPages},
 {title:'MARANATHA: 2026',zh:'玛拉拿他：2026',meta:'ILLUSTRATION / PRODUCT / OBJECT',year:'2026',image:'/playground/maranatha-2026/stickers.webp',pages:maranathaPages},
 {title:'THE POSSESSION',zh:'乩身',meta:'AI FILM / AIGC WORKFLOW / AWARD',year:'2024',image:'/playground/possession/scene-01.webp',pages:possessionPages},
 {title:'MOON · WINE · SNOW',zh:'月 · 酒 · 雪',meta:'POSTER / ORACLE SCRIPT / EXHIBITION',year:'APR.',image:'/playground/oracle-hanzi-posters/jiu.webp',pages:oraclePosterPages},
 {title:'CHAO RHYTHM: 2025 KTK',zh:'潮韵：2025KTK',meta:'POSTER / TYPOGRAPHY / KTK',year:'2025',image:'/playground/chao-yun-2025-ktk/poster-02.webp',pages:chaoYunPages},
 {title:'INCENSE PLAQUE',zh:'香牌',meta:'OBJECT / MATERIAL / CULTURE',year:'2026',image:'/playground/horse-incense-plaque/hero.webp',pages:horseIncensePages},
 {title:'PIGEONBRO GATE',zh:'鸽门',meta:'OBJECT / CULTURE',image:'/portfolio/page-28.jpg',pages:pigeonPages}
];

export default function PlaygroundWall({locale}:{locale:Locale}){
 const [selected,setSelected]=useState<number|null>(null);
 const [page,setPage]=useState(0);
 const [pageDirection,setPageDirection]=useState<'forward'|'backward'>('forward');
 const [zoomed,setZoomed]=useState<string|null>(null);
 const [low,setLow]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const wheelLocked=useRef(false);
 const item=selected===null?null:works[selected];
 const pages=item?.pages;
 const currentPage=pages?.[page];

 useEffect(()=>{selected===null?dialog.current?.close():dialog.current?.showModal()},[selected]);
 useEffect(()=>{
  if(selected===null)return;
  const previousHtml=document.documentElement.style.overflow;
  const previousBody=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
  return()=>{document.documentElement.style.overflow=previousHtml;document.body.style.overflow=previousBody};
 },[selected]);
 useEffect(()=>{setPage(0)},[selected]);
 useEffect(()=>{setZoomed(null)},[selected,page]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(!pages?.length)return;
   if(event.key==='ArrowLeft'){setPageDirection('backward');setPage(value=>(value-1+pages.length)%pages.length)}
   if(event.key==='ArrowRight'){setPageDirection('forward');setPage(value=>(value+1)%pages.length)}
  };
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 },[pages]);

 const open=(index:number)=>{setPage(0);setSelected(index)};
 const close=()=>setSelected(null);
 const moveProject=(direction:number)=>setSelected(value=>value===null?0:(value+direction+works.length)%works.length);
 const movePage=(direction:number)=>{if(!pages)return;setPageDirection(direction>0?'forward':'backward');setPage(value=>(value+direction+pages.length)%pages.length)};
 const wheelPage=(event:WheelEvent)=>{
  if(!pages||Math.abs(event.deltaY)<18||wheelLocked.current)return;
  event.preventDefault();wheelLocked.current=true;movePage(event.deltaY>0?1:-1);
  window.setTimeout(()=>{wheelLocked.current=false},650);
 };

 return <>
  <div className={`playgroundWall ${low?'low':''}`}>
   <div className="playControls"><span>{locale==='zh'?'选择一项实验':'SELECT AN EXPERIMENT'}</span><button aria-pressed={low} onClick={()=>setLow(value=>!value)}>{locale==='zh'?'动态':'MOTION'} {low?'OFF':'ON'}</button></div>
   {works.map((work,index)=><button key={work.title} onClick={()=>open(index)} className={`art art${index+1} ${work.image?'hasImage':''}`}>
    {work.image&&<Image src={work.image} alt={locale==='zh'?`${work.zh}实验项目`:`${work.title} experiment`} fill sizes="(max-width: 767px) 100vw, 32vw"/>}
    <span>EXP. {String(index+1).padStart(3,'0')}</span><b>{locale==='zh'?work.zh:work.title}</b><em>{work.meta}</em>
   </button>)}
  </div>

  <dialog ref={dialog} className={`lightbox ${pages?'projectLightbox':''}`} onClose={close} onClick={event=>{if(event.target===event.currentTarget)close()}}>
   {item&&pages&&currentPage&&<article key={page} className={`playCasePage ${currentPage.layout} page-${pageDirection} ${item.title==='777'?'project-777':''} ${item.title==='MOON · WINE · SNOW'?'project-oracle-posters':''} ${item.title==='CHAO RHYTHM: 2025 KTK'?'project-chao-yun':''} ${item.title==='MARANATHA: 2026'?'project-maranatha':''} ${item.title==='THE POSSESSION'?'project-possession':''} ${item.title==='INCENSE PLAQUE'?'project-horse-incense':''}`} onWheel={wheelPage}>
    {currentPage.image&&<div className="playCaseMedia"><button type="button" className="playCaseImageButton" onClick={()=>setZoomed(currentPage.image!)} aria-label={locale==='zh'?'点击放大图片':'Enlarge image'}><Image src={currentPage.image} alt={currentPage.title[locale]} fill sizes="(max-width: 767px) 100vw, 62vw" priority/></button></div>}
    {currentPage.video&&<div className="playCaseMedia playCaseVideo"><video src={currentPage.video} autoPlay muted loop playsInline controls preload="metadata"/></div>}
    {currentPage.images&&<div className={`playCaseMedia playCaseGallery count-${currentPage.images.length}`}>{currentPage.images.map((src,index)=><figure key={src}><button type="button" className="playCaseImageButton" onClick={()=>setZoomed(src)} aria-label={locale==='zh'?`点击放大第${index+1}张图片`:`Enlarge image ${index+1}`}><Image src={src} alt={`${currentPage.title[locale]} ${index+1}`} fill sizes="(max-width: 767px) 100vw, 42vw"/></button></figure>)}</div>}
    <div className="playCaseCopy"><span>{currentPage.kicker[locale]}</span><h2>{currentPage.title[locale]}</h2>{currentPage.body[locale]&&<p>{currentPage.body[locale]}</p>}<div className="playCaseMeta"><b>{String(page+1).padStart(2,'0')} / {String(pages.length).padStart(2,'0')}</b><span>{item.meta} / {item.year??'2025'}</span></div></div>
    <nav className="playCaseNav pageDots" aria-label={locale==='zh'?'项目页码':'Project pages'}><div>{pages.map((_,index)=><span key={index} aria-label={`${locale==='zh'?'第':'Page '}${index+1}${locale==='zh'?'页':''}`} aria-current={page===index?'page':undefined}/>)}</div></nav>
   </article>}
   {zoomed&&<button type="button" className="playImageZoom" onClick={()=>setZoomed(null)} aria-label={locale==='zh'?'点击还原图片':'Restore image'}><Image src={zoomed} alt={locale==='zh'?'放大的项目图片':'Enlarged project image'} fill sizes="94vw" priority/></button>}
   {item&&!pages&&<div className="lightboxArt"><span>EXPERIMENT {String((selected??0)+1).padStart(3,'0')}</span><h2>{locale==='zh'?item.zh:item.title}</h2><p>{locale==='zh'?'个人视觉实验 / 媒介研究':'PERSONAL VISUAL EXPERIMENT / MEDIA STUDY'}</p><div><button onClick={()=>moveProject(-1)}>← PREV</button><button onClick={()=>moveProject(1)}>NEXT →</button></div></div>}
  </dialog>
 </>;
}
