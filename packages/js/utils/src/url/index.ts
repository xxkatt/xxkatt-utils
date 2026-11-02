export type QueryValue = string | number | boolean

export type QueryParams = Record<string, QueryValue | readonly QueryValue[] | null | undefined>

export type ParsedQuery = Record<string, string | string[]>

function splitUrl(url: string): { path: string; query: string; hash: string } {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex < 0 ? '' : url.slice(hashIndex)
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const queryIndex = beforeHash.indexOf('?')
  return {
    path: queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex),
    query: queryIndex < 0 ? '' : beforeHash.slice(queryIndex),
    hash,
  }
}

function appendQueryValue(
  search: URLSearchParams,
  name: string,
  value: QueryValue | readonly QueryValue[],
): void {
  for (const item of Array.isArray(value) ? value : [value]) {
    search.append(name, String(item))
  }
}

/** 解析查询串（可带前导 ?）；重复键返回数组，所有值保持字符串。 */
export function parseQuery(query: string): ParsedQuery {
  const entries = new Map<string, string | string[]>()
  for (const [name, value] of new URLSearchParams(query)) {
    const previous = entries.get(name)
    if (previous === undefined) entries.set(name, value)
    else if (typeof previous === 'string') entries.set(name, [previous, value])
    else previous.push(value)
  }
  return Object.fromEntries(entries)
}

/** 序列化为不带 ? 的查询串；数组使用重复键，省略 null、undefined 和空数组。 */
export function stringifyQuery(params: QueryParams): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) appendQueryValue(search, name, value)
  }
  return search.toString()
}

/** 读取 URL 中第一个同名查询参数；不存在时返回 null，不读取 hash 内的参数。 */
export function getQueryParam(url: string, name: string): string | null {
  return new URLSearchParams(splitUrl(url).query).get(name)
}

/** 读取 URL 的全部查询参数，重复键返回数组。 */
export function getQueryParams(url: string): ParsedQuery {
  return parseQuery(splitUrl(url).query)
}

/** 合并查询参数并返回新 URL；null 或空数组删除该键，undefined 保留原值。 */
export function setQueryParams(url: string, params: QueryParams): string {
  const { path, query, hash } = splitUrl(url)
  const search = new URLSearchParams(query)
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue
    search.delete(name)
    if (value !== null) appendQueryValue(search, name, value)
  }
  const serialized = search.toString()
  return path + (serialized ? `?${serialized}` : '') + hash
}

/** 删除一个或多个查询参数的全部同名项，返回新 URL。 */
export function removeQueryParams(url: string, names: string | readonly string[]): string {
  const params = Object.fromEntries(
    (typeof names === 'string' ? [names] : names).map((name) => [name, null]),
  )
  return setQueryParams(url, params)
}

/** 获取第一个 # 后的原始 hash，不含 #，不解码；不存在时返回空字符串。 */
export function getUrlHash(url: string): string {
  return splitUrl(url).hash.slice(1)
}

/** 设置原始 hash（可带一个前导 #），空字符串移除 hash；不进行编码。 */
export function setUrlHash(url: string, hash: string): string {
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  return beforeHash + (value ? `#${value}` : '')
}
