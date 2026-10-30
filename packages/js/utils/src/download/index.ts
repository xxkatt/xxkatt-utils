/**
 * 在浏览器中下载 URL、完整 Data URL 或 Blob/File。
 *
 * @param source 文件地址或文件内容；字符串始终作为地址处理。
 * @param filename 建议保存的完整文件名，包含扩展名。
 * @returns 触发下载后完成，不代表文件已保存到磁盘。
 * @example
 * await download('/files/report.pdf', 'report.pdf')
 * await download(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt')
 */
export async function download(source: string | Blob, filename: string): Promise<void> {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('download requires a browser environment')
  }

  let blob: Blob
  if (typeof source === 'string') {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`)
    }
    blob = await response.blob()
  } else {
    blob = source
  }

  const anchor = document.createElement('a')
  const url = URL.createObjectURL(blob)
  try {
    anchor.href = url
    anchor.download = filename
    anchor.hidden = true
    document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    // 留出浏览器开始读取文件的时间，避免同步释放导致下载失败。
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
