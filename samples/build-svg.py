"""Rebuild the SVG sample, using the installed Skill's static SVG helper."""
from pathlib import Path
import html
import importlib.util

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('papyra_svg', ROOT.parent / 'skills/papyra/scripts/prepare_svg.py')
svg_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(svg_module)
source = (ROOT / 'svg.md').read_text(encoding='utf-8')
original = (ROOT / 'assets/triangle.svg').read_text(encoding='utf-8')
prepared = svg_module.prepare_svg(original, 'original')
# Same geometry, reflected vertically. Text stays horizontal and names the sides.
generated = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" role="img" aria-labelledby="title desc">
<title id="title">上下翻转后的三、四、五直角三角形</title><desc id="desc">直角位于左上角，水平直角边为四，竖直直角边为三，斜边为五。</desc>
<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor"/></marker></defs>
<path d="M60 45H360L60 270Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M60 65H80V45" fill="none" stroke="currentColor" stroke-width="2"/>
<g fill="currentColor" font-family="serif" font-size="22"><text x="200" y="30">4</text><text x="28" y="165">3</text><text x="230" y="190">5</text></g>
<path d="M120 300H300" stroke="currentColor" stroke-width="1.5" marker-end="url(#arrow)"/></svg>'''
generated = svg_module.prepare_svg(generated, 'generated')
css = '''*{box-sizing:border-box}body{margin:0;background:#f5f8fb;color:#19354a;font:18px/1.75 Georgia,"Songti SC",serif}main{max-width:820px;margin:auto;padding:32px 24px}h1{font-size:clamp(26px,5vw,38px);line-height:1.3}h2{font-size:25px;margin-top:40px}figure{margin:24px 0}svg{display:block;width:100%;max-width:420px;height:auto;margin:auto}figcaption{font-size:16px;margin-top:16px}a{color:#1b587c}a:focus-visible,summary:focus-visible{outline:3px solid #bd5c00;outline-offset:4px}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 monospace}details{border-top:1px solid #b2c5d2;padding-top:16px} @media(prefers-color-scheme:dark){body{background:#152631;color:#e1edf4}a{color:#9ad7f7}} @media print{body{background:white;color:black}details>pre{display:block!important}figure{break-inside:avoid}summary{display:none}main{padding:0}}'''
page = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>几何图形：原图与生成示意</title><style>{css}</style></head><body><main>
<h1>几何图形：原图与生成示意</h1>
<p>本例使用三、四、五直角三角形说明图形中的量与关系。两条直角边为 3 和 4，斜边为 5；图形采用相同尺度。</p>
<h2>原始图形</h2><figure>{prepared}<figcaption>原始图形由本仓库提供，不是现场测量记录。来源：samples/assets/triangle.svg。</figcaption></figure>
<h2>生成示意</h2><p>把同一三角形上下翻转，使竖直的直角边朝下，长度和直角关系保持不变。此图是根据上述条件生成的示意，不是新增测量证据。</p>
<figure data-enhancement="diagram">{generated}<figcaption>生成示意：长度与直角关系保持不变。</figcaption></figure>
<h2>阅读说明</h2><p>图中的 3、4、5 表示边长，未指定物理单位。横向箭头只是阅读方向，不表示外力、速度或另一条边。两个图采用独立的内部标识，箭头与标题各自关联。</p>
<details><summary>查看完整 Markdown 原文</summary><pre id="source-markdown">{html.escape(source)}</pre></details>
</main></body></html>'''
target = ROOT / 'output/svg.html'
temporary = target.with_suffix('.html.tmp')
temporary.write_text(page, encoding='utf-8')
temporary.replace(target)
print(f'Updated {target}')
