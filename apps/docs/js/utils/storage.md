# localStorage

自动通过 JSON 序列化和解析，读写对象、数组及基本值。

## 基本用法

```ts
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@xxkatt/utils'

setLocalStorage('user', { name: '小明', roles: ['admin'] })
const user = getLocalStorage<{ name: string; roles: string[] }>('user')
console.log(user?.name) // '小明'

setLocalStorage('enabled', false)
getLocalStorage<boolean>('enabled') // false

removeLocalStorage('user')
getLocalStorage('user') // null
```

## 类型签名

```ts
function getLocalStorage<T = unknown>(key: string): T | null
function setLocalStorage(key: string, value: unknown): void
function removeLocalStorage(key: string): void
```

- `getLocalStorage`：键不存在时返回 `null`。默认返回 `unknown`；泛型 `T` 只提供类型提示，不校验存储内容。
- `setLocalStorage`：按 `JSON.stringify` 的规则序列化并覆盖指定键。
- `removeLocalStorage`：删除指定键；键不存在时不报错。

## 数据与错误

- 字符串、数字、布尔值、`null`、数组和普通对象可直接存取。存入 `null` 后读回也是 `null`，与缺失值无法区分。
- 遵循标准 JSON 规则：对象中的 `undefined`、函数和 Symbol 属性被忽略；数组中的这些值以及 `NaN`、`Infinity` 转为 `null`；`Date` 通常转为 ISO 字符串，不会自动还原为 Date。Map、Set 等需要自行转换。
- 根值为 `undefined`、函数或 Symbol，以及包含 BigInt、循环引用等无法序列化的值，会抛出错误，不覆盖已有数据。自定义 `toJSON` 的行为遵循原生 JSON API。
- 读取的原始内容必须是合法 JSON；如果其他代码曾用原生 API 存入未序列化的普通文本，会抛出 `SyntaxError`。例如字符串应存为 `JSON.stringify('hello')`。
- 浏览器存储被禁用、配额不足等错误原样抛出，调用方可用 `try/catch` 处理。
- 模块可在 Node.js / SSR 中安全导入；这三个函数仅能在浏览器页面中调用，非浏览器环境调用会明确报错。

localStorage 按来源隔离，数据通常跨页面会话保留，没有内置过期时间。
