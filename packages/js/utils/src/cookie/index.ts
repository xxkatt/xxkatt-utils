export interface CookieOptions {
  /** 默认 /。删除 cookie 时需使用与写入时一致的路径。 */
  path?: string
  /** 省略时使用当前主机。 */
  domain?: string
  /** 绝对过期时间；与 maxAge 同时设置时，maxAge 优先。 */
  expires?: Date
  /** 有效期，单位为秒，必须是有限整数。 */
  maxAge?: number
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

function getCookieDocument(): Document {
  if (typeof document === 'undefined') {
    throw new Error('cookie helpers require a browser environment')
  }
  return document
}

/** 读取并解码 cookie；不存在时返回 null，非法百分号编码保留原值。 */
export function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  for (const cookie of getCookieDocument().cookie.split(';')) {
    const entry = cookie.trim()
    if (!entry.startsWith(prefix)) continue
    const value = entry.slice(prefix.length)
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  return null
}

/** 编码并写入字符串 cookie；省略有效期时创建会话 cookie。 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const cookieDocument = getCookieDocument()
  const { path = '/', domain, expires, maxAge, secure, sameSite } = options
  const attributes = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]
  // 路径和域名直接用于属性值，禁止分隔符与控制字符注入其他属性。
  for (const attribute of [path, domain]) {
    // oxlint-disable-next-line no-control-regex -- 此处用于拒绝控制字符。
    if (attribute !== undefined && /[;\u0000-\u001f\u007f]/.test(attribute)) {
      throw new TypeError('Cookie path and domain cannot contain semicolons or control characters')
    }
  }
  attributes.push(`Path=${path}`)
  if (domain !== undefined) attributes.push(`Domain=${domain}`)
  if (expires !== undefined) {
    if (!Number.isFinite(expires.getTime())) throw new TypeError('Invalid cookie expiration date')
    attributes.push(`Expires=${expires.toUTCString()}`)
  }
  if (maxAge !== undefined) {
    if (!Number.isInteger(maxAge)) throw new TypeError('Cookie maxAge must be a finite integer')
    attributes.push(`Max-Age=${maxAge}`)
  }
  if (secure) attributes.push('Secure')
  if (sameSite !== undefined) attributes.push(`SameSite=${sameSite}`)
  cookieDocument.cookie = attributes.join('; ')
}

/** 通过 Max-Age=0 删除 cookie；path 和 domain 需与写入时一致。 */
export function removeCookie(
  name: string,
  options: Pick<CookieOptions, 'path' | 'domain'> = {},
): void {
  setCookie(name, '', { ...options, maxAge: 0 })
}
