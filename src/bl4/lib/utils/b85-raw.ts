/**
 * Raw Base85 serial encoder/decoder that mirrors the logic in `b85decode.c`.
 *
 * This module exposes two helpers:
 *   - `decodeBase85(payload: string)` which returns the raw bytes as a Uint8Array
 *   - `encodeBase85(bytes: Uint8Array)` which emits the payload string using the
 *     same alphabet and padding rules as the C implementation
 *
 * NOTE: This is intentionally low-level and does not perform any of the extra
 * bookkeeping that the TypeScript port of `bl4editor.py` does. It is useful when
 * you want to cross-check behaviour with the native decoder.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~';
const PAD_DIGIT = ALPHABET.length - 1; // Highest digit (equivalent to '~')
const C4 = 0x31c84b1;
const C3 = 0x95eed;
const C2 = 0x1c39;
const C1 = 0x55;

const LOOKUP = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i += 1) {
  LOOKUP.set(ALPHABET[i], i);
}

/**
 * Decode a base85 payload string into raw bytes. Invalid characters are skipped,
 * matching the behaviour of the native decoder.
 */
export function decodeBase85(payload: string): Uint8Array {
  const digits: number[] = [];
  for (const ch of payload) {
    const value = LOOKUP.get(ch);
    if (value !== undefined) {
      digits.push(value);
    }
  }

  if (digits.length === 0) {
    return new Uint8Array();
  }

  const output: number[] = [];
  const chunk: number[] = [];

  for (const value of digits) {
    chunk.push(value);
    if (chunk.length === 5) {
      output.push(...decodeChunk(chunk));
      chunk.length = 0;
    }
  }

  if (chunk.length > 0) {
    const originalLength = chunk.length;
    while (chunk.length < 5) {
      chunk.push(PAD_DIGIT);
    }
    const decoded = decodeChunk(chunk);
    output.push(...decoded.slice(0, Math.max(originalLength - 1, 0)));
  }

  return Uint8Array.from(output);
}

/**
 * Encode raw bytes back into a base85 payload.
 */
export function encodeBase85(bytes: Uint8Array): string {
  let result = '';
  let index = 0;

  // Full 4-byte blocks
  while (index + 4 <= bytes.length) {
    const value =
      bytes[index] |
      (bytes[index + 1] << 8) |
      (bytes[index + 2] << 16) |
      (bytes[index + 3] << 24);

    result += encodeValue(value >>> 0, 5);
    index += 4;
  }

  // Trailing bytes (0 < remainder < 4)
  const remaining = bytes.length - index;
  if (remaining > 0) {
    // The decoder expects (digitCount - 1) bytes from an incomplete chunk
    // So if we have N bytes, we need (N + 1) digits
    // Pack bytes in little-endian order
    let tailValue = bytes[index] ?? 0;
    if (remaining >= 2) {
      tailValue |= (bytes[index + 1] ?? 0) << 8;
    }
    if (remaining >= 3) {
      tailValue |= (bytes[index + 2] ?? 0) << 16;
    }

    const digitCount = remaining + 1;
    result += encodeValue(tailValue >>> 0, digitCount);
  }

  return result;
}

function decodeChunk(chunk: number[]): number[] {
  const d1 = chunk[0];
  const d2 = chunk[1];
  const d3 = chunk[2];
  const d4 = chunk[3];
  const d5 = chunk[4];

  const u4 = d4 * C1 + d5;
  const u3 = d3 * C2 + u4;
  const u2 = d2 * C3 + u3;
  const value = (d1 * C4 + u2) >>> 0;

  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
}

function encodeValue(value: number, digitCount: number): string {
  let remainder = value >>> 0;
  const digits = new Array<number>(5);

  digits[0] = Math.floor(remainder / C4);
  remainder %= C4;
  digits[1] = Math.floor(remainder / C3);
  remainder %= C3;
  digits[2] = Math.floor(remainder / C2);
  remainder %= C2;
  digits[3] = Math.floor(remainder / C1);
  digits[4] = remainder % C1;

  let out = '';
  for (let i = 0; i < digitCount; i += 1) {
    out += ALPHABET[digits[i]];
  }
  return out;
}

/**
 * Convenience wrapper for full serial strings (with the @U? prefix).
 */
export function decodeSerial(serial: string): Uint8Array {
  const payload = serial.startsWith('@U') ? serial.slice(3) : serial;
  return decodeBase85(payload);
}

export function encodeSerial(prefix: string, payloadBytes: Uint8Array): string {
  return prefix + encodeBase85(payloadBytes);
}

export const B85_ALPHABET = ALPHABET;
