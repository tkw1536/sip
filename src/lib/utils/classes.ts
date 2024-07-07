export function classes(...values: any[]): string {
  return values.filter(clz => typeof clz === 'string' && clz !== '').join(' ')
}
