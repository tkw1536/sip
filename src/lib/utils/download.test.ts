import { describe, expect, test, vi, afterEach } from 'vitest'
import download from './download'

describe(download, () => {
  const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')
  vi.spyOn(URL, 'revokeObjectURL')
  const clickSpy = vi.spyOn(HTMLElement.prototype, 'click')

  afterEach(() => {
    vi.clearAllMocks()
  })

  test.each([
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: undefined, extension: undefined, expectedFilename: 'export' },
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: undefined, extension: 'txt', expectedFilename: 'export.txt' },
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: 'myfile', extension: undefined, expectedFilename: 'myfile' },
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: 'myfile.txt', extension: undefined, expectedFilename: 'myfile.txt' },
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: 'myfile', extension: 'txt', expectedFilename: 'myfile' },
    { blob: new Blob(['hello world'], { type: 'text/plain' }), filename: 'myfile.txt', extension: 'txt', expectedFilename: 'myfile.txt' }
  ])('download($blob, $filename, $extension) -> $expectedFilename', ({ blob, filename, extension, expectedFilename }) => {
    download(blob, filename, extension)

    // check that we created and revoke the same url
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    const gotURL = createObjectURLSpy.mock.results[0].value
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(gotURL)

    // check that we clicked a html element
    expect(HTMLElement.prototype.click).toHaveBeenCalledOnce()

    // check that we were called with an HTMLAnchorElement
    const element: HTMLAnchorElement = clickSpy.mock.instances[0] as any
    expect(element).toBeInstanceOf(HTMLAnchorElement)
    expect(element.getAttribute('download')).toBe(expectedFilename)
    expect(element.getAttribute('href')).toBe(gotURL)
  })
})
