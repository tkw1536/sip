import {
  type CompileTimeFunctionArgs,
  type CompileTimeFunctionResult
} from 'vite-plugin-compile-time'
import { exec } from 'child_process'
import { join } from 'path'

const PACKAGE_JSON = join(__dirname, '..', 'package.json')
const YARN_LOCK = join(__dirname, '..', 'yarn.lock')

/** generates a legal disclaimer to include */
export default async function generateDisclaimer (args: CompileTimeFunctionArgs): DefinitelyPromise<CompileTimeFunctionResult> { // eslint-disable-line @typescript-eslint/no-invalid-void-type
  const buffer = await new Promise(
    (resolve, reject) => exec('yarn licenses generate-disclaimer --prod', (error, stdout, stderr) => {
      if (error !== null) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  )
  return {
    watchFiles: [
      PACKAGE_JSON,
      YARN_LOCK
    ],
    data: buffer
  }
}

type DefinitelyPromise<T> = T extends (Promise<infer X> | infer X) ? Promise<X> : never
