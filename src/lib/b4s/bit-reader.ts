// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Sequential bit reader that consumes most-significant bit first within each byte.

export class BitReader {
  private readonly data: Uint8Array;
  private pos = 0; // Position in bits

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /** Current read position in bits. */
  get position(): number {
    return this.pos;
  }

  /** Total length in bits. */
  get length(): number {
    return this.data.length * 8;
  }

  /** Read a single bit, returning null when reaching the end. */
  read(): number | null {
    if (this.pos >= this.length) {
      return null;
    }
    const byteIndex = this.pos >> 3;
    const bitIndex = 7 - (this.pos & 7);
    const bit = (this.data[byteIndex] >> bitIndex) & 1;
    this.pos += 1;
    return bit;
  }

  /** Read two consecutive bits. Returns null when insufficient data remains. */
  read2(): [number, number] | null {
    const first = this.read();
    if (first === null) {
      return null;
    }
    const second = this.read();
    if (second === null) {
      return null;
    }
    return [first, second];
  }

  /** Read `count` bits as an unsigned integer. Returns null when insufficient data remains. */
  readN(count: number): number | null {
    if (count <= 0 || count > 32 || this.pos + count > this.length) {
      return null;
    }
    let value = 0;
    for (let i = 0; i < count; i++) {
      const bit = this.read();
      if (bit === null) {
        return null;
      }
      value = (value << 1) | bit;
    }
    return value >>> 0;
  }

  /** Reset the read cursor to the specified bit position. */
  setPosition(bitPos: number): boolean {
    if (bitPos < 0 || bitPos > this.length) {
      return false;
    }
    this.pos = bitPos;
    return true;
  }

  /** Move the cursor backwards by `count` bits. */
  rewind(count: number): boolean {
    if (count < 0 || this.pos - count < 0) {
      return false;
    }
    this.pos -= count;
    return true;
  }

  /** Return all bits prior to the current cursor as a string. */
  stringBefore(): string {
    const snapshot = this.pos;
    this.rewind(snapshot);
    const out: string[] = new Array(snapshot);
    for (let i = 0; i < snapshot; i++) {
      const bit = this.read();
      out[i] = bit === 1 ? '1' : '0';
    }
    this.pos = snapshot;
    return out.join('');
  }

  /** Return all remaining bits from the cursor onward. */
  stringAfter(): string {
    const out: string[] = [];
    while (true) {
      const bit = this.read();
      if (bit === null) {
        break;
      }
      out.push(bit === 1 ? '1' : '0');
    }
    return out.join('');
  }

  /** Return the full bitstream while preserving the current cursor position. */
  fullString(): string {
    const snapshot = this.pos;
    this.rewind(snapshot);
    const length = this.length;
    const out: string[] = new Array(length);
    for (let i = 0; i < length; i++) {
      const bit = this.read();
      out[i] = bit === 1 ? '1' : '0';
    }
    this.pos = snapshot;
    return out.join('');
  }
}
