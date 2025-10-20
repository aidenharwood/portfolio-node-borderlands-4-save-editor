/**
 * BL4 Serial Decoder - Varint5/Varbit5 Implementation (PARTIAL)
 * 
 * This file provides type definitions and a PARTIAL decoder for Borderlands 4 item serials.
 * The serial format uses complex bit-level encoding (varint5/varbit5) as documented at:
 * https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
 * 
 * **CURRENT STATUS**: The bit-level decoder is not fully working. The exact encoding
 * used by Nicnl's tool doesn't perfectly match the README documentation, or there are
 * implementation details not fully documented. 
 * 
 * **WORKAROUND**: Use `parseDeserialized()` to parse strings that have already been
 * deserialized by Nicnl's web tool: https://borderlands4-serial-comparator.nicnl.com/
 * 
 * DESERIALIZED FORMAT:
 * itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
 * 
 * Example:
 * Serial: @Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
 * Deserialized: 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
 * 
 * Where:
 * - 269 = item type
 * - 0 = version
 * - 1, 28 = field pair (1=level identifier, 28=level value)
 * - 2, 1611 = field pair (2=random seed identifier, 1611=seed value)
 * - {5} {7} etc = part IDs
 * - {243:[106 101]} = part 243 with chunk values [106, 101]
 * 
 * FIELD IDENTIFIERS (from Discord conversation):
 * - 1 = Level
 * - 2 = Random seed
 * 
 * DATA TYPES (from README):
 * - Varint5: Major type 100, followed by blocks of 5 bits (LSB first, continuation bit)
 * - Varbit5: Major type 110, followed by 5-bit length, then N bits of data
 * - Struct: Major type 001, followed by 4-bit struct ID
 * - Terminator: 000
 * 
 * FOR A COMPLETE IMPLEMENTATION:
 * See: https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker
 * Or use the web tool: https://borderlands4-serial-comparator.nicnl.com/
 */

import { bitPackDecode } from './utils/serial-utils';

export interface VarbitData {
  type: 'varint5' | 'varbit5' | 'struct' | 'unknown';
  value: number;
  bitOffset: number;
  bitLength: number;
  chunks4?: number[]; // For parts with chunk data
}

export interface DecodedSerial {
  serial: string;
  itemType: number;
  version: number;
  fields: Array<{ id: number; value: number }>;
  parts: Array<{ id: number; values?: number[] }>;
  varbits: VarbitData[];
  structs: any[];
  raw: string;
}

/**
 * Read N bits from byte array starting at bitOffset (LSB-first within bytes)
 */
function readBits(data: Uint8Array, bitOffset: number, bitCount: number): number {
  let result = 0;
  for (let i = 0; i < bitCount; i++) {
    const byteIndex = Math.floor((bitOffset + i) / 8);
    const bitIndex = (bitOffset + i) % 8;
    if (byteIndex >= data.length) break;
    const bit = (data[byteIndex] >>> bitIndex) & 1;
    result |= bit << i;
  }
  return result;
}

/**
 * Decode a Varint5 value
 * Format: 3-bit major type (100) + blocks of 5 bits (4 data + 1 continuation)
 * Returns: { value, bitsRead }
 */
function decodeVarint5(data: Uint8Array, bitOffset: number): { value: number; bitsRead: number } {
  let value = 0;
  let shift = 0;
  let bitsRead = 3; // Skip major type (100)
  let currentOffset = bitOffset + 3;
  
  // Read blocks until continuation bit is 0
  for (let blockNum = 0; blockNum < 4; blockNum++) { // Max 4 blocks = 16 bits
    const block = readBits(data, currentOffset, 5);
    const continueBit = block & 1;
    const dataNibble = (block >>> 1) & 0xF;
    
    value |= dataNibble << shift;
    shift += 4;
    bitsRead += 5;
    currentOffset += 5;
    
    if (continueBit === 0) break;
  }
  
  return { value, bitsRead };
}

/**
 * Decode a Varbit5 value
 * Format: 3-bit major type (110) + 5-bit length + N bits of data
 * Returns: { value, bitsRead }
 */
function decodeVarbit5(data: Uint8Array, bitOffset: number): { value: number; bitsRead: number } {
  const lengthBits = readBits(data, bitOffset + 3, 5);
  const value = readBits(data, bitOffset + 8, lengthBits);
  return { value, bitsRead: 8 + lengthBits };
}

/**
 * Decode a Borderlands 4 item serial
 * 
 * This is a full implementation of the varint5/varbit5 decoder based on:
 * - https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
 * - Reference implementations from Nicnl
 * 
 * @param serial - The base85 serial string (starting with @U)
 * @returns Decoded serial data structure
 */
export function decodeSerial(serial: string): DecodedSerial {
  // Decode base85 and bit-flip to get raw binary data
  const { data } = bitPackDecode(serial, true);
  
  const varbits: VarbitData[] = [];
  const structs: any[] = [];
  const fields: Array<{ id: number; value: number }> = [];
  const parts: Array<{ id: number; values?: number[] }> = [];
  
  let bitOffset = 0;
  
  // Major type constants
  const MAJOR_TYPE_VARINT5 = 0b100;
  const MAJOR_TYPE_VARBIT5 = 0b110;
  const MAJOR_TYPE_STRUCT = 0b001;
  const MAJOR_TYPE_TERMINATOR = 0b000;
  
  // Skip static prefix: 001 0000 (7 bits)
  bitOffset = 7;
  
  // Decode item type (varint5 or varbit5)
  let itemType = 0;
  const itemTypeMajor = readBits(data, bitOffset, 3);
  
  if (itemTypeMajor === MAJOR_TYPE_VARINT5) {
    const decoded = decodeVarint5(data, bitOffset);
    itemType = decoded.value;
    bitOffset += decoded.bitsRead;
    
    varbits.push({
      type: 'varint5',
      value: itemType,
      bitOffset: bitOffset - decoded.bitsRead,
      bitLength: decoded.bitsRead
    });
  } else if (itemTypeMajor === MAJOR_TYPE_VARBIT5) {
    const decoded = decodeVarbit5(data, bitOffset);
    itemType = decoded.value;
    bitOffset += decoded.bitsRead;
    
    varbits.push({
      type: 'varbit5',
      value: itemType,
      bitOffset: bitOffset - decoded.bitsRead,
      bitLength: decoded.bitsRead
    });
  }
  
  const version = 0; // Version is typically 0
  
  // Decode fields section (field_id, field_value pairs)
  // Continue until we hit a double terminator or non-field pattern
  let consecutiveTerminators = 0;
  
  while (bitOffset < data.length * 8 - 16) {
    const majorType = readBits(data, bitOffset, 3);
    
    if (majorType === MAJOR_TYPE_TERMINATOR) {
      bitOffset += 3;
      consecutiveTerminators++;
      if (consecutiveTerminators >= 2) {
        // Double terminator means end of fields section
        break;
      }
      continue;
    }
    
    consecutiveTerminators = 0;
    
    // Try to decode as field pair (id, value)
    let fieldId = 0;
    let fieldIdBits = 0;
    
    if (majorType === MAJOR_TYPE_VARINT5) {
      const decoded = decodeVarint5(data, bitOffset);
      fieldId = decoded.value;
      fieldIdBits = decoded.bitsRead;
      bitOffset += decoded.bitsRead;
    } else if (majorType === MAJOR_TYPE_VARBIT5) {
      const decoded = decodeVarbit5(data, bitOffset);
      fieldId = decoded.value;
      fieldIdBits = decoded.bitsRead;
      bitOffset += decoded.bitsRead;
    } else {
      // Not a varint/varbit, probably end of fields
      break;
    }
    
    // If field ID is > 10, it's probably a part, not a field
    if (fieldId > 10) {
      // Backtrack and exit fields section
      bitOffset -= fieldIdBits;
      break;
    }
    
    // Read field value
    const valueMajor = readBits(data, bitOffset, 3);
    let fieldValue = 0;
    
    if (valueMajor === MAJOR_TYPE_VARINT5) {
      const decoded = decodeVarint5(data, bitOffset);
      fieldValue = decoded.value;
      bitOffset += decoded.bitsRead;
    } else if (valueMajor === MAJOR_TYPE_VARBIT5) {
      const decoded = decodeVarbit5(data, bitOffset);
      fieldValue = decoded.value;
      bitOffset += decoded.bitsRead;
    } else {
      // Invalid value type, skip
      break;
    }
    
    fields.push({ id: fieldId, value: fieldValue });
  }
  
  // Decode parts section
  // Parts can be simple {id} or have values {id:[val1 val2]}
  while (bitOffset < data.length * 8 - 8) {
    const majorType = readBits(data, bitOffset, 3);
    
    if (majorType === MAJOR_TYPE_TERMINATOR) {
      bitOffset += 3;
      continue;
    }
    
    if (majorType === MAJOR_TYPE_STRUCT) {
      // Struct: 001 + 4-bit ID
      const structId = readBits(data, bitOffset + 3, 4);
      bitOffset += 7;
      structs.push({ id: structId });
      continue;
    }
    
    // Decode part ID
    let partId = 0;
    
    if (majorType === MAJOR_TYPE_VARINT5) {
      const decoded = decodeVarint5(data, bitOffset);
      partId = decoded.value;
      bitOffset += decoded.bitsRead;
      
      varbits.push({
        type: 'varint5',
        value: partId,
        bitOffset: bitOffset - decoded.bitsRead,
        bitLength: decoded.bitsRead
      });
    } else if (majorType === MAJOR_TYPE_VARBIT5) {
      const decoded = decodeVarbit5(data, bitOffset);
      partId = decoded.value;
      bitOffset += decoded.bitsRead;
      
      varbits.push({
        type: 'varbit5',
        value: partId,
        bitOffset: bitOffset - decoded.bitsRead,
        bitLength: decoded.bitsRead
      });
    } else {
      // Unknown major type, skip
      bitOffset += 3;
      continue;
    }
    
    // Check if next value(s) are part chunk values
    // Heuristic: if next value is small (<256) and there's room, it's likely a chunk value
    const partValues: number[] = [];
    const nextMajor = readBits(data, bitOffset, 3);
    
    if ((nextMajor === MAJOR_TYPE_VARINT5 || nextMajor === MAJOR_TYPE_VARBIT5) && 
        bitOffset + 16 < data.length * 8) {
      // Peek at the value
      const peekDecoded = nextMajor === MAJOR_TYPE_VARINT5
        ? decodeVarint5(data, bitOffset)
        : decodeVarbit5(data, bitOffset);
      
      // If value is reasonable for a chunk (< 256), consider it a chunk value
      if (peekDecoded.value < 256) {
        partValues.push(peekDecoded.value);
        bitOffset += peekDecoded.bitsRead;
        
        // Check for additional chunk values
        const next2Major = readBits(data, bitOffset, 3);
        if ((next2Major === MAJOR_TYPE_VARINT5 || next2Major === MAJOR_TYPE_VARBIT5) &&
            bitOffset + 16 < data.length * 8) {
          const peek2Decoded = next2Major === MAJOR_TYPE_VARINT5
            ? decodeVarint5(data, bitOffset)
            : decodeVarbit5(data, bitOffset);
          
          if (peek2Decoded.value < 256) {
            partValues.push(peek2Decoded.value);
            bitOffset += peek2Decoded.bitsRead;
          }
        }
      }
    }
    
    if (partValues.length > 0) {
      parts.push({ id: partId, values: partValues });
    } else {
      parts.push({ id: partId });
    }
  }
  
  // Build the deserialized string
  let rawString = `${itemType}, ${version}`;
  
  // Add fields
  for (const field of fields) {
    rawString += `, ${field.id}, ${field.value}|`;
  }
  
  // Add double pipe separator
  rawString += '|';
  
  // Add parts
  for (const part of parts) {
    if (part.values && part.values.length > 0) {
      rawString += ` {${part.id}:[${part.values.join(' ')}]}`;
    } else {
      rawString += ` {${part.id}}`;
    }
  }
  rawString += '|';
  
  return {
    serial,
    itemType,
    version,
    fields,
    parts,
    varbits,
    structs,
    raw: rawString
  };
}

/**
 * Parse deserialized string back into structured data
 * 
 * This can parse strings in the format:
 * "269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|"
 * 
 * @param deserialized - The deserialized string
 * @returns Structured data
 */
export function parseDeserialized(deserialized: string): DecodedSerial {
  const parts: Array<{ id: number; values?: number[] }> = [];
  const fields: Array<{ id: number; value: number }> = [];
  
  // Split on ||  to separate header from parts
  const [header, partsSection] = deserialized.split('||');
  
  // Parse header: itemType, version, field pairs
  const headerParts = header.split(',').map(s => s.trim());
  const itemType = parseInt(headerParts[0]) || 0;
  const version = parseInt(headerParts[1]) || 0;
  
  // Parse field pairs (after itemType and version)
  for (let i = 2; i < headerParts.length; i += 2) {
    const fieldId = parseInt(headerParts[i]) || 0;
    const fieldValue = parseInt(headerParts[i + 1]?.split('|')[0]) || 0;
    if (fieldId > 0) {
      fields.push({ id: fieldId, value: fieldValue });
    }
  }
  
  // Parse parts: {id} or {id:[val1 val2]}
  if (partsSection) {
    const partMatches = partsSection.matchAll(/\{(\d+)(?::\[([^\]]+)\])?\}/g);
    for (const match of partMatches) {
      const id = parseInt(match[1]);
      const valuesStr = match[2];
      if (valuesStr) {
        const values = valuesStr.split(' ').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
        parts.push({ id, values });
      } else {
        parts.push({ id });
      }
    }
  }
  
  return {
    serial: '',
    itemType,
    version,
    fields,
    parts,
    varbits: [],
    structs: [],
    raw: deserialized
  };
}

export { getBasicInfo, isValidSerial } from './serial-codec';
