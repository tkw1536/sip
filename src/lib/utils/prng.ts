const max = 0x80000000
const a = 1103515245
const c = 12345

/** prng that returns a pseudo-random-number based on the given seed */
export function prng(seed: number): () => number {
  let state = seed

  return () => {
    state = (a * state + c) % max
    return state / (max - 1)
  }
}
