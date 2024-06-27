import { execSync } from 'child_process'

/** generates a legal disclaimer to include */
export function generateDisclaimer (): string {
  const buffer = execSync('yarn licenses generate-disclaimer --prod')
  return buffer.toString()
}
