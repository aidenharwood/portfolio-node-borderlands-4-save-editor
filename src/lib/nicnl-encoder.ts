/**
 * Borderlands 4 Item Serial Encoder
 * Encodes item data back to BL4 serial format
 * 
 * Implements:
 * - Binary → Base85 encoding with bit reversal
 * - Varint5/Varbit5 encoding
 * - Level and random seed modification
 */

import type { DecodedSerial } from './nicnl-decoder';

const B85_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~";
const LEVEL_MARKER = '00000011001000001100';

/**
 * Convert binary string to hex string
 */
export function binToHex(bin: string): string {
  // Pad to multiple of 4 bits
  while (bin.length % 4 !== 0) {
    bin += '0';
  }
  
  let hex = '';
  for (let i = 0; i < bin.length; i += 4) {
    const nibble = bin.slice(i, i + 4);
    hex += parseInt(nibble, 2).toString(16);
  }
  return hex;
}

/**
 * Convert hex string to byte array
 */
export function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Reverse bits in a byte (01234567 => 76543210)
 */
export function reverseBits(byte: number): number {
  let b = byte;
  b = ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
  b = ((b & 0xCC) >> 2) | ((b & 0x33) << 2);
  b = ((b & 0xAA) >> 1) | ((b & 0x55) << 1);
  return b;
}

/**
 * Encode byte array to Base85 serial
 * Uses Nicnl's exact implementation: big-endian, bit-reversed
 */
export function bytesToB85(bytes: number[]): string {
  // Reverse bits in each byte (reverse the decode operation)
  const reversedBytes = bytes.map(reverseBits);
  
  let result = '@U'; // Prefix
  let idx = 0;
  
  while (idx < reversedBytes.length) {
    let workingU32 = 0;
    let byteCount = 0;
    
    // Collect up to 4 bytes
    if (idx < reversedBytes.length) {
      workingU32 |= reversedBytes[idx++] << 24;
      byteCount++;
    }
    if (idx < reversedBytes.length) {
      workingU32 |= reversedBytes[idx++] << 16;
      byteCount++;
    }
    if (idx < reversedBytes.length) {
      workingU32 |= reversedBytes[idx++] << 8;
      byteCount++;
    }
    if (idx < reversedBytes.length) {
      workingU32 |= reversedBytes[idx++];
      byteCount++;
    }
    
    // Ensure unsigned
    workingU32 = workingU32 >>> 0;
    
    // Encode as Base85 (5 characters)
    const chars: string[] = [];
    for (let i = 0; i < 5; i++) {
      chars.unshift(B85_CHARSET[workingU32 % 85]);
      workingU32 = Math.floor(workingU32 / 85);
    }
    
    // Add the appropriate number of characters based on byte count
    const charCount = byteCount + 1; // 1 byte = 2 chars, 2 bytes = 3 chars, etc.
    result += chars.slice(0, charCount).join('');
  }
  
  return result;
}

/**
 * Encode a signed int16 as varint5
 * Returns binary string with LSB-first encoding
 * @param minBlocks Minimum number of 5-bit blocks to encode (for padding)
 */
export function encodeVarint5(value: number, minBlocks: number = 0): string {
  // Convert to unsigned representation if negative
  if (value < 0) {
    value = (1 << 16) + value; // Two's complement for 16-bit
  }
  
  // Convert to binary (no padding!)
  let bits = value.toString(2);
  
  // Reverse bits for LSB-first
  bits = bits.split('').reverse().join('');
  
  // Calculate required blocks
  const requiredBlocks = Math.ceil(bits.length / 4);
  const blocksToEncode = Math.max(requiredBlocks, minBlocks);
  
  // Pad bits to fit minimum blocks
  while (bits.length < blocksToEncode * 4) {
    bits += '0';
  }
  
  // Encode in 4-bit blocks with continuation bit
  let result = '';
  for (let i = 0; i < blocksToEncode * 4; i += 4) {
    const block = bits.slice(i, i + 4);
    const hasMore = (i + 4 < blocksToEncode * 4) ? '1' : '0';
    result += block + hasMore;
  }
  
  return result;
}

/**
 * Encode a value as varbit5
 * Returns binary string with 5-bit length + payload (LSB-first)
 */
export function encodeVarbit5(value: number): string {
  // Convert to binary
  let bits = value.toString(2);
  
  // Reverse for LSB-first
  bits = bits.split('').reverse().join('');
  
  // Encode length (5 bits, LSB-first)
  const length = bits.length;
  const lengthBits = length.toString(2).padStart(5, '0');
  const lengthReversed = lengthBits.split('').reverse().join('');
  
  return lengthReversed + bits;
}

/**
 * Encode major type (3 bits)
 */
export function encodeMajorType(type: '000' | '001' | '010' | '100' | '110'): string {
  return type;
}

/**
 * Modify the level of a decoded serial
 * Returns a new serial string with the modified level
 */
export function modifyLevel(decoded: DecodedSerial, newLevel: number): string {
  // Start with prefix
  let binary = '0010000';
  
  // Encode item type (always use varbit5 with major type 110)
  binary += encodeMajorType('110');
  binary += encodeVarbit5(decoded.itemType);
  
  // Add static "mystery bits" (appears between item type and level marker)
  // These are always 01100 in all observed serials
  binary += '01100';
  
  // Add level marker
  binary += LEVEL_MARKER;
  
  // Encode new level (always use at least 2 blocks for level)
  binary += encodeVarint5(newLevel, 2);
  
  // Encode other fields (like random seed)
  for (const field of decoded.fields) {
    if (field.id === 1) continue; // Skip level, we already encoded it
    
    // Field ID (varbit5, no major type)
    binary += encodeVarbit5(field.id);
    
    // Field marker
    binary += '001';
    
    // Field value (use varbit5 for unsigned values like random seed)
    binary += encodeMajorType('110');
    binary += encodeVarbit5(field.value);
  }
  
  // Encode parts section
  if (decoded.parts && decoded.parts.length > 0) {
    // Terminator before parts
    binary += '000';
    
    // Parts count
    const partCount = decoded.parts.length;
    if (partCount < 32) {
      binary += encodeMajorType('110');
      binary += encodeVarbit5(partCount);
    } else {
      binary += encodeMajorType('100');
      binary += encodeVarint5(partCount);
    }
    
    // Each part
    for (const part of decoded.parts) {
      // Part ID
      if (part.id < 32) {
        binary += encodeMajorType('110');
        binary += encodeVarbit5(part.id);
      } else {
        binary += encodeMajorType('100');
        binary += encodeVarint5(part.id);
      }
      
      // Chunks (if any)
      if (part.chunks && part.chunks.length > 0) {
        // Chunk count
        const chunkCount = part.chunks.length;
        if (chunkCount < 32) {
          binary += encodeMajorType('110');
          binary += encodeVarbit5(chunkCount);
        } else {
          binary += encodeMajorType('100');
          binary += encodeVarint5(chunkCount);
        }
        
        // Each chunk
        for (const chunk of part.chunks) {
          if (chunk < 32) {
            binary += encodeMajorType('110');
            binary += encodeVarbit5(chunk);
          } else {
            binary += encodeMajorType('100');
            binary += encodeVarint5(chunk);
          }
        }
      } else {
        // No chunks - encode chunk count as 0
        binary += encodeMajorType('110');
        binary += encodeVarbit5(0);
      }
    }
  }
  
  // Pad to byte boundary
  while (binary.length % 8 !== 0) {
    binary += '0';
  }
  
  // Convert to hex
  const hex = binToHex(binary);
  
  // Convert to bytes
  const bytes = hexToBytes(hex);
  
  // Encode to Base85
  return bytesToB85(bytes);
}

/**
 * Modify the random seed of a decoded serial
 * Returns a new serial string with the modified random seed
 */
export function modifyRandomSeed(decoded: DecodedSerial, newSeed: number): string {
  // Update the random seed field
  const modifiedDecoded = { ...decoded };
  modifiedDecoded.fields = decoded.fields.map(f => 
    f.id === 2 ? { ...f, value: newSeed } : f
  );
  
  // Re-encode with the same level
  return modifyLevel(modifiedDecoded, decoded.level || 1);
}

/**
 * Create a new serial with specified level and random seed
 */
export function createSerial(itemType: number, version: number, level: number, randomSeed: number, parts?: Array<{ id: number; chunks?: number[] }>): string {
  const decoded: DecodedSerial = {
    itemType,
    version,
    level,
    randomSeed,
    fields: [
      { id: 1, value: level },
      { id: 2, value: randomSeed }
    ],
    parts: parts || [],
    raw: '',
    binary: '',
    hex: ''
  };
  
  return modifyLevel(decoded, level);
}
