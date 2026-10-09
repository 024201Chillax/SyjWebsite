from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 3508, 2480
BG = (248, 247, 243)
INK = (24, 23, 21)
MID = (102, 99, 92)
HAIR = (203, 199, 190)
AMBER = (190, 126, 48)
OLIVE = (113, 123, 69)
BLUSH = (183, 122, 126)

ROOT = Path(r"C:\Users\pc\Desktop\网站搭建")
ASSET = ROOT / "assets" / "ziyu_process"
OUT = ROOT / "outputs" / "字遇" / "作品集开发流程_五页_纯效果图版"
OUT.mkdir(parents=True, exist_ok=True)

FONT_SONG = r"C:\Windows\Fonts\simsun.ttc"
FONT_YAHEI = r"C:\Windows\Fonts\msyh.ttc"
FONT_YAHEI_L = r"C:\Windows\Fonts\msyhl.ttc"
FONT_TIMES_I = r"C:\Windows\Fonts\timesi.ttf"
FONT_ARIAL = r"C:\Windows\Fonts\arial.ttf"
FONT_ARIAL_B = r"C:\Windows\Fonts\arialbd.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def cover(img, box, focus=(0.5, 0.5)):
    x, y, w, h = box
    im = img.convert("RGB")
    s = max(w / im.width, h / im.height)
    nw, nh = int(im.width * s), int(im.height * s)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, min(nw - w, int((nw - w) * focus[0])))
    top = max(0, min(nh - h, int((nh - h) * focus[1])))
    return im.crop((left, top, left + w, top + h))


def contain(img, box, bg=BG):
    x, y, w, h = box
    im = img.convert("RGB")
    s = min(w / im.width, h / im.height)
    nw, nh = int(im.width * s), int(im.height * s)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), bg)
    canvas.paste(im, ((w - nw)//2, (h - nh)//2))
    return canvas


def paste_cover(page, img, box, focus=(0.5, 0.5)):
    page.paste(cover(img, box, focus), (box[0], box[1]))


def paste_contain(page, img, box, bg=BG):
    page.paste(contain(img, box, bg), (box[0], box[1]))


def line(draw, xy, fill=HAIR, width=2):
    draw.line(xy, fill=fill, width=width)


def text(draw, xy, s, fnt, fill=INK, anchor=None, spacing=8, align="left"):
    draw.multiline_text(xy, s, font=fnt, fill=fill, anchor=anchor, spacing=spacing, align=align)


def header(draw, number, title_cn, title_en):
    text(draw, (150, 104), number, font(FONT_ARIAL_B, 42), AMBER)
    text(draw, (235, 96), title_cn, font(FONT_SONG, 72), INK)
    text(draw, (238, 182), title_en, font(FONT_TIMES_I, 28), MID)
    line(draw, (150, 236, W-150, 236), HAIR, 2)


def footer(draw, idx):
    line(draw, (150, H-118, W-150, H-118), HAIR, 2)
    text(draw, (150, H-90), "ZIYU · ENCOUNTER CHINESE CHARACTERS / WIND CHIME SERIES", font(FONT_ARIAL, 20), MID)
    text(draw, (W-150, H-90), f"PROCESS 0{idx}", font(FONT_ARIAL, 20), MID, anchor="ra")


def footer_joint(draw, idx):
    line(draw, (150, H-118, W-150, H-118), HAIR, 2)
    text(draw, (150, H-90), "ZIYU · ENCOUNTER CHINESE CHARACTERS / WIND CHIME & AROMA DIFFUSER", font(FONT_ARIAL, 20), MID)
    text(draw, (W-150, H-90), f"PROCESS 0{idx}", font(FONT_ARIAL, 20), MID, anchor="ra")


def crop(img, rect):
    return img.crop(rect)


portfolio32 = Image.open(ASSET / "portfolio-32.png").convert("RGB")
portfolio33 = Image.open(ASSET / "portfolio-33.png").convert("RGB")

material = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-addcadbf-0669-4410-bdd8-a63b2d23d615.png")
exploded = Image.open(ROOT / "outputs" / "字遇" / "成套广告图" / "final_v4_soft_focus_ikea" / "03_产品结构_白底悬挂摄影.png")
gift = Image.open(ROOT / "outputs" / "字遇" / "成套广告图" / "final_v4_soft_focus_ikea" / "01_系列礼盒_北欧极简主视觉.png")
home = Image.open(ROOT / "outputs" / "字遇" / "成套广告图" / "final_v4_soft_focus_ikea" / "04_居家窗边悬挂_大吉.png")
outdoor = Image.open(ROOT / "outputs" / "字遇" / "成套广告图" / "final_v4_soft_focus_ikea" / "05_户外绿景悬挂_乐未央.png")
shop = Image.open(ROOT / "outputs" / "字遇" / "成套广告图" / "final_v4_soft_focus_ikea" / "06_店铺入口悬挂_活泼地.png")

# Diffuser continuation pages: the same character-source system, expressed through a static scent object.
diffuser_concept = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-abfe18ed-0259-44d1-a62e-f0d13290b919.png")
diffuser_technical = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-92a8973b-ef92-46eb-bc93-96e94e5da093.png")
diffuser_pink = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-d999c1ed-576b-4df2-9d9e-c354ce63130d.png")
diffuser_amber = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-108a2dde-636c-4634-905e-2ca7bfe51c0c.png")
diffuser_group = Image.open(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-adb69b21-4e9b-4378-aee8-5a3f6f935ff6.png")


def page1():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "01", "文化溯源｜由字知物", "Cultural Research · From Inscribed Relics to Auspicious Meanings")

    # Three artifact cards
    cards = [
        (150, 350, 980, 840, (120, 80, 1110, 1100), "安", "汉铜印 · 安", "安定 / 平安 / 守护"),
        (1264, 350, 980, 840, (1125, 80, 2160, 1100), "乐", "汉铜印 · 长乐", "喜乐 / 长久 / 共鸣"),
        (2378, 350, 980, 840, (2160, 80, 3200, 1100), "喜", "宋元铜印 · 喜寿", "欢庆 / 吉祥 / 相遇"),
    ]
    for i, (x, y, w, h, r, char, name, meaning) in enumerate(cards):
        d.rectangle((x, y, x+w, y+h), outline=HAIR, width=2, fill=(255,255,253))
        im = crop(portfolio32, r)
        paste_cover(page, im, (x+22, y+22, w-44, 548), (0.5, 0.5))
        text(d, (x+34, y+612), char, font(FONT_SONG, 92), [OLIVE, AMBER, BLUSH][i])
        text(d, (x+155, y+622), name, font(FONT_SONG, 33), INK)
        text(d, (x+155, y+681), meaning, font(FONT_YAHEI_L, 26), MID)
        text(d, (x+w-34, y+624), f"0{i+1}", font(FONT_ARIAL_B, 26), HAIR, anchor="ra")

    text(d, (150, 1320), "研究方法", font(FONT_SONG, 42), INK)
    text(d, (150, 1392), "RESEARCH METHOD", font(FONT_ARIAL, 22), MID)
    steps = [
        ("01", "建立数据库", "整理南京博物院有字文物的年代、材质、字义与载体特征"),
        ("02", "语义筛选", "从文物文字中提取与祝福、情绪和日常生活相关的吉祥语义"),
        ("03", "结构分析", "拆分印面中的中轴、回环、对称与重复关系，形成视觉基因"),
        ("04", "系列命名", "以“大吉、乐未央、活泼地”构成由祝愿到情绪的产品叙事"),
    ]
    sx = 900
    for i, (num, ttl, desc) in enumerate(steps):
        x = sx + i*610
        d.ellipse((x, 1332, x+62, 1394), outline=AMBER, width=3)
        text(d, (x+31, 1363), num, font(FONT_ARIAL_B, 19), AMBER, anchor="mm")
        text(d, (x, 1438), ttl, font(FONT_SONG, 33), INK)
        text(d, (x, 1500), desc, font(FONT_YAHEI_L, 23), MID, spacing=13)
        if i < 3:
            line(d, (x+75, 1363, x+575, 1363), HAIR, 2)

    d.rounded_rectangle((150, 1830, W-150, 2200), radius=24, fill=(239, 235, 225))
    text(d, (220, 1902), "核心洞察", font(FONT_SONG, 38), AMBER)
    text(d, (220, 1980), "文字不是附着在产品表面的装饰，而是决定轮廓、连接方式与情感寓意的结构原型。", font(FONT_SONG, 43), INK)
    text(d, (220, 2060), "The character becomes a structural archetype—shaping form, connection and emotional meaning.", font(FONT_TIMES_I, 28), MID)
    footer(d, 1)
    page.save(OUT / "01_文化溯源_由字知物.png", quality=95)


def page2():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "02", "造型转译｜由字成器", "Form Translation · From Graphic Character to Wind Chime Structure")

    # source schematic from portfolio page
    source = crop(portfolio33, (80, 0, 1710, 2300))
    paste_contain(page, source, (110, 320, 1420, 1780), (255,255,253))
    d.rectangle((110, 320, 1530, 2100), outline=HAIR, width=2)

    # central transformation route
    cx = 1760
    text(d, (cx, 375), "二维字形", font(FONT_SONG, 34), INK)
    text(d, (cx, 430), "2D GLYPH", font(FONT_ARIAL, 20), MID)
    line(d, (cx, 505, cx, 1810), HAIR, 3)
    stages = [
        (570, "笔画提纯", "保留识别度最高的中轴、回环和对称关系"),
        (900, "结构重组", "将文字骨架转化为悬挂支撑与受力框架"),
        (1230, "器型包覆", "以透明玻璃形成声腔、保护层与光影界面"),
        (1560, "动静连接", "铃体、木珠与短册形成可摆动的声音路径"),
    ]
    for i,(yy,ttl,desc) in enumerate(stages):
        d.ellipse((cx-16, yy-16, cx+16, yy+16), fill=[OLIVE,AMBER,BLUSH,AMBER][i])
        text(d, (cx+55, yy-28), ttl, font(FONT_SONG, 31), INK)
        text(d, (cx+55, yy+24), desc, font(FONT_YAHEI_L, 22), MID)

    # right product trio: use the clean source render rather than a screenshot of the old page
    trio = Image.open(r"F:\设计文件\南博风铃设计文件\风铃\2025.6.2\62-19ng.png")
    paste_cover(page, trio, (2250, 320, 1108, 1160), (0.5, 0.42))
    d.rectangle((2250, 320, 3358, 1480), outline=HAIR, width=2)
    text(d, (2250, 1545), "三种语义，三套结构", font(FONT_SONG, 40), INK)
    text(d, (2250, 1610), "THREE MEANINGS · THREE STRUCTURES", font(FONT_ARIAL, 20), MID)
    labels=[("大吉",OLIVE,"拱形包覆 / 稳定守护"),("乐未央",AMBER,"重复圆环 / 延续共鸣"),("活泼地",BLUSH,"上下叠置 / 轻快节奏")]
    for i,(ttl,c,desc) in enumerate(labels):
        yy=1715+i*145
        d.rectangle((2250,yy,2272,yy+82),fill=c)
        text(d,(2308,yy),ttl,font(FONT_SONG,31),INK)
        text(d,(2308,yy+50),desc,font(FONT_YAHEI_L,22),MID)

    footer(d, 2)
    page.save(OUT / "02_造型转译_由字成器.png", quality=95)


def page3():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "03", "设计落地｜由形入境", "Design Realization · Material, Structure, Scenario and Packaging")

    # upper band: materials + exploded structure
    paste_cover(page, material, (150, 330, 1810, 860), (0.5, 0.5))
    d.rectangle((150,330,1960,1190),outline=HAIR,width=2)
    text(d,(185,1080),"材料与色彩验证",font(FONT_SONG,34),INK)
    text(d,(185,1130),"手工玻璃 / 黄铜 / 深色结构件 / 棉绳 / 木珠 / 纸质短册",font(FONT_YAHEI_L,22),MID)

    # Crop away most of the long tag, then fit the complete assembly rather than filling and clipping it.
    ex_crop = exploded.crop((0, 0, exploded.width, int(exploded.height * 0.72)))
    paste_contain(page, ex_crop, (2040, 330, 1318, 860), (255,255,253))
    d.rectangle((2040,330,3358,1190),outline=HAIR,width=2)
    text(d,(2075,1080),"悬挂与装配验证",font(FONT_SONG,34),INK)
    text(d,(2075,1130),"挂绳—字形骨架—玻璃声腔—铃舌—木珠—短册",font(FONT_YAHEI_L,22),MID)

    # lower scene strip
    scene_y=1315
    gap=28
    sw=(W-300-gap*2)//3
    for i,(im,ttl,sub,fy) in enumerate([
        (home,"居家窗边","柔光与静态陈设",0.12),
        (outdoor,"户外庭院","自然风驱动与环境折射",0.18),
        (shop,"店铺入口","入户识别与品牌氛围",0.13),
    ]):
        x=150+i*(sw+gap)
        # Shift the crop upward so each wind-chime body, mounting point and key structure remain visible.
        paste_cover(page,im,(x,scene_y,sw,650),(0.5,fy))
        d.rectangle((x,scene_y,x+sw,scene_y+650),outline=HAIR,width=2)
        d.rectangle((x,scene_y+545,x+sw,scene_y+650),fill=(250,249,246))
        text(d,(x+25,scene_y+563),ttl,font(FONT_SONG,28),INK)
        text(d,(x+25,scene_y+610),sub,font(FONT_YAHEI_L,19),MID)

    text(d,(150,2055),"验证闭环",font(FONT_SONG,35),INK)
    text(d,(150,2120),"语义一致性 → 结构可装配性 → 材料真实感 → 声音与摆动 → 场景适配 → 礼盒传播",font(FONT_SONG,37),INK)
    text(d,(150,2180),"Meaning → Assembly → Material → Motion & Sound → Context → Packaging",font(FONT_TIMES_I,25),MID)
    footer(d, 3)
    page.save(OUT / "03_设计落地_由形入境.png", quality=95)


def page4():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "04", "同源分化｜由字生香", "Shared Origin · From Character Structure to Aroma Object")

    # Opening statement: explicitly connect the diffuser to the same source material.
    text(d, (150, 330), "同一组文字基因，\n两种感知媒介。", font(FONT_SONG, 66), INK, spacing=20)
    text(d, (150, 520), "风铃以风与声音激活文字，扩香器则以矿石、\n空气与气味完成更静态的表达；素材来源与造型\n逻辑保持一致，只改变功能路径与使用方式。", font(FONT_YAHEI_L, 27), MID, spacing=17)

    d.rounded_rectangle((150, 750, 890, 1010), radius=20, fill=(239,235,225))
    text(d, (200, 800), "共享设计基因", font(FONT_SONG, 34), AMBER)
    text(d, (200, 875), "文字语义  ×  笔画骨架  ×  透明玻璃  ×  深色支架", font(FONT_SONG, 31), INK)
    text(d, (200, 936), "SEMANTICS · STROKES · GLASS · FRAME", font(FONT_ARIAL, 20), MID)

    # Concept evolution sheet on the right.
    paste_contain(page, diffuser_concept, (1030, 330, 2328, 1000), (255,255,253))
    d.rectangle((1030,330,3358,1330),outline=HAIR,width=2)
    text(d, (1065, 1240), "形态延续｜将风铃中的中轴、重复圆环与上下叠置，转译为可承托香石的静态器型", font(FONT_SONG, 30), INK)
    text(d, (1065, 1290), "FORM CONTINUITY · FROM KINETIC CHIME TO STATIC AROMA VESSEL", font(FONT_ARIAL, 19), MID)

    # Shared-source branching diagram.
    text(d, (150, 1145), "表现形式分化", font(FONT_SONG, 38), INK)
    text(d, (150, 1210), "ONE SOURCE · TWO EXPRESSIONS", font(FONT_ARIAL, 20), MID)
    branch_y = 1460
    line(d, (260, branch_y, 3260, branch_y), HAIR, 3)
    line(d, (1755, 1375, 1755, 1545), HAIR, 3)
    d.ellipse((1719,1424,1791,1496), fill=AMBER)
    text(d,(1755,1460),"字",font(FONT_SONG,32),(255,255,255),anchor="mm")

    # Left: wind chime expression.
    paste_cover(page, outdoor, (150, 1570, 1515, 560), (0.5,0.14))
    d.rectangle((150,1570,1665,2130),outline=HAIR,width=2)
    d.rectangle((150,2015,1665,2130),fill=(250,249,246))
    text(d,(185,2032),"风铃｜动态声音媒介",font(FONT_SONG,31),INK)
    text(d,(185,2080),"风力驱动 · 摆动碰撞 · 声音反馈",font(FONT_YAHEI_L,21),MID)

    # Right: diffuser expression.
    paste_cover(page, diffuser_group, (1843, 1570, 1515, 560), (0.5,0.47))
    d.rectangle((1843,1570,3358,2130),outline=HAIR,width=2)
    d.rectangle((1843,2015,3358,2130),fill=(250,249,246))
    text(d,(1878,2032),"扩香器｜静态嗅觉媒介",font(FONT_SONG,31),INK)
    text(d,(1878,2080),"滴入精油 · 矿石吸附 · 空气对流释香",font(FONT_YAHEI_L,21),MID)

    text(d,(150,2195),"设计判断",font(FONT_SONG,32),AMBER)
    text(d,(350,2192),"保留共同的文化识别与系列轮廓，将铃舌、短册和悬挂关系替换为储香、承托与空气接触界面。",font(FONT_SONG,34),INK)
    footer_joint(d, 4)
    page.save(OUT / "04_同源分化_由字生香.png", quality=95)


def page5():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "05", "功能落地｜由形释香", "Aroma Realization · Structure, Material and Use Experience")

    # Technical development on the left.
    paste_contain(page, diffuser_technical, (150, 330, 2010, 1130), (255,255,253))
    d.rectangle((150,330,2160,1460),outline=HAIR,width=2)
    text(d,(185,1360),"结构与装配验证",font(FONT_SONG,34),INK)
    text(d,(185,1410),"玻璃装饰模块—字形支架—储香容腔—香石托盘—导香锥—玻璃底碟",font(FONT_YAHEI_L,22),MID)

    # Final amber product, clean and prominent.
    paste_cover(page, diffuser_amber, (2240, 330, 1118, 1130), (0.5,0.43))
    d.rectangle((2240,330,3358,1460),outline=HAIR,width=2)
    d.rectangle((2240,1315,3358,1460),fill=(250,249,246))
    text(d,(2275,1337),"乐未央 · 扩香器",font(FONT_SONG,34),INK)
    text(d,(2275,1392),"重复圆环延续“乐”的共鸣意象，矿石托盘形成稳定的释香界面",font(FONT_YAHEI_L,21),MID)

    # Bottom: pink product + material/function logic.
    paste_cover(page, diffuser_pink, (150, 1570, 1040, 590), (0.5,0.48))
    d.rectangle((150,1570,1190,2160),outline=HAIR,width=2)
    d.rectangle((150,2048,1190,2160),fill=(250,249,246))
    text(d,(185,2065),"活泼地 · 扩香器",font(FONT_SONG,30),INK)
    text(d,(185,2110),"上下叠置的轻快节奏转化为盛石、扩散与承托层级",font(FONT_YAHEI_L,20),MID)

    text(d,(1280,1580),"扩香路径",font(FONT_SONG,36),INK)
    text(d,(1280,1638),"AROMA PATH",font(FONT_ARIAL,19),MID)
    steps=[("01","滴香","精油滴入天然多孔矿石"),("02","吸附","矿石扩大液体接触面积"),("03","对流","开放容腔引导空气交换"),("04","释香","气味缓慢扩散至周围空间")]
    for i,(num,ttl,desc) in enumerate(steps):
        x=1280+i*500
        d.ellipse((x,1712,x+64,1776),outline=AMBER,width=3)
        text(d,(x+32,1744),num,font(FONT_ARIAL_B,19),AMBER,anchor="mm")
        text(d,(x,1822),ttl,font(FONT_SONG,31),INK)
        text(d,(x,1880),desc,font(FONT_YAHEI_L,21),MID)
        if i<3:
            line(d,(x+82,1744,x+460,1744),HAIR,2)

    text(d,(1280,1995),"CMF 延续",font(FONT_SONG,32),INK)
    swatches=[(OLIVE,"透明橄榄玻璃"),(AMBER,"透明琥珀玻璃"),(BLUSH,"透明烟粉玻璃"),((55,45,37),"深色结构件"),((145,139,129),"天然扩香石")]
    for i,(c,label) in enumerate(swatches):
        x=1280+i*390
        d.ellipse((x,2065,x+44,2109),fill=c)
        text(d,(x+62,2072),label,font(FONT_YAHEI_L,20),MID)

    text(d,(150,2218),"系列闭环",font(FONT_SONG,34),AMBER)
    text(d,(350,2214),"文化语义一致 → 结构语言一致 → 感知媒介分化 → 使用场景扩展",font(FONT_SONG,34),INK)
    footer_joint(d, 5)
    page.save(OUT / "05_功能落地_由形释香.png", quality=95)


# Final presentation revision: pages 04–05 use finished product imagery only.
# These definitions intentionally override the earlier development-board versions.
def page4():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "04", "同源延展｜扩香器系列", "Shared Origin · Aroma Diffuser Series")

    text(d, (150, 310), "与风铃共享同一组文字素材与结构语言，\n扩香器以静态器皿、矿石与空气对流呈现气味体验。", font(FONT_SONG, 38), INK, spacing=14)
    text(d, (W-150, 330), "SAME SOURCE · DIFFERENT EXPRESSION", font(FONT_ARIAL, 20), MID, anchor="ra")

    # Complete family image — fitted, never cropped.
    paste_contain(page, diffuser_group, (150, 490, 3208, 1190), (241,238,231))
    d.rectangle((150,490,3358,1680),outline=HAIR,width=2)
    d.rectangle((150,1550,3358,1680),fill=(250,249,246))
    text(d,(190,1572),"字遇 · 扩香器系列",font(FONT_SONG,36),INK)
    text(d,(190,1625),"透明玻璃、重复圆环与上下叠置共同延续风铃系列的视觉基因",font(FONT_YAHEI_L,22),MID)

    # Two finished-effect views, both fully contained.
    left = Image.open(r"F:\设计文件\南博风铃设计文件\扩香器渲染\xiangxun1.png")
    right = Image.open(r"F:\设计文件\南博风铃设计文件\扩香器渲染\xiangxun3.png")
    paste_contain(page,left,(150,1780,1540,420),(255,255,253))
    paste_contain(page,right,(1818,1780,1540,420),(255,255,253))
    d.rectangle((150,1780,1690,2200),outline=HAIR,width=2)
    d.rectangle((1818,1780,3358,2200),outline=HAIR,width=2)
    text(d,(150,2240),"系列正视图｜完整呈现三套扩香器的比例、色彩与组合关系",font(FONT_SONG,27),INK)
    text(d,(1818,2240),"系列俯视图｜展示香石容腔、玻璃层次与桌面陈设关系",font(FONT_SONG,27),INK)
    footer_joint(d, 4)
    page.save(OUT / "04_同源延展_扩香器系列.png", quality=95)


def page5():
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)
    header(d, "05", "产品呈现｜由形释香", "Final Presentation · Form, Material and Atmosphere")

    # Three final product photographs. Use contain throughout to preserve the whole product.
    cards = [
        (150, 330, 1010, 1390, diffuser_pink, "活泼地 · 扩香器", "上下叠置 / 烟粉玻璃 / 香石容腔"),
        (1249, 330, 1010, 1390, diffuser_amber, "乐未央 · 扩香器", "重复圆环 / 琥珀玻璃 / 矿石托盘"),
        (2348, 330, 1010, 1390, diffuser_group, "系列组合", "共享结构语言 / 两种感知表达"),
    ]
    for x,y,w,h,im,ttl,sub in cards:
        d.rectangle((x,y,x+w,y+h),fill=(255,255,253),outline=HAIR,width=2)
        fitted = contain(im,(0,0,w-40,h-185),(246,242,235))
        page.paste(fitted,(x+20,y+20))
        d.rectangle((x,y+h-145,x+w,y+h),fill=(250,249,246))
        text(d,(x+30,y+h-122),ttl,font(FONT_SONG,31),INK)
        text(d,(x+30,y+h-68),sub,font(FONT_YAHEI_L,21),MID)

    # One complete original effect image across the bottom for context.
    hero = Image.open(r"F:\设计文件\南博风铃设计文件\扩香器渲染\xiangxun5.png")
    paste_contain(page,hero,(150,1815,3208,350),(255,255,253))
    d.rectangle((150,1815,3358,2165),outline=HAIR,width=2)
    text(d,(150,2210),"产品陈设效果｜天然石材与着色玻璃共同强化东方、克制而温润的系列气质",font(FONT_SONG,29),INK)
    text(d,(W-150,2212),"COLORED GLASS · AROMA STONE · QUIET ORIENTAL MOOD",font(FONT_ARIAL,18),MID,anchor="ra")
    footer_joint(d, 5)
    page.save(OUT / "05_产品呈现_由形释香.png", quality=95)


if __name__ == "__main__":
    page1(); page2(); page3(); page4(); page5()
    for p in sorted(OUT.glob("*.png")):
        print(p)
