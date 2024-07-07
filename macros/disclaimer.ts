import {
  type CompileTimeFunctionArgs,
  type CompileTimeFunctionResult
} from 'vite-plugin-compile-time'
import { execSync } from 'child_process'
import { join } from 'path'

const PACKAGE_JSON = join(__dirname, '..', 'package.json')
const YARN_LOCK = join(__dirname, '..', 'yarn.lock')

/** generates a legal disclaimer to include */
export default function generateDisclaimer (args: CompileTimeFunctionArgs): CompileTimeFunctionResult { // eslint-disable-line @typescript-eslint/no-invalid-void-type
  const buffer = execSync('yarn licenses generate-disclaimer --prod')
  return {
    watchFiles: [
      PACKAGE_JSON,
      YARN_LOCK
    ],
    data: buffer.toString()
  }
}
