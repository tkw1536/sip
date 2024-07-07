/** formatError formats an error message as a string */
export function formatError(err: unknown): string {
  if (Object.hasOwn(err as object, 'message')) {
    return String((err as any).message)
  }
  return String(err)
}
