// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Varint implementation using 4 data bits + continuation bit blocks.

import { BitReader } from './bit-reader';
import { BitWriter } from './bit-writer';
import { mirrorBits } from './byte-mirror';

const NB_BLOCKS = 4;
const BITS_PER_BLOCK = 4;
const MAX_BITS = NB_BLOCKS * BITS_PER_BLOCK;

export function readVarint(reader: BitReader): number {
  let dataRead = 0;
  let output = 0;

  for (let block = 0; block < NB_BLOCKS; block++) {
    const blockValue = reader.readN(BITS_PER_BLOCK);
    if (blockValue === null) {
      throw new Error('unexpected end of data while reading varint');
    }
    const mirrored = mirrorBits(blockValue, BITS_PER_BLOCK);
    output |= (mirrored & 0xf) << dataRead;
    dataRead += BITS_PER_BLOCK;

    const continuation = reader.read();
    if (continuation === null) {
      throw new Error('unexpected end of data while reading varint');
    }
    if (continuation === 0) {
      break;
    }
  }

  return output >>> 0;
}

export function writeVarint(writer: BitWriter, value: number): void {
  let bitsNeeded = 0;
  let temp = value >>> 0;

  while (temp > 0) {
    bitsNeeded += 1;
    temp >>= 1;
  }

  if (bitsNeeded === 0) {
    bitsNeeded = 1;
  }
  if (bitsNeeded > MAX_BITS) {
    bitsNeeded = MAX_BITS;
  }

  let remaining = bitsNeeded;
  let working = value >>> 0;

  while (remaining > BITS_PER_BLOCK) {
    for (let i = 0; i < BITS_PER_BLOCK; i++) {
      writer.writeBit(working & 1);
      working >>= 1;
      remaining -= 1;
    }
    writer.writeBit(1);
  }

  if (remaining > 0) {
    for (let i = 0; i < BITS_PER_BLOCK; i++) {
      if (remaining > 0) {
        writer.writeBit(working & 1);
        working >>= 1;
        remaining -= 1;
      } else {
        writer.writeBit(0);
      }
    }
    writer.writeBit(0);
  }
}
