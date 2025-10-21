// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Part structure helpers for Borderlands 4 serials.

import { BitWriter } from './bit-writer';
import { Token, Tokenizer } from './tokenizer';
import type { TokenType } from './tokenizer';
import { readVarbit, writeVarbit } from './varbit';
import { readVarint, writeVarint } from './varint';

export const PartSubType = {
  NONE: 0,
  INT: 1,
  LIST: 2
} as const;
export type PartSubType = (typeof PartSubType)[keyof typeof PartSubType];

export interface Part {
  index: number;
  subType: PartSubType;
  value?: number;
  values?: number[];
}

export function partToString(part: Part): string {
  if (part.subType === PartSubType.NONE) {
    return `{${part.index}}`;
  }
  if (part.subType === PartSubType.INT) {
    return `{${part.index}:${part.value ?? 0}}`;
  }
  const values = part.values ?? [];
  return `{${part.index}:[${values.join(' ')}]}`;
}

export function bestEncodingForValue(value: number): { tokenType: TokenType; tokenBits: number[]; valueBits: number[] } {
  const varintWriter = new BitWriter();
  writeVarint(varintWriter, value);
  const varbitWriter = new BitWriter();
  writeVarbit(varbitWriter, value);

  if (varintWriter.position <= varbitWriter.position) {
    return { tokenType: Token.VARINT, tokenBits: [1, 0, 0], valueBits: varintWriter.bits() };
  }
  return { tokenType: Token.VARBIT, tokenBits: [1, 1, 0], valueBits: varbitWriter.bits() };
}

export function readPart(tokenizer: Tokenizer): Part {
  const reader = tokenizer.bitReader();

  const index = readVarint(reader);
  const firstFlag = reader.read();
  if (firstFlag === null) {
    throw new Error('unexpected end of data while reading part flag');
  }

  if (firstFlag === 1) {
    const value = readVarint(reader);
    tokenizer.expect('type part, subtype int terminator', 0, 0, 0);
    return {
      index,
      subType: PartSubType.INT,
      value
    };
  }

  const secondFlag = reader.readN(2);
  if (secondFlag === null) {
    throw new Error('unexpected end of data while reading part subtype flag');
  }

  if (secondFlag === 0b10) {
    return {
      index,
      subType: PartSubType.NONE
    };
  }

  if (secondFlag === 0b01) {
    const values: number[] = [];

    const startToken = tokenizer.nextToken();
    if (startToken !== Token.SEP2) {
      throw new Error(`expected list start token ${Token.SEP2}, got ${startToken}`);
    }

    while (true) {
      const token = tokenizer.nextToken();
      if (token === null) {
        throw new Error('unexpected end of data while reading part list');
      }

      if (token === Token.SEP1) {
        return {
          index,
          subType: PartSubType.LIST,
          values
        };
      }

      if (token === Token.VARINT) {
        values.push(readVarint(reader));
        continue;
      }

      if (token === Token.VARBIT) {
        values.push(readVarbit(reader));
        continue;
      }

      throw new Error(`unexpected token ${token} while reading part list`);
    }
  }

  throw new Error(`unknown part subtype flag ${(secondFlag >>> 0).toString(2)}`);
}

export function writePart(writer: BitWriter, part: Part): void {
  writeVarint(writer, part.index >>> 0);

  switch (part.subType) {
    case PartSubType.NONE:
      writer.writeBits(0, 1, 0);
      return;
    case PartSubType.INT:
      writer.writeBit(1);
      writeVarint(writer, part.value ?? 0);
      writer.writeBits(0, 0, 0);
      return;
    case PartSubType.LIST: {
      writer.writeBits(0, 0, 1);
      writer.writeBits(0, 1);

      const values = part.values ?? [];
      for (const value of values) {
        const encoding = bestEncodingForValue(value >>> 0);
        writer.writeBits(...encoding.tokenBits);
        writer.writeBits(...encoding.valueBits);
      }

      writer.writeBits(0, 0);
      return;
    }
    default:
      throw new Error(`unsupported part subtype ${part.subType}`);
  }
}
