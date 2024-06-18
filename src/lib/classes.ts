export function classes (...values: any[]): string {
  const classes: string[] = values.filter(clz => typeof clz === 'string' && clz !== '')
  return classes.join(' ')
}
