import { describe, expect, it } from 'vitest'
import {
  getQueryParam,
  getQueryParams,
  getUrlHash,
  parseQuery,
  removeQueryParams,
  setQueryParams,
  setUrlHash,
  stringifyQuery,
} from '@/index'

describe('parseQuery / stringifyQuery', () => {
  it('解析带或不带 ? 的查询串，重复键按顺序保留', () => {
    const expected = { tag: ['one', 'two', 'three'], empty: '', flag: '', value: 'a=b' }
    const query = 'tag=one&tag=two&tag=three&empty=&flag&value=a=b'

    expect(parseQuery(query)).toEqual(expected)
    expect(parseQuery(`?${query}`)).toEqual(expected)
    expect(parseQuery('')).toEqual({})
    expect(parseQuery('?')).toEqual({})
  })

  it('按 URLSearchParams 规则解码，区分空格与字面量加号', () => {
    expect(
      parseQuery('%E7%94%A8%E6%88%B7=%E4%BD%A0%E5%A5%BD+world&plus=%2B&encoded=%26%3D%23'),
    ).toEqual({ 用户: '你好 world', plus: '+', encoded: '&=#' })
    expect(parseQuery('bad=%E0%A4%A&percent=%&number=1&bool=false')).toEqual({
      bad: '\uFFFD%A',
      percent: '%',
      number: '1',
      bool: 'false',
    })
  })

  it('原型相关键作为普通自有属性保留，不修改对象原型', () => {
    const result = parseQuery('__proto__=one&__proto__=two&constructor=value&toString=text')

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(result['__proto__']).toEqual(['one', 'two'])
    expect(result['constructor']).toBe('value')
    expect(result['toString']).toBe('text')
    expect(parseQuery(stringifyQuery(result))).toEqual(result)
  })

  it('序列化基本类型和只读数组，保留零、false 与空字符串', () => {
    const tags = ['a', 'b'] as const
    expect(
      stringifyQuery({ count: 0, enabled: false, empty: '', tag: tags, mixed: [1, true, 'x'] }),
    ).toBe('count=0&enabled=false&empty=&tag=a&tag=b&mixed=1&mixed=true&mixed=x')
    expect(tags).toEqual(['a', 'b'])
  })

  it('编码名称和值，中文、空格、加号和分隔符可往返', () => {
    const params = { '用户&=': '你好 + & = # %', tag: ['a b', 'a+b'] }
    const query = stringifyQuery(params)

    expect(query).toBe(
      '%E7%94%A8%E6%88%B7%26%3D=%E4%BD%A0%E5%A5%BD+%2B+%26+%3D+%23+%25&tag=a+b&tag=a%2Bb',
    )
    expect(parseQuery(query)).toEqual(params)
  })

  it('省略 null、undefined、空数组，不修改传入对象', () => {
    const params = { a: null, b: undefined, c: [] }

    expect(stringifyQuery(params)).toBe('')
    expect(stringifyQuery({})).toBe('')
    expect(params).toEqual({ a: null, b: undefined, c: [] })
  })
})

describe('getQueryParam / getQueryParams', () => {
  it('只去掉查询串分隔符，保留参数名中的额外问号', () => {
    expect(getQueryParam('/path??name=value#part', '?name')).toBe('value')
    expect(getQueryParams('/path??name=value#part')).toEqual({ '?name': 'value' })
    expect(setQueryParams('/path??name=value#part', { page: 1 })).toBe(
      '/path?%3Fname=value&page=1#part',
    )
  })

  it('精确读取首个同名值，区分缺失值与空值', () => {
    const url = 'https://example.com/path?userId=1&user=first&user=second&empty=#user=hash'

    expect(getQueryParam(url, 'user')).toBe('first')
    expect(getQueryParam(url, 'empty')).toBe('')
    expect(getQueryParam(url, 'missing')).toBeNull()
    expect(getQueryParam(url, 'use')).toBeNull()
    expect(getQueryParams(url)).toEqual({ userId: '1', user: ['first', 'second'], empty: '' })
  })

  it.each(['', '/path', 'https://example.com', '/path#/route?only=hash'])(
    '无查询串时不读取 hash 中的参数：%s',
    (url) => {
      expect(getQueryParams(url)).toEqual({})
      expect(getQueryParam(url, 'only')).toBeNull()
    },
  )

  it.each(['/path', '../path', 'path', '//example.com/path', ''])(
    '读取相对地址和仅查询串地址：%s',
    (path) => {
      expect(getQueryParams(`${path}?q=%E4%BD%A0%E5%A5%BD#section?ignored=1`)).toEqual({
        q: '你好',
      })
    },
  )
})

describe('setQueryParams / removeQueryParams', () => {
  it('合并参数，覆盖全部同名项，保留其他参数、路径和 hash', () => {
    const url = 'https://EXAMPLE.com:443/a%2Fb?tag=old&keep=1&tag=older#route?x=1'
    const params = { tag: ['new', 'two'], page: 0, enabled: false }
    const result = setQueryParams(url, params)

    expect(result).toBe(
      'https://EXAMPLE.com:443/a%2Fb?keep=1&tag=new&tag=two&page=0&enabled=false#route?x=1',
    )
    expect(params).toEqual({ tag: ['new', 'two'], page: 0, enabled: false })
  })

  it('null 与空数组删除，undefined 保留原值，空字符串写入空值', () => {
    expect(
      setQueryParams('/path?a=1&b=2&c=3&d=4', {
        a: null,
        b: [],
        c: undefined,
        d: '',
        missing: undefined,
      }),
    ).toBe('/path?c=3&d=')
  })

  it.each(['/path', '../path', 'path', '//example.com/path', ''])(
    '无查询串时添加参数，保留原地址形式：%s',
    (path) => {
      expect(setQueryParams(`${path}#part`, { q: 'a+b & 中' })).toBe(
        `${path}?q=a%2Bb+%26+%E4%B8%AD#part`,
      )
    },
  )

  it('只修改 # 之前的查询串，保留 hash 内的 ? 和 #', () => {
    expect(setQueryParams('/path#/route?tag=old#nested', { tag: 'new' })).toBe(
      '/path?tag=new#/route?tag=old#nested',
    )
    expect(setQueryParams('/path?#', { empty: '' })).toBe('/path?empty=#')
  })

  it('删除单个或多个键的全部同名项，删除最后一项时移除 ?', () => {
    const url = '/path?a=1&b=2&a=3#part'

    expect(removeQueryParams(url, 'a')).toBe('/path?b=2#part')
    expect(removeQueryParams(url, ['a', 'b'] as const)).toBe('/path#part')
    expect(removeQueryParams(url, 'missing')).toBe(url)
    expect(removeQueryParams('/path#part', 'a')).toBe('/path#part')
    expect(setQueryParams('/path?a=1#part', { a: null })).toBe('/path#part')
  })

  it('修改查询参数时按标准重新编码已有查询串', () => {
    expect(setQueryParams('/path?q=a%20b&symbol=~#%E4%B8%AD', { page: 1 })).toBe(
      '/path?q=a+b&symbol=%7E&page=1#%E4%B8%AD',
    )
  })

  it('支持空名称和原型相关名称', () => {
    const params = parseQuery('__proto__=new&constructor=value&=empty')

    expect(getQueryParams(setQueryParams('/path?__proto__=old', params))).toEqual(params)
    expect(removeQueryParams('/path?__proto__=old&keep=1', '__proto__')).toBe('/path?keep=1')
  })
})

describe('getUrlHash / setUrlHash', () => {
  it('读取原始 hash，不解码，保留后续 #、? 和加号', () => {
    expect(getUrlHash('/path?q=1#%E4%B8%AD+文?x=1#nested')).toBe('%E4%B8%AD+文?x=1#nested')
    expect(getUrlHash('/path?q=%23')).toBe('')
    expect(getUrlHash('/path#')).toBe('')
    expect(getUrlHash('')).toBe('')
  })

  it('设置或替换原始 hash，可传入前导 #，保留路径和原始查询串', () => {
    expect(setUrlHash('/path?q=a%20b#old', '#/route?x=1#nested')).toBe(
      '/path?q=a%20b#/route?x=1#nested',
    )
    expect(setUrlHash('../path', '中文%20+')).toBe('../path#中文%20+')
    expect(setUrlHash('', 'part')).toBe('#part')
    expect(setUrlHash('/path', '##part')).toBe('/path##part')
  })

  it('空字符串或单独 # 移除 hash', () => {
    expect(setUrlHash('/path?q=1#old#nested', '')).toBe('/path?q=1')
    expect(setUrlHash('/path#old', '#')).toBe('/path')
    expect(setUrlHash('/path', '')).toBe('/path')
  })
})
