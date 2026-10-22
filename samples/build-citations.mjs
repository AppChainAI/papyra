import { readFile, writeFile, rename } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Explicit generation aid for citations.md only, not a general Markdown parser or CLI.
// No network requests, runtime JavaScript, packages, or third-party assets.
const root = new URL('./', import.meta.url);
const source = await readFile(new URL('citations.md', root), 'utf8');
const css = await readFile(new URL('../skills/papyra/assets/citations.css', root), 'utf8');
assert(!source.includes('\r'), 'This sample requires LF line endings.');
assert(!/<\/style/i.test(css), 'Unsafe embedded stylesheet closing tag.');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const divider = '## 证据笔记与书目\n';
assert.equal(source.split(divider).length, 2, 'Expected the sample evidence heading exactly once.');
const [body, definitions] = source.split(divider);
const notes = new Map();
let current;
for (const line of definitions.split('\n')) {
  if (!line.trim()) continue;
  const definition = line.match(/^\[\^([a-z][a-z0-9-]*)\]: (.+)$/);
  if (definition) {
    const [, id, text] = definition;
    assert(!notes.has(id), `Duplicate note: ${id}`);
    current = { id, number: notes.size + 1, lines: [text], references: [] };
    notes.set(id, current);
  } else {
    assert(current && /^ {4}\S/.test(line), `Unsupported sample note line: ${line}`);
    current.lines.push(line.slice(4));
  }
}
assert.deepEqual([...notes.keys()], ['mathml', 'svg', 'scope', 'agent-svg'],
  'This explicit builder expects the citation sample note IDs.');

function inline(text, allowReferences = true) {
  let html = '';
  let cursor = 0;
  for (const match of text.matchAll(/\[\^([a-z][a-z0-9-]*)\]|https?:\/\/[^\s<>]+/g)) {
    html += escape(text.slice(cursor, match.index));
    if (match[1]) {
      assert(allowReferences, 'Nested references in sample notes are unsupported.');
      const note = notes.get(match[1]);
      assert(note, `Undefined note: ${match[1]}`);
      const occurrence = note.references.length + 1;
      const id = `ref-${note.id}-${occurrence}`;
      note.references.push(id);
      html += `<sup class="citation-call"><a class="citation-ref" role="doc-noteref" id="${id}" href="#${note.id}" aria-label="引用 ${note.number}，第 ${occurrence} 次；查看证据笔记">[${note.number}]</a></sup>`;
    } else {
      const url = new URL(match[0]);
      assert(['https:', 'http:'].includes(url.protocol), 'Unsupported URL protocol.');
      // Keep the original URL spelling both as link destination and visible text.
      html += `<a class="citation-url" href="${escape(match[0])}">${escape(match[0])}</a>`;
    }
    cursor = match.index + match[0].length;
  }
  return html + escape(text.slice(cursor));
}

const blocks = body.trimEnd().split(/\n\n+/);
let reading = '';
let sectionOpen = false;
let sectionNumber = 0;
for (const block of blocks) {
  if (block.startsWith('# ')) {
    assert(!reading && !block.includes('\n'), 'Expected one opening sample title.');
    reading += `<h1 id="reading-title">${inline(block.slice(2))}</h1>\n`;
  } else if (block.startsWith('## ')) {
    assert(!block.includes('\n'), 'Multiline sample heading is unsupported.');
    if (sectionOpen) reading += '</section>\n';
    sectionNumber++;
    const supplemental = block.slice(3).startsWith('Agent 补充证据');
    reading += `<section aria-labelledby="claim-section-${sectionNumber}"${supplemental ? ' data-evidence-origin="agent-supplemental"' : ''}>\n<h2 id="claim-section-${sectionNumber}">${inline(block.slice(3))}</h2>\n`;
    sectionOpen = true;
  } else {
    assert(!block.includes('\n') && !/^(?:[-*>`]|\d+\.)/.test(block),
      `Unsupported sample block: ${block}`);
    reading += `<p>${inline(block)}</p>\n`;
  }
}
if (sectionOpen) reading += '</section>\n';

const evidence = [...notes.values()].map(note => {
  assert(note.references.length, `Unused sample note: ${note.id}`);
  const supplemental = note.id === 'agent-svg';
  const paragraphs = note.lines.map(line => `<p>${inline(line, false)}</p>`).join('\n');
  const backlinks = note.references.map((id, index) =>
    `<a role="doc-backlink" href="#${id}">返回引用 ${note.number}.${index + 1}</a>`).join('\n');
  return `<li class="citation-note" role="doc-endnote" id="${note.id}" tabindex="-1" data-note-id="${note.id}"${supplemental ? ' data-evidence-origin="agent-supplemental"' : ''}>\n${paragraphs}\n<nav class="citation-backlinks" aria-label="引用 ${note.number} 的返回位置">\n${backlinks}\n</nav>\n</li>`;
}).join('\n');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>离线文档的证据边界 — Papyra 引用样例</title>
<style data-enhancement="citations">
${css}
</style>
<style data-enhancement="citation-layout">
:root { color-scheme: light; background: #eeeaf9; color: #242036; font-family: "Songti SC", "Noto Serif CJK SC", Georgia, serif; }
* { box-sizing: border-box; }
body { margin: 0; font-size: 17px; line-height: 1.8; }
main { max-width: 57rem; margin: 0 auto; padding: 2rem clamp(1.25rem, 5vw, 4rem) 4rem; background: #fff; }
nav.reading-nav { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; margin-block-end: 1.5rem; font: .9rem/1.6 system-ui, sans-serif; }
h1 { font-size: clamp(1.8rem, 4vw, 2.65rem); line-height: 1.25; margin: .5rem 0 1.5rem; }
h2 { font-size: 1.3rem; line-height: 1.5; margin-block: 2.4rem 1rem; }
p { margin-block: 1rem; }
.citation-notes { font-size: .96rem; }
#evidence { margin-block-start: 3rem; padding-block-start: .25rem; border-block-start: 2px solid #b8a4d5; }
#raw-source { margin-block-start: 3rem; padding-block-start: .25rem; border-block-start: 2px solid #b8a4d5; }
.source-explanation { font: .94rem/1.7 system-ui, sans-serif; color: #524b64; }
#source-markdown { margin: 1.2rem 0 0; padding: 1rem; max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; font: .88rem/1.8 ui-monospace, "SFMono-Regular", Consolas, monospace; background: #f4f1fa; border: 1px solid #c8bddb; }
@media (max-width: 480px) { main { padding-inline: 1.15rem; } .citation-notes { padding-inline-start: 1.4rem; } }
@media print { :root, body, main { background: #fff; color: #000; } body { font-size: 11pt; } main { max-width: none; margin: 0; padding: 0; } h1, h2 { break-after: avoid; } .reading-nav { font-size: 10pt; } #source-markdown { white-space: pre-wrap; overflow: visible; max-height: none; background: none; font-size: 8pt; } .source-explanation { color: #000; } }
</style>
</head>
<body>
<main class="papyra-citations">
<nav class="reading-nav" aria-label="样例阅读导航" data-enhancement>
<a href="#evidence">证据笔记与书目</a><a href="#source-markdown">完整 Markdown 原文</a>
</nav>
<article id="reading-note" data-enhancement="citation-reading" aria-labelledby="reading-title">
${reading}
<section id="evidence" aria-labelledby="evidence-title">
<h2 id="evidence-title">证据笔记与书目</h2>
<ol class="citation-notes">
${evidence}
</ol>
</section>
</article>
<section id="raw-source" aria-labelledby="original-title">
<h2 id="original-title" data-enhancement>完整 Markdown 原文</h2>
<p class="source-explanation" data-enhancement>上方是独立标记的阅读增强；下方保留输入的全部字面文本、原注 ID、URL 与核验状态。原始文本不依赖脚本或折叠，打印时也完整呈现。外部链接需联网，内部引用与返回无需联网。</p>
<pre id="source-markdown">${escape(source)}</pre>
</section>
</main>
</body>
</html>
`;
const target = new URL('output/citations.html', root);
const temporary = new URL('output/citations.html.tmp', root);
await writeFile(temporary, html);
await rename(temporary, target);
console.log(`Updated ${target.pathname}: ${notes.size} notes; native citation anchors, original source and embedded CSS.`);
