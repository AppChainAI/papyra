# 离线数学：一张可复核的推导纸

公式由本地 Temml 0.14.0 在生成时转为 MathML。断网、移动单文件、禁用 JavaScript 后仍可阅读；每条公式的精确 TeX 与分隔符可在原生展开区查看。

## 行内公式与字面量

直角三角形的两条直角边是 $a=3$ 与 \(b=4\)，斜边为 $c=\sqrt{a^2+b^2}=5$。

价格是 $5 和 $12，不是数学分隔符。转义金额 \$19.99 也按原文保留。

```tex
这里是代码而不是待执行的公式：$not_math$，\[not_rendered\]。
\frac{1}{0} 与 <script>alert('source')</script> 都只是代码文字。
```

## 分式、根式与公式引用

先引用后定义也能离线定位：\eqref{pythagoras}。普通编号引用是 \ref{pythagoras}。

$$
a^2+b^2=c^2\label{pythagoras}
$$

分式与根式给出一个独立例子：

\[
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
\]

## 求和与积分

$$
\sum_{k=1}^{n}k=\frac{n(n+1)}{2}
$$

$$
\int_0^1 x^2\,dx=\frac{1}{3}
$$

## 矩阵与对齐推导

$$
A=\begin{pmatrix}1&2\\3&4\end{pmatrix},\quad \det A=-2
$$

$$
\begin{aligned}
f(x)&=(x+1)^2\\
&=x^2+2x+1
\end{aligned}\label{expanded}
$$

对齐推导可用 \eqref{expanded} 定位，不依赖浏览器后处理或 CSS 计数器。

## 明确失败，而非假成功

下一条输入缺少右花括号，页面必须显示真实解析错误并展开原文；它不是已经渲染成功的公式。

$$\frac{1}{$$

下一条使用未知命令，也必须明确失败，不自动删除命令、猜测替代公式或启用不受信任的扩展。

$$\notARealMathCommand{z}$$

页面保留错误样例用于阅读者检查失败反馈；发布普通文档时，未获明确接受的公式错误应阻止交付。
