import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { renderMathEntries, loadMathAssets, escapeHTML } from '../skills/papyra/scripts/render-math.mjs';

// A designed sample generator, not a general Markdown renderer or product CLI.
const root = new URL('./', import.meta.url);
const source = await readFile(new URL('math.md', root), 'utf8');
const entries = [
  { id: 'side-a', source: '$a=3$' },
  { id: 'side-b', source: String.raw`\(b=4\)` },
  { id: 'hypotenuse', source: String.raw`$c=\sqrt{a^2+b^2}=5$` },
  { id: 'forward-reference', source: String.raw`\eqref{pythagoras}` },
  { id: 'plain-reference', source: String.raw`\ref{pythagoras}` },
  { id: 'pythagoras', source: '$$\na^2+b^2=c^2\\label{pythagoras}\n$$' },
  { id: 'quadratic', source: '\\[\nx=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}\n\\]' },
  { id: 'sum', source: '$$\n\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}\n$$' },
  { id: 'integral', source: '$$\n\\int_0^1 x^2\\,dx=\\frac{1}{3}\n$$' },
  { id: 'matrix', source: '$$\nA=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix},\\quad \\det A=-2\n$$' },
  { id: 'aligned', source: '$$\n\\begin{aligned}\nf(x)&=(x+1)^2\\\\\n&=x^2+2x+1\n\\end{aligned}\\label{expanded}\n$$' },
  { id: 'aligned-reference', source: String.raw`\eqref{expanded}` },
  { id: 'malformed', source: String.raw`$$\frac{1}{$$` },
  { id: 'unknown-command', source: String.raw`$$\notARealMathCommand{z}$$` }
];
const { items, errors } = renderMathEntries(entries);
const expectedErrors = new Map([
  ['malformed', /./],
  ['unknown-command', /notARealMathCommand|Undefined control sequence|unknown/i]
]);
assert.equal(errors.length, expectedErrors.size, 'Unexpected count of real math errors; refusing output.');
for (const error of errors) {
  assert(expectedErrors.get(error.id)?.test(error.message), `Unexpected math failure: ${error.id}: ${error.message}`);
  console.warn(`Expected failure retained (${error.id}): ${error.message}`);
}
for (const [path, hash] of [
  ['../skills/papyra/assets/temml-0.14.0/temml.mjs', '09e55a0c364d35b8ef66be49486b90884240a7e66c463a825e096faf27b0d59d'],
  ['../skills/papyra/assets/temml-0.14.0/Temml-Local.css', '544f4e3fee4c36f4568e4f145fa626dc9573c5f4c96c523aadcc433c3989a239'],
  ['../skills/papyra/assets/temml-0.14.0/Temml.woff2', 'fc70501355ae6d38ff0b80f825af153557d5f2f474198d6b9b7dd2d3a291a0cc']
]) {
  assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), hash, `${path}: upstream checksum changed`);
}

// Locate only explicit, exact source selections. Currency and code never enter
// the renderer. A missing/ambiguous selection is a generation error, not a guess.
const selections = items.map(item => {
  const start = source.indexOf(item.source);
  assert(start >= 0 && source.indexOf(item.source, start + item.source.length) < 0, `${item.id}: source span is missing or ambiguous`);
  return { ...item, start, end: start + item.source.length };
}).sort((a, b) => a.start - b.start);
for (let i = 1; i < selections.length; i++) assert(selections[i - 1].end <= selections[i].start, 'Overlapping math selections.');

let offset = 0;
const fragments = [];
for (const paragraph of source.trimEnd().split('\n\n')) {
  const start = source.indexOf(paragraph, offset);
  const end = start + paragraph.length;
  offset = end;
  const selected = selections.filter(item => item.start >= start && item.end <= end);
  if (paragraph.startsWith('```tex\n')) {
    assert.equal(selected.length, 0, 'Code cannot be selected as math.');
    fragments.push(`<pre class="literal-code"><code>${escapeHTML(paragraph.slice(7, -4))}</code></pre>`);
    continue;
  }
  if (paragraph.startsWith('# ')) {
    fragments.push(`<h1>${escapeHTML(paragraph.slice(2))}</h1>`);
    continue;
  }
  if (paragraph.startsWith('## ')) {
    fragments.push(`<h2>${escapeHTML(paragraph.slice(3))}</h2>`);
    continue;
  }
  if (selected.length === 1 && selected[0].source === paragraph && selected[0].displayMode) {
    fragments.push(`<section class="equation">${selected[0].html}${selected[0].sourceHTML}</section>`);
    continue;
  }
  let position = start;
  let html = '';
  for (const item of selected) {
    html += escapeHTML(source.slice(position, item.start)) + item.html;
    position = item.end;
  }
  html += escapeHTML(source.slice(position, end));
  fragments.push(`<p>${html}</p>${selected.map(item => item.sourceHTML).join('')}`);
}
const { css, licenseComment } = await loadMathAssets();
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>离线数学 · Papyra</title>
<style>
* { box-sizing:border-box; }
body { margin:0; background:#f7f4eb; color:#212b31; font:17px/1.8 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
main { width:min(100% - 2.5rem,52rem); margin:3rem auto; padding:clamp(1rem,4vw,3rem); background:#fffefa; border-top:5px solid #355c56; box-shadow:0 8px 40px #22342a0a; }
h1 { font-family:ui-serif,Georgia,serif; font-size:clamp(1.9rem,5vw,3rem); line-height:1.25; letter-spacing:-.025em; margin-top:0; }
h2 { margin-top:2.5rem; font-size:1.3rem; border-top:1px solid #d8ddd5; padding-top:1.3rem; }
p { margin:1rem 0; }
a { color:#245a52; text-underline-offset:.2em; }
.literal-code { overflow:auto; padding:1rem; background:#eaf0e9; font-size:.86em; }
.original-document { margin-top:3rem; border-top:1px solid #b8c8bd; padding-top:1rem; }
.original-document pre { white-space:pre-wrap; overflow-wrap:anywhere; font-size:.82em; }
footer { margin-top:2rem; font-size:.85em; color:#4c5b54; }
@media print { body { background:white; } main { margin:0; width:100%; box-shadow:none; } }
</style>
<style data-enhancement="math">
${css}
</style>
</head>
<body>
<main>
${fragments.join('\n')}
<details class="original-document"><summary data-enhancement="math">完整 Markdown 原文（精确文本）</summary><pre id="source-markdown"><code>${escapeHTML(source)}</code></pre></details>
<footer data-enhancement="math">本页无脚本、无外部字体请求。原生 MathML 负责公式；展开区保留 TeX 与分隔符。错误样例按真实解析结果显示，并不表示渲染通过。</footer>
</main>
${licenseComment}
</body>
</html>
`;
assert(!/<script\b/i.test(html), 'Static sample must not contain executable scripts.');
await mkdir(new URL('output/', root), { recursive: true });
const temporary = new URL('output/math.html.tmp', root);
await writeFile(temporary, html);
await rename(temporary, new URL('output/math.html', root));
console.log(`Generated ${new URL('output/math.html', root).pathname}: ${items.length - errors.length} successful selections; ${errors.length} explicit expected failures; no browser JavaScript.`);
