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

const sampleJSON = JSON.parse(await readFixture('sample.json')) as PathParams[]
const samplePB = new Pathbuilder(sampleJSON.map(p => new Path(p)))

const aDocumentBundlePath = samplePB.paths[0] // path for a document group
const regularPropertyPath = samplePB.paths[1] // path with a regular property
const entityReferencePath = samplePB.paths[7] // path with disambiguation

describe(Pathbuilder, async () => {
  test('parses valid xml', async () => {
    const sampleXML = await readFixture('sample.xml')
    const got = Pathbuilder.parse(sampleXML)
    expect(got).toEqual(samplePB)
  })

  test('does not parse invalid xml', async () => {
    const invalidXML = await readFixture('invalid.xml')
    expect(() => Pathbuilder.parse(invalidXML)).toThrow()
  })

  test('round-trips parsing xml correctly', async () => {
    const roundTrip = Pathbuilder.parse(samplePB.toXML())
    expect(roundTrip).toEqual(samplePB)
  })
})

describe(Path, async () => {
  test.each([
    [aDocumentBundlePath, ['http://erlangen-crm.org/240307/E31_Document']],
    [
      regularPropertyPath,
      [
        'http://erlangen-crm.org/240307/E31_Document',
        'http://erlangen-crm.org/240307/P102_has_title',
        'http://erlangen-crm.org/240307/E35_Title',
        'http://erlangen-crm.org/240307/P3_has_note',
      ],
    ],
    [
      entityReferencePath,
      [
        'http://erlangen-crm.org/240307/E31_Document',
        'http://erlangen-crm.org/240307/P94i_was_created_by',
        'http://erlangen-crm.org/240307/E65_Creation',
        'http://erlangen-crm.org/240307/P14_carried_out_by',
        'http://erlangen-crm.org/240307/E21_Person',
      ],
    ],
  ])('uris $#', (path: Path, wantURIs: string[]) => {
    const got = new Set(path.uris())
    const want = new Set(wantURIs)
    expect(got).toEqual(want)
  })

  test.each([
    [aDocumentBundlePath, null],
    [regularPropertyPath, 'string'],
    [entityReferencePath, 'entity_reference'],
  ])('informativeFieldType $#', (path: Path, want: string | null) => {
    expect(path.informativeFieldType).toEqual(want)
  })

  test.each([
    [aDocumentBundlePath, null],
    [regularPropertyPath, null],
    [entityReferencePath, 'http://erlangen-crm.org/240307/E21_Person'],
  ])('disambiguated_concept $#', (path: Path, want: string | null) => {
    expect(path.disambiguatedConcept).toEqual(want)
  })
})
