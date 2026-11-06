/** 将有限数值的十进制字符串拆为整数系数与十进制指数。 */
function toDecimal(value: number): { coefficient: bigint; exponent: number } {
  const [mantissa, exponent = '0'] = String(value).split('e')
  const [integer, fraction = ''] = mantissa!.split('.')
  return {
    coefficient: BigInt(integer! + fraction),
    exponent: Number(exponent) - fraction.length,
  }
}

/** 按十进制相加，返回 number；非有限数值与正负零遵循原生规则。 */
export function add(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return a + b
  const left = toDecimal(a)
  const right = toDecimal(b)
  const exponent = Math.min(left.exponent, right.exponent)
  const coefficient =
    left.coefficient * 10n ** BigInt(left.exponent - exponent) +
    right.coefficient * 10n ** BigInt(right.exponent - exponent)
  return Number(`${coefficient}e${exponent}`)
}

/** 按十进制相减，返回 number。 */
export function subtract(a: number, b: number): number {
  return add(a, -b)
}

/** 按十进制相乘，返回 number。 */
export function multiply(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return a * b
  const left = toDecimal(a)
  const right = toDecimal(b)
  return Number(`${left.coefficient * right.coefficient}e${left.exponent + right.exponent}`)
}

/** 按十进制相除，返回 number；除零遵循原生规则。 */
export function divide(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return a / b
  const left = toDecimal(Math.abs(a))
  const right = toDecimal(Math.abs(b))
  const decimalExponent = left.exponent - right.exponent
  let numerator = left.coefficient * 10n ** BigInt(Math.max(decimalExponent, 0))
  let denominator = right.coefficient * 10n ** BigInt(Math.max(-decimalExponent, 0))

  // 定位二进制指数，再一次舍入到 53 位有效数字；次正规数最小步长为 2^-1074。
  let binaryExponent = numerator.toString(2).length - denominator.toString(2).length
  const belowPower =
    binaryExponent >= 0
      ? numerator < denominator << BigInt(binaryExponent)
      : numerator << BigInt(-binaryExponent) < denominator
  if (belowPower) binaryExponent--
  const exponent = Math.max(binaryExponent - 52, -1074)
  if (exponent >= 0) denominator <<= BigInt(exponent)
  else numerator <<= BigInt(-exponent)

  let coefficient = numerator / denominator
  const remainder = numerator % denominator
  // 与 number 一致：就近舍入，恰好居中时取偶数。
  if (remainder * 2n > denominator || (remainder * 2n === denominator && coefficient % 2n)) {
    coefficient++
  }
  const result = Number(coefficient) * 2 ** exponent
  return a < 0 !== b < 0 ? -result : result
}

/** 返回数组最大值；空数组返回 -Infinity，包含 NaN 时返回 NaN。 */
export function max(values: readonly number[]): number {
  let result = -Infinity
  for (const value of values) result = Math.max(result, value)
  return result
}

/** 返回数组最小值；空数组返回 Infinity，包含 NaN 时返回 NaN。 */
export function min(values: readonly number[]): number {
  let result = Infinity
  for (const value of values) result = Math.min(result, value)
  return result
}

/** 使用 add 从左到右累加；空数组返回 0。 */
export function sum(values: readonly number[]): number {
  let result = 0
  for (const value of values) result = add(result, value)
  return result
}

/** 使用 sum 和 divide 计算算术平均数；空数组返回 NaN。 */
export function average(values: readonly number[]): number {
  return divide(sum(values), values.length)
}
