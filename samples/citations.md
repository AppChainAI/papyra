# 离线文档的证据边界

这份记录只讨论已读到的规范文字，不把规范摘录当成浏览器兼容性测试。

## 两份规范能支持什么

MathML 与 SVG 都能进入 HTML 文档；这为单文件文档中的原生表达提供规范依据，但不能单凭这两段文字宣布所有浏览器表现一致。[^mathml][^svg]

MathML 对具体呈现方式的表述是建议，而不是强制；阅读器应保留原始公式或等价文字，不把截图当成唯一正文。后半句是本文的设计判断，不是规范原句。[^mathml]

“所有浏览器都一致朗读 MathML”在本记录中未核验，不能由上述引用推出。[^scope]

## Agent 补充证据（与原文结论分开）

以下补充由 agent 查阅规范后加入，身份明确为补充证据，不冒充外部作者的原文结论：SVG 的 HTML 命名空间由 HTML 解析器自动提供。它支持讨论内联 SVG 的写法，但不能证明任何具体浏览器已通过无障碍测试。[^agent-svg]

## 证据笔记与书目

[^mathml]: 来源：W3C，Mathematical Markup Language (MathML) Version 3.0 2nd Edition，Chapter 2: MathML Fundamentals。定位：§2.1.1 General Considerations；§2.1.4 MathML and Rendering。作者与发布日期：本记录未单独采集，不补填。
    原始 URL：https://www.w3.org/TR/MathML3/chapter2.html
    定位 URL：https://www.w3.org/TR/MathML3/chapter2.html#fund.xmlgeneral
    定位 URL：https://www.w3.org/TR/MathML3/chapter2.html#fund.renderingmodel
    原文摘录：“Notably the HTML parser may also be used with MathML.”
    原文摘录：“MathML presentation elements only recommend (i.e., do not require) specific ways of rendering; this is in order to allow for medium-dependent rendering and for individual preferences of style.”
    核验状态：2026-10-22 通过读取工具读到该规范章节并对照上述文字；第二段摘录的排版换行合并为空格。未执行浏览器、读屏或当前实现兼容性测试。该链接未来及离线时的可达性未核验。

[^svg]: 来源：W3C，SVG 2，Chapter 5: Document Structure。定位：§5.1.1 Overview。作者与发布日期：本记录未单独采集，不补填。
    原始 URL：https://www.w3.org/TR/SVG2/struct.html
    原文摘录：“An SVG document fragment can stand by itself as a self-contained file or resource, in which case the SVG document fragment is an SVG document, or it can be embedded inline as a fragment within a parent HTML or XML document.”
    核验状态：2026-10-22 通过读取工具读到该规范章节并对照上述文字；摘录的排版换行合并为空格。规范中术语链接的显示文字保留，链接包装未复制。未执行具体浏览器测试。该链接未来及离线时的可达性未核验。

[^scope]: 说明性脚注（无 URL）：这里只标记尚未完成的验证，不引用一个不存在的测试报告。兼容性、辅助技术朗读与打印效果须分别实测。核验状态：未核验；作者、日期、页码与外部来源均未提供。

[^agent-svg]: Agent 补充证据：W3C，SVG 2，Chapter 5: Document Structure。定位：§5.1.2 Namespace；不是输入作者的额外主张。作者与发布日期：本记录未单独采集，不补填。
    原始 URL：https://www.w3.org/TR/SVG2/struct.html
    定位 URL：https://www.w3.org/TR/SVG2/struct.html#Namespace
    原文摘录：“When using the HTML syntax, the namespace is provided automatically by the HTML parser.”
    核验状态：2026-10-22 通过读取工具读到该规范章节并对照上述文字；摘录的排版换行合并为空格。此补充不证明具体浏览器兼容性或无障碍结果。该链接未来及离线时的可达性未核验。
