# uuid

生成 UUID v4，默认返回不含横杠的 32 个小写十六进制字符，支持保留标准横杠和添加前缀。

## 基本用法

```ts
import { uuid } from '@xxkatt/utils'

uuid()
// 示例：'00112233445546778899aabbccddeeff'

uuid('', true)
// 示例：'00112233-4455-4677-8899-aabbccddeeff'

uuid('user_')
// 示例：'user_00112233445546778899aabbccddeeff'

uuid('user_', true)
// 示例：'user_00112233-4455-4677-8899-aabbccddeeff'
```

以上输出仅为格式示例，每次调用都会重新生成随机值。

## 类型签名

```ts
function uuid(prefix?: string, hyphens?: boolean): string
```

## 参数

| 参数      | 类型      | 默认值  | 说明                                       |
| --------- | --------- | ------- | ------------------------------------------ |
| `prefix`  | `string`  | `''`    | 原样拼接在 UUID 前的前缀，分隔符需自行提供 |
| `hyphens` | `boolean` | `false` | 是否保留标准 UUID 中的横杠                 |

## 返回值

返回 `string`。不计前缀时，默认长度为 32；`hyphens` 为 `true` 时长度为 36，格式为 `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`，其中 `y` 为 `8`、`9`、`a` 或 `b`。

## 注意事项

- 前缀不会自动补充分隔符。`uuid('user')` 会直接以 `user` 开头；需要下划线时请传入 `'user_'`。
- 无需前缀但要保留横杠时，可调用 `uuid('', true)` 或 `uuid(undefined, true)`。
- 需要自定义长度或字符范围时，使用 [randomId](./random-id)。
