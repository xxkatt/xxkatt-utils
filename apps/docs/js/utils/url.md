# URL

查询参数解析、序列化、读写与删除，以及 hash 读写。所有函数显式接收字符串，可在 Node.js、SSR 和浏览器中使用；修改函数返回新字符串，不改变页面地址。

## 基本用法

```ts
import {
  getQueryParam,
  getQueryParams,
  getUrlHash,
  parseQuery,
  removeQueryParams,
  setQueryParams,
  setUrlHash,
  stringifyQuery,
} from '@xxkatt/utils'

parseQuery('?tag=vue&tag=ts&page=1')
// { tag: ['vue', 'ts'], page: '1' }

stringifyQuery({ q: '你好 world', tag: ['vue', 'ts'], page: 1, preview: false })
// 'q=%E4%BD%A0%E5%A5%BD+world&tag=vue&tag=ts&page=1&preview=false'

const url = '/articles?tag=vue&tag=ts&page=1#list'
getQueryParam(url, 'tag') // 'vue'
getQueryParam(url, 'missing') // null
getQueryParams(url) // { tag: ['vue', 'ts'], page: '1' }

setQueryParams(url, { page: 2, tag: ['js', 'web'] })
// '/articles?page=2&tag=js&tag=web#list'

setQueryParams(url, { page: null, tag: undefined })
// '/articles?tag=vue&tag=ts#list'

removeQueryParams(url, 'tag') // '/articles?page=1#list'
removeQueryParams(url, ['tag', 'page']) // '/articles#list'

getUrlHash(url) // 'list'
setUrlHash(url, '#detail') // '/articles?tag=vue&tag=ts&page=1#detail'
setUrlHash(url, '') // '/articles?tag=vue&tag=ts&page=1'
```

浏览器中操作当前页面地址时，可显式传入 `window.location.href`。如需更新页面地址，再自行调用 History 或 Location API。

## 类型签名

```ts
type QueryValue = string | number | boolean
type QueryParams = Record<string, QueryValue | readonly QueryValue[] | null | undefined>
type ParsedQuery = Record<string, string | string[]>

function parseQuery(query: string): ParsedQuery
function stringifyQuery(params: QueryParams): string
function getQueryParam(url: string, name: string): string | null
function getQueryParams(url: string): ParsedQuery
function setQueryParams(url: string, params: QueryParams): string
function removeQueryParams(url: string, names: string | readonly string[]): string
function getUrlHash(url: string): string
function setUrlHash(url: string, hash: string): string
```

以上类型均可从 `@xxkatt/utils` 导入。

## 查询参数规则

| 输入值               | `stringifyQuery`                        | `setQueryParams`         |
| -------------------- | --------------------------------------- | ------------------------ |
| 字符串、数字、布尔值 | 转为字符串写入，保留 `''`、`0`、`false` | 替换该键的全部旧值       |
| 数组                 | 按顺序生成重复键，例如 `tag=a&tag=b`    | 用数组替换该键的全部旧值 |
| 空数组               | 省略该键                                | 删除该键                 |
| `null`               | 省略该键                                | 删除该键                 |
| `undefined`          | 省略该键                                | 跳过该键，保留已有值     |

- `parseQuery` 只接收查询串，可带前导 `?`；完整 URL 使用 `getQueryParams`。`stringifyQuery` 的结果不带 `?`。
- 单个值解析为字符串；重复键解析为数组，不自动转换数字、布尔值或 JSON。缺失参数读取为 `null`，存在的空值读取为 `''`。
- 使用标准 `URLSearchParams` 编解码：空格序列化为 `+`，字面量加号序列化为 `%2B`；解析时反向转换。非法百分号及 UTF-8 编码按标准容错规则处理，不抛出解码错误。
- 只支持平铺参数和重复键，不解析嵌套对象或方括号语法。`tag[]` 会作为完整的参数名。
- URL 操作支持绝对地址、相对路径、协议相对地址以及仅查询串或 hash 的字符串。按第一个 `#` 和其前的第一个 `?` 划分，不验证 URL 的协议或合法性。
- 查询参数读写只处理 `#` 之前的查询串，不操作 hash 路由内部的参数。
- 设置或删除参数会重新序列化整个查询串，例如 `%20` 变为 `+`、`~` 变为 `%7E`，即使仅跳过或删除不存在的键也可能改变编码形式。被设置的键移到末尾，其余键保持顺序；最终没有参数时移除 `?`。路径和 hash 保持原样。

## hash 规则

- `getUrlHash` 返回第一个 `#` 后的原始内容，不含前导 `#`，不进行百分号解码；缺失或空 hash 返回 `''`。
- `setUrlHash` 接收原始内容，允许带一个前导 `#`；传入 `''` 或 `'#'` 移除 hash。后续的 `#`、`?` 按内容保留。
- hash 读写不进行编码或解码。需要写入编码后的纯文本时，可先调用 `encodeURIComponent`；需要读取解码文本时，可自行调用 `decodeURIComponent` 并处理非法编码。
