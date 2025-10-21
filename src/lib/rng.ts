/**
 * Seeded Random Number Generator (RNG)
 * Multiple implementations to test which one nicnl uses
 */

/**
 * Linear Congruential Generator (LCG) - Common simple RNG
 */
export class LCG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Standard LCG parameters (used in many implementations)
  next(): number {
    // Using glibc LCG parameters
    this.state = (1103515245 * this.state + 12345) & 0x7fffffff;
    return this.state;
  }

  nextInt(max: number): number {
    return this.next() % max;
  }

  nextFloat(): number {
    return this.next() / 0x7fffffff;
  }

  reset(seed: number) {
    this.state = seed;
  }
}

/**
 * Mulberry32 - Simple, fast seeded RNG
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  reset(seed: number) {
    this.state = seed;
  }
}

/**
 * SplitMix32 - Another common seeded RNG
 */
export class SplitMix32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  next(): number {
    this.state = (this.state + 0x9e3779b9) | 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  reset(seed: number) {
    this.state = seed | 0;
  }
}

/**
 * xorshift32 - Very simple and fast
 */
export class XorShift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 1; // Cannot be 0
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  reset(seed: number) {
    this.state = seed || 1;
  }
}

/**
 * Simple hash-based RNG (might be what nicnl uses for simplicity)
 */
export class SimpleHashRNG {
  private seed: number;
  private counter: number;

  constructor(seed: number) {
    this.seed = seed;
    this.counter = 0;
  }

  next(): number {
    this.counter++;
    // Simple hash function
    let x = (this.seed + this.counter) | 0;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = (x >> 16) ^ x;
    return (x >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  reset(seed: number) {
    this.seed = seed;
    this.counter = 0;
  }
}

export type RNGType = 'lcg' | 'mulberry32' | 'splitmix32' | 'xorshift32' | 'simplehash';

export function createRNG(type: RNGType, seed: number) {
  switch (type) {
    case 'lcg':
      return new LCG(seed);
    case 'mulberry32':
      return new Mulberry32(seed);
    case 'splitmix32':
      return new SplitMix32(seed);
    case 'xorshift32':
      return new XorShift32(seed);
    case 'simplehash':
      return new SimpleHashRNG(seed);
  }
}
