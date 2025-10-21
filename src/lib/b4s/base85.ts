// Derived from https://github.com/Nicnl/borderlands4-serials (AGPL-3.0-or-later)
// Custom Base85 codec with byte mirroring for Borderlands 4 serials.

import { mirrorByte } from './byte-mirror';

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~';
const PADDING_VALUE = CHARSET.charCodeAt(CHARSET.length - 1);

const POW85_1 = 85;
const POW85_2 = POW85_1 * 85;
const POW85_3 = POW85_2 * 85;
const POW85_4 = POW85_3 * 85;

const reverseLookup = (() => {
  const table = new Uint8Array(256);
  table.fill(0xff);
  for (let i = 0; i < CHARSET.length; i++) {
    table[CHARSET.charCodeAt(i)] = i;
  }
  return table;
})();

export function decodeBase85(serial: string): Uint8Array {
  if (serial.length < 2 || serial[0] !== '@' || serial[1] !== 'U') {
    throw new Error('not a valid Borderlands 4 serial');
  }

  const payload = serial.slice(2);
  const result: number[] = [];
  let idx = 0;

  while (idx < payload.length) {
    let value = 0;
    let charCount = 0;

    while (idx < payload.length && charCount < 5) {
      const code = payload.charCodeAt(idx);
      idx += 1;
      const mapped = reverseLookup[code];
      if (mapped <= 85) {
        value = value * 85 + mapped;
        charCount += 1;
      }
    }

    if (charCount === 0) {
      break;
    }

    if (charCount < 5) {
      const padding = 5 - charCount;
      for (let i = 0; i < padding; i++) {
        value = value * 85 + PADDING_VALUE;
      }
    }

    let byteCount = 4;
    if (charCount < 5) {
      byteCount = charCount - 1;
    }

    if (byteCount >= 1) {
      result.push((value >> 24) & 0xff);
    }
    if (byteCount >= 2) {
      result.push((value >> 16) & 0xff);
    }
    if (byteCount >= 3) {
      result.push((value >> 8) & 0xff);
    }
    if (byteCount >= 4) {
      result.push(value & 0xff);
    }
  }

  for (let i = 0; i < result.length; i++) {
    result[i] = mirrorByte(result[i]);
  }

  return Uint8Array.from(result);
}

export function encodeBase85(data: Uint8Array): string {
  const bytes = new Uint8Array(data.length);
  bytes.set(data);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = mirrorByte(bytes[i]);
  }

  let output = '@U';
  let idx = 0;
  const length = bytes.length;
  const fullGroups = Math.floor(length / 4);
  const extraBytes = length % 4;

  for (let group = 0; group < fullGroups; group++) {
    const v0 = bytes[idx];
    const v1 = bytes[idx + 1];
    const v2 = bytes[idx + 2];
    const v3 = bytes[idx + 3];
    idx += 4;

    let value = ((v0 << 24) | (v1 << 16) | (v2 << 8) | v3) >>> 0;

    const c4 = value % POW85_1;
    value = Math.floor(value / POW85_1);
    const c3 = value % POW85_1;
    value = Math.floor(value / POW85_1);
    const c2 = value % POW85_1;
    value = Math.floor(value / POW85_1);
    const c1 = value % POW85_1;
    const c0 = Math.floor(value / POW85_1);

    output += CHARSET[c0] + CHARSET[c1] + CHARSET[c2] + CHARSET[c3] + CHARSET[c4];
  }

  if (extraBytes !== 0) {
    let value = bytes[idx];
    if (extraBytes >= 2) {
      value = (value << 8) | bytes[idx + 1];
    }
    if (extraBytes === 3) {
      value = (value << 8) | bytes[idx + 2];
    }

    if (extraBytes === 3) {
      value <<= 8;
    } else if (extraBytes === 2) {
      value <<= 16;
    } else {
      value <<= 24;
    }

    let remaining = value >>> 0;
    const chars: string[] = [];

    chars.push(CHARSET[Math.floor(remaining / POW85_4)]);
    remaining %= POW85_4;
    chars.push(CHARSET[Math.floor(remaining / POW85_3)]);

    if (extraBytes >= 2) {
      remaining %= POW85_3;
      chars.push(CHARSET[Math.floor(remaining / POW85_2)]);

      if (extraBytes === 3) {
        remaining %= POW85_2;
        chars.push(CHARSET[Math.floor(remaining / POW85_1)]);
      }
    }

    output += chars.join('');
  }

  return output;
}
