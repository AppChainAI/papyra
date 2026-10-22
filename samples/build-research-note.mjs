import { readFile, writeFile, rename } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { renderMathEntries, loadMathAssets } from '../skills/papyra/scripts/render-math.mjs';

// A designed sample builder, not a general Markdown renderer or product CLI.
const root = new URL('./', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const source = await read('research-note.md');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const entries = [
  { id: 'side-a', source: '$a=3$' },
  { id: 'side-b', source: '$b=4$' },
  { id: 'hypotenuse', source: '$c=\\sqrt{a^2+b^2}=5$' },
  { id: 'pythagoras', source: '$$\na^2+b^2=c^2\n$$' }
];
for (const entry of entries) assert(source.includes(entry.source), `Formula absent from source: ${entry.id}`);
const math = renderMathEntries(entries);
assert.deepEqual(math.errors, []);
const byId = Object.fromEntries(math.items.map(item => [item.id, item]));
const assets = await loadMathAssets();
const citationCss = await read('../skills/papyra/assets/citations.css');
const rawSvg = await read('assets/triangle.svg');
const prepared = spawnSync('python3', ['-B', '-c', `import importlib.util,sys
spec=importlib.util.spec_from_file_location('papyra_svg',sys.argv[1])
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
sys.stdout.write(m.prepare_svg(sys.stdin.read(),'geometry'))`, fileURLToPath(new URL('../skills/papyra/scripts/prepare_svg.py', root))], { input: rawSvg, encoding: 'utf8' });
assert.equal(prepared.status, 0, prepared.stderr);
const references = {
  mathml: { url: 'https://www.w3.org/TR/2025/CR-mathml-core-20250624/', returns: ['cite-mathml-1', 'cite-mathml-2'] },
  svg: { url: 'https://www.w3.org/TR/SVG2/intro.html', returns: ['cite-svg-1', 'cite-svg-2'] },
  offline: { returns: ['cite-offline-1'] }
};
const ref = (key, occurrence, label) => `<sup class="citation-call"><a class="citation-ref" role="doc-noteref" id="cite-${key}-${occurrence}" href="#${key}" aria-label="查看来源 ${label}">[${label}]</a></sup>`;
const notes = Object.entries(references).map(([key, metadata]) => {
  const line = source.split('\n').find(line => line.startsWith(`[^${key}]: `));
  assert(line, `Missing source note: ${key}`);
  let text = escape(line.slice(key.length + 5));
  if (metadata.url) text = text.replace(escape(metadata.url), `<a class="citation-url" href="${metadata.url}">${escape(metadata.url)}</a>`);
  return `<li class="citation-note" id="${key}" role="doc-endnote" tabindex="-1"><p>${text}</p><nav class="citation-backlinks" aria-label="${key} 的返回位置">${metadata.returns.map((id, i) => `<a role="doc-backlink" href="#${id}" aria-label="返回 ${key} 第 ${i + 1} 处引用">返回引用 ${i + 1}</a>`).join(' · ')}</nav></li>`;
}).join('\n');
const css = `*{box-sizing:border-box}body{margin:0;background:#fff;color:#243441;font:18px/1.8 Georgia,"Songti SC",serif}main{max-width:880px;padding:36px 24px;margin:auto}h1{font-size:clamp(28px,5vw,42px);line-height:1.3}h2{font-size:25px;margin-top:42px}a{color:#075985;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #a84b00;outline-offset:4px}:target{outline:2px solid #a84b00;outline-offset:5px}svg{width:100%;max-width:420px;height:auto;display:block;margin:auto}figure{margin:24px 0}figcaption{font-size:16px}#sources{padding-left:24px}#sources li{margin-bottom:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}summary{cursor:pointer}details{margin:16px 0}#source-document{border-top:1px solid #b1bfca;padding-top:18px}@media(prefers-color-scheme:dark){body{background:#16252f;color:#e1edf4}a{color:#94d5fa}}@media print{body{background:white;color:black}main{padding:0}a{color:black}a[href^="http"]::after{content:" (" attr(href) ")";font-size:10pt;overflow-wrap:anywhere}details> :not(summary){display:block!important}summary{display:none}svg{max-height:240px}figure{break-inside:avoid}}`;
const citationTheme = `.papyra-citations{--citation-link:#075985;--citation-focus:#a84b00;--citation-target:#e8f1f7;--citation-rule:#7894a6;--math-source-color:inherit}@media(prefers-color-scheme:dark){.papyra-citations{--citation-link:#94d5fa;--citation-focus:#ffc47d;--citation-target:#243f51;--citation-rule:#7894a6}}@media print{.papyra-citations{--citation-link:black;--citation-focus:black;--citation-target:transparent}.citation-url::after{content:none!important}}`;
const page = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一份可追溯的几何阅读札记</title><style data-enhancement="math">${assets.css}</style><style data-enhancement="citations">${citationCss}</style><style>${css}\n${citationTheme}</style>${assets.licenseComment}</head><body><main class="papyra-citations">
<article data-enhancement="reading"><h1>一份可追溯的几何阅读札记</h1>
<p>本札记把数学公式、原生 SVG 和来源引脚放在同一份离线文档中。几何数字是教学示例，不是现场测量结果。</p>
<h2>从公式到图形</h2><p>设直角边为 ${byId['side-a'].html}、${byId['side-b'].html}，则斜边为 ${byId.hypotenuse.html}。这是本例的计算，不是对外部数据的引用。</p>
${entries.slice(0,3).map(entry => byId[entry.id].sourceHTML).join('\n')}
<section id="eq-1" aria-label="公式 1">${byId.pythagoras.html}${byId.pythagoras.sourceHTML}</section>
<p><a href="#eq-1">式（1）</a>给出本例的边长关系；原式可展开查看。渲染结果不替代原始 LaTeX。</p>
<figure>${prepared.stdout}<figcaption>图形来源：本仓库 samples/assets/triangle.svg。两条直角边为 3 和 4，斜边为 5；未指定物理单位。图中的箭头仅表示阅读方向。</figcaption></figure>
<h2>表达与依据</h2><p>MathML Core 定义了适合浏览器实现的数学标记核心子集。${ref('mathml',1,'1')}</p>
<p>SVG 可以描述二维图形，包括形状、图像和文字。${ref('svg',1,'2')}</p>
<p>数学结构与图形结构在这里互补，但文档离线可用仍需实际验证，不能仅因采用 MathML 与 SVG 就推断通过。${ref('mathml',2,'1')}${ref('svg',2,'2')}</p>
<p>证据说明保存在单文件内；打开原始网址需要网络。${ref('offline',1,'3')}</p>
<h2>来源与注释</h2><ol id="sources" class="citation-notes">${notes}</ol></article>
<section id="source-document"><h2>完整 Markdown 原文</h2><pre id="source-markdown">${escape(source)}</pre></section>
</main></body></html>`;
assert(!/<script\b|<link\b/i.test(page), 'Static sample must not require scripts or stylesheets');
const target = new URL('output/research-note.html', root);
const temporary = new URL('output/research-note.html.tmp', root);
await writeFile(temporary, page);
await rename(temporary, target);
console.log(`Updated ${target.pathname}: formulas, original SVG, five citation occurrences.`);
