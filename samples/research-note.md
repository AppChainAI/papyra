# 一份可追溯的几何阅读札记

本札记把数学公式、原生 SVG 和来源引脚放在同一份离线文档中。几何数字是教学示例，不是现场测量结果。

## 从公式到图形

设直角边为 $a=3$、$b=4$，则斜边为 $c=\sqrt{a^2+b^2}=5$。这是本例的计算，不是对外部数据的引用。

$$
a^2+b^2=c^2
$$

式（1）给出本例的边长关系；原式可展开查看。渲染结果不替代原始 LaTeX。

![三、四、五直角三角形](assets/triangle.svg)

图形来源：本仓库 samples/assets/triangle.svg。两条直角边为 3 和 4，斜边为 5；未指定物理单位。图中的箭头仅表示阅读方向。

## 表达与依据

MathML Core 定义了适合浏览器实现的数学标记核心子集。[^mathml]

SVG 可以描述二维图形，包括形状、图像和文字。[^svg]

数学结构与图形结构在这里互补，但文档离线可用仍需实际验证，不能仅因采用 MathML 与 SVG 就推断通过。[^mathml][^svg]

证据说明保存在单文件内；打开原始网址需要网络。[^offline]

## 来源与注释

[^mathml]: W3C，MathML Core，Abstract。原文摘录：“This specification defines a core subset of Mathematical Markup Language, or MathML, that is suitable for browser implementation.” 原网址：https://www.w3.org/TR/2025/CR-mathml-core-20250624/ 。状态：2026-10-22 已读取摘要；Candidate Recommendation Snapshot，不称为最终推荐标准。

[^svg]: W3C，SVG 2，Chapter 1，§1.1 About SVG。原文摘录：“SVG is a language for describing two-dimensional graphics.” 另据该节，图形对象包括形状、图像和文字。原网址：https://www.w3.org/TR/SVG2/intro.html 。状态：2026-10-22 已读取；只支持上述描述，不作为离线可用性的证明。

[^offline]: 解释性脚注：离线交付只包含本文件中的内容与资源，不包含链接目标网页的离线副本。本脚注不引用外部资料。
