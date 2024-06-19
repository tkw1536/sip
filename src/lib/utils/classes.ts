export function classes (...values: any[]): string {
  return values
    .filter((clz): clz is string => typeof clz === 'string' && clz !== '')
    .join(' ')
}