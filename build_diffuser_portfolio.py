from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

W, H = 2560, 1440
BG = (244, 240, 232)
INK = (43, 36, 31)
MUTED = (119, 105, 93)
LINE = (206, 193, 177)
AMBER = (178, 115, 57)
BLUSH = (193, 126, 116)
CREAM = (235, 219, 193)

ROOT = Path(r"C:\Users\pc\Desktop\网站搭建")
OUT = ROOT / "outputs" / "字遇扩香器_作品集流程"
OUT.mkdir(parents=True, exist_ok=True)

FONT_R = r"C:\Windows\Fonts\msyh.ttc"
FONT_L = r"C:\Windows\Fonts\msyhl.ttc"
FONT_B = r"C:\Windows\Fonts\msyhbd.ttc"

ASSET = {
    "concept": Path(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-abfe18ed-0259-44d1-a62e-f0d13290b919.png"),
    "technical": Path(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-92a8973b-ef92-46eb-bc93-96e94e5da093.png"),
    "pink": Path(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-d999c1ed-576b-4df2-9d9e-c354ce63130d.png"),
    "amber": Path(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-108a2dde-636c-4634-905e-2ca7bfe51c0c.png"),
    "group": Path(r"C:\Users\pc\.codex\generated_images\01a0e614-de83-7b02-a99c-0c12c0033d1f\exec-adb69b21-4e9b-4378-aee8-5a3f6f935ff6.png"),
    "detail": Path(r"F:\设计文件\南博风铃设计文件\扩香器渲染\xiangxun4..png"),
}

def f(size, bold=False, light=False):
    return ImageFont.truetype(FONT_B if bold else FONT_L if light else FONT_R, size)

def open_rgb(path):
    return Image.open(path).convert("RGB")

def cover(im, size, align=(0.5, 0.5)):
    tw, th = size
    s = max(tw / im.width, th / im.height)
    nw, nh = round(im.width*s), round(im.height*s)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = max(0, round((nw-tw)*align[0])); y = max(0, round((nh-th)*align[1]))
    return im.crop((x, y, x+tw, y+th))

def contain(im, size, bg=(255,255,255)):
    tw, th = size
    s = min(tw / im.width, th / im.height)
    nw, nh = round(im.width*s), round(im.height*s)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, bg)
    canvas.paste(im, ((tw-nw)//2, (th-nh)//2))
    return canvas

def rounded_paste(page, im, box, radius=18, shadow=True):
    x, y, w, h = box
    if shadow:
        sh = Image.new("RGBA", page.size, (0,0,0,0)); sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((x+8,y+12,x+w+8,y+h+12), radius, fill=(50,35,22,36))
        sh = sh.filter(ImageFilter.GaussianBlur(14)); page.alpha_composite(sh)
    mask = Image.new("L", (w,h), 0); md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,w,h), radius, fill=255)
    page.paste(im.resize((w,h), Image.Resampling.LANCZOS).convert("RGBA"), (x,y), mask)

def text(draw, xy, s, size, fill=INK, bold=False, light=False, anchor=None):
    draw.text(xy, s, font=f(size,bold,light), fill=fill, anchor=anchor)

def rule(draw, x1,y1,x2,y2, fill=LINE, width=2):
    draw.line((x1,y1,x2,y2), fill=fill, width=width)

def page_no(draw, n):
    text(draw,(2400,86),f"0{n}",22,MUTED,light=True,anchor="ra")
    rule(draw,2292,100,2400,100,MUTED,1)

def add_label(draw, x, y, num, cn, en):
    draw.ellipse((x,y,x+42,y+42), outline=AMBER, width=2)
    text(draw,(x+21,y+21),num,16,AMBER,bold=True,anchor="mm")
    text(draw,(x+58,y-2),cn,26,INK,bold=True)
    text(draw,(x+58,y+32),en.upper(),12,MUTED,light=True)

def make_page1():
    p = Image.new("RGBA", (W,H), BG+(255,)); d = ImageDraw.Draw(p)
    # Header
    text(d,(120,76),"字遇 · 扩香器系列",38,INK,bold=True)
    text(d,(120,128),"从书写结构到嗅觉器物的形态转译",18,MUTED,light=True)
    text(d,(2400,76),"FORM DEVELOPMENT",14,MUTED,light=True,anchor="ra")
    page_no(d,1); rule(d,120,174,2440,174)

    # Left manifesto
    text(d,(120,230),"DESIGN ORIGIN",13,AMBER,bold=True)
    text(d,(120,270),"以“字”为骨，\n以“香”为气。",54,INK,bold=True)
    text(d,(120,410),"提取汉字中横、竖、弧、圆与叠置关系，\n将书写的节奏转化为扩香器的承托、容纳\n与释香结构，形成统一而可延展的系列语言。",21,MUTED,light=True)
    # Principle strip
    d.rounded_rectangle((120,560,620,690),20,fill=(233,224,210))
    text(d,(150,588),"形态语法",15,AMBER,bold=True)
    text(d,(150,626),"笔画骨架  ×  器皿容腔  ×  圆形香息",22,INK,bold=True)

    # Concept sketch
    concept = contain(open_rgb(ASSET["concept"]),(1700,650),(250,248,244))
    rounded_paste(p,concept,(700,220,1700,650),16,True)
    text(d,(730,842),"形态推演草图｜由基础笔画、圆形单元与器皿轮廓逐步收敛为两组产品原型",15,MUTED,light=True)

    # Timeline area
    y0 = 990; rule(d,120,y0,2400,y0,LINE,2)
    stages = [
        ("01","语义提取","提炼横、弧、圆、叠等\n可识别的书写结构"),
        ("02","几何归纳","将笔画转译为承重骨架，\n圆形转译为储香单元"),
        ("03","功能嵌合","把容石、滴香与对流路径\n嵌入整体形态"),
        ("04","系列统一","以透明色玻璃、深色支架\n和天然矿石建立家族语言"),
        ("05","比例收敛","调整重心、留白与透明层次，\n获得稳定的视觉节奏"),
    ]
    xs = [120,590,1060,1530,2000]
    for (num,cn,desc),x in zip(stages,xs):
        add_label(d,x,1040,num,cn,"development step")
        text(d,(x+58,1124),desc,18,MUTED,light=True)
        if x != xs[-1]:
            rule(d,x+355,1062,x+438,1062,AMBER,2)
            d.polygon([(x+438,1056),(x+450,1062),(x+438,1068)],fill=AMBER)
    # Footer quote
    text(d,(120,1370),"关键词  CHARACTER / VESSEL / BREATH / TRANSPARENCY",13,MUTED,light=True)
    text(d,(2400,1370),"字遇 · AROMA DIFFUSER DEVELOPMENT",13,MUTED,light=True,anchor="ra")
    p.convert("RGB").save(OUT/"01_概念来源与形态推演.png",quality=95)

def make_page2():
    p = Image.new("RGBA", (W,H), BG+(255,)); d = ImageDraw.Draw(p)
    text(d,(120,76),"结构深化与体验验证",38,INK,bold=True)
    text(d,(120,128),"从结构拆解、材料选择到扩香路径与场景落地",18,MUTED,light=True)
    text(d,(2400,76),"DETAIL & EXPERIENCE",14,MUTED,light=True,anchor="ra")
    page_no(d,2); rule(d,120,174,2440,174)

    # Technical drawing left
    technical = contain(open_rgb(ASSET["technical"]),(1410,780),(252,251,248))
    rounded_paste(p,technical,(120,220,1410,780),16,True)
    text(d,(150,966),"结构拆解｜模块化玻璃件、中心支架、储香容腔、矿石托盘与扩香锥依次装配",15,MUTED,light=True)

    # Hero on right
    hero = cover(open_rgb(ASSET["amber"]),(780,780),(0.5,0.46))
    rounded_paste(p,hero,(1620,220,780,780),16,True)
    d.rounded_rectangle((1660,856,2360,970),12,fill=(36,31,28,225))
    text(d,(1690,878),"透明、承托与呼吸",26,(250,245,236),bold=True)
    text(d,(1690,925),"让香气的扩散过程成为可观看的空间层次",15,(210,201,191),light=True)

    # Bottom information blocks
    y = 1060
    blocks = [
        (120,"01","结构策略","模块化拆装\n重心下置 / 稳定承托\n香石可替换与清洁"),
        (600,"02","扩香路径","精油滴入矿石\n多孔介质吸附\n借助空气对流缓慢释香"),
        (1080,"03","CMF 语言","手工着色玻璃\n深色木质 / 金属骨架\n天然多孔矿石"),
        (1560,"04","体验验证","控制高光与折射\n验证桌面尺度及安全距离\n适配玄关、书房与卧室"),
    ]
    for x,num,cn,desc in blocks:
        d.rounded_rectangle((x,y,x+410,y+246),18,fill=(238,232,222),outline=LINE,width=1)
        text(d,(x+28,y+26),num,16,AMBER,bold=True)
        text(d,(x+28,y+61),cn,24,INK,bold=True)
        rule(d,x+28,y+101,x+382,y+101,LINE,1)
        text(d,(x+28,y+126),desc,17,MUTED,light=True)

    # CMF swatches
    swx = 2035
    text(d,(swx,1064),"MATERIAL PALETTE",12,MUTED,light=True)
    colors = [(215,154,126),(185,125,62),(59,45,36),(154,148,138)]
    labels = ["BLUSH GLASS","AMBER GLASS","DARK FRAME","AROMA STONE"]
    for i,(c,lbl) in enumerate(zip(colors,labels)):
        yy=1105+i*50
        d.ellipse((swx,yy,swx+30,yy+30),fill=c,outline=(255,255,255),width=2)
        text(d,(swx+46,yy+5),lbl,12,MUTED,light=True)

    text(d,(120,1370),"设计闭环  CONCEPT → FORM → STRUCTURE → CMF → SCENE",13,MUTED,light=True)
    text(d,(2400,1370),"字遇 · AROMA DIFFUSER DEVELOPMENT",13,MUTED,light=True,anchor="ra")
    p.convert("RGB").save(OUT/"02_结构深化与体验验证.png",quality=95)

if __name__ == "__main__":
    for k,v in ASSET.items():
        if not v.exists(): raise FileNotFoundError(f"missing {k}: {v}")
    make_page1(); make_page2()
    print(OUT)
