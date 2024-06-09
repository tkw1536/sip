const clone: <T>(x: T) => T = typeof structuredClone === 'function' ? structuredClone : <T>(x: T) => JSON.parse(JSON.stringify(x));
export default clone;