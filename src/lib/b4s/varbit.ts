// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Varbit implementation with 5-bit little-endian length prefix.

import { BitReader } from './bit-reader';
import { BitWriter } from './bit-writer';
import { mirrorBits } from './byte-mirror';

const LENGTH_BITS = 5;
const MAX_LENGTH = (1 << LENGTH_BITS) - 1;

export function readVarbit(reader: BitReader): number {
  const lengthEncoded = reader.readN(LENGTH_BITS);
  if (lengthEncoded === null) {
    throw new Error('unexpected end of data while reading varbit length');
  }
  const length = mirrorBits(lengthEncoded, LENGTH_BITS) & MAX_LENGTH;

  if (length === 0) {
    return 0;
  }

  let value = 0;
  for (let i = 0; i < length; i++) {
    const bit = reader.read();
    if (bit === null) {
      throw new Error('unexpected end of data while reading varbit value');
    }
    value |= (bit & 1) << i;
  }

  return value >>> 0;
}

export function writeVarbit(writer: BitWriter, value: number): void {
  let bitsNeeded = 0;
  let temp = value >>> 0;

  while (temp > 0) {
    bitsNeeded += 1;
    temp >>= 1;
  }

  if (bitsNeeded > MAX_LENGTH) {
    bitsNeeded = MAX_LENGTH;
  }

  let lengthBits = bitsNeeded;
  for (let i = 0; i < LENGTH_BITS; i++) {
    writer.writeBit(lengthBits & 1);
    lengthBits >>= 1;
  }

  let working = value >>> 0;
  for (let i = 0; i < bitsNeeded; i++) {
    writer.writeBit(working & 1);
    working >>= 1;
  }
}
