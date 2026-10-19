# 原生 HTML/CSS 正文行内批注研究

## 结论与证据边界

截图所示的背景高亮、不同下划线、跨行圆角框和标签外观，可以用原生 HTML/CSS 实现，不需要依赖库。**这只是实现可行性判断，不证明原页如此实现**：截图不能验证 DOM、CSS、组件库、事件行为、键盘操作或辅助技术语义；本次没有原页源码或运行时证据。

## 文档核对

1. **背景与语义（直接证据，高置信）**：`<mark>` 表示与当前上下文相关、值得标记的文字，并不等于强调重要性的 `<strong>`。仅需视觉包装时可选 `<span>` 并设置背景；不要把所有颜色标记都解释成同一种语义。来源：[MDN mark](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/mark)。
2. **下划线（直接证据，高置信）**：`text-decoration-line: underline` 配合 `text-decoration-style: solid | dotted | wavy` 分别得到实线、点线、波浪线；可组合颜色、粗细和偏移。视觉线型本身不提供“待核实”“错误”等业务语义，应同时给出文字说明。来源：[MDN text-decoration-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-decoration-style)。
3. **跨行圆角框（直接证据，高置信）**：保持文本为普通行内元素，使用 `border`、`border-radius`、`padding`、背景以及 `box-decoration-break: clone`。`clone` 为每个折行片段独立绘制装饰；默认 `slice` 则是切分整体装饰。它不是把多行文字围成一个连续外轮廓，也不负责行高。MDN 示例同时给出 `-webkit-box-decoration-break`；目标浏览器仍需实测，不在这里承诺兼容版本。来源：[MDN box-decoration-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-decoration-break)。
4. **标签与按钮（直接证据＋实现建议，高置信）**：纯状态标签用文字 `<span>`；实际触发操作才用 `<button type="button">`，避免误提交表单。按钮保留可见文字及焦点样式，不能只把可点击的 `<span>` 涂成按钮。正文片段继续使用行内布局；标签按钮可用 `inline-block`，其自身不跨行拆分。来源：[MDN button](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)。
5. **可访问提示（直接证据，高置信）**：最小方案是常显说明，通过 `aria-describedby` 与按钮关联。若另做悬浮提示，需同时支持键盘焦点和鼠标，提示容器使用 `role="tooltip"`；提示不接收焦点，触发元素引用它。APG 描述 Escape 关闭，但该 tooltip 模式页面明确仍是未形成工作组共识的草案，不能当成已定稿规范。WCAG 1.4.13 要求适用的额外悬浮/焦点内容可关闭、可悬停、保持可见（有列明的例外）。仅 `:hover` 或 `title` 不应被当成完整交互方案。来源：[W3C APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)、[W3C WCAG 1.4.13 说明](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)。

## 最小静态示意

以下仅为 Markdown 代码块中的非执行示例：不挂载页面、不包含脚本、不实现按钮动作或悬浮提示。说明常显，避免把不完整的纯 CSS 提示当作可访问功能。

```html
<style>
  .text { max-width: 24em; line-height: 2; color: #222; }
  mark { color: inherit; background: #fff0ad; }
  .line { text-decoration-line: underline; }
  .solid { text-decoration-style: solid; }
  .dotted { text-decoration-style: dotted; }
  .wavy { text-decoration-style: wavy; }
  .boxed {
    background: #eef4ff;
    border: 1px solid #345ba8;
    border-radius: .3em;
    padding: .05em .2em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .tag {
    display: inline-block;
    font: inherit;
    color: #234779;
    background: #eef4ff;
    border: 1px solid currentColor;
    border-radius: .4em;
    padding: 0 .4em;
  }
  .tag:focus-visible { outline: 2px solid #234779; outline-offset: 2px; }
</style>
<p class="text">
  <mark>相关重点</mark>，
  <span class="line solid">实线标注</span>、
  <span class="line dotted">点线标注</span>、
  <span class="line wavy">波浪线标注</span>。
  <span class="boxed">这是一段保留自然折行的正文批注，宽度不足时每个行片段分别获得圆角边框与背景。</span>
  <button class="tag" type="button" aria-describedby="note-1">批注 1</button>
</p>
<p id="note-1">批注 1：此处需要核实来源。按钮仅展示外观，未连接操作。</p>
```

## 社区与开源方案补充（2026-10-19）

用户补充截图出自 Google Gemini / AI Studio。已搜索 Gemini Canvas、AI Studio 和文本标注社区线索，未找到可验证地对应这张截图的公开项目或源码。不能据此确定它使用了特定库。

[AI Studio 官方 Build 文档](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)说明生成的是可查看、导出的应用代码，并支持 npm 包。其提到的 annotation mode 是圈选应用 UI 并要求 AI 修改，不等于截图中的正文文学批注组件。生成环境不能反推生成页面用了什么库。

| 方案 | 官方资料确认的能力 | 适用判断与限制 |
| --- | --- | --- |
| [Rough Notation](https://github.com/rough-stuff/rough-notation) | 手绘下划线、圈、框、高亮、括号；以 SVG 绘制；`multiline: true` 按行标记，动画可关闭 | 最适合增加手写圈点感；不是批注数据管理器，截图里的规整波浪线和标签仍宜用 CSS。README 自述 gzip 3.83 KB，非本次测量。 |
| [Recogito Text Annotator](https://github.com/recogito/text-annotator-js) | 文本区间、quote/start/end 数据、重叠标注选择、事件、筛选、样式、撤销重做；原生 JS 与 React 接口；BSD-3-Clause | 若要做读者可选字、编辑、多重标注的阅读器，优先试用；不是加入后自动拥有完整评论产品，评论 UI 和存储仍需应用处理。 |
| [web-highlighter](https://github.com/alienzhou/web-highlighter) | 无依赖；选中文字高亮、序列化与恢复、点击悬浮事件；MIT | 适合简单划线与保存。恢复依赖 DOM 路径和文本偏移，文档或框架重绘变化可能导致失效；存储由调用方实现。 |
| [mark.js](https://markjs.io/) | 关键词、正则、范围高亮 | 适合搜索命中，不是完整的语义批注管理器。 |
| [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API) | 不修改 DOM 即可对 Range 集合高亮 | 适合动态或重叠区间；不是库。装饰属性和可访问语义有限，不能独立替代圆角圈框与标签，目标浏览器需验证。 |

**对 Papyra 的建议**：静态生成的单文件 HTML 继续用原生 span/mark + CSS；需要手绘效果时只增加 Rough Notation；明确需要选区编辑、重叠批注等产品交互时再考虑 Recogito。使用库时将所需资源及许可证随单文件内嵌，不依赖 CDN。

选库之外，生成准确性更重要：标注至少携带段落 ID、原文引用及分类；定位时核对原文，多次出现时消歧，找不到时报告失败，不随意标到第一个同名片段。标注库不会替 AI 判断文学解释是否成立。

此处只完成资料调研，没有安装、性能基准、维护活跃度审计或浏览器对比实测。

## 核验、矛盾与未覆盖项

- 只采用上列 MDN/W3C 原始文档，未采用搜索摘要作为最终证据，未发现上述 CSS 行为的相互矛盾描述。
- 已调用来源核验工具；工具返回“无法自动判定语义支持”，因此结论依据人工阅读原始文档中的值定义与示例，而非自动核验通过。
- 未验证原页实现、浏览器渲染、屏幕阅读器、颜色对比度、触屏交互、重叠批注或任意选区锚定。未新增依赖或功能。
- 若进入实现阶段，下一步仅需对目标浏览器的自然换行、缩放、焦点与辅助技术关联做小范围实测。
