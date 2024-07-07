/**
 * Prompt the user to download the given Blob as a file.
 *
 * @param filename Filename of the blob to download.
 * @param extension Extension of filename to download. Will only be used if filename is omitted.
 */
export default function download (blob: Blob, filename?: string, extension?: string): void {
  // create a link to the object
  const href = URL.createObjectURL(blob)
  const download = filename ?? (typeof extension === 'string' ? `export.${extension}` : 'export')

  // create a download link and click it
  const a = document.createElement('a')
  a.href = href
  a.download = download
  a.click()

  // clean up the reference to the object
  URL.revokeObjectURL(href)
}
