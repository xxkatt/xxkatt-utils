# is

类型判断、判空和常用格式校验。所有函数均从 `@xxkatt/utils` 导入，无运行时依赖。

## 基本用法

```ts
import {
  isString,
  isDefined,
  isNil,
  isEmpty,
  isAllEmpty,
  isUrl,
  isEmail,
  isPhone,
} from '@xxkatt/utils'

function greet(value: unknown) {
  if (isString(value)) {
    // value 已收窄为 string。
    return value.toUpperCase()
  }
}

const values = ['hello', undefined, null].filter(isDefined)
// 类型为 (string | null)[]，结果为 ['hello', null]。

isNil(null) // true
isEmpty([]) // true
isEmpty(null) // false
isAllEmpty(null) // true

isUrl('https://example.com/path') // true
isEmail('user+tag@example.com') // true
isPhone('13800138000') // true
```

## 类型判断

以下函数均接收一个 `unknown` 值并返回布尔值；返回 `true` 时，可在 TypeScript 中收窄为表中的类型。

| 函数            | 收窄类型                        | 判断规则                                                                                    |
| --------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `isString`      | `string`                        | 原始字符串，包含空字符串                                                                    |
| `isNumber`      | `number`                        | 原始数字，包含 `NaN`、`Infinity`                                                            |
| `isBoolean`     | `boolean`                       | 原始布尔值                                                                                  |
| `isBigInt`      | `bigint`                        | 原始 BigInt                                                                                 |
| `isSymbol`      | `symbol`                        | 原始 Symbol                                                                                 |
| `isUndefined`   | `undefined`                     | 严格等于 `undefined`                                                                        |
| `isNull`        | `null`                          | 严格等于 `null`                                                                             |
| `isNil`         | `null \| undefined`             | 为 `null` 或 `undefined`                                                                    |
| `isObject`      | `object`                        | 非 `null` 且 `typeof` 为 `'object'`，包含数组和类实例，排除函数                             |
| `isPlainObject` | `Record<PropertyKey, unknown>`  | 普通对象，包含对象字面量、`new Object()`、`Object.create(null)`，排除类实例和自定义原型对象 |
| `isArray`       | `unknown[]`                     | 使用 `Array.isArray`，不检查元素类型                                                        |
| `isFunction`    | `(...args: never[]) => unknown` | `typeof` 为 `'function'`，包含异步函数和生成器函数                                          |
| `isDate`        | `Date`                          | `Date` 类型，包含 `Invalid Date`                                                            |
| `isRegExp`      | `RegExp`                        | 正则表达式类型                                                                              |
| `isMap`         | `Map<unknown, unknown>`         | Map 类型，不检查键和值的类型                                                                |
| `isSet`         | `Set<unknown>`                  | Set 类型，不检查元素类型                                                                    |
| `isPromise`     | `PromiseLike<unknown>`          | 对象或函数具有可调用的 `then` 方法，包含原生 Promise 和 thenable                            |

`isDefined` 保留输入的泛型类型，仅排除 `undefined`，不排除 `null`：

```ts
function isDefined<T>(value: T): value is Exclude<T, undefined>
```

原始值判断不包含包装对象，例如 `isNumber(new Number(1))` 返回 `false`。需要检查有限数字或有效日期时，可结合 `Number.isFinite(value)` 或 `Number.isNaN(value.getTime())`。

`isFunction` 只识别函数类型，不验证调用签名；参数使用 `never[]`，避免将未知函数视为可接收任意参数的函数。调用前应通过具体的类型约定确定参数和返回值。JavaScript 类的 `typeof` 也是 `'function'`，此判断不保证可以不使用 `new` 调用。

`isPromise` 不执行 `then`，也不要求存在 `.catch()` 或 `.finally()`。可以使用 `Promise.resolve(value)` 将 thenable 转换为原生 Promise。

### 通用类型标签

```ts
function is(value: unknown, type: string): boolean

is([], 'Array') // true
is(null, 'Null') // true
is(undefined, 'Undefined') // true
is(new Date(), 'Date') // true
is(1, 'number') // false，标签区分大小写，应传入 'Number'。
```

`is` 根据 `Object.prototype.toString` 的标签判断，返回普通 `boolean`，不收窄类型。`isDate`、`isRegExp`、`isMap`、`isSet` 也使用类型标签，支持跨 realm（如 iframe）对象。类型标签可以被 `Symbol.toStringTag` 自定义，因此这些判断适合日常开发，不用于验证对象的真实性或校验外部数据结构。

### JSON 字符串

```ts
function isJSON(value: unknown): boolean

isJSON('{"name":"hello"}') // true
isJSON('null') // true
isJSON('42') // true
isJSON('"hello"') // true
isJSON('{name:"hello"}') // false
isJSON({ name: 'hello' }) // false，仅接受字符串。
```

使用 `JSON.parse` 检查语法，包含对象、数组和所有合法 JSON 原始值；允许 JSON 文本两侧的空白。此函数不校验解析结果的字段、结构或业务规则。

## 判空

```ts
function isEmpty(value: unknown): boolean
function isAllEmpty(value: unknown): boolean
```

| 输入                                       | `isEmpty` | `isAllEmpty` |
| ------------------------------------------ | --------- | ------------ |
| `''`、`[]`、`{}`、空 Map、空 Set           | `true`    | `true`       |
| `null`、`undefined`                        | `false`   | `true`       |
| `' '`、`[undefined]`、`{ key: undefined }` | `false`   | `false`      |
| `0`、`false`、`NaN`、函数、Date、类实例    | `false`   | `false`      |

- 字符串和数组检查 `length`；不删除空白、不递归检查内容。`new Array(1)` 长度为 1，返回 `false`。
- Map 和 Set 检查 `size`。
- 普通对象检查自有可枚举属性，包含 Symbol 属性，忽略不可枚举属性。
- 其他类型一律返回 `false`，例如空 TypedArray、WeakMap、WeakSet。

## 常用格式校验

```ts
function isUrl(value: unknown): boolean
function isEmail(value: unknown): boolean
function isPhone(value: unknown): boolean
```

三个函数均仅接受原始字符串参与校验，返回布尔值；数字、`null`、`undefined` 等输入直接返回 `false`。不自动转换类型或删除首尾空白。

### URL

`isUrl` 使用原生 `URL` 解析绝对 HTTP(S) 地址；允许域名、IP、localhost、端口、路径、查询参数和片段。拒绝相对地址、协议相对地址、其他协议、原始空白字符和反斜杠。

```ts
isUrl('https://example.com?q=hello%20world') // true
isUrl('http://localhost:3000') // true
isUrl('/api/users') // false
isUrl('//example.com') // false
isUrl('javascript:alert(1)') // false
```

此函数不检查地址是否可访问，也不限制目标主机或 URL 中的凭据。

### 邮箱

`isEmail` 校验常用 ASCII 邮箱格式，支持本地部分中的点号和 `+` 标签，域名至少包含一个点，末尾为至少两个英文字母。拒绝连续点号、首尾点号、本地部分为空、域名标签首尾为连字符等格式。

```ts
isEmail('user.name+tag@sub.example.com') // true
isEmail('user..name@example.com') // false
isEmail('user@localhost') // false
```

此函数不覆盖完整 RFC 邮箱语法，不验证邮箱是否存在或能否收信。

### 手机号

`isPhone` 校验中国大陆 11 位手机号格式：第一位为 `1`，第二位为 `3–9`，其余为数字。不接受 `+86`、空格或横杠。

```ts
isPhone('13800138000') // true
isPhone('+8613800138000') // false
isPhone(13800138000) // false，应传入字符串。
```

此函数不验证运营商号段是否已分配、号码是否存在或是否属于当前用户。
