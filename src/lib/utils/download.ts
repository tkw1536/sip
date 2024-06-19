/** Download prompts the user to download the selected blob as a local file */
export default async function download (blob: Blob, filename?: string): Promise<void> {
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? 'export'
  document.body.appendChild(a)
  a.click()

  return await new Promise(resolve => {
    queueMicrotask(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      resolve()
    })
  })
}
