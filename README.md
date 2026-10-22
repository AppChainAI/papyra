# Papyra

把文档变成美观、可交互的 HTML 阅读页面。

Papyra 将文档交给用户本地已安装并配置的 coding agent，由 agent 分析内容并设计页面，而不是套用固定模板。

## 核心能力

- **输入**：支持 Markdown 与关联本地图片；其他格式暂不纳入当前实施计划。
- **输出**：面向人类阅读的单文件 HTML，目标是可离线打开、内容保真、适配桌面与手机。
- **设计**：根据内容组织排版和必要交互，不为交互而交互；逐节选择原文中的结论、行动、约束与关键数字，用随包 Rough Notation 添加醒目圈点（下划线 3px、圈注 2.5px），资源内嵌、可离线阅读。
- **数学与图形**：随包 Temml 在生成阶段转换 LaTeX 为静态 MathML，保留精确原式；支持直接生成内联 SVG，并用静态检查辅助模块隔离图内 ID、拒绝活动内容和外部依赖。
- **证据溯源**：正文引脚关联证据笔记、原出处和原始网址；原生锚点支持一源多引的逐处返回，未核验及 Agent 补充来源明确区分。
- **Agent**：Skill 由具备文件读写能力的本地 coding agent 执行，复用宿主的模型、工具与权限控制，不提供独立生成 CLI。

## 安装与使用 Skill

可分发的 Skill 位于 [`skills/papyra/`](skills/papyra/)。只需安装 Papyra 一份，内容设计、视觉指导和验收规则全部随包提供，无需安装其他 Skill。

在需要使用 Papyra 的项目目录中运行：

```sh
npx skills add AppChainAI/papyra --skill papyra
```

默认安装到当前项目，不加 `-g`。安装时按提示选择使用的 agent；该命令需要 Node.js/npm，生成的 HTML 本身无需这些环境。

上述远程命令要求 GitHub 上已发布包含 `skills/papyra/` 的版本。也可以从本地仓库安装：

```sh
npx skills add /path/to/papyra --skill papyra
```

安装后，在 agent 中提出任务，例如：

> 用 Papyra 把 docs/report.md 转成交互式 HTML 阅读页面，保留完整内容，支持离线打开，保存到 exports/report.html。

Skill 根据内容选择目录、流程、图表、方案比较等表达，不套固定页面模板。基础生成需要 agent 的文件读写能力；数学转换辅助模块使用 Node.js 18.13+，SVG 静态检查辅助模块使用 Python 3，均不要求 npm 安装。读者只需浏览器；真实视觉和交互验收需要宿主的浏览器与看图能力，未验证部分明确说明。

文档是否发送至模型服务取决于所用 agent 的配置。

## 项目状态

当前提供自包含的 Papyra Skill **0.4.0**。新增数学公式、静态 SVG 与引脚式引用的规则和辅助资源，并新增四份可离线打开的案例；版本在新案例通过检查后更新。

新增案例已在本机 Chrome 验证：完整 Markdown 精确存档、1440px/390px/320px 无整页横向溢出、移动单文件后的离线/无脚本阅读、引用逐处返回、打印 PDF；另已实测引用键盘往返和查看桌面/窄屏页面。数学错误依赖与 SVG 安全边界检查通过。未验证 Safari/Firefox、真实屏幕阅读器或跨模型生成稳定性，不声称任意 Markdown 已有通用渲染器。

产品范围与验收标准见 [需求文档](docs/requirements.md)；三项能力的范围、验收与后续限制见 [路线图](docs/roadmap.md)。0.3.0 的历史样例与报告保留。

## 交互阅读样本

HTML 可直接在浏览器中离线打开，无需安装依赖或启动服务器。运营与业务数字为虚构测试内容；新引用案例中的规范摘录来自实际读取的 W3C 文档，核验范围在案例中说明。

| 场景 | Markdown | HTML |
| --- | --- | --- |
| 市场运营 | [运营周报](samples/market-operations.md) | [渠道、行动与停止条件](samples/output/market-operations.html) |
| 需求开发 | [需求与验收规格](samples/requirements-development.md) | [状态规则与用例关联](samples/output/requirements-development.html) |
| 设计方案 | [社区阅读室方案](samples/design-proposal.md) | [方案取舍与空间约束](samples/output/design-proposal.html) |
| 数学公式 | [离线推导纸](samples/math.md) | [公式、编号引用与错误反馈](samples/output/math.html) |
| SVG 图形 | [原图与生成示意](samples/svg.md) | [静态 SVG 与 ID 隔离](samples/output/svg.html) |
| 引用溯源 | [证据边界](samples/citations.md) | [引脚、证据笔记与原网址](samples/output/citations.html) |
| 组合案例 | [几何阅读札记](samples/research-note.md) | [公式、SVG 与证据引脚](samples/output/research-note.html) |

三个页面分别采用运营复盘、技术规格与空间方案的阅读组织，在对应章节增加内容解释与交互。全文文字保真、离线打开、主要交互、键盘入口及桌面/手机溢出检查通过，详见 [0.3.0 三案例回测](docs/papyra-0.3.0-sample-retest.md)。Impeccable 检测器仅用于可选开发验收，不是 Skill 或生成页面的运行依赖。

macOS 可直接打开，例如：

```sh
open samples/output/market-operations.html
```

```sh
node samples/build.mjs  # 按本轮选定重点内嵌最新标注资源，覆盖三例 output
node samples/check.mjs  # 本机 Chrome 离线回归；其他安装路径可用 CHROME_PATH 指定
```

构建脚本只复现这三例的标注，不是通用 Markdown 转换器。检查需要 Node.js 22+ 和 Chrome，无需安装 npm 依赖；截图、打印 PDF 和检查结果保存在命令打印出的临时目录，不纳入 Git。

新增案例生成与验证：

```sh
node samples/build-math.mjs
python3 -B samples/build-svg.py
node samples/build-citations.mjs
node samples/build-research-note.mjs
node samples/check-math.mjs
python3 -B samples/check-svg.py
node samples/check-capabilities.mjs
```

这些是固定案例的开发辅助，不是产品 CLI 或通用 Markdown 转换器。浏览器检查需要 Node.js 22+ 与本机 Chrome，沿用 `CHROME_PATH`；输出截图、PDF 和结果至临时目录。数学案例有两条预期失败，用来验证缺括号与未知命令的明确反馈；其他未预期失败会阻止构建。

## Skill 结构

```text
skills/papyra/
├── SKILL.md
├── references/
│   ├── content-design.md
│   ├── visual-design.md
│   ├── annotations.md
│   ├── math.md
│   ├── svg.md
│   ├── citations.md
│   └── acceptance.md
├── scripts/
│   ├── render-math.mjs
│   └── prepare_svg.py
├── assets/
│   ├── rough-notation-0.5.1.iife.js
│   ├── annotations.js
│   ├── annotations.css
│   ├── math.css
│   ├── citations.css
│   └── temml-0.14.0/
├── licenses/
│   ├── rough-notation-MIT.txt
│   ├── temml-MIT.txt
│   └── impeccable-Apache-2.0.txt
└── THIRD_PARTY_NOTICES.md
```

三例共用 Skill 的标注脚本与 CSS，单个输出 HTML 已包含全部必要资源。已有样本不是跨模型自动选重点的质量证明。

安装 `papyra` 会获得全部必要参考、标注、公式与引用资源及生成辅助模块，不依赖本仓库的样本或测试工具。第三方材料的版权与许可声明随 Skill 一同分发。
