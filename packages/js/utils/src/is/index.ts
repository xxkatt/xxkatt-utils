/** 按 Object.prototype.toString 的标签判断类型，如 'Date'、'Map'；区分大小写。 */
export function is(value: unknown, type: string): boolean {
  return Object.prototype.toString.call(value) === `[object ${type}]`
}

/** 仅判断原始字符串，不包含 String 包装对象。 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** 判断原始 number，包含 NaN 和 Infinity，不进行数值有效性检查。 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

/** 仅判断原始布尔值。 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint'
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol'
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

/** 排除 undefined，保留 null。 */
export function isDefined<T>(value: T): value is Exclude<T, undefined> {
  return value !== undefined
}

export function isNull(value: unknown): value is null {
  return value === null
}

/** 判断 null 或 undefined。 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/** 判断非 null 的对象，包含数组、内置对象和类实例，不包含函数。 */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object'
}

/** 判断普通对象，支持对象字面量、跨 realm 对象和 Object.create(null)。 */
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (!is(value, 'Object')) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === null) return true
  const constructor = Object.hasOwn(prototype, 'constructor') && prototype.constructor
  return (
    typeof constructor === 'function' &&
    Function.prototype.toString.call(constructor) === Function.prototype.toString.call(Object)
  )
}

/** 判断 Date 类型，包含 Invalid Date。 */
export function isDate(value: unknown): value is Date {
  return is(value, 'Date')
}

export function isRegExp(value: unknown): value is RegExp {
  return is(value, 'RegExp')
}

/** 包含普通函数、异步函数和生成器函数；不检查参数或返回值类型。 */
export function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === 'function'
}

/** 仅判断数组，不检查元素类型。 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isMap(value: unknown): value is Map<unknown, unknown> {
  return is(value, 'Map')
}

export function isSet(value: unknown): value is Set<unknown> {
  return is(value, 'Set')
}

/** 判断 Promise 或具有可调用 then 方法的对象/函数，收窄为 PromiseLike。 */
export function isPromise(value: unknown): value is PromiseLike<unknown> {
  return (isObject(value) || isFunction(value)) && 'then' in value && isFunction(value.then)
}

/** 判断可被 JSON.parse 解析的字符串，包含 JSON 原始值。 */
export function isJSON(value: unknown): boolean {
  if (!isString(value)) return false
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

/** 判断空字符串、数组、Map、Set 或无自有可枚举属性的普通对象。 */
export function isEmpty(value: unknown): boolean {
  if (isString(value) || isArray(value)) return value.length === 0
  if (isMap(value) || isSet(value)) return value.size === 0
  if (isPlainObject(value)) {
    return !Reflect.ownKeys(value).some((key) =>
      Object.prototype.propertyIsEnumerable.call(value, key),
    )
  }
  return false
}

/** 在 isEmpty 的基础上，将 null、undefined 也视为空。 */
export function isAllEmpty(value: unknown): boolean {
  return isNil(value) || isEmpty(value)
}

/** 判断绝对 HTTP(S) URL，拒绝空白字符、反斜杠和相对地址。 */
export function isUrl(value: unknown): boolean {
  if (!isString(value) || !/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== ''
  } catch {
    return false
  }
}

/** 常用邮箱格式校验，不验证邮箱是否存在，不覆盖完整 RFC 邮箱语法。 */
export function isEmail(value: unknown): boolean {
  return (
    isString(value) &&
    /^[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/i.test(
      value,
    )
  )
}

/** 中国大陆 11 位手机号格式：以 1 开头，第二位为 3–9；不验证号段分配或号码存在性。 */
export function isPhone(value: unknown): boolean {
  return isString(value) && /^1[3-9]\d{9}$/.test(value)
}
