import { type MacroContext } from '@parcel/macros'
import { execSync } from 'child_process'
import { join } from 'path'

const PACKAGE_JSON = join(__dirname, '..', 'package.json')
const YARN_LOCK = join(__dirname, '..', 'yarn.lock')

/** generates a legal disclaimer to include */
export function generateDisclaimer (this: MacroContext | void): string { // eslint-disable-line @typescript-eslint/no-invalid-void-type
  this?.invalidateOnFileChange(PACKAGE_JSON)
  this?.invalidateOnFileChange(YARN_LOCK)
  const buffer = execSync('yarn licenses generate-disclaimer --prod')
  return buffer.toString()
}
