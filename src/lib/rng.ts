export type RNG = {
  next: () => number
  seed: number
}

function splitmix32(a: number): number {
  a = (a + 0x9e3779b9) | 0
  a = Math.imul(a ^ (a >>> 16), 0x85ebca6b)
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35)
  return (a ^ (a >>> 16)) >>> 0
}

export function createRNG(seed: number): RNG {
  let s0 = splitmix32(seed)
  let s1 = splitmix32(s0)
  let s2 = splitmix32(s1)
  let s3 = splitmix32(s2)

  function next(): number {
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0
    const t = (s1 << 9) >>> 0
    s2 ^= s0
    s3 ^= s1
    s1 ^= s2
    s0 ^= s3
    s2 ^= t
    s3 = rotl(s3, 11)
    return result / 0x100000000
  }

  return { next, seed }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}
