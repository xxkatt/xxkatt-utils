/** 按 1024 进制格式化字节数，单位为 B 至 EB，最多保留两位小数。 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError('bytes must be a non-negative finite number')
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']
  let size = bytes
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }

  let rounded = Number(size.toFixed(2))
  if (rounded >= 1024 && index < units.length - 1) {
    rounded = 1
    index++
  }
  return `${rounded} ${units[index]}`
}

/** 将 File/Blob 异步读取为完整的 Base64 Data URL，需要 FileReader 支持。 */
export async function fileToDataURL(file: Blob): Promise<string> {
  if (typeof FileReader === 'undefined') {
    throw new Error('fileToDataURL requires FileReader support')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.onabort = () => reject(new Error('File reading was aborted'))
    reader.readAsDataURL(file)
  })
}

/** 将完整 Data URL 同步还原为 Blob；支持 Base64 和百分号编码，保留 MIME 类型和字节。 */
export function dataURLToBlob(dataURL: string): Blob {
  const url = new URL(dataURL)
  if (url.protocol !== 'data:') throw new TypeError('Invalid Data URL')

  // 保留查询串中的数据，排除 URL 的 fragment；内容中的 # 应写为 %23。
  const value = url.href.slice(5).split('#', 1)[0]!
  const commaIndex = value.indexOf(',')
  if (commaIndex < 0) throw new TypeError('Invalid Data URL: missing comma')
  let type = value.slice(0, commaIndex).trim()
  const data = value.slice(commaIndex + 1)
  let bytes: Uint8Array<ArrayBuffer>

  if (/;base64$/i.test(type)) {
    type = type.slice(0, -7).trimEnd()
    const binary = atob(decodeURIComponent(data))
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } else {
    bytes = new TextEncoder().encode(data)
    let length = 0
    for (let index = 0; index < bytes.length; index++) {
      if (bytes[index] === 37) {
        const hex = String.fromCharCode(...bytes.subarray(index + 1, index + 3))
        if (!/^[\da-f]{2}$/i.test(hex))
          throw new TypeError('Invalid Data URL: invalid percent encoding')
        bytes[length++] = Number.parseInt(hex, 16)
        index += 2
      } else {
        bytes[length++] = bytes[index]!
      }
    }
    bytes = bytes.subarray(0, length)
  }

  if (!type) type = 'text/plain;charset=US-ASCII'
  else if (type.startsWith(';')) type = `text/plain${type}`
  return new Blob([bytes], { type })
}
