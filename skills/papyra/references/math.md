# 离线数学公式

使用随 Skill 分发的 **Temml 0.14.0（MIT）**，在生成时将已识别的 LaTeX 转为原生 MathML。最终 HTML 不需要 Temml 脚本、npm 安装、CDN、在线字体或 JavaScript。公式是可分离的增强；精确 TeX、原始分隔符及原文顺序必须保留。

## 1. 先识别文档，再选择公式

Agent 阅读上下文，明确选择公式区间；本 Skill **不对整份 Markdown/HTML 做正则自动渲染**，也不运行 Temml 的 `renderMathInElement`。

- 明确的行内数学用 `$...$` 或 `\(...\)`，块公式用独立的 `$$...$$` 或 `\[...\]`。保留原来使用的分隔符与内部空白，不统一改写成另一种写法。
- `$` 不一定表示数学。`价格 $5 和 $12`、货币表格、转义金额 `\$19.99`、shell 变量等都按字面量保留。只有上下文明确是数学表达式才选中；无法判断时不猜。
- 排除围栏代码、缩进代码、行内代码、转义示例、链接目标、HTML 属性，以及原文介绍分隔符的文字。代码中的 `\frac`、`$...$` 或 `<script>` 都是文字，不执行、不增强。
- 只传入明确选中的精确片段，不能把整段正文作为 TeX。拆分时不丢失前后标点、空格、换行或非数学文字。不要将公式源文拼进 script、事件处理器或未转义的 HTML。
- 支持分式、根式、上下标、求和、积分、`matrix` / `pmatrix` / `bmatrix` 和 `aligned` 等 Temml 原生语法。输入中使用 Temml 不支持的命令必须报告；不要删除未知命令、改成看似正确的公式，或虚构成功状态。

## 2. 生成时使用本地 helper

[render-math.mjs](../scripts/render-math.mjs) 是供宿主生成页面时调用的本地辅助模块，不是独立产品 CLI，也不是通用 Markdown 解析器。Node 18.13+，无额外安装。

```js
import { renderMathEntries, loadMathAssets } from './skills/papyra/scripts/render-math.mjs';

const result = renderMathEntries([
  { id: 'ref-before', source: String.raw`\eqref{energy}` },
  { id: 'energy', source: String.raw`$$E=mc^2\label{energy}$$` },
  { id: 'inline-root', source: String.raw`\(c=\sqrt{a^2+b^2}\)` }
]);
if (result.errors.length) throw new Error(JSON.stringify(result.errors));
const { css, licenseComment } = await loadMathAssets();
// 将 result.items[i].html 插入相应公式位置；sourceHTML 插在合法块级位置。
// css 放在 <style data-enhancement="math"> 中，许可注释放在页面中。
```

每个输入包含唯一 `id` 和精确 `source` 字符串，另可设 `numbered:false`。`id` 仅允许 ASCII 字母、数字、`_`、`-`，且须与本页其他 math helper 调用的 id 不冲突；建议一页一次批量调用，以解析整页引用。

返回 `{items, errors}`。每个 item 有 `id`、`source`、`html`、`sourceHTML`、`ok`、`error`、`number`、`labels`、`displayMode`。`html` 是带 `data-enhancement="math"` 的可视 MathML / 引用 / 错误反馈，**不是原文**；`sourceHTML` 是原生 `details`，其 `pre > code` 的文本正好等于输入 `source`。这些返回字符串已经按各自上下文转义，不要再解码拼接。输入 id 重复、格式错误或 source 非字符串属于宿主调用错误，直接抛异常；公式解析、重复标签、缺失引用进入 `errors`。

### 标签与引用

- 块公式默认按本次批量调用的文档顺序编号，显式整数写入 HTML，不依赖运行时后处理或 CSS 计数器。生成失败可能留下编号空缺，不能把失败公式当成成功编号目标。
- 在编号块中保留 `\label{energy}`，引用用明确选中的 `\eqref{energy}` 或 `\ref{energy}`；支持先引用后定义。标签使用 ASCII 字母、数字、`_`、`-`，不使用空格、冒号、任意 HTML 或其他字符（Temml 会规范化其他字符，不能依靠规范化来区分标签）。
- 同一页面一次批量解析；原生锚点为 `#papyra-equation-<id>`。引用与标签都无脚本可用。一个公式可以有多个不同标签；任何重复标签都会使所有冲突公式明确失败，不静默选择最后一个。
- `numbered:false` 只用于无标签的展示块。行内公式不能作为编号标签目标。对齐推导使用 `$$\begin{aligned}...\end{aligned}\label{key}$$`，而不是 `equation` / `align` 自动编号环境或 `\tag`；后两者会明确报错，避免两套编号不一致。
- 引用缺失或目标失败时，该引用也明确失败；依赖失败会传播，不保留看似有效的错误锚点。公式内的引用同样按目标编号解析。

### 失败与安全

固定使用 `throwOnError:true`、`strict:true`、`trust:false`、每条公式独立的空宏表、`maxExpand:1000` 与 `maxSize:[20,10]`。未知命令、不配对括号、未授权的链接/HTML/样式命令均不能降级成假成功。文档不能覆盖这些选项，也不加载文档提供的预定义宏、插件或可执行函数；单条公式的宏不会泄漏到下一条。

失败返回紧邻位置的可见错误文字，并默认展开该公式的精确原文。普通交付中，只要 `errors` 非空就停止正式发布，先向用户说明具体失败与原文位置。只有像数学示例页这样**明确要求展示错误输入**的文档才允许保留经核对的预期失败；示例构建器会对未预期的失败直接中止。

## 3. 原文、可访问性与页面整合

- MathML 是增强，带 `data-enhancement="math"`，保持可选择及原生数学语义，不用图片、canvas 或隐藏的伪成功占位。正常情况下只有 MathML 向屏幕阅读器提供公式；不再添加朗读同一 TeX 的 `aria-label`、隐藏镜像或重复 `annotation`。
- `sourceHTML` 的原生 `details` 默认关闭；读者主动展开后才接触 TeX 源文。原文 `code` **不带增强标记**，不得删除。错误输入默认展开，以免公式丢失。不要给可聚焦 summary 设置 `aria-hidden`。
- 行内 `html` 放在正文对应位置；其 `sourceHTML` 放在该段落之后，不能把块级 `details` 放进 `p`。块公式可在独立 `section` 中依次插入 `html` 与 `sourceHTML`。正文与公式保持原来的先后次序；多个行内源文展开区也按原顺序排列。
- 可另外提供整个 Markdown 的原生展开区作为精确文本存档（示例已提供），不能因此漏掉正文或把全文仅藏在折叠区。
- 宽矩阵、长等式在局部滚动，不让页面整体横向溢出；移动端、放大、键盘、打印和禁用 JavaScript 都要实际检查。老旧、没有原生 MathML 的浏览器无法保证增强排版，原文展开区仍可用；不要声称所有浏览器视觉完全相同。

## 4. 资源、字体与许可

读取真实资源，不由模型重新生成或概括库代码：

| 用途 | Skill 内路径 |
| --- | --- |
| Node ESM renderer（实际 helper 导入） | `assets/temml-0.14.0/temml.mjs` |
| 上游浏览器构建（备用；静态生成页不需要） | `assets/temml-0.14.0/temml.min.js` |
| 原版离线 MathML 样式 | `assets/temml-0.14.0/Temml-Local.css` |
| 原版小型 script/prime 辅助字体 | `assets/temml-0.14.0/Temml.woff2` |
| Papyra 展示样式 | `assets/math.css` |
| MIT 完整许可 | `licenses/temml-MIT.txt` |

`loadMathAssets()` 保持 vendored 文件原字节不变，只在生成的 CSS 中把上游唯一的 `url('Temml.woff2')` 换成该本地字体的 `data:font/woff2;base64,...`，然后连接原样读取的 `math.css`。此项明确的 URL 内联是实现单文件必需的转换，不能删掉字体却留下相对路径。上游 CSS 中内建的 SVG data URL 仍原样保留。其余数学字形由系统/浏览器本地数学字体提供，不取网络字体；此小字体不是全套数学字体，平台间字形与度量可以不同。

把返回 `css` 原样内嵌到 `<style data-enhancement="math">`，保留返回的完整 MIT 许可注释。样式放在页面主题之前或之后均可，但主题不能破坏 MathML 排版；深色页面通过 `--math-source-color`、`--math-source-background`、`--math-source-ink`、`--math-error-color` 提供实际可读配色。最终页面不嵌入 `temml.mjs`、`temml.min.js`，也不运行浏览器 auto-render。HTML 要有 `<!doctype html>`。

上游来源为 npm tarball `https://registry.npmjs.org/temml/-/temml-0.14.0.tgz`，已直接下载并检查包内容与 `package.json`（0.14.0、MIT、Node ≥18.13）。SHA-256：

- tarball：`6be7cc75cd61af39a98fd1d88146732818b042ae665963cf0473b44a44b090e2`
- Node renderer：`09e55a0c364d35b8ef66be49486b90884240a7e66c463a825e096faf27b0d59d`
- browser renderer：`56b4338176d39170692503b8b7ec630d3edf8e10861895658deb74aefb66af9d`
- 全部所选文件的校验值及许可出处见 [第三方声明](../THIRD_PARTY_NOTICES.md)。

helper 使用此**固定版本**的内部 `__renderToMathMLTree` 来完成无 DOM 引用解析；升级时必须重新检查树节点的 `label`、`classes`、`children`、`href` 与 `toMarkup` 合约，不能直接替换版本号。

## 5. 可运行样例与交付检查

仓库中运行 `node samples/build-math.mjs`，从 `samples/math.md` 生成 `samples/output/math.html`。样例包含两种行内分隔符、两种块分隔符、分式/根式、求和/积分、矩阵、对齐、前向标签引用、货币、代码、缺括号与未知宏。构建器只渲染人工列出的明确片段，验证真实上游资源哈希，以临时文件写入后原子替换输出；错误样例会显示真实解析反馈，不是成功公式。

发布前由宿主运行样例及边界检查，实际离线打开，禁用 JavaScript，检查公式可见、键盘定位与源码展开可用、无外部资源请求、无整页横向溢出。核对每条 `code.textContent` 与精确输入源文，检查重复标签、缺失引用、未知宏及不受信任命令的明确失败。未执行的浏览器或自动检查必须如实说明，不把 helper 源码存在当作验收证据。
