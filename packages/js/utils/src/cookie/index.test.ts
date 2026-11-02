import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCookie, removeCookie, setCookie } from '@/index'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getCookie', () => {
  it('精确匹配名称，保留值中的等号、空值和加号', () => {
    vi.stubGlobal('document', { cookie: 'userId=1; user=a=b=c; empty=; plus=a+b' })

    expect(getCookie('user')).toBe('a=b=c')
    expect(getCookie('empty')).toBe('')
    expect(getCookie('plus')).toBe('a+b')
    expect(getCookie('missing')).toBeNull()
    expect(getCookie('use')).toBeNull()
  })

  it('解码名称和值，正确处理中文及分隔符', () => {
    vi.stubGlobal('document', {
      cookie: `${encodeURIComponent('用户;=')}=${encodeURIComponent('你好; = % +')}; other=1`,
    })

    expect(getCookie('用户;=')).toBe('你好; = % +')
  })

  it('空 cookie 返回 null', () => {
    vi.stubGlobal('document', { cookie: '' })

    expect(getCookie('user')).toBeNull()
  })

  it('非法百分号编码保留原值，不影响其他 cookie', () => {
    vi.stubGlobal('document', { cookie: 'bad=%E0%A4%A; valid=ok' })

    expect(getCookie('bad')).toBe('%E0%A4%A')
    expect(getCookie('valid')).toBe('ok')
  })
})

describe('setCookie / removeCookie', () => {
  it('仅写入一个 cookie，编码名称和值，默认使用根路径和会话有效期', () => {
    const write = vi.fn()
    vi.stubGlobal('document', {
      set cookie(value: string) {
        write(value)
      },
    })

    setCookie('用户;=', '你好; = % +')

    expect(write).toHaveBeenCalledExactlyOnceWith(
      `${encodeURIComponent('用户;=')}=${encodeURIComponent('你好; = % +')}; Path=/`,
    )
  })

  it('支持自定义路径、域名、过期时间及安全属性，maxAge 的单位为秒', () => {
    const document = { cookie: '' }
    vi.stubGlobal('document', document)

    setCookie('token', 'abc', {
      path: '/app',
      domain: 'example.com',
      expires: new Date('2030-01-01T00:00:00Z'),
      maxAge: 3600,
      secure: true,
      sameSite: 'none',
    })

    expect(document.cookie).toBe(
      'token=abc; Path=/app; Domain=example.com; Expires=Tue, 01 Jan 2030 00:00:00 GMT; Max-Age=3600; Secure; SameSite=none',
    )
  })

  it('支持零和负数 maxAge，且 secure=false 时不添加 Secure', () => {
    const document = { cookie: '' }
    vi.stubGlobal('document', document)

    setCookie('token', '', { maxAge: 0, secure: false, sameSite: 'lax' })
    expect(document.cookie).toBe('token=; Path=/; Max-Age=0; SameSite=lax')

    setCookie('token', '', { maxAge: -1, sameSite: 'strict' })
    expect(document.cookie).toBe('token=; Path=/; Max-Age=-1; SameSite=strict')
  })

  it('删除时使用根路径，允许指定与写入一致的路径和域名', () => {
    const document = { cookie: '' }
    vi.stubGlobal('document', document)

    removeCookie('用户')
    expect(document.cookie).toBe(`${encodeURIComponent('用户')}=; Path=/; Max-Age=0`)

    removeCookie('token', { path: '/app', domain: 'example.com' })
    expect(document.cookie).toBe('token=; Path=/app; Domain=example.com; Max-Age=0')
  })

  it.each([NaN, Infinity, -Infinity, 1.5])('无效 maxAge 抛错且不写入：%s', (maxAge) => {
    const document = { cookie: 'existing=1' }
    vi.stubGlobal('document', document)

    expect(() => setCookie('token', 'abc', { maxAge })).toThrow(TypeError)
    expect(document.cookie).toBe('existing=1')
  })

  it('无效过期日期抛错且不写入', () => {
    const document = { cookie: 'existing=1' }
    vi.stubGlobal('document', document)

    expect(() => setCookie('token', 'abc', { expires: new Date(NaN) })).toThrow(TypeError)
    expect(document.cookie).toBe('existing=1')
  })

  it.each([{ path: '/; Secure' }, { domain: 'example.com; Path=/' }, { path: '/\r\n' }])(
    '拒绝路径或域名中的属性注入：%j',
    (options) => {
      const document = { cookie: 'existing=1' }
      vi.stubGlobal('document', document)

      expect(() => setCookie('token', 'abc', options)).toThrow(TypeError)
      expect(document.cookie).toBe('existing=1')
    },
  )
})

it('cookie 函数在非浏览器环境调用时明确报错', () => {
  vi.stubGlobal('document', undefined)

  expect(() => getCookie('key')).toThrow('require a browser environment')
  expect(() => setCookie('key', 'value')).toThrow('require a browser environment')
  expect(() => removeCookie('key')).toThrow('require a browser environment')
})
