# randomId

使用加密安全随机数生成指定长度、指定基数的 ID。自定义 ID 不遵循 UUID 格式。

## 基本用法

```ts
import { randomId } from '@xxkatt/utils'

randomId()
// 示例：'0123456789abcdef0123456789abcdef'（32 个小写十六进制字符）

randomId(8, 10)
// 示例：'03928471'（8 个数字字符，可能以 0 开头）

randomId(21, 62)
// 示例：'aB3dE5fG7hJ9kL1mN2pQ4'（21 个数字或大小写字母）

randomId(0)
// ''
```

以上非空输出仅为格式示例，每次调用都会重新生成随机值。

## 类型签名

```ts
function randomId(length?: number, radix?: number): string
```

## 参数

| 参数     | 类型     | 默认值 | 说明                                           |
| -------- | -------- | ------ | ---------------------------------------------- |
| `length` | `number` | `32`   | 字符数量，必须为非负安全整数；`0` 返回空字符串 |
| `radix`  | `number` | `16`   | 基数，必须为 `2` 至 `62` 的整数（含边界）      |

字符表依次为 `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`，使用其中前 `radix` 个字符：

| 基数 | 字符范围            |
| ---- | ------------------- |
| `2`  | `0–1`               |
| `10` | `0–9`               |
| `16` | `0–9`、`a–f`        |
| `36` | `0–9`、`a–z`        |
| `62` | `0–9`、`a–z`、`A–Z` |

## 返回值

返回长度为 `length` 的 `string`。默认返回 32 个小写十六进制字符，但不包含 UUID 的版本与变体约束。

## 异常与边界行为

- `length` 为负数、小数、`NaN`、无穷值或超出安全整数范围时，抛出 `RangeError`。
- `radix` 不是 `2` 至 `62` 的整数时，抛出 `RangeError`。
- `length` 为 `0` 时仍会校验 `radix`。例如 `randomId(0, 1)` 会抛出 `RangeError`。
- 依赖 `globalThis.crypto.getRandomValues()`，通过丢弃不能均分到字符表的随机值来避免取模偏差。
- 随机 ID 仍可能重复，长度越短、字符范围越小，重复概率越高。需要标准 UUID v4 格式时，使用 [uuid](./uuid)。
