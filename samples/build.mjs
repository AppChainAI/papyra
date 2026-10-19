import { readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Refresh the three designed sample pages; this is not a Markdown renderer or CLI.
const root = new URL('./', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const library = await read('../skills/papyra/assets/rough-notation-0.5.1.iife.js');
assert.equal(createHash('sha256').update(library).digest('hex'),
  'f90aa0090e361ff48694b74e0319e109856decb3e757c280dfe25e3607f35fac');
const runtime = await read('../skills/papyra/assets/annotations.js');
const css = await read('../skills/papyra/assets/annotations.css');
const license = await read('../skills/papyra/licenses/rough-notation-MIT.txt');
assert(!/<\/script/i.test(library + runtime));
assert(!/<\/style/i.test(css));
assert(!license.includes('-->'));
const cases = [
  {
    name: 'market-operations',
    colors: ['#a03022', '#ead69a', '#241e14'],
    targets: [
      ['下一周优先修复移动端报名流程，再调整投放预算，不以访问量替代有效报名。', 'underline'],
      ['到场率尚未产生，不得把确认参会人数当成实际到场人数。', 'underline'],
      ['下周预算上限 12,000 元。', 'circle', '12,000 元'],
      ['预算估算仅用于讨论，不构成效果承诺。历史单次报名成本不能直接当作未来成本；增加预算可能改变受众质量。', 'highlight', '预算估算仅用于讨论，不构成效果承诺。'],
      ['若报名表出现数据丢失，立即停止投放，修复后才恢复。', 'underline']
    ]
  },
  {
    name: 'requirements-development',
    colors: ['#93d8ff', '#365577', '#e9f1fb'],
    targets: [
      ['本期交付单文档导出：保留内容、明确进度、失败可重试，且不覆盖已有有效文件。本文是需求规格，不表示功能已实现。', 'underline', '保留内容、明确进度、失败可重试，且不覆盖已有有效文件。'],
      ['本文是需求规格，不表示功能已实现。', 'highlight'],
      ['成功提交之前收到取消，不得交付；提交之后取消返回“任务已完成”。', 'underline'],
      ['拒绝路径穿越及通过符号链接逃逸工作区；不能仅检查字符串前缀。', 'underline'],
      ['T01–T06 全部通过后才能发布。', 'circle', 'T01–T06']
    ]
  },
  {
    name: 'design-proposal',
    colors: ['#1b4c7d', '#dce7ef', '#1c2d3d'],
    targets: [
      ['不替代消防、结构及无障碍专项审核。', 'underline'],
      ['吸声帘不能保证完全隔音，活动时仍需限制音量。', 'highlight'],
      ['金额为初步估算，未包含新增结构工程；实际采购以审核后的清单和报价为准。预算上限为 90,000 元，剩余空间 3,800 元。', 'circle', '90,000 元'],
      ['金额为初步估算，未包含新增结构工程；实际采购以审核后的清单和报价为准。预算上限为 ', 'underline', '实际采购以审核后的清单和报价为准。'],
      ['若现场审核发现不能形成连续通道，需重新调整布局，不以压缩通道换取更多座位。', 'underline']
    ]
  }
];
const pages = [];
for (const { name, colors, targets } of cases) {
  let html = await read(`output/${name}.html`);
  // Remove only our own previously generated resources and plain-text focus wrappers.
  html = html.replace(/<!-- papyra-annotations:start -->[\s\S]*?<!-- papyra-annotations:end -->\n?/g, '');
  html = html.replace(/<span data-notation="(?:underline|highlight|circle)">([^<>]*)<\/span>/g, '$1');
  assert(!html.includes('data-notation='), `${name}: unexpected nested focus markup`);
  const markdown = await read(`${name}.md`);
  for (const [context, type, phrase = context] of targets) {
    assert(markdown.includes(phrase), `${name}: focus not in original Markdown`);
    assert.equal(html.split(context).length, 2, `${name}: ambiguous focus context: ${context}`);
    html = html.replace(context, context.replace(phrase, `<span data-notation="${type}">${phrase}</span>`));
  }
  html = html.replaceAll('<span class="sec-mark">', '<span class="sec-mark" data-enhancement>')
    .replaceAll('<caption>', '<caption data-enhancement>')
    .replaceAll('<span class="rec-badge">', '<span class="rec-badge" data-enhancement>')
    .replaceAll('<p class="fig-note">', '<p class="fig-note" data-enhancement>');
  const theme = `:root { --notation-color:${colors[0]}; --notation-highlight:${colors[1]}; --notation-highlight-ink:${colors[2]}; }`;
  const block = text => `<!-- papyra-annotations:start -->${text}<!-- papyra-annotations:end -->\n`;
  html = html.replace('</head>', block(`<style data-enhancement="notation">\n${css}\n${theme}\n</style>`) + '</head>');
  html = html.replace('</body>', block(`<!-- Rough Notation 0.5.1; MIT license\n${license}-->\n<script data-enhancement="notation">${library}</script>\n<script data-enhancement="notation">${runtime}</script>\n`) + '</body>');
  pages.push({ name, html });
}
for (const { name, html } of pages) {
  const target = new URL(`output/${name}.html`, root);
  const temporary = new URL(`output/${name}.html.tmp`, root);
  await writeFile(temporary, html);
  await rename(temporary, target);
  console.log(`Updated ${target.pathname}: 5 annotations, embedded Skill resources.`);
}
