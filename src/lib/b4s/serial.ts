// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// High level serial (de)serialization utilities built on top of tokenizer/bit helpers.

import { BitWriter } from './bit-writer';
import { bestEncodingForValue, PartSubType, partToString, readPart, writePart } from './part';
import type { Part } from './part';
import { readVarbit, writeVarbit } from './varbit';
import { readVarint, writeVarint } from './varint';
import { Token, Tokenizer } from './tokenizer';
import type { TokenType } from './tokenizer';

export interface Block {
  token: TokenType;
  value?: number;
  part?: Part;
}

export type Serial = Block[];

interface DeserializeResult {
  serial: Serial;
  bitString: string;
}

export function deserialize(data: Uint8Array): DeserializeResult {
  const tokenizer = new Tokenizer(data);
  tokenizer.expect('magic header', 0, 0, 1, 0, 0, 0, 0);

  const reader = tokenizer.bitReader();
  const blocks: Serial = [];
  let trailingTerminators = 0;
  let partBlocksFound = false;

  while (true) {
    const token = tokenizer.nextToken();
    if (token === null) {
      break;
    }

    if (token === Token.UNSUPPORTED_111) {
      if (partBlocksFound) {
        break;
      }
      throw new Error('unsupported PART_111 block found, aborting');
    }

    const block: Block = { token };

    if (token === Token.SEP1) {
      trailingTerminators += 1;
    } else {
      trailingTerminators = 0;
    }

    switch (token) {
      case Token.SEP1:
      case Token.SEP2:
        break;
      case Token.VARINT: {
        const value = readVarint(reader);
        block.value = value;
        break;
      }
      case Token.VARBIT: {
        const value = readVarbit(reader);
        block.value = value;
        break;
      }
      case Token.PART: {
        const part = readPart(tokenizer);
        block.part = part;
        partBlocksFound = true;
        break;
      }
      default:
        throw new Error(`unknown token ${token}`);
    }

    blocks.push(block);
  }

  while (trailingTerminators > 1 && blocks.length > 0) {
    blocks.pop();
    trailingTerminators -= 1;
  }

  return {
    serial: blocks,
    bitString: tokenizer.doneString()
  };
}

export function serialize(serial: Serial): Uint8Array {
  const writer = new BitWriter();
  writer.writeBits(0, 0, 1, 0, 0, 0, 0);

  for (const block of serial) {
    switch (block.token) {
      case Token.SEP1:
        writer.writeBits(0, 0);
        break;
      case Token.SEP2:
        writer.writeBits(0, 1);
        break;
      case Token.VARINT:
        writer.writeBits(1, 0, 0);
        writeVarint(writer, block.value ?? 0);
        break;
      case Token.VARBIT:
        writer.writeBits(1, 1, 0);
        writeVarbit(writer, block.value ?? 0);
        break;
      case Token.PART:
        writer.writeBits(1, 0, 1);
        writePart(writer, block.part ?? { index: 0, subType: PartSubType.NONE });
        break;
      case Token.UNSUPPORTED_111:
        // Intentionally skipped: we do not handle DLC tokens.
        break;
      default:
        throw new Error(`unsupported token ${block.token}`);
    }
  }

  return writer.toUint8Array();
}

export function serialToString(serial: Serial): string {
  const parts: string[] = [];

  for (let i = 0; i < serial.length; i++) {
    const block = serial[i];
    switch (block.token) {
      case Token.SEP1:
        parts.push('|');
        break;
      case Token.SEP2:
        parts.push(',');
        break;
      case Token.VARINT:
      case Token.VARBIT:
        parts.push(i > 0 ? ` ${block.value ?? 0}` : `${block.value ?? 0}`);
        break;
      case Token.PART: {
        const text = partToString(block.part ?? { index: 0, subType: PartSubType.NONE });
        parts.push(i > 0 ? ` ${text}` : text);
        break;
      }
      case Token.UNSUPPORTED_111:
        parts.push(i > 0 ? ' <111>' : '<111>');
        break;
      default:
        parts.push(` <UNKNOWN_TOKEN:${block.token}>`);
        break;
    }
  }

  return parts.join('');
}

function normalizeDeserializedString(input: string): string {
  let prev = '';
  let current = input;
  while (current !== prev) {
    prev = current;
    current = current
      .replace(/} /g, '}')
      .replace(/ \{/g, '{')
      .replace(/, /g, ',')
      .replace(/\| /g, '|')
      .replace(/ \|/g, '|');
  }
  return current;
}

function parseUnsigned(str: string): number | null {
  const trimmed = str.trim();
  if (trimmed.length === 0) {
    return null;
  }
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed.charCodeAt(i);
    if (ch < 48 || ch > 57) {
      return null;
    }
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value >>> 0;
}

function parsePartToken(token: string): Part | null {
  const trimmed = token.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }
  const content = trimmed.slice(1, -1).trim();
  if (content.length === 0) {
    return null;
  }

  if (!content.includes(':')) {
    const index = parseUnsigned(content);
    if (index === null) {
      return null;
    }
    return {
      index,
      subType: PartSubType.NONE
    };
  }

  const [indexRaw, valueRaw] = content.split(':');
  const index = parseUnsigned(indexRaw ?? '');
  if (index === null) {
    return null;
  }

  if (valueRaw?.startsWith('[') && valueRaw.endsWith(']')) {
    const inner = valueRaw.slice(1, -1).trim();
    const values: number[] = [];
    if (inner.length > 0) {
      for (const part of inner.split(' ')) {
        if (part === '') {
          continue;
        }
        const num = parseUnsigned(part);
        if (num === null) {
          return null;
        }
        values.push(num);
      }
    }
    return {
      index,
      subType: PartSubType.LIST,
      values
    };
  }

  const value = parseUnsigned(valueRaw ?? '');
  if (value === null) {
    return null;
  }
  return {
    index,
    subType: PartSubType.INT,
    value
  };
}

function tokenizeDeserializedString(str: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let braceDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (braceDepth > 0) {
      current += ch;
      if (ch === '{') {
        braceDepth += 1;
      } else if (ch === '}') {
        braceDepth -= 1;
        if (braceDepth === 0) {
          tokens.push(current);
          current = '';
        }
      }
      continue;
    }

    if (ch === '{') {
      if (current !== '') {
        tokens.push(current);
        current = '';
      }
      braceDepth = 1;
      current = '{';
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (current !== '') {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    if (ch === '|' || ch === ',') {
      if (current !== '') {
        tokens.push(current);
        current = '';
      }
      tokens.push(ch);
      continue;
    }

    current += ch;
  }

  if (current !== '') {
    tokens.push(current);
  }

  return tokens.filter((t) => t.length > 0);
}

export function serialFromString(input: string): Serial {
  const normalized = normalizeDeserializedString(input);
  const tokens = tokenizeDeserializedString(normalized);
  const blocks: Serial = [];

  for (const token of tokens) {
    if (token === '|') {
      blocks.push({ token: Token.SEP1 });
      continue;
    }
    if (token === ',') {
      blocks.push({ token: Token.SEP2 });
      continue;
    }
    if (token.startsWith('{')) {
      const part = parsePartToken(token);
      if (!part) {
        throw new Error(`invalid part token '${token}'`);
      }
      blocks.push({ token: Token.PART, part });
      continue;
    }
    if (token === '<111>') {
      blocks.push({ token: Token.UNSUPPORTED_111 });
      continue;
    }

    const numeric = parseUnsigned(token);
    if (numeric !== null) {
      const encoding = bestEncodingForValue(numeric);
      blocks.push({ token: encoding.tokenType, value: numeric });
      continue;
    }

    throw new Error(`invalid token '${token}' in deserialized string`);
  }

  return blocks;
}
