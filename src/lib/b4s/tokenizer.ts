// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Tokenizer over a bitstream using Borderlands 4 serial token prefixes.

import { BitReader } from './bit-reader';

export const Token = {
  SEP1: 0,
  SEP2: 1,
  VARINT: 2,
  VARBIT: 3,
  PART: 4,
  UNSUPPORTED_111: 5
} as const;
export type TokenType = (typeof Token)[keyof typeof Token];

export class Tokenizer {
  private readonly reader: BitReader;
  private readonly splitPositions: number[] = [];

  constructor(data: Uint8Array) {
    this.reader = new BitReader(data);
  }

  /** Underlying bit reader. */
  bitReader(): BitReader {
    return this.reader;
  }

  /** Insert visual separators for debugging (mirrors Go implementation). */
  doneString(): string {
    let full = this.reader.fullString();
    for (let i = this.splitPositions.length - 1; i >= 0; i--) {
      const pos = this.splitPositions[i];
      full = `${full.slice(0, pos)}  ${full.slice(pos)}`;
    }
    return full;
  }

  /** Expect an exact bit pattern, throwing when it does not match. */
  expect(context: string, ...bits: number[]): void {
    for (const expected of bits) {
      const bit = this.reader.read();
      if (bit === null) {
        throw new Error(`${context} => unexpected end of data`);
      }
      if (bit !== expected) {
        throw new Error(`${context} => expected bit ${expected}, got ${bit}`);
      }
    }
  }

  /** Fetch the next token from the stream. */
  nextToken(): TokenType | null {
    this.splitPositions.push(this.reader.position);

    const firstBits = this.reader.read2();
    if (!firstBits) {
      return null;
    }
    const [b1, b2] = firstBits;
    const twoBit = (b1 << 1) | b2;

    switch (twoBit) {
      case 0b00:
  return Token.SEP1;
      case 0b01:
  return Token.SEP2;
      default:
        break;
    }

    const thirdBit = this.reader.read();
    if (thirdBit === null) {
      return null;
    }
    const threeBit = (twoBit << 1) | thirdBit;

    switch (threeBit) {
      case 0b100:
  return Token.VARINT;
      case 0b110:
  return Token.VARBIT;
      case 0b101:
  return Token.PART;
      case 0b111:
  return Token.UNSUPPORTED_111;
      default:
        this.reader.rewind(3);
        throw new Error(`invalid token ${threeBit.toString(2).padStart(3, '0')} at position ${this.reader.position}`);
    }
  }
}
