import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  is,
  isAllEmpty,
  isArray,
  isBigInt,
  isBoolean,
  isDate,
  isDefined,
  isEmail,
  isEmpty,
  isFunction,
  isJSON,
  isMap,
  isNil,
  isNull,
  isNumber,
  isObject,
  isPhone,
  isPlainObject,
  isPromise,
  isRegExp,
  isSet,
  isString,
  isSymbol,
  isUndefined,
  isUrl,
} from '@/index'

describe('类型判断', () => {
  it.each([
    [null, 'Null'],
    [undefined, 'Undefined'],
    [[], 'Array'],
    [{}, 'Object'],
    [new Date(), 'Date'],
    [new Map(), 'Map'],
    [new Set(), 'Set'],
    [NaN, 'Number'],
  ])('通过标签判断 %s 的类型 %s', (value, type) => {
    expect(is(value, type as string)).toBe(true)
    expect(is(value, 'String')).toBe(false)
  })

  it('标签区分大小写，不自动推断类型', () => {
    expect(is('hello', 'String')).toBe(true)
    expect(is('hello', 'string')).toBe(false)
    expectTypeOf(is('hello', 'String')).toEqualTypeOf<boolean>()
  })

  it.each<[string, (value: unknown) => boolean, unknown[], unknown[]]>([
    ['isString', isString, ['', 'hello'], [null, undefined, 1, new String('hello')]],
    ['isNumber', isNumber, [0, -1, NaN, Infinity], ['1', 1n, new Number(1)]],
    ['isBoolean', isBoolean, [true, false], [0, 'true', new Boolean(false)]],
    ['isBigInt', isBigInt, [0n, 1n], [0, '1']],
    ['isSymbol', isSymbol, [Symbol(), Symbol.for('key')], ['key', Object(Symbol())]],
    ['isUndefined', isUndefined, [undefined], [null, false, 0, '']],
    ['isDefined', isDefined, [null, false, 0, ''], [undefined]],
    ['isNull', isNull, [null], [undefined, false, 0, '']],
    ['isNil', isNil, [null, undefined], [false, 0, '', NaN]],
    [
      'isObject',
      isObject,
      [{}, [], new Date(), new Map(), Object.create(null)],
      [null, 1, () => {}],
    ],
    ['isArray', isArray, [[], [1]], [{ length: 0 }, new Uint8Array(), null]],
    ['isDate', isDate, [new Date(), new Date(NaN)], ['2026-10-30', {}, null]],
    ['isRegExp', isRegExp, [/a/, new RegExp('a')], ['/a/', {}, null]],
    ['isMap', isMap, [new Map()], [new WeakMap(), { size: 0 }, null]],
    ['isSet', isSet, [new Set()], [new WeakSet(), { size: 0 }, null]],
    [
      'isFunction',
      isFunction,
      [() => {}, async () => {}, function* () {}],
      [{ call: () => {} }, null, 'function'],
    ],
  ])('%s 接受目标类型并拒绝其他类型', (_name, check, positives, negatives) => {
    for (const value of positives) expect(check(value)).toBe(true)
    for (const value of negatives) expect(check(value)).toBe(false)
  })

  it('普通对象排除类实例和自定义原型对象', () => {
    class Example {}
    for (const value of [{}, new Object(), Object.create(null)]) {
      expect(isPlainObject(value)).toBe(true)
    }
    for (const value of [new Example(), Object.create({}), [], new Date(), null, () => {}]) {
      expect(isPlainObject(value)).toBe(false)
    }
  })

  it('识别跨 realm 的数组、普通对象及内置对象', async () => {
    const { runInNewContext } = await vi.importActual<{
      runInNewContext(code: string): Record<string, unknown>
    }>('node:vm')
    const values = runInNewContext(
      '({ array: [], object: {}, date: new Date(), regex: /a/, map: new Map(), set: new Set() })',
    )
    expect(isArray(values.array)).toBe(true)
    expect(isPlainObject(values.object)).toBe(true)
    expect(isDate(values.date)).toBe(true)
    expect(isRegExp(values.regex)).toBe(true)
    expect(isMap(values.map)).toBe(true)
    expect(isSet(values.set)).toBe(true)
  })

  /* oxlint-disable unicorn/no-thenable -- 专门测试 thenable，不 await 测试对象。 */
  it('识别 Promise 和 thenable，不执行 then 方法', () => {
    const thenable = {
      then: () => {
        throw new Error('不应执行')
      },
    }
    const fn = Object.assign(() => {}, { then: () => {} })
    for (const value of [Promise.resolve(1), thenable, fn, Object.create(thenable)]) {
      expect(isPromise(value)).toBe(true)
    }
    for (const value of [null, undefined, 1, {}, { then: true }, { catch: () => {} }]) {
      expect(isPromise(value)).toBe(false)
    }
  })
  /* oxlint-enable unicorn/no-thenable */

  it('在条件分支和 filter 中收窄类型', () => {
    const values: unknown[] = [
      'text',
      1,
      true,
      1n,
      Symbol(),
      null,
      undefined,
      [],
      {},
      new Date(),
      /a/,
      new Map(),
      new Set(),
      Promise.resolve(1),
    ]
    expectTypeOf(values.filter(isString)).toEqualTypeOf<string[]>()
    expectTypeOf(values.filter(isNumber)).toEqualTypeOf<number[]>()
    expectTypeOf(values.filter(isBoolean)).toEqualTypeOf<boolean[]>()
    expectTypeOf(values.filter(isBigInt)).toEqualTypeOf<bigint[]>()
    expectTypeOf(values.filter(isSymbol)).toEqualTypeOf<symbol[]>()
    expectTypeOf(values.filter(isNull)).toEqualTypeOf<null[]>()
    expectTypeOf(values.filter(isUndefined)).toEqualTypeOf<undefined[]>()
    expectTypeOf(values.filter(isNil)).toEqualTypeOf<(null | undefined)[]>()
    expectTypeOf(values.filter(isObject)).toEqualTypeOf<object[]>()
    expectTypeOf(values.filter(isPlainObject)).toEqualTypeOf<Record<PropertyKey, unknown>[]>()
    expectTypeOf(values.filter(isArray)).toEqualTypeOf<unknown[][]>()
    expectTypeOf(values.filter(isDate)).toEqualTypeOf<Date[]>()
    expectTypeOf(values.filter(isRegExp)).toEqualTypeOf<RegExp[]>()
    expectTypeOf(values.filter(isMap)).toEqualTypeOf<Map<unknown, unknown>[]>()
    expectTypeOf(values.filter(isSet)).toEqualTypeOf<Set<unknown>[]>()
    expectTypeOf(values.filter(isPromise)).toEqualTypeOf<PromiseLike<unknown>[]>()
    const optional: (string | null | undefined)[] = ['text', null, undefined]
    expectTypeOf(optional.filter(isDefined)).toEqualTypeOf<(string | null)[]>()
    expect(optional.filter(isDefined)).toEqual(['text', null])
    const callback: unknown = (value: number) => value
    if (isFunction(callback)) {
      expectTypeOf(callback).toEqualTypeOf<(...args: never[]) => unknown>()
    }
  })
})

describe('JSON 判断', () => {
  it.each(['{}', '[]', '"hello"', '0', 'true', 'false', 'null', '  {"value":1}  '])(
    '接受所有合法 JSON 值：%s',
    (value) => expect(isJSON(value)).toBe(true),
  )
  it.each(['', ' ', 'undefined', 'NaN', '{value:1}', '{"value":1,}', {}, [], 1, null])(
    '拒绝非法 JSON 或非字符串：%s',
    (value) => expect(isJSON(value)).toBe(false),
  )
})

describe('判空', () => {
  it.each(['', [], {}, Object.create(null), new Map(), new Set()])('识别空容器 %s', (value) => {
    expect(isEmpty(value)).toBe(true)
    expect(isAllEmpty(value)).toBe(true)
  })

  it.each([
    ' ',
    [undefined],
    // oxlint-disable-next-line unicorn/no-new-array -- 覆盖包含空槽的数组。
    new Array(1),
    { value: undefined },
    new Map([['key', undefined]]),
    new Set([undefined]),
    0,
    false,
    NaN,
    new Date(),
    /a/,
    new Uint8Array(),
    () => {},
  ])('不将非空容器和其他类型视为空：%s', (value) => {
    expect(isEmpty(value)).toBe(false)
    expect(isAllEmpty(value)).toBe(false)
  })

  it.each([null, undefined])('isAllEmpty 将 %s 视为空', (value) => {
    expect(isEmpty(value)).toBe(false)
    expect(isAllEmpty(value)).toBe(true)
  })

  it('计入可枚举 Symbol 属性，忽略不可枚举属性', () => {
    expect(isEmpty({ [Symbol('key')]: 1 })).toBe(false)
    expect(isEmpty(Object.defineProperty({}, 'hidden', { value: 1 }))).toBe(true)
    class Example {}
    expect(isEmpty(new Example())).toBe(false)
  })
})

describe('格式校验', () => {
  it('格式校验返回 boolean，避免将格式不匹配误判为非字符串', () => {
    expectTypeOf(isJSON).returns.toEqualTypeOf<boolean>()
    expectTypeOf(isUrl).returns.toEqualTypeOf<boolean>()
    expectTypeOf(isEmail).returns.toEqualTypeOf<boolean>()
    expectTypeOf(isPhone).returns.toEqualTypeOf<boolean>()
  })
  it.each([
    'https://example.com',
    'HTTP://localhost:8080/path?q=1#hash',
    'https://127.0.0.1',
    'https://[::1]:8080/',
    'https://例子.中国',
  ])('接受绝对 HTTP(S) URL：%s', (value) => {
    expect(isUrl(value)).toBe(true)
  })

  it.each([
    '',
    '/path',
    '//example.com',
    'example.com',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://',
    'https://example.com:99999',
    ' https://example.com',
    'https://example.com\n',
    'https://exa mple.com',
    'https://example.com\\path',
    null,
    1,
  ])('拒绝不符合约定的 URL：%s', (value) => {
    expect(isUrl(value)).toBe(false)
  })

  it.each(['user@example.com', 'user.name+tag@sub.example.com', 'USER@EXAMPLE.COM'])(
    '接受常用邮箱：%s',
    (value) => {
      expect(isEmail(value)).toBe(true)
    },
  )

  it.each([
    '',
    'user',
    '@example.com',
    'user@',
    'user@localhost',
    'user@@example.com',
    ' user@example.com',
    'user@example.com\n',
    '.user@example.com',
    'user..name@example.com',
    'user@-example.com',
    'user@example-.com',
    null,
    1,
  ])('拒绝非法邮箱：%s', (value) => {
    expect(isEmail(value)).toBe(false)
  })

  it.each(['13800138000', '19912345678', '16612345678'])('接受大陆手机号格式：%s', (value) => {
    expect(isPhone(value)).toBe(true)
  })

  it.each([
    '',
    '12800138000',
    '23800138000',
    '1380013800',
    '138001380000',
    '+8613800138000',
    '138 0013 8000',
    '13800138000\n',
    13800138000,
    null,
  ])('拒绝非法手机号或非字符串：%s', (value) => {
    expect(isPhone(value)).toBe(false)
  })
})
