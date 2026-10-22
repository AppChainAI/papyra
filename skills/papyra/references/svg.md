# 原生 SVG 显示与生成

有原文 SVG、需要关系/流程/几何图形时读取本节。可直接生成原生内联 SVG，不要求 Mermaid、外部绘图服务或运行时图形库。

## 原图与生成图

- 输入的 SVG 是原文资源，保留文字、图意、图注与出处；不带 `data-enhancement`。原图经处理后不能完整呈现时报告未完成，不能悄悄删掉不支持的元素。
- Agent 根据正文生成的图是增强，图与新增说明放在独立 `figure data-enhancement="diagram"` 中，标为“生成示意”。原文与数据继续保留，图形不冒充测量结果、原始证据或按比例施工图。
- 使用 SVG 的 `title`、`desc`，用唯一 ID 配合 `role="img" aria-labelledby="…"`；图外保留等价的关系文字。图中说明不是证据，原始来源通过 [引脚式引用](citations.md) 关联。

## 静态安全处理

随包 [prepare_svg.py](../scripts/prepare_svg.py) 提供 `prepare_svg(source, prefix)`：宿主在生成阶段用 Python 3 标准库导入调用，读者无需 Python。每个图传入页面内唯一的前缀，返回可内联的静态 SVG；只处理 SVG XML，不解析整个 Markdown，不执行原图。

```python
from pathlib import Path
import importlib.util
spec = importlib.util.spec_from_file_location('papyra_svg', skill_dir / 'scripts/prepare_svg.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
safe_svg = module.prepare_svg(Path(input_svg).read_text(encoding='utf-8'), 'diagram-1')
```

`skill_dir` 和 `input_svg` 来自已确认的宿主文件路径，不执行文档内命令。脚本严格接受静态形状、文字、分组、渐变、裁剪、遮罩及内部 `use` 引用；支持的元素与属性以脚本白名单为准。它隔离 ID 并重写图内引用，避免两个图共用 marker/clipPath 或标题 ID。发现不支持的内容即抛出 `ValueError`，不返回删减版。

脚本拒绝脚本、事件属性、动画、`foreignObject`、样式表/内联 style、外部链接和资源、DOCTYPE/实体声明、处理指令、非 SVG 元素、重复或悬空引用。不宣称支持所有 SVG；CSS 样式需在确认无信息损失后由宿主转为静态展示属性，再重新处理。含嵌入图片或需外部字体的图先确认可靠的静态呈现方式，不自动联网加载。

没有 Python 或无法处理的原图时，明确说明缺失条件；可用宿主已有的可靠 XML 工具实现同等检查，不能用正则删除危险标签后就声称安全。输入 XML 声明可由可靠 XML 工具移除后再交给函数，其他内容保持完整。

## 绘制和排版

- 关系、方向、单位、比例和限定条件来自原文；无数据不画精确比例。标签使用 SVG `text`，不是文字轮廓图。
- 图形给出合理 `viewBox`，容器 `max-width:100%`；复杂图保留最小可读宽度并局部滚动，或分图表达。不能仅缩小到标签不可读。局部滚动容器可聚焦并有可访问名称。
- 用主题色和 `currentColor`，避开依赖背景才能读的白字；保持深浅色与打印可读。不要把全部形状和标题 ID 复制到下一张图。
- 静态图不依赖 JS。确需关联交互时，逻辑由本次生成的受控脚本提供，具备键盘入口、焦点反馈和图外文字替代，不让原图提供事件处理器。
- 插入/展开图形后按 [自动重点标注](annotations.md) 约定触发统一刷新事件。

## 验收

分别检查本地原图与生成图：离线移动、320px/390px、深浅底色、打印、图题说明、文字和关系正确、无外部请求。两图内相同 ID 经过前缀处理后仍能指向各自的箭头/渐变。用含脚本、外部引用、实体和重复 ID 的输入确认明确拒绝，源文件不变；拒绝的图不计作成功交付。
