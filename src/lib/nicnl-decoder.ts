/**
 * Borderlands 4 Item Serial Decoder
 * Reverse engineered from Nicnl's deserializer at https://borderlands4-deserializer.nicnl.com/
 * 
 * This implementation combines:
 * 1. Nicnl's b85.js for Base85 decoding with bit reversal
 * 2. Nicnl's item_decode_read_level.js for level extraction
 * 3. README.md specifications for varint5/varbit5 formats
 * 
 * Key discoveries:
 * - Base85: Big-endian byte order [3,2,1,0] with bit reversal enabled
 * - Level marker: "00000011001000001100" (20 bits)
 * - Level is encoded as varint5 after the marker
 * - Varint5: blocks of 5 bits (4 data + 1 continuation), LSB-first
 */

import { getItemTypeName, getManufacturer, getWeaponType } from './item-type-map';

const B85_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~";
const LEVEL_MARKER = '00000011001000001100';

// Create reverse lookup table for Base85
const reverseLookup = new Array(256).fill(0xFF);
for (let i = 0; i < B85_CHARSET.length; i++) {
  reverseLookup[B85_CHARSET.charCodeAt(i)] = i;
}

/**
 * Decode Base85 serial to hex string
 * Uses Nicnl's exact implementation: big-endian, bit-reversed
 */
export function b85DecodeToHex(serial: string): string | null {
  // Remove @U prefix
  if (serial[0] !== '@' || serial[1] !== 'U') return null;
  const string = serial.slice(2);

  const result: number[] = [];
  let idx = 0;
  const size = string.length;

  // Byte order for Borderlands 4: Standard big-endian [0, 1, 2, 3]
  // The reverseByteOrder is used during decode to undo the encoding transformation
  const reverseByteOrder = (bytes: number[]): number[] => {
    // During decoding, we need to reverse the byte order that was applied during encoding
    // Since encoding used [3,2,1,0], we reverse it back to [0,1,2,3]
    return [bytes[0], bytes[1], bytes[2], bytes[3]];
  };

  while (idx < size) {
    let workingU32 = 0;
    let charCount = 0;

    // Collect up to 5 valid Base85 characters
    while (idx < size && charCount < 5) {
      const charCode = string.charCodeAt(idx);
      idx++;

      if (charCode >= 0 && reverseLookup[charCode] < 0x56) {
        workingU32 = workingU32 * 85 + reverseLookup[charCode];
        charCount++;
      }
    }

    if (charCount === 0) break;

    // Handle padding for incomplete groups
    if (charCount < 5) {
      const padding = 5 - charCount;
      for (let i = 0; i < padding; i++) {
        workingU32 = workingU32 * 85 + 0x7e; // '~' value
      }
    }

    if (charCount === 5) {
      // Full group - apply byte order transformation
      const standardBytes = [
        (workingU32 >>> 24) & 0xFF,
        (workingU32 >>> 16) & 0xFF,
        (workingU32 >>> 8) & 0xFF,
        (workingU32 >>> 0) & 0xFF
      ];

      const orderedBytes = reverseByteOrder(standardBytes);
      result.push(orderedBytes[0], orderedBytes[1], orderedBytes[2], orderedBytes[3]);
    } else {
      // Partial group - NO byte order transformation
      const byteCount = charCount - 1;
      if (byteCount >= 1) result.push((workingU32 >>> 24) & 0xFF);
      if (byteCount >= 2) result.push((workingU32 >>> 16) & 0xFF);
      if (byteCount >= 3) result.push((workingU32 >>> 8) & 0xFF);
    }
  }

  // Reverse the bits in each byte (76543210 => 01234567)
  for (let i = 0; i < result.length; i++) {
    let b = result[i];
    b = ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
    b = ((b & 0xCC) >> 2) | ((b & 0x33) << 2);
    b = ((b & 0xAA) >> 1) | ((b & 0x55) << 1);
    result[i] = b;
  }

  // Convert byte array to hex string
  return result.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to binary string
 */
export function hexToBin(hex: string): string {
  hex = hex.replace("0x", "").toLowerCase();
  let out = "";
  for (const c of hex) {
    switch (c) {
      case '0': out += "0000"; break;
      case '1': out += "0001"; break;
      case '2': out += "0010"; break;
      case '3': out += "0011"; break;
      case '4': out += "0100"; break;
      case '5': out += "0101"; break;
      case '6': out += "0110"; break;
      case '7': out += "0111"; break;
      case '8': out += "1000"; break;
      case '9': out += "1001"; break;
      case 'a': out += "1010"; break;
      case 'b': out += "1011"; break;
      case 'c': out += "1100"; break;
      case 'd': out += "1101"; break;
      case 'e': out += "1110"; break;
      case 'f': out += "1111"; break;
      default: return "";
    }
  }
  return out;
}

/**
 * Convert binary string back to hex
 */
export function binToHex(bin: string): string {
  let hex = '';
  for (let i = 0; i < bin.length; i += 4) {
    const nibble = bin.slice(i, i + 4);
    const h = parseInt(nibble, 2).toString(16);
    hex += h;
  }
  return hex;
}

/**
 * Decode item level from binary string
 * Exact implementation from Nicnl's item_decode_read_level.js
 */
export function itemDecodeLevel(b02: string): { level: number; firstLevelBit: number; lastLevelBit: number } | null {
  // Keep only 200 first bits, the level is always within this range
  if (b02.length >= 200) b02 = b02.slice(0, 200);

  let firstLevelBit = -1;
  let lastLevelBit = -1;

  // Figure out where the level marker is
  const markerIndex = b02.indexOf(LEVEL_MARKER);
  if (markerIndex === -1) return null;
  firstLevelBit = markerIndex + LEVEL_MARKER.length;

  // Discard everything before the marker
  b02 = b02.slice(markerIndex + LEVEL_MARKER.length);

  // The level cannot be more than 20 bits long
  if (b02.length >= 20) b02 = b02.slice(0, 20);

  // Read the varints (5 bits each)
  let levelBits = '';
  lastLevelBit = firstLevelBit;
  while (b02.length > 0) {
    // Should not happen
    if (b02.length < 5) return null;
    lastLevelBit += 5;

    // First 4 bits: level data
    const block = b02.slice(0, 5);
    levelBits += block.slice(0, 4);

    // 5th bit: continuation flag
    if (block[4] === '0') break;

    // Remove the processed bits
    b02 = b02.slice(5);
  }

  // The level bits are reversed
  levelBits = levelBits.split('').reverse().join('');

  // The level is 16bits, pad with zeros if needed
  while (levelBits.length < 16)
    levelBits = '0' + levelBits;

  // Read signed int16
  let level = parseInt(levelBits, 2);
  if (levelBits.length > 0 && levelBits[0] === '1')
    level -= (1 << levelBits.length);

  return {
    level,
    firstLevelBit,
    lastLevelBit,
  };
}

/**
 * Decode varint5 from binary string at given position
 * Returns { value, bitsRead }
 */
export function decodeVarint5(b02: string, offset: number): { value: number; bitsRead: number } | null {
  let valueBits = '';
  let bitsRead = 0;
  
  while (true) {
    if (offset + bitsRead + 5 > b02.length) return null;
    
    const block = b02.slice(offset + bitsRead, offset + bitsRead + 5);
    valueBits += block.slice(0, 4); // First 4 bits are data
    bitsRead += 5;
    
    // 5th bit: continuation flag (0 = stop, 1 = continue)
    if (block[4] === '0') break;
    
    // Max 4 blocks (20 bits total) for int16
    if (bitsRead >= 20) break;
  }
  
  // Reverse the bits (LSB-first)
  valueBits = valueBits.split('').reverse().join('');
  
  // Pad to 16 bits
  while (valueBits.length < 16) {
    valueBits = '0' + valueBits;
  }
  
  // Parse as signed int16
  let value = parseInt(valueBits, 2);
  if (valueBits.length > 0 && valueBits[0] === '1') {
    value -= (1 << valueBits.length);
  }
  
  return { value, bitsRead };
}

/**
 * Decode varbit5 from binary string at given position
 * Returns { value, bitsRead }
 */
export function decodeVarbit5(b02: string, offset: number): { value: number; bitsRead: number } | null {
  if (offset + 5 > b02.length) return null;
  
  // First 5 bits: length of payload (LSB-first)
  const lengthBlock = b02.slice(offset, offset + 5);
  const lengthBitsReversed = lengthBlock.split('').reverse().join('');
  const length = parseInt(lengthBitsReversed, 2);
  
  if (offset + 5 + length > b02.length) return null;
  
  // Next N bits: payload (LSB-first)
  const payloadBits = b02.slice(offset + 5, offset + 5 + length);
  const payloadReversed = payloadBits.split('').reverse().join('');
  const value = parseInt(payloadReversed, 2);
  
  return { value, bitsRead: 5 + length };
}

/**
 * Read major type (3 bits) at given position
 */
export function readMajorType(b02: string, offset: number): string | null {
  if (offset + 3 > b02.length) return null;
  return b02.slice(offset, offset + 3);
}

export interface DecodedSerial {
  itemType: number;
  itemTypeName?: string;
  manufacturer?: string;
  weaponType?: string;
  version: number;
  level?: number;
  randomSeed?: number;
  fields: Array<{ id: number; value: number }>;
  parts: Array<{ id: number; chunks?: number[] }>;
  raw: string;
  binary: string;
  hex: string;
}

/**
 * Decode a Borderlands 4 serial into its components
 * Extracts: item type, version, level, random seed, and parts
 */
export function decodeSerial(serial: string): DecodedSerial | null {
  // Step 1: Decode Base85 to hex
  const hex = b85DecodeToHex(serial);
  if (!hex) return null;
  
  // Step 2: Convert hex to binary
  const binary = hexToBin(hex);
  if (!binary) return null;
  
  // Step 3: Extract level using Nicnl's exact method
  const levelInfo = itemDecodeLevel(binary);
  
  // Step 4: Parse the structure
  let offset = 0;
  
  // Expected structure: 001 0000 (static prefix according to README)
  const prefix = binary.slice(0, 7);
  if (prefix !== '0010000') {
    console.warn('Unexpected prefix:', prefix, 'expected: 0010000');
  }
  offset = 7;
  
  // Next: item type (varint5 or varbit5)
  const itemTypeMajor = readMajorType(binary, offset);
  let itemType = 0;
  let version = 0;
  
  if (itemTypeMajor === '100') {
    // Varint5
    offset += 3;
    const result = decodeVarint5(binary, offset);
    if (result) {
      itemType = result.value;
      offset += result.bitsRead;
    }
  } else if (itemTypeMajor === '110') {
    // Varbit5
    offset += 3;
    const result = decodeVarbit5(binary, offset);
    if (result) {
      itemType = result.value;
      offset += result.bitsRead;
    }
  }
  
  // Try to extract version (usually follows item type)
  const versionMajor = readMajorType(binary, offset);
  if (versionMajor === '100') {
    offset += 3;
    const result = decodeVarint5(binary, offset);
    if (result) {
      version = result.value;
      offset += result.bitsRead;
    }
  } else if (versionMajor === '110') {
    offset += 3;
    const result = decodeVarbit5(binary, offset);
    if (result) {
      version = result.value;
      offset += result.bitsRead;
    }
  }
  
  // Build fields array
  const fields: Array<{ id: number; value: number }> = [];
  if (levelInfo) {
    fields.push({ id: 1, value: levelInfo.level });
  }
  
  // Extract additional fields and parts section
  const parts: Array<{ id: number; chunks?: number[] }> = [];
  
  if (levelInfo) {
    let fieldsOffset = levelInfo.lastLevelBit;
    
    // Read additional fields (like random seed)
    // Fields are encoded as: varbit5 field_id + "001" marker + major_type + value
    while (fieldsOffset < binary.length - 20) {
      // Check if we've reached end of fields (indicated by major type 000)
      const nextMajor = readMajorType(binary, fieldsOffset);
      if (!nextMajor || nextMajor === '000') break;
      
      // Try to read field ID as varbit5 (no major type prefix)
      const fieldIdResult = decodeVarbit5(binary, fieldsOffset);
      if (!fieldIdResult || fieldIdResult.value === 0) break;
      
      const fieldId = fieldIdResult.value;
      fieldsOffset += fieldIdResult.bitsRead;
      
      // Expect "001" marker after field ID
      if (binary.slice(fieldsOffset, fieldsOffset + 3) !== '001') break;
      fieldsOffset += 3;
      
      // Read field value (major type + value)
      const fieldValueMajor = readMajorType(binary, fieldsOffset);
      if (!fieldValueMajor) break;
      
      fieldsOffset += 3;
      let fieldValueResult: { value: number; bitsRead: number } | null = null;
      
      if (fieldValueMajor === '100') {
        fieldValueResult = decodeVarint5(binary, fieldsOffset);
      } else if (fieldValueMajor === '110') {
        fieldValueResult = decodeVarbit5(binary, fieldsOffset);
      }
      
      if (!fieldValueResult) break;
      fields.push({ id: fieldId, value: fieldValueResult.value });
      fieldsOffset += fieldValueResult.bitsRead;
    }
    
    
    // Now read parts section
    // Parts start with major type + count
    const partCountMajor = readMajorType(binary, fieldsOffset);
    if (partCountMajor === '100' || partCountMajor === '110') {
      fieldsOffset += 3;
      let partCountResult: { value: number; bitsRead: number } | null = null;
      
      if (partCountMajor === '100') {
        partCountResult = decodeVarint5(binary, fieldsOffset);
      } else {
        partCountResult = decodeVarbit5(binary, fieldsOffset);
      }
      
      if (partCountResult) {
        const partCount = partCountResult.value;
        fieldsOffset += partCountResult.bitsRead;
        
        // Read each part
        for (let i = 0; i < partCount; i++) {
          const partIdMajor = readMajorType(binary, fieldsOffset);
          if (!partIdMajor) break;
          
          fieldsOffset += 3;
          let partIdResult: { value: number; bitsRead: number } | null = null;
          
          if (partIdMajor === '100') {
            partIdResult = decodeVarint5(binary, fieldsOffset);
          } else if (partIdMajor === '110') {
            partIdResult = decodeVarbit5(binary, fieldsOffset);
          }
          
          if (!partIdResult) break;
          const partId = partIdResult.value;
          fieldsOffset += partIdResult.bitsRead;
          
          // Check if this part has chunks
          const chunkCountMajor = readMajorType(binary, fieldsOffset);
          if (chunkCountMajor === '100' || chunkCountMajor === '110') {
            // Has chunks
            fieldsOffset += 3;
            let chunkCountResult: { value: number; bitsRead: number } | null = null;
            
            if (chunkCountMajor === '100') {
              chunkCountResult = decodeVarint5(binary, fieldsOffset);
            } else {
              chunkCountResult = decodeVarbit5(binary, fieldsOffset);
            }
            
            if (chunkCountResult && chunkCountResult.value > 0) {
              const chunkCount = chunkCountResult.value;
              fieldsOffset += chunkCountResult.bitsRead;
              
              const chunks: number[] = [];
              for (let j = 0; j < chunkCount; j++) {
                const chunkMajor = readMajorType(binary, fieldsOffset);
                if (!chunkMajor) break;
                
                fieldsOffset += 3;
                let chunkResult: { value: number; bitsRead: number } | null = null;
                
                if (chunkMajor === '100') {
                  chunkResult = decodeVarint5(binary, fieldsOffset);
                } else if (chunkMajor === '110') {
                  chunkResult = decodeVarbit5(binary, fieldsOffset);
                }
                
                if (!chunkResult) break;
                chunks.push(chunkResult.value);
                fieldsOffset += chunkResult.bitsRead;
              }
              
              parts.push({ id: partId, chunks });
            } else {
              // chunk count is 0, just add part without chunks
              parts.push({ id: partId });
            }
          } else {
            // No chunks
            parts.push({ id: partId });
          }
        }
      }
    }
  }
  
  const level = fields.find(f => f.id === 1)?.value;
  const randomSeed = fields.find(f => f.id === 2)?.value;
  
  return {
    itemType,
    itemTypeName: getItemTypeName(itemType),
    manufacturer: getManufacturer(itemType),
    weaponType: getWeaponType(itemType),
    version,
    level,
    randomSeed,
    fields,
    parts,
    raw: serial,
    binary,
    hex
  };
}

/**
 * Serialize a DecodedSerial to the text format used by Nicnl's deserializer
 * Format: "itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|"
 * Example: "269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|"
 */
export function serializeToString(decoded: DecodedSerial): string {
  // Start with item type and version
  let result = `${decoded.itemType}, ${decoded.version}`;
  
  // Add fields (field_id, field_value pairs with | separator after each pair)
  // Format: itemType, version, field_id, field_value| field_id, field_value||
  // First field starts with comma, subsequent fields start with space
  if (decoded.fields && decoded.fields.length > 0) {
    for (let i = 0; i < decoded.fields.length; i++) {
      const field = decoded.fields[i];
      if (i === 0) {
        result += `, ${field.id}, ${field.value}|`;
      } else {
        result += ` ${field.id}, ${field.value}|`;
      }
    }
  }
  
  // Add separator between fields and parts
  result += '|';
  
  // Add parts
  if (decoded.parts && decoded.parts.length > 0) {
    result += ' ';
    const partStrings: string[] = [];
    
    for (const part of decoded.parts) {
      if (part.chunks && part.chunks.length > 0) {
        if (part.chunks.length === 1) {
          // Single chunk: {243:87}
          partStrings.push(`{${part.id}:${part.chunks[0]}}`);
        } else {
          // Multiple chunks: {243:[106 101]}
          const chunksStr = part.chunks.join(' ');
          partStrings.push(`{${part.id}:[${chunksStr}]}`);
        }
      } else {
        // Simple part: {5}
        partStrings.push(`{${part.id}}`);
      }
    }
    
    result += partStrings.join(' ');
  }
  
  // Add final separator
  result += '|';
  
  return result;
}

/**
 * Parse deserialized string format
 * Format: "itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|"
 */
export function parseDeserialized(deserialized: string): DecodedSerial {
  const parts = deserialized.split('||');
  const headerPart = parts[0].trim();
  const partsPart = parts[1]?.trim() || '';

  // Parse header: itemType, version, field pairs
  const headerTokens = headerPart.split(/[|,]/).map(s => s.trim()).filter(Boolean);
  
  const itemType = parseInt(headerTokens[0]) || 0;
  const version = parseInt(headerTokens[1]) || 0;

  // Parse fields (pairs after itemType and version)
  const fields: Array<{ id: number; value: number }> = [];
  for (let i = 2; i < headerTokens.length; i += 2) {
    if (i + 1 < headerTokens.length) {
      fields.push({
        id: parseInt(headerTokens[i]),
        value: parseInt(headerTokens[i + 1])
      });
    }
  }

  // Parse parts: {id}, {id:value}, or {id:[values]}
  const parsedParts: Array<{ id: number; chunks?: number[] }> = [];
  // Match {id}, {id:value}, or {id:[values]}
  const partMatches = partsPart.matchAll(/\{(\d+)(?::(?:(\d+)|\[([^\]]*)\]))?\}/g);
  
  for (const match of partMatches) {
    const id = parseInt(match[1]);
    let chunks: number[] | undefined;
    
    if (match[3] !== undefined) {
      // Format: {id:[values]}
      chunks = match[3].split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
    } else if (match[2] !== undefined) {
      // Format: {id:value}
      chunks = [parseInt(match[2])];
    }
    // else: Format {id} - no chunks
    
    parsedParts.push({ id, chunks });
  }

  // Extract specific field values
  const level = fields.find(f => f.id === 1)?.value;
  const randomSeed = fields.find(f => f.id === 2)?.value;

  return {
    itemType,
    itemTypeName: getItemTypeName(itemType),
    manufacturer: getManufacturer(itemType),
    weaponType: getWeaponType(itemType),
    version,
    level,
    randomSeed,
    fields,
    parts: parsedParts,
    raw: deserialized,
    binary: '',
    hex: ''
  };
}
