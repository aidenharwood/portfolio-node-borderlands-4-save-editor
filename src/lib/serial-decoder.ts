// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// High-level decoder glue that bridges the Go reference implementation with our Vue tooling.

import { decodeBase85, deserialize, serialToString } from './b4s';
import { getItemTypeName, getManufacturer, getWeaponType } from './item-type-map';

export interface FieldInfo {
  id: number;
  value: number;
}

export interface PartInfo {
  id: number;
  chunks?: number[];
}

export interface DeserializedStructure {
  itemType: number;
  version: number;
  fields: FieldInfo[];
  parts: PartInfo[];
}

export interface DecodedSerial {
  itemType: number;
  itemTypeName?: string;
  manufacturer?: string;
  weaponType?: string;
  version: number;
  level?: number;
  randomSeed?: number;
  fields: FieldInfo[];
  parts: PartInfo[];
  deserialized: string;
  raw: string;
  binary: string;
  hex: string;
}

function bytesToHex(bytes: Uint8Array): string {
  const parts: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    parts[i] = bytes[i].toString(16).padStart(2, '0');
  }
  return parts.join('');
}

function stripWhitespaceBits(bitStream: string): string {
  return bitStream.replace(/\s+/g, '');
}

export function buildDeserializedString(structure: DeserializedStructure): string {
  let result = `${structure.itemType}, ${structure.version}`;

  if (structure.fields.length > 0) {
    for (let i = 0; i < structure.fields.length; i++) {
      const field = structure.fields[i];
      if (i === 0) {
        result += `, ${field.id}, ${field.value}|`;
      } else {
        result += ` ${field.id}, ${field.value}|`;
      }
    }
  }

  result += '|';

  if (structure.parts.length > 0) {
    const partStrings: string[] = [];
    for (const part of structure.parts) {
      if (part.chunks && part.chunks.length > 0) {
        if (part.chunks.length === 1) {
          partStrings.push(`{${part.id}:${part.chunks[0]}}`);
        } else {
          partStrings.push(`{${part.id}:[${part.chunks.join(' ')}]}`);
        }
      } else {
        partStrings.push(`{${part.id}}`);
      }
    }
    result += ` ${partStrings.join(' ')}`;
  }

  result += '|';
  return result;
}

export function parseDeserializedStructure(deserialized: string): DeserializedStructure {
  const [fieldsSectionRaw, partsSectionRaw = ''] = deserialized.split('||');
  const headerTokens = (fieldsSectionRaw ?? '')
    .split(/[|,]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const itemType = Number.parseInt(headerTokens[0] ?? '0', 10) || 0;
  const version = Number.parseInt(headerTokens[1] ?? '0', 10) || 0;

  const fields: FieldInfo[] = [];
  for (let i = 2; i < headerTokens.length; i += 2) {
    const id = Number.parseInt(headerTokens[i] ?? '', 10);
    const value = Number.parseInt(headerTokens[i + 1] ?? '', 10);
    if (Number.isFinite(id) && Number.isFinite(value)) {
      fields.push({ id, value });
    }
  }

  const parts: PartInfo[] = [];
  const partsSection = (partsSectionRaw ?? '').replace(/\|+$/, '');
  const regex = /\{(\d+)(?::(?:(\d+)|\[([^\]]*)\]))?\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(partsSection)) !== null) {
    const id = Number.parseInt(match[1], 10);
    if (!Number.isFinite(id)) {
      continue;
    }

    if (match[3] !== undefined) {
      const chunks = match[3]
        .split(/\s+/)
        .map((token) => Number.parseInt(token, 10))
        .filter((value) => Number.isFinite(value));
      parts.push({ id, chunks });
      continue;
    }

    if (match[2] !== undefined) {
      const value = Number.parseInt(match[2], 10);
      if (Number.isFinite(value)) {
        parts.push({ id, chunks: [value] });
      } else {
        parts.push({ id });
      }
      continue;
    }

    parts.push({ id });
  }

  return {
    itemType,
    version,
    fields,
    parts
  };
}

export function decodeSerial(serial: string): DecodedSerial {
  const bytes = decodeBase85(serial);
  const { serial: blocks, bitString } = deserialize(bytes);
  const deserialized = serialToString(blocks);
  const structure = parseDeserializedStructure(deserialized);

  const level = structure.fields.find((field) => field.id === 1)?.value;
  const randomSeed = structure.fields.find((field) => field.id === 2)?.value;

  return {
    itemType: structure.itemType,
    itemTypeName: getItemTypeName(structure.itemType),
    manufacturer: getManufacturer(structure.itemType),
    weaponType: getWeaponType(structure.itemType),
    version: structure.version,
    level,
    randomSeed,
    fields: structure.fields,
    parts: structure.parts,
    deserialized,
    raw: serial,
    binary: stripWhitespaceBits(bitString),
    hex: bytesToHex(bytes)
  };
}

export function serializeToString(decoded: DecodedSerial): string {
  return buildDeserializedString({
    itemType: decoded.itemType,
    version: decoded.version,
    fields: decoded.fields,
    parts: decoded.parts
  });
}
