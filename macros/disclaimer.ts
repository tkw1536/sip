import { execSync } from 'child_process'

/** generate legal notices */
export function generateDisclaimer (): string {
  const buffer = execSync('yarn licenses generate-disclaimer --prod')
  return buffer.toString()
}
