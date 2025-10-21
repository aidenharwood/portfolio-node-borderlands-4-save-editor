// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Utility helpers for reversing bit order in small integers.

/** Reverse the lowest `bitCount` bits of `value`. */
export function mirrorBits(value: number, bitCount: number): number {
  let output = 0;
  for (let i = 0; i < bitCount; i++) {
    if ((value >> i) & 1) {
      output |= 1 << (bitCount - 1 - i);
    }
  }
  return output >>> 0;
}

/** Reverse all 8 bits in a byte. */
export function mirrorByte(value: number): number {
  let b = value & 0xff;
  b = ((b & 0xf0) >> 4) | ((b & 0x0f) << 4);
  b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2);
  b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1);
  return b;
}
