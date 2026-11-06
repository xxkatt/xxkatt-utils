# Math

四则运算、数组最大值与最小值、求和与算术平均数。四则运算按输入数字的十进制字符串计算，处理 `0.1 + 0.2` 这类常见小数精度问题，结果返回 `number`。

## 基本用法

```ts
import { add, subtract, multiply, divide, max, min, sum, average } from '@xxkatt/utils'

add(0.1, 0.2) // 0.3
subtract(0.3, 0.1) // 0.2
multiply(0.1, 0.2) // 0.02
divide(0.3, 0.1) // 3

max([1, 3, 2]) // 3
min([1, 3, 2]) // 1
sum([0.1, 0.2, 0.3]) // 0.6
average([0.1, 0.2]) // 0.15
```

所有函数均从 `@xxkatt/utils` 的公共入口导入，不依赖浏览器 API，可在 Node.js、SSR、浏览器和 Web Worker 中使用。

## 四则运算

```ts
function add(a: number, b: number): number
function subtract(a: number, b: number): number
function multiply(a: number, b: number): number
function divide(a: number, b: number): number
```

| 函数       | 计算    | 示例                      |
| ---------- | ------- | ------------------------- |
| `add`      | `a + b` | `add(0.1, 0.2) // 0.3`    |
| `subtract` | `a - b` | `subtract(1, 0.9) // 0.1` |
| `multiply` | `a * b` | `multiply(1.2, 3) // 3.6` |
| `divide`   | `a / b` | `divide(0.7, 0.1) // 7`   |

- 接受两个 `number`，支持负数、零和科学计数法，不接收字符串或 `bigint`。
- 有限数值按照 `String(value)` 得到的十进制值计算，内部使用 BigInt 避免缩放整数时丢失精度，最终转换回 `number`；除法采用就近舍入，恰好居中时取偶数。
- 非有限数值及正负零遵循原生四则运算规则；除零不抛错。

```ts
add(1e-7, 2e-7) // 3e-7
multiply(-1.2, 3) // -3.6
divide(1, 3) // 0.3333333333333333
divide(1, 0) // Infinity
divide(-1, 0) // -Infinity
divide(0, 0) // NaN
add(Infinity, -Infinity) // NaN
```

## 数组统计

```ts
function max(values: readonly number[]): number
function min(values: readonly number[]): number
function sum(values: readonly number[]): number
function average(values: readonly number[]): number
```

| 函数      | 说明                                      | 空数组结果  |
| --------- | ----------------------------------------- | ----------- |
| `max`     | 返回最大值                                | `-Infinity` |
| `min`     | 返回最小值                                | `Infinity`  |
| `sum`     | 使用 `add` 从左到右累加，初始值为 `0`     | `0`         |
| `average` | 使用 `divide(sum(values), values.length)` | `NaN`       |

- 接收数字数组或只读数字数组，不修改输入；单元素数组返回该元素的数值，`sum` 与 `average` 的零符号遵循上述累加规则。
- 包含 `NaN` 时结果为 `NaN`，不自动过滤无效数值；无穷大按对应原生运算传播。
- `max` 与 `min` 逐项比较，避免展开大数组导致函数参数数量超限；正负零的选择与 `Math.max`、`Math.min` 一致。

```ts
const values = [0.1, 0.2, 0.3] as const
sum(values) // 0.6
average(values) // 0.2

max([-3, -1, -2]) // -1
min([0, -0]) // -0
sum([1, NaN, 2]) // NaN
sum([Infinity, -Infinity]) // NaN
```

## 精度与范围

- 返回值仍受 JavaScript `number` 的有效位数与数值范围限制；溢出返回正负 `Infinity`，极小结果可能下溢为正负零，无限循环小数仍需舍入。
- 输入值若已在此前计算或转换时丢失精度，无法恢复。例如应写 `add(0.1, 0.2)`，传入已计算的 `0.1 + 0.2` 会保留该误差。
- `sum` 每一步都返回 `number`，`average` 先求和再相除，因此仍可能出现中间结果舍入或溢出。这些函数不提供任意精度计算或金额舍入规则。
