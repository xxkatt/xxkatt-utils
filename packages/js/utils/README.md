# @xxkatt/utils

常用的 JavaScript / TypeScript 工具函数，提供 ESM 导出和 TypeScript 类型声明，无运行时依赖。

## 安装

```sh
pnpm add @xxkatt/utils
```

## 使用

```ts
import { randomId, uuid } from '@xxkatt/utils'

uuid() // 32 位 UUID v4，不带横杠
uuid('', true) // 标准 UUID v4：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
uuid('user_') // 添加前缀：user_…
uuid('user_', true) // 添加前缀并保留横杠

randomId() // 32 个随机的小写十六进制字符
randomId(8, 10) // 8 位随机数字，可能以 0 开头
randomId(21, 62) // 21 个随机字符，字符来自 0–9、a–z、A–Z
```

## API

### uuid(prefix?, hyphens?)

生成 UUID v4，返回 `string`。

| 参数      | 类型      | 默认值  | 说明                                 |
| --------- | --------- | ------- | ------------------------------------ |
| `prefix`  | `string`  | `''`    | 原样拼接在 UUID 前，分隔符需自行提供 |
| `hyphens` | `boolean` | `false` | 是否保留标准 UUID 中的横杠           |

不计前缀时，默认返回 32 个小写十六进制字符；保留横杠时长度为 36。

### randomId(length?, radix?)

使用加密安全随机数生成自定义 ID，返回 `string`。

| 参数     | 类型     | 默认值 | 说明                                           |
| -------- | -------- | ------ | ---------------------------------------------- |
| `length` | `number` | `32`   | 字符数量，必须为非负安全整数；`0` 返回空字符串 |
| `radix`  | `number` | `16`   | 基数，必须为 `2` 至 `62` 的整数（含边界）      |

字符表为 `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`，使用其中前 `radix` 个字符。参数不符合要求时抛出 `RangeError`；`length` 为 `0` 时仍会校验 `radix`。

自定义 ID 不遵循 UUID 格式，随机结果可能重复。需要标准 UUID v4 时请使用 `uuid`。

## 运行环境

支持 Node.js 24+，以及支持 Web Crypto API 和 ES2022 的现代浏览器。

- `uuid` 依赖 `globalThis.crypto.randomUUID()`；浏览器中需要 HTTPS 或 localhost 等安全上下文。
- `randomId` 依赖 `globalThis.crypto.getRandomValues()`。
- 通过 ESM `import` 使用。

## 文档与反馈

- [完整 API 文档](https://github.com/xxkatt/xxkatt-utils/tree/master/apps/docs/js/utils)
- [源码仓库](https://github.com/xxkatt/xxkatt-utils)
- [问题反馈](https://github.com/xxkatt/xxkatt-utils/issues)

## 许可证

[MIT](./LICENSE) © 2026 xxkatt
