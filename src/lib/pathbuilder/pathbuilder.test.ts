import { describe, expect, test } from 'vitest'
import { Path, Pathbuilder, type PathParams } from './pathbuilder'
import { join } from 'path'
import { readFile } from 'fs'

const fixturePath = join(__dirname, '..', '..', '..', 'fixtures', 'pathbuilder')
async function readFixture(name: string): Promise<string> {
  const path = join(fixturePath, name)
  return await new Promise((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err !== null) {
        reject(err)
        return
      }
      resolve(data.toString())
    })
  })
}

describe(Pathbuilder, async () => {
  const sampleJSON = JSON.parse(
    await readFixture('sample.json'),
  ) as PathParams[]
  const samplePB = new Pathbuilder(sampleJSON.map(p => new Path(p)))

  test('parses valid xml', async () => {
    const sampleXML = await readFixture('sample.xml')
    const got = Pathbuilder.parse(sampleXML)
    expect(got).toEqual(samplePB)
  })

  test('does not parse invalid xml', async () => {
    const invalidXML = await readFixture('invalid.xml')
    expect(() => Pathbuilder.parse(invalidXML)).toThrow()
  })
})

// TODO: Tests for path
