import { afterEach, describe, expect, it, vi } from 'vitest'
import { randomId, uuid } from '@/uuid'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('uuid', () => {
  it('默认生成不带横杠的 32 字符 UUID v4', () => {
    expect(uuid()).toMatch(/^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/)
  })

  it('支持标准带横杠的 UUID v4', () => {
    expect(uuid('', true)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('支持仅传入前缀', () => {
    expect(uuid('user_')).toMatch(/^user_[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/)
  })

  it.each<[string | undefined, boolean | undefined, string]>([
    [undefined, undefined, '00112233445546778899aabbccddeeff'],
    [undefined, false, '00112233445546778899aabbccddeeff'],
    ['user_', false, 'user_00112233445546778899aabbccddeeff'],
    ['user', false, 'user00112233445546778899aabbccddeeff'],
    ['user_', undefined, 'user_00112233445546778899aabbccddeeff'],
    ['', true, '00112233-4455-4677-8899-aabbccddeeff'],
    [undefined, true, '00112233-4455-4677-8899-aabbccddeeff'],
    ['user_', true, 'user_00112233-4455-4677-8899-aabbccddeeff'],
  ])('传入 %s、%s 时保留格式并原样拼接前缀', (prefix, hyphens, expected) => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00112233-4455-4677-8899-aabbccddeeff',
    )
    expect(uuid(prefix, hyphens)).toBe(expected)
  })
})

describe('randomId', () => {
  it('默认生成 32 个小写十六进制字符', () => {
    expect(randomId()).toMatch(/^[0-9a-f]{32}$/)
  })

  it.each(Array.from({ length: 61 }, (_, index) => index + 2))(
    '支持基数 %i，保持指定长度和字符范围',
    (radix) => {
      const value = randomId(128, radix)
      const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(
        0,
        radix,
      )
      expect(value).toHaveLength(128)
      expect([...value].every((char) => alphabet.includes(char))).toBe(true)
    },
  )

  it('支持长度为 1', () => {
    expect(randomId(1, 2)).toMatch(/^[01]$/)
  })

  it('长度为 0 时返回空字符串且不调用随机源', () => {
    const getRandomValues = vi.spyOn(globalThis.crypto, 'getRandomValues')
    expect(randomId(0)).toBe('')
    expect(getRandomValues).not.toHaveBeenCalled()
  })

  it('支持超过 Web Crypto 单次配额的长度', () => {
    expect(randomId(65_537, 10)).toMatch(/^\d{65537}$/)
  })

  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '拒绝非法长度 %s',
    (length) => {
      expect(() => randomId(length)).toThrow(RangeError)
    },
  )

  it.each([0, 1, 63, 2.5, NaN, Infinity, -Infinity])('拒绝非法基数 %s', (radix) => {
    expect(() => randomId(8, radix)).toThrow(RangeError)
  })

  it('长度为 0 时仍校验基数', () => {
    expect(() => randomId(0, 1)).toThrow(RangeError)
  })

  it('拒绝会导致分布偏差的随机值，并重新采样以补足长度', () => {
    const getRandomValues = vi
      .fn<(bytes: Uint8Array) => Uint8Array>()
      .mockImplementationOnce((bytes) => {
        bytes.set([248, 249, 250, 255])
        return bytes
      })
      .mockImplementationOnce((bytes) => {
        bytes.set([0, 61, 62, 247])
        return bytes
      })
    vi.stubGlobal('crypto', { getRandomValues })

    expect(randomId(4, 62)).toBe('0Z0Z')
    expect(getRandomValues).toHaveBeenCalledTimes(2)
  })
})
