/** generate a class attribute to be added to the html */
export function classes(...values: any[]): string {
  return values.filter(clz => typeof clz === 'string' && clz !== '').join(' ')
}
