function getStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('localStorage helpers require a browser environment')
  }
  return window.localStorage
}

/** 读取 JSON 值；不存在时返回 null。T 仅提供类型提示，不校验实际数据。 */
export function getLocalStorage<T = unknown>(key: string): T | null {
  const value = getStorage().getItem(key)
  return value === null ? null : (JSON.parse(value) as T)
}

/** 按 JSON.stringify 的规则写入值；无法序列化时抛错，不覆盖已有数据。 */
export function setLocalStorage(key: string, value: unknown): void {
  const storage = getStorage()
  const serialized = JSON.stringify(value)
  if (serialized === undefined) {
    throw new TypeError('The value cannot be serialized as JSON')
  }
  storage.setItem(key, serialized)
}

/** 删除指定键；键不存在时不做任何操作。 */
export function removeLocalStorage(key: string): void {
  getStorage().removeItem(key)
}
