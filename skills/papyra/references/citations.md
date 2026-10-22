# 引用、证据笔记与书目

引用的任务是让读者从一句话到达证据，再准确回到刚才的引用位置。默认使用原生 HTML 锚点与有序笔记，不把联网请求、悬停浮层或 JavaScript 当作阅读先决条件。本参考不引入依赖、运行时脚本或产品 CLI。

## 1. 先区分来源与判断

- 保留输入中已有的引文、注号、笔记标识、原始 URL、作者、标题、日期、页码、章节、限定条件与核验状态。未提供的作者、日期、页码等写“未提供”或“未采集”，不依据域名、文件名或上下文补造。
- 只有实际读过的内容才能标为“已对照摘录”。记录读到的 URL 或本地路径、定位和本次核验范围；打不开的来源保留原链接并标“未核验”，不生成仿真的摘录、访问时间或来源标题。
- “读到规范”不等于“验证实现”。兼容性、读屏、打印或运行结果需要独立证据；摘录核验与实现未核验可以同时成立。
- 保留原始 URL；可另加已有依据的章节 URL，但不以新定位替换原 URL。页码或章节仅在输入给出、或确实从已读来源确认时加入。URL 版本与来源状态照录，不把工作草案称为最终标准。
- 区分直接引文、转述与文档自身的判断。排版换行合并、链接包装去除等摘录转换要说明，不暗示保留了原始 HTML 字节。
- 需要 agent 查证补充时，把新材料放在明确标为“Agent 补充证据”的独立区块，使用 `data-enhancement` 和 `data-evidence-origin="agent-supplemental"`。不要把补充来源塞进原作者的脚注，或改写原句，使其看起来本来就有证据。

## 2. 原生链接契约

每个来源笔记有稳定目标 ID，每次出现的引用另有唯一 ID。重复引用同一来源可以复用笔记，但每一次都必须拥有返回链接。一个论点有多个来源时并列多个独立锚点，不生成一个不知道会去哪的组合按钮。

```html
<div class="papyra-citations">
  <p>MathML 的呈现规则并非全部强制。
    <sup class="citation-call"><a class="citation-ref" role="doc-noteref" id="ref-mathml-1"
      href="#mathml" aria-label="引用 1，第 1 次；查看证据笔记">[1]</a></sup>
  </p>
  <p>这里再次使用同一来源。
    <sup class="citation-call"><a class="citation-ref" role="doc-noteref" id="ref-mathml-2"
      href="#mathml" aria-label="引用 1，第 2 次；查看证据笔记">[1]</a></sup>
  </p>
  <section aria-labelledby="evidence-heading">
    <h2 id="evidence-heading">证据笔记与书目</h2>
    <ol class="citation-notes">
      <li class="citation-note" role="doc-endnote" id="mathml" tabindex="-1">
        <p>W3C，MathML Fundamentals，§2.1.4 MathML and Rendering。</p>
        <p>原始 URL：<a class="citation-url"
          href="https://www.w3.org/TR/MathML3/chapter2.html">https://www.w3.org/TR/MathML3/chapter2.html</a></p>
        <p>具体摘录、缺失元信息和核验范围由输入或实际查证记录提供。</p>
        <nav class="citation-backlinks" aria-label="引用 1 的返回位置">
          <a role="doc-backlink" href="#ref-mathml-1">返回引用 1.1</a>
          <a role="doc-backlink" href="#ref-mathml-2">返回引用 1.2</a>
        </nav>
      </li>
    </ol>
  </section>
</div>
```

此代码只说明结构；不能把其中说明性文字作为已查证的文档证据交付。完整、实际查读的引文见样例。

- 保留原注 ID，例如输入 `[^mathml]` 对应 `id="mathml"`。注号是展示序号，不替换原 ID。若已有 ID 冲突，做一致的可逆映射并记录，不静默断开原有链接。
- 引用用可见 `[1]` 等文本及说明性可访问名称；返回用“返回引用 1.2”之类文本，不能只有一个无说明的箭头。目标笔记用 `tabindex="-1"`，供浏览器的原生定位和焦点行为使用，不制造额外 Tab 停靠点。
- 普通解释性脚注不要求 URL；不要用空链接、虚构书目或 `href="#"` 填位置。它仍有独立注号、正文目标与每次出现的返回链接。
- 同一来源不同页码可在同一笔记中明确列出“引用 1.1 → 页码/章节”的对应关系，也可分为独立笔记；不能把一段证据伪装成支持所有上下文。来源相同但作者原注与 agent 补充的身份不同，不为去重混为一条。
- 无 JavaScript 时仍要完成“引用 → 证据 → 每次引用”的完整往返。外部 URL 仅在读者主动点击时访问，不预取、嵌入远程预览或上报点击。

## 3. 嵌入与呈现

将 `assets/citations.css` 的完整内容原样内嵌到 `<style data-enhancement="citations">`。它只作用于 `.papyra-citations`，提供引用、笔记、返回、键盘焦点、`:target` 定位高亮、长 URL 换行和打印 URL 样式。页面主题如需覆盖颜色，设置 `--citation-link`、`--citation-focus`、`--citation-target`、`--citation-rule`，另行核对对比度。不修改随包资产本身，也不把外链样式作为依赖。没有 citation runtime，也没有新增第三方许可。

证据与书目默认全部展开，紧邻正文后的注释区即可。不要把目标或关键证据放进关闭的 `details`、弹层、切换面板或隐藏容器；CSS 无法可靠地让所有浏览器在打印时展开关闭的原生 `details`。若非必要不用折叠。确需折叠的非关键辅助内容不得包裹引用目标，且必须实际检查无脚本、哈希定位和打印。页面可保留普通目录跳转，但不要用动态定位替换原生 `href`。

所有证据、限定条件和原始 URL 都要出现在打印正文。URL 直接作为链接文本最稳妥；样式也会为有名称的 HTTP(S) 链接附加其地址。返回链接打印可见，不能为精简版面删掉证据笔记。长笔记允许跨页，不设置固定高度或裁切。

## 4. 内容保真与样例边界

正文中已有引用可以做语义排版，但显示编号、Markdown 的 `[^id]` 和 HTML 链接不是字面相同的字符串。不能把“语义保留”冒充“逐字相同”。有两种明确的验收路径：

1. 原文 DOM 路径：不修改源文本，将引用导航放在独立 `data-enhancement` 节点；剔除增强后的原文文本仍逐字等于输入。增强链接必须清楚地指向原文的具体引用位置，不把显示编号插入原文本身。
2. 原始文本加独立阅读增强路径：将完整 Markdown 正确转义后放入 `<pre id="source-markdown">`，它的 `textContent` 与输入 UTF-8 文本逐字相同，包括 Markdown 语法、全部注释定义、换行与末尾换行。另设完整的 `[data-enhancement="citation-reading"]` 阅读版，语义保留全部段落、证据笔记、原 ID 与 URL。阅读版可以展示编号，不能代替原始文本字面核验。原始文本不隐藏，打印也完整保留。

不要在同一个验收断言里先剥离所有增强，再宣称编号阅读版与原始 Markdown 字符串相同。分别检查原始文本精确相等，以及增强版的正文/笔记顺序、引文文字、URL、身份区分和链接图。两份表示都可搜索和选择，原始文本不能用截图、脚本字符串或隐藏模板替代。

本仓库的 `samples/citations.md` 与 `samples/build-citations.mjs` 采用第 2 路径。生成器仅处理该样例实际使用的标题、普通段落、URL、命名脚注定义与引用；对不支持的结构拒绝处理，不宣称通用 Markdown 解析器。它从样例输入取得所有证据和元信息，原样内嵌此 CSS，不联网、不添加依赖，用临时文件完成后原子替换 `samples/output/citations.html`。执行 `node samples/build-citations.mjs` 只是维护样例的生成辅助，不是交付给读者的产品 CLI。

## 5. 完成标准

- 对照输入检查每个论点、摘录、解释性脚注、定位、核验标签、原 URL 与原注 ID；agent 补充材料独立标识。
- 检查所有内部 `href` 都有唯一目标；每个引用出现位置都有对应返回链接；重复来源和同一论点多个来源均实际往返。
- 禁用 JavaScript、离线打开且阻断网络，仍能读完证据并使用全部内部链接。原始 URL 是离线可见文本，不声称离线能访问外站。
- 用键盘逐次操作引用与返回，确认焦点可见、目标高亮和阅读位置清楚；检查约 390px、320px 与 200% 放大，不出现整页横向溢出。
- 实际检查打印：所有证据、完整 URL、限定条件、原始文本均可见，笔记没有裁切或因折叠丢失。
- 分别报告实际执行的链接检查、原始文本与语义检查、桌面/手机/打印/离线/无脚本检查；不以源码推断冒充浏览器验收结果。
