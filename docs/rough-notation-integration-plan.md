# Rough Notation 自动重点标注：可行性与实现方案

## 结论

可行，适合 Papyra 的生成式阅读页。采用“生成时 Agent 选重点并标记 DOM，浏览器用固定脚本绘制”的方式，不新增运行时 AI 调用、不引入 React 或批注管理系统。标注是原文上的阅读增强，不能替代原文或改变事实重要程度。

本次只评估与设计；未修改 Skill、安装库或验证实际浏览器渲染。

## 依据与约束

- Papyra 当前是 Skill，并无已实现的 CLI。集成入口是 `skills/papyra/`，不是开发新的生成服务。
- 输出须单文件、离线、可搜索、可复制；剔除增强节点后原文保持一致。
- [Rough Notation README](https://github.com/rough-stuff/rough-notation)提供 `annotate()`、`show()`、`remove()`、多行和动画设置；库将 SVG 放在目标元素旁边。
- 已阅读 [rough-notation.ts](https://github.com/rough-stuff/rough-notation/blob/master/src/rough-notation.ts)：多行使用 `getClientRects()`；内部监听窗口 resize 和目标 ResizeObserver，以延迟检查重绘。仅位置变化不一定触发目标尺寸观察，不能据此保证所有动态布局都自动对齐。
- 已阅读 [render.ts](https://github.com/rough-stuff/rough-notation/blob/master/src/render.ts)：多行逐片段绘制；不是将任意多行圈成一个连续外轮廓。
- 上游 [package.json](https://github.com/rough-stuff/rough-notation/blob/master/package.json)标示版本 0.5.1。这是本次读取的 master 内容，不是对 npm 最新版或发布包一致性的证明。实施时锁定验证过的发布包、记录校验值，不跟随 master。
- [MIT 许可](https://github.com/rough-stuff/rough-notation/blob/master/LICENSE)允许分发，但须保留版权及许可文字。仓库和生成 HTML 都应携带。

## 1. 自动选择重点

由当前执行生成任务的 Agent 在理解原文后完成，无需额外模型或服务。候选优先级：

1. 决定读者行动的结论、建议与验收条件。
2. 风险、前置条件、例外、停止条件。
3. 决定方案差异的数字及其单位、口径。
4. 初次出现且影响理解的关键概念。

默认少而精：每节通常 0–2 处，短文可更少；不是配额，不为凑数新增重点。已有醒目标题、粗体、指标卡或图表不再重复圈点。优先短语或完整关键分句，不标整段；金额、单位、否定词和必要限定条件不可拆开。正文代码、链接和复杂表格第一版不加手绘覆盖。

生成前确定“原文片段 → 阅读作用 → 样式”，不另造摘要替换该片段。生成时直接包裹确切文本，不在运行时全文搜索关键词，避免重复词误匹配。验收时逐项确认对应原文及上下文。

## 2. 最小视觉语法

| 阅读作用 | Rough Notation 类型 | 约束 |
| --- | --- | --- |
| 核心结论或关键分句 | underline | 默认，支持自然跨行 |
| 关键数值或术语 | highlight | 使用与页面底色适配的浅色，不能遮字 |
| 极少数决定性数字或短词 | circle | 仅单行；窄屏换行后改用 underline |

颜色遵循页面概念，不固定红黄绿业务语义。第一版不启用删除线、叉号、整段框和动画序列，防止把原文误表现为作废或错误。`animate: false`、`multiline: true`（适用时）、`iterations: 1` 为建议起点；笔画与 padding 依据真实行高校准，而不是照搬默认 5px。

## 3. DOM 与固定绘制脚本

生成的正文示意：

```html
<p>当转化率<span class="reading-focus" data-notation="underline">连续两周低于 2%，暂停投放</span>，并复盘渠道质量。</p>
```

这不是新增句子。包裹节点不带 `data-enhancement`，否则剔除增强时会连原文一起删除。可见的额外解释或图例才放进独立 `data-enhancement` 节点。

绘制脚本负责：

1. 读取预定义标注类型；未知类型忽略，不执行输入中的代码或任意配置。
2. 等 DOM 与字体就绪后，针对可见且具有非零布局区域的目标调用 `annotate()` / `show()`。
3. 给库生成的 SVG 添加 `data-enhancement="notation"`、`aria-hidden="true"`，作为可剔除的纯视觉装饰。不删除正文，不接管选择与复制。
4. 保留实例；更新布局时重绘而非重复创建。若 circle 目标换行，移除旧实例并按 underline 重建。
5. 使用库已有 resize 机制；在页面自身的展开、切换、图片加载等影响布局的入口合并请求重绘。不要再加一套全页 MutationObserver 或逐滚动监听。对默认隐藏的区域等显示后再绘制。
6. 局部绘制失败只让该处回退普通 CSS 强调，不中断其他标注和正文交互；生成验收仍应报告错误，不能把退化当正常通过。

`data-notation` 只是静态绘制指令，不代表内容的额外业务事实。需要传达风险时，风险含义必须已由原文文字表达，不能仅靠颜色、圈框或无障碍隐藏说明添加解释。

## 4. 单文件交付与退化

- 将验证过版本的 IIFE 分发文件和许可随 Skill 放在本地 assets/licenses 中，运行环境不依赖 npm。
- 生成 HTML 时由宿主文件操作原样内嵌库、固定初始化脚本和许可，不让 Agent 重新编写库源码，不使用 CDN 或运行时下载。接入时验证发布包自包含、无外部请求，并检查脚本文本内嵌边界。
- 先提供每个标注目标的普通 CSS 强调；只有该目标 SVG 成功显示才关闭其屏幕 CSS 装饰。禁用 JS、库加载失败或某个目标绘制失败时仍可阅读。
- 打印时隐藏 `.rough-annotation`，恢复普通下划线/字重等打印友好的强调，不依赖打印页宽下绝对定位 SVG 的准确性。
- 默认无动画，天然符合减少动态效果要求；第一版不增加开关、评论、存储或标注编辑。

## 5. 实施改动范围

| 位置 | 改动 |
| --- | --- |
| `skills/papyra/SKILL.md` | 增加自动重点标注步骤，并链接集成参考 |
| `skills/papyra/references/content-design.md` | 定义选重点依据、密度与保真要求 |
| `skills/papyra/references/visual-design.md` | 定义三类标注及排版约束 |
| `skills/papyra/references/acceptance.md` | 增加标注准确性、重绘、打印及退化检查 |
| `skills/papyra/references/annotations.md`（新增） | 记录 DOM 契约、内嵌及固定脚本使用方法 |
| `skills/papyra/assets/`（新增） | 锁定版本 IIFE、固定初始化脚本；不把页面内容写进通用脚本 |
| `skills/papyra/licenses/`、`THIRD_PARTY_NOTICES.md` | 加入库许可与发布包中相关许可核对 |
| 独立标注测试夹具与检查脚本（新增） | 先覆盖绘制边界，再用一份现有 Markdown 另存样页验证生成效果 |
| `README.md` | 功能完成并验收后补自动标注能力和实际限制 |

先做一份真实样页，不覆盖现有三份输出、不顺带开发 CLI。固定绘制逻辑随 Skill 复用，避免每次生成时由模型重写布局监听与异常处理。

## 6. 验收与决策门槛

### 内容

- 静态及绘制后剔除增强，原文文本与未标注版一致；数字、单位、否定和条件完整。
- 每条标注有真实原文依据；重复词标到正确段落；没有“所有段落都重要”的过量圈画。
- 原文仍可搜索、选择、复制；隐藏 SVG 后仍能读懂全部内容。

### 渲染与交互

- 实测桌面、390px、320px、200% 放大；中文跨行、中英混排、重复词、关键数字。
- resize、图片加载导致的位置变化、折叠再展开、反复切换后位置正确，无重复 SVG。
- circle 跨行能退化成下划线；粗笔画不压字，不碰下一行，不增加整页横向滚动。
- 离线移动单文件后无资源请求；禁用 JS、单处绘制失败仍保留 CSS 强调。
- 实际打印 PDF：正文完整，没有屏幕坐标残留的圈框。
- 检查 SVG 装饰语义、键盘阅读及深浅底色对比；不把视觉检查等同于屏幕阅读器验证。

以上通过后再更新 Skill 并重新生成其他样本。若手绘圈点降低阅读性，先减少标注数量、仅保留下划线，而不是扩展复杂配置。
