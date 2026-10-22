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
      ['工作坊报名已达到 184 人，距离 240 人目标还差 56 人。', 'highlight', '距离 240 人目标还差 56 人'],
      ['主目标：10 月 16 日前获得 240 个有效报名，至少 150 人实际到场。', 'underline', '10 月 16 日前获得 240 个有效报名，至少 150 人实际到场'],
      ['有效报名：填写完整联系方式并确认参会意向；重复邮箱只计一次。', 'underline', '填写完整联系方式并确认参会意向；重复邮箱只计一次'],
      ['渠道访问合计按渠道去重，不代表跨渠道的唯一访客总数。', 'underline'],
      ['确认移动端修复已上线。', 'underline'],
      ['若付费渠道连续两天单次报名成本超过 160 元，暂停该组素材并复核归因。', 'underline'],
      ['是否批准将付费预算从 8,640 元降至 4,800 元？', 'highlight', '付费预算从 8,640 元降至 4,800 元'],
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
      ['对方断网后仍能阅读正文、图片与代码。', 'underline'],
      ['单个 HTML 输出，内嵌样式、脚本和必要图片。', 'underline'],
      ['同名文件冲突确认与临时文件原子替换。', 'underline'],
      ['自动修改原文、翻译正文或事实补全。', 'highlight'],
      ['以下接口用于评审，不是当前可用 API。', 'highlight'],
      ['标题、段落、表格、代码与链接没有静默遗漏。', 'underline'],
      ['未确认覆盖时，原有输出文件保持不变。', 'underline'],
      ['最大文档长度与单张图片大小需要用真实样本测量后确定。', 'underline'],
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
      ['保留现有窗户和承重结构，不把安静阅读与活动声场混在一起。', 'underline'],
      ['周末举办不超过 12 人的读书交流。', 'highlight', '不超过 12 人'],
      ['通道连续，无障碍路径不被临时家具占用。', 'underline'],
      ['减少 6 个固定阅读位，换取日常安静阅读与周末交流可同时进行。', 'underline'],
      ['交流区位于入口侧，避免活动人流穿过安静区。', 'underline'],
      ['借书由工作人员确认，归还放入归还区，不直接混回书架。', 'underline'],
      ['导视：深蓝文字搭配清晰箭头，不仅依赖颜色区分区域。', 'underline', '深蓝文字搭配清晰箭头，不仅依赖颜色区分区域'],
      ['照明：阅读面照度和色温交由专项设计确认，不以装饰灯代替任务照明。', 'underline', '阅读面照度和色温交由专项设计确认，不以装饰灯代替任务照明'],
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
  pages.push({ name, html, annotations: targets.length });
}
for (const { name, html, annotations } of pages) {
  const target = new URL(`output/${name}.html`, root);
  const temporary = new URL(`output/${name}.html.tmp`, root);
  await writeFile(temporary, html);
  await rename(temporary, target);
  console.log(`Updated ${target.pathname}: ${annotations} annotations, embedded Skill resources.`);
}
