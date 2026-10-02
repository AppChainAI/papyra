# Papyra

把文档变成美观、可交互的 HTML 阅读页面。

Papyra 将文档交给用户本地已安装并配置的 coding agent，由 agent 分析内容并设计页面，而不是套用固定模板。

## 核心能力

- **输入**：首版支持 Markdown 与关联本地图片，后续扩展 PDF 等格式。
- **输出**：面向人类阅读的单文件 HTML，目标是可离线打开、内容保真、适配桌面与手机。
- **设计**：根据内容组织排版和必要交互，不为交互而交互。
- **Agent**：Skill 由具备文件读写能力的本地 coding agent 执行；CLI 后续逐步适配不同 agent。

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

Skill 根据内容选择目录、流程、图表、方案比较等表达，不套固定页面模板。生成只需要 agent 的文件读写能力；真实视觉和交互验收还需要浏览器与看图能力，未验证的部分会明确说明。

文档是否发送至模型服务取决于所用 agent 的配置。

## CLI（计划）

```sh
papyra build doc.md
```

CLI 依赖用户已经安装并配置好的本地 agent。文档是否发送至模型服务取决于该 agent 的配置。

## 项目状态

当前已提供自包含的 Papyra Skill 0.2.0。`samples/` 保留三份输入 Markdown 与 `output/` 下三份最终 HTML（蓝图、报刊号外、蓝图+线路示意），均为 fresh-context agent 仅凭 skill 文本独立生成，已做源码级保真核对与静态截图，浏览器交互未逐页实测。CLI 尚未实现。生成为同模型族，跨模型验证未做，不是独立质量评测。

完整范围、质量要求、验收标准与待确定事项见 [需求文档](docs/requirements.md)。

## 交互阅读样本

HTML 可直接在浏览器中离线打开，无需安装依赖或启动服务器。文档与业务数字均为虚构测试内容。

| 场景 | Markdown | HTML |
| --- | --- | --- |
| 市场运营 | [运营周报](samples/market-operations.md) | [渠道、行动与停止条件](samples/papyra/market-operations.html) |
| 需求开发 | [需求与验收规格](samples/requirements-development.md) | [状态规则与用例关联](samples/papyra/requirements-development.html) |
| 设计方案 | [社区阅读室方案](samples/design-proposal.md) | [方案取舍与空间约束](samples/papyra/design-proposal.html) |

三个页面分别采用运营复盘、技术规格与空间方案的阅读组织，在对应章节增加内容解释与交互。全文文字保真、离线打开、主要交互、键盘入口及桌面/手机溢出检查通过，详见 [Papyra Skill 测试报告](docs/papyra-skill-evaluation.md)。Impeccable 检测器仅用于可选开发验收，不是 Skill 或生成页面的运行依赖。

macOS 可直接打开，例如：

```sh
open samples/papyra/market-operations.html
```

检查脚本在 [`samples/papyra/check.mjs`](samples/papyra/check.mjs)。截图、打印 PDF 和检查结果可在本地重新生成，不纳入 Git。

## Skill 结构

```text
skills/papyra/
├── SKILL.md
├── references/
│   ├── content-design.md
│   ├── visual-design.md
│   └── acceptance.md
├── licenses/
│   └── impeccable-Apache-2.0.txt
└── THIRD_PARTY_NOTICES.md
```

安装 `papyra` 会获得全部必要参考文件，不依赖本仓库的样本或测试工具。第三方材料的版权与许可声明随 Skill 一同分发。
