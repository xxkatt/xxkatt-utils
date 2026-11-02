import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/index'

let storage: Storage

beforeEach(() => {
  const values = new Map<string, string>()
  storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  }
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('localStorage', () => {
  it.each([
    { name: '小明', roles: ['admin'], enabled: true },
    [1, '你好', null],
    'hello',
    '123',
    '',
    0,
    false,
    null,
  ])('JSON 往返读写，保留原始类型：%j', (value) => {
    setLocalStorage('value', value)

    expect(storage.getItem('value')).toBe(JSON.stringify(value))
    expect(getLocalStorage('value')).toEqual(value)
  })

  it('支持泛型提示与覆盖已有数据', () => {
    setLocalStorage('user', { name: 'old' })
    setLocalStorage('user', { name: '小明' })

    expect(getLocalStorage<{ name: string }>('user')?.name).toBe('小明')
  })

  it('缺失值返回 null，删除不影响其他键且可重复执行', () => {
    expect(getLocalStorage('missing')).toBeNull()
    setLocalStorage('remove', 1)
    setLocalStorage('keep', 2)

    removeLocalStorage('remove')
    removeLocalStorage('remove')

    expect(getLocalStorage('remove')).toBeNull()
    expect(getLocalStorage('keep')).toBe(2)
  })

  it.each([undefined, () => {}, Symbol('value'), 1n])(
    '不可序列化的根值抛错，保留已有数据：%s',
    (value) => {
      setLocalStorage('value', 'original')

      expect(() => setLocalStorage('value', value)).toThrow(TypeError)
      expect(getLocalStorage('value')).toBe('original')
    },
  )

  it('循环引用抛错，不写入数据', () => {
    const value: { self?: unknown } = {}
    value.self = value

    expect(() => setLocalStorage('value', value)).toThrow(TypeError)
    expect(getLocalStorage('value')).toBeNull()
  })

  it.each(['plain text', '', '{broken'])('非法 JSON 抛出解析错误：%s', (value) => {
    storage.setItem('value', value)

    expect(() => getLocalStorage('value')).toThrow(SyntaxError)
  })

  it('透传存储被禁用时的访问错误', () => {
    const error = new DOMException('Access denied', 'SecurityError')
    vi.stubGlobal('window', {
      get localStorage() {
        throw error
      },
    })

    expect(() => getLocalStorage('key')).toThrow(error)
    expect(() => setLocalStorage('key', 1)).toThrow(error)
    expect(() => removeLocalStorage('key')).toThrow(error)
  })

  it('透传配额不足等写入错误，保留已有数据', () => {
    setLocalStorage('value', 'original')
    const error = new DOMException('Quota exceeded', 'QuotaExceededError')
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw error
    })

    expect(() => setLocalStorage('value', 'new')).toThrow(error)
    expect(getLocalStorage('value')).toBe('original')
  })

  it('在非浏览器环境调用时明确报错', () => {
    vi.stubGlobal('window', undefined)

    expect(() => getLocalStorage('key')).toThrow('require a browser environment')
    expect(() => setLocalStorage('key', 1)).toThrow('require a browser environment')
    expect(() => removeLocalStorage('key')).toThrow('require a browser environment')
  })
})
