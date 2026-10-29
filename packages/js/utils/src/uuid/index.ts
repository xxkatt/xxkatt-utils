const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * 生成 UUID v4，默认返回 32 个小写十六进制字符。
 *
 * @param hyphens 是否保留标准 UUID 中的横杠，默认 false。
 * @param prefix 原样拼接在 UUID 前的前缀，分隔符需自行提供。
 * @example
 * uuid()
 * uuid(true)
 * uuid(false, 'user_')
 * uuid(true, 'user_')
 */
export function uuid(hyphens: boolean = false, prefix: string = ''): string {
  const value = globalThis.crypto.randomUUID()
  return prefix + (hyphens ? value : value.replaceAll('-', ''))
}

/**
 * 使用加密安全随机数生成 ID；自定义长度的 ID 不遵循 UUID 格式。
 * 字符表依次为 0–9、a–z、A–Z，使用前 radix 个字符。
 *
 * @param length 字符数量，必须为非负安全整数，默认 32；0 返回空字符串。
 * @param radix 基数，必须为 2–62 的整数，默认 16。
 * @example
 * randomId(8, 10)
 * randomId(21, 62)
 */
export function randomId(length: number = 32, radix: number = 16): string {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new RangeError('length must be a non-negative safe integer')
  }
  if (!Number.isInteger(radix) || radix < 2 || radix > ALPHABET.length) {
    throw new RangeError('radix must be an integer between 2 and 62')
  }
  if (length === 0) return ''

  const bytes = new Uint8Array(Math.min(length, 65_536))
  const limit = 256 - (256 % radix)
  let value = ''

  while (value.length < length) {
    globalThis.crypto.getRandomValues(bytes)
    for (const byte of bytes) {
      // 丢弃无法均分到字符表的尾部区间，避免取模导致分布偏差。
      if (byte >= limit) continue
      value += ALPHABET.charAt(byte % radix)
      if (value.length === length) break
    }
  }

  return value
}
