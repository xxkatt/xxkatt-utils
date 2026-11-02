# cookie

读写和删除浏览器页面可访问的 cookie。名称和值自动进行百分号编码，值始终为字符串。

## 基本用法

```ts
import { getCookie, removeCookie, setCookie } from '@xxkatt/utils'

// 默认 Path=/，省略有效期时创建会话 cookie
setCookie('theme', 'dark')
getCookie('theme') // 'dark'
getCookie('missing') // null

setCookie('language', '中文', {
  maxAge: 60 * 60 * 24 * 7, // 秒：7 天
  sameSite: 'lax',
  secure: true, // HTTPS 页面
})

removeCookie('theme')

// 删除时需使用与写入时一致的 path / domain
setCookie('preference', 'compact', { path: '/app', domain: 'example.com' })
removeCookie('preference', { path: '/app', domain: 'example.com' })
```

## 类型签名

```ts
interface CookieOptions {
  path?: string
  domain?: string
  expires?: Date
  maxAge?: number
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

function getCookie(name: string): string | null
function setCookie(name: string, value: string, options?: CookieOptions): void
function removeCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void
```

`CookieOptions` 可从 `@xxkatt/utils` 导入为类型。

## 写入选项

| 选项       | 说明                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| `path`     | 默认 `/`。设置 cookie 的路径作用域                                                    |
| `domain`   | 默认省略，使用当前主机；指定时必须符合浏览器的域名限制                                |
| `expires`  | 有效的 Date，表示绝对过期时间                                                         |
| `maxAge`   | 有限整数，单位为秒；零或负数使 cookie 过期；与 `expires` 同时设置时优先               |
| `secure`   | 为 `true` 时添加 Secure，一般用于 HTTPS 页面                                          |
| `sameSite` | `strict`、`lax` 或 `none`；省略时由浏览器决定。`none` 通常需要同时设置 `secure: true` |

## 返回值与注意事项

- `getCookie` 精确匹配名称，返回解码后的字符串。缺失时返回 `null`，空值返回 `''`；非法百分号编码保留原字符串，`+` 保留为加号。
- `setCookie`、`removeCookie` 返回 `void`；浏览器可能因域名、大小或隐私策略等拒绝写入，返回不代表写入成功。
- `removeCookie` 写入同名、同作用域的 `Max-Age=0` cookie。若原 cookie 使用自定义路径或域名，删除时需要传入相同选项。
- 同名 cookie 可存在于不同路径或域名中，读取返回 `document.cookie` 中第一个匹配值；浏览器不提供其路径与域名信息。
- 路径和域名不能包含分号或控制字符，无效日期和非整数 `maxAge` 会抛出 `TypeError`。
- JavaScript 无法读取或设置 HttpOnly cookie；对象值需自行 `JSON.stringify` / `JSON.parse`。
- 模块可在 Node.js / SSR 中安全导入；函数仅能在浏览器页面中调用，非浏览器环境调用会明确报错。
