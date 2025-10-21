// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Bit-level writer that emits most-significant bit first within bytes.

export class BitWriter {
  private readonly data: number[] = [];
  private pos = 0;

  /** Append a single bit to the stream. */
  writeBit(bit: number): void {
    const normalized = bit & 1;
    const byteIndex = this.pos >> 3;

    while (byteIndex >= this.data.length) {
      this.data.push(0);
    }

    const bitIndex = 7 - (this.pos & 7);
    if (normalized === 1) {
      this.data[byteIndex] |= 1 << bitIndex;
    } else {
      this.data[byteIndex] &= ~(1 << bitIndex);
    }

    this.pos += 1;
  }

  /** Append multiple bits to the stream. */
  writeBits(...bits: number[]): void {
    for (const bit of bits) {
      this.writeBit(bit);
    }
  }

  /** Append `count` bits from `value` (most-significant bit first). */
  writeN(value: number, count: number): void {
    for (let i = count - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.writeBit(bit);
    }
  }

  /** Number of bits written so far. */
  get position(): number {
    return this.pos;
  }

  /** Raw bit array (0/1 values) up to the write cursor. */
  bits(): number[] {
    const output: number[] = new Array(this.pos);
    for (let i = 0; i < this.pos; i++) {
      const byteIndex = i >> 3;
      const bitIndex = 7 - (i & 7);
      output[i] = (this.data[byteIndex] >> bitIndex) & 1;
    }
    return output;
  }

  /** Finalise and return the underlying byte array. */
  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.data);
  }
}
