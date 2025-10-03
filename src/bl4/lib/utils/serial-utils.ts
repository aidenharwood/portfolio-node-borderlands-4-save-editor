/**
 * BL4 Serial Encoder/Decoder - Direct port from bl4editor.py
 * This implementation matches the Python version exactly
 */

// Types matching Python dataclasses
export interface ItemStats {
  primaryStat?: number;
  secondaryStat?: number;
  level?: number;
  rarity?: number;
  manufacturer?: number;
  itemClass?: number;
  flags?: number[];
  itemClassRaw?: number;
}

export interface DecodedItem {
  serial: string;
  itemType: string;
  itemCategory: string;
  length: number;
  stats: ItemStats;
  rawFields: Record<string, any>;
  confidence: string;
  originalBinary: Uint8Array;
  originalPrefix: string;
  originalPayload: string;
  dataPositions: number[];
  charOffsets: number[];
  weaponName?: string;
  markers?: Record<string, [number, string]>;
}

import { decodeBase85, encodeBase85 } from './b85-raw'

const WEAPON_NAMES: Record<string, string> = {
  'd_t@': 'Jakobs Shotgun',
  'bV{r': 'Jakobs Pistol',
  'y3L+2}': 'Jakobs Sniper',
  'eU_{': 'Maliwan Shotgun',
  'w$Yw2}': 'Maliwan SMG',
  'velk2}': 'Vladof AR',
  'xFw!2}': 'Vladof SMG',
  'xp/&2}': 'Ripper Sniper',
  'ct)%': 'Torgue Pistol',
  'fs(8': 'Daedalus AR',
  'b)Kv': 'Order Pistol',
  'y>^2}': 'Order Sniper',
  'r$WBm': 'Jakobs Ordnance'
}

function getWeaponName(serial: string): string | undefined {
  if (!serial.startsWith('@Ug')) {
    return undefined
  }

  for (let length = 4; length <= 10; length++) {
    const prefix = serial.substring(3, 3 + length)
    for (const [code, name] of Object.entries(WEAPON_NAMES)) {
      if (prefix.startsWith(code)) {
        return name
      }
    }
  }

  return undefined
}

export function bitPackDecode(serial: string): {
  data: Uint8Array
  originalPrefix: string
  originalPayload: string
  dataPositions: number[]
  charOffsets: number[]
  markers: Record<string, [number, string]>
} {
  let originalPrefix = ''
  let payload = serial

  if (serial.startsWith('@U') && serial.length >= 3) {
    originalPrefix = serial.slice(0, 3)
    payload = serial.slice(3)
  }

  const data = decodeBase85(payload)
  const dataPositions = Array.from({ length: payload.length }, (_, idx) => idx)
  const charOffsets = new Array(payload.length).fill(0)
  const markers: Record<string, [number, string]> = {}

  const markerList = ['Fme!K', '}TYg', '}TYs', 'RG}', 'RG/', '/A', '/B', '/C', '/D', '/F']
  for (const marker of markerList) {
    const pos = payload.indexOf(marker)
    if (pos !== -1) {
      markers[marker] = [pos, marker]
    }
  }

  return {
    data,
    originalPrefix,
    originalPayload: payload,
    dataPositions,
    charOffsets,
    markers
  }
}

export function bitPackEncode(
  modifiedData: Uint8Array,
  originalPrefix: string,
  _originalPayload: string,
  _dataPositions: number[],
  _charOffsets: number[]
): string {
  const encodedPayload = encodeBase85(modifiedData)
  return `${originalPrefix}${encodedPayload}`
}

/**
 * Extract fields from binary data
 * Direct port from extract_fields in bl4editor.py
 */
function extractFields(data: Uint8Array): Record<string, any> {
  const fields: Record<string, any> = {};

  if (data.length >= 4) {
    const view = new DataView(data.buffer, data.byteOffset);
    fields['header_le'] = view.getUint32(0, true);
    fields['header_be'] = view.getUint32(0, false);
  }

  if (data.length >= 8) {
    const view = new DataView(data.buffer, data.byteOffset);
    fields['field2_le'] = view.getUint32(4, true);
  }

  if (data.length >= 12) {
    const view = new DataView(data.buffer, data.byteOffset);
    fields['field3_le'] = view.getUint32(8, true);
  }

  // Extract 16-bit values for potential stats
  const stats16: [number, number][] = [];
  for (let i = 0; i < Math.min(data.length - 1, 20); i += 2) {
    const val16 = data[i] | (data[i + 1] << 8);
    fields[`val16_at_${i}`] = val16;
    if (val16 >= 100 && val16 <= 10000) {
      stats16.push([i, val16]);
    }
  }
  fields['potential_stats'] = stats16;

  // Extract byte values for potential flags
  const flags: [number, number][] = [];
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const byteVal = data[i];
    fields[`byte_${i}`] = byteVal;
    if (byteVal < 100) {
      flags.push([i, byteVal]);
    }
  }
  fields['potential_flags'] = flags;

  return fields;
}

/**
 * Decode weapon (type 'r')
 * Direct port from decode_weapon in bl4editor.py
 */
function decodeWeapon(
  data: Uint8Array,
  serial: string,
  originalPrefix: string,
  payload: string,
  dataPositions: number[],
  charOffsets: number[],
  markers: Record<string, [number, string]>
): DecodedItem {
  const fields = extractFields(data);
  const stats: ItemStats = {};

  // Check for rarity bundle marker
  if ('Fme!K' in markers) {
    fields['family_marker'] = 'Fme!K';
    const rarityStart = markers['Fme!K'][0] + 5;
    if (payload.length >= rarityStart + 5) {
      fields['rarity_bundle'] = payload.substring(rarityStart, rarityStart + 5);
      if (fields['rarity_bundle'] === 'V0_S6') {
        stats.rarity = 5;
      }
    }
  }

  // Check for manufacturer effects marker
  if ('RG}' in markers || 'RG/' in markers) {
    const rgMarker = 'RG}' in markers ? 'RG}' : 'RG/';
    const rgStart = markers[rgMarker][0] + rgMarker.length;
    let effectBlock = '';
    for (let i = rgStart; i < payload.length; i++) {
      if (payload[i] === 's') break;
      effectBlock += payload[i];
    }
    fields['manufacturer_effects'] = effectBlock;
  }

  // Check for pool selector
  for (const pool of ['/A', '/B', '/C', '/D', '/F']) {
    if (pool in markers) {
      fields['pool_selector'] = pool;
      const lengthNibblePos = markers[pool][0] + pool.length + 1;
      if (payload.length > lengthNibblePos && payload[lengthNibblePos - 1] === '`') {
        fields['length_nibble'] = payload[lengthNibblePos];
      }
      break;
    }
  }

  // Check for tail triad (flags)
  if (serial.startsWith('@Ugr')) {
    if (payload.length >= 3) {
      const tailTriad = payload.endsWith('00') ? payload.substring(payload.length - 3) : payload.substring(payload.length - 5, payload.length - 2);
      fields['tail_triad'] = tailTriad;
      stats.flags = tailTriad.split('').map(c => c.charCodeAt(0));
    }
  }

  // Extract stats from fields
  if ('val16_at_0' in fields) stats.primaryStat = fields['val16_at_0'];
  if ('val16_at_12' in fields) stats.secondaryStat = fields['val16_at_12'];
  if ('byte_4' in fields) stats.manufacturer = fields['byte_4'];
  if ('byte_8' in fields) {
    stats.itemClass = fields['byte_8'];
    stats.itemClassRaw = fields['byte_8'];
  }
  if ('byte_1' in fields && !('rarity_bundle' in fields)) {
    stats.rarity = fields['byte_1'];
  }
  if ('byte_13' in fields && (fields['byte_13'] === 2 || fields['byte_13'] === 34)) {
    stats.level = fields['byte_13'];
  }

  if (payload.startsWith('$WBm')) {
    stats.level = 50;
  }

  const weaponName = getWeaponName(serial);
  const confidence = data.length in [24, 26] && 'Fme!K' in markers ? 'high' : 'medium';

  return {
    serial,
    itemType: 'r',
    itemCategory: 'weapon',
    length: data.length,
    stats,
    rawFields: fields,
    confidence,
    originalBinary: data,
    originalPrefix,
    originalPayload: payload,
    dataPositions,
    charOffsets,
    weaponName,
    markers
  };
}

/**
 * Decode equipment type 'e'
 * Direct port from decode_equipment_e in bl4editor.py
 */
function decodeEquipmentE(
  data: Uint8Array,
  serial: string,
  originalPrefix: string,
  payload: string,
  dataPositions: number[],
  charOffsets: number[],
  markers: Record<string, [number, string]>
): DecodedItem {
  const fields = extractFields(data);
  const stats: ItemStats = {};

  // Same marker checks as weapon
  if ('Fme!K' in markers) {
    fields['family_marker'] = 'Fme!K';
    const rarityStart = markers['Fme!K'][0] + 5;
    if (payload.length >= rarityStart + 5) {
      fields['rarity_bundle'] = payload.substring(rarityStart, rarityStart + 5);
      if (fields['rarity_bundle'] === 'V0_S6') {
        stats.rarity = 5;
      }
    }
  }

  if ('RG}' in markers || 'RG/' in markers) {
    const rgMarker = 'RG}' in markers ? 'RG}' : 'RG/';
    const rgStart = markers[rgMarker][0] + rgMarker.length;
    let effectBlock = '';
    for (let i = rgStart; i < payload.length; i++) {
      if (payload[i] === 's') break;
      effectBlock += payload[i];
    }
    fields['manufacturer_effects'] = effectBlock;
  }

  for (const pool of ['/A', '/B', '/C', '/D', '/F']) {
    if (pool in markers) {
      fields['pool_selector'] = pool;
      const lengthNibblePos = markers[pool][0] + pool.length + 1;
      if (payload.length > lengthNibblePos && payload[lengthNibblePos - 1] === '`') {
        fields['length_nibble'] = payload[lengthNibblePos];
      }
      break;
    }
  }

  if (serial.startsWith('@Ugr')) {
    if (payload.length >= 3) {
      const tailTriad = payload.endsWith('00') ? payload.substring(payload.length - 3) : payload.substring(payload.length - 5, payload.length - 2);
      fields['tail_triad'] = tailTriad;
      stats.flags = tailTriad.split('').map(c => c.charCodeAt(0));
    }
  }

  // Extract stats - different positions for type 'e'
  if ('val16_at_2' in fields) stats.primaryStat = fields['val16_at_2'];
  if ('val16_at_8' in fields) stats.secondaryStat = fields['val16_at_8'];
  if ('val16_at_10' in fields && data.length > 38) stats.level = fields['val16_at_10'];
  if ('byte_1' in fields) stats.manufacturer = fields['byte_1'];
  if ('byte_3' in fields) {
    stats.itemClass = fields['byte_3'];
    stats.itemClassRaw = fields['byte_3'];
  }
  if ('byte_9' in fields) stats.rarity = fields['byte_9'];

  if (payload.startsWith('$WBm')) {
    stats.level = 50;
  }

  const weaponName = getWeaponName(serial);
  const confidence = 'byte_1' in fields && fields['byte_1'] === 49 ? 'high' : 'medium';

  return {
    serial,
    itemType: 'e',
    itemCategory: 'equipment',
    length: data.length,
    stats,
    rawFields: fields,
    confidence,
    originalBinary: data,
    originalPrefix,
    originalPayload: payload,
    dataPositions,
    charOffsets,
    weaponName,
    markers
  };
}

/**
 * Decode equipment type 'd'
 * Direct port from decode_equipment_d in bl4editor.py
 */
function decodeEquipmentD(
  data: Uint8Array,
  serial: string,
  originalPrefix: string,
  payload: string,
  dataPositions: number[],
  charOffsets: number[],
  markers: Record<string, [number, string]>
): DecodedItem {
  const fields = extractFields(data);
  const stats: ItemStats = {};

  // Same marker checks
  if ('Fme!K' in markers) {
    fields['family_marker'] = 'Fme!K';
    const rarityStart = markers['Fme!K'][0] + 5;
    if (payload.length >= rarityStart + 5) {
      fields['rarity_bundle'] = payload.substring(rarityStart, rarityStart + 5);
      if (fields['rarity_bundle'] === 'V0_S6') {
        stats.rarity = 5;
      }
    }
  }

  if ('RG}' in markers || 'RG/' in markers) {
    const rgMarker = 'RG}' in markers ? 'RG}' : 'RG/';
    const rgStart = markers[rgMarker][0] + rgMarker.length;
    let effectBlock = '';
    for (let i = rgStart; i < payload.length; i++) {
      if (payload[i] === 's') break;
      effectBlock += payload[i];
    }
    fields['manufacturer_effects'] = effectBlock;
  }

  for (const pool of ['/A', '/B', '/C', '/D', '/F']) {
    if (pool in markers) {
      fields['pool_selector'] = pool;
      const lengthNibblePos = markers[pool][0] + pool.length + 1;
      if (payload.length > lengthNibblePos && payload[lengthNibblePos - 1] === '`') {
        fields['length_nibble'] = payload[lengthNibblePos];
      }
      break;
    }
  }

  if (serial.startsWith('@Ugr')) {
    if (payload.length >= 3) {
      const tailTriad = payload.endsWith('00') ? payload.substring(payload.length - 3) : payload.substring(payload.length - 5, payload.length - 2);
      fields['tail_triad'] = tailTriad;
      stats.flags = tailTriad.split('').map(c => c.charCodeAt(0));
    }
  }

  // Extract stats - different positions for type 'd'
  if ('val16_at_4' in fields) stats.primaryStat = fields['val16_at_4'];
  if ('val16_at_8' in fields) stats.secondaryStat = fields['val16_at_8'];
  if ('val16_at_10' in fields) stats.level = fields['val16_at_10'];
  if ('byte_5' in fields) stats.manufacturer = fields['byte_5'];
  if ('byte_6' in fields) {
    stats.itemClass = fields['byte_6'];
    stats.itemClassRaw = fields['byte_6'];
  }
  if ('byte_14' in fields) stats.rarity = fields['byte_14'];

  if (payload.startsWith('$WBm')) {
    stats.level = 50;
  }

  const weaponName = getWeaponName(serial);
  const confidence = 'byte_5' in fields && fields['byte_5'] === 15 ? 'high' : 'medium';

  return {
    serial,
    itemType: 'd',
    itemCategory: 'equipment_alt',
    length: data.length,
    stats,
    rawFields: fields,
    confidence,
    originalBinary: data,
    originalPrefix,
    originalPayload: payload,
    dataPositions,
    charOffsets,
    weaponName,
    markers
  };
}

/**
 * Decode item serial
 * Main entry point for decoding
 */
export function decodeItemSerial(serial: string): DecodedItem {
  try {
    const decoded = bitPackDecode(serial);
    const { data, originalPrefix, originalPayload, dataPositions, charOffsets, markers } = decoded;

    // Determine item type from serial
    let itemType = '?';
    if (serial.length >= 3 && serial.startsWith('@U')) {
      itemType = serial[2];
    }

    // Route to appropriate decoder
    switch (itemType) {
      case 'g':
      case 'r':
        return decodeWeapon(data, serial, originalPrefix, originalPayload, dataPositions, charOffsets, markers);
      case 'e':
        return decodeEquipmentE(data, serial, originalPrefix, originalPayload, dataPositions, charOffsets, markers);
      case 'd':
        return decodeEquipmentD(data, serial, originalPrefix, originalPayload, dataPositions, charOffsets, markers);
      default:
        // Generic decode for unknown types
        return {
          serial,
          itemType,
          itemCategory: 'unknown',
          length: data.length,
          stats: {},
          rawFields: extractFields(data),
          confidence: 'low',
          originalBinary: data,
          originalPrefix,
          originalPayload,
          dataPositions,
          charOffsets,
          markers
        };
    }
  } catch (error) {
    return {
      serial,
      itemType: 'error',
      itemCategory: 'decode_failed',
      length: 0,
      stats: {},
      rawFields: { error: (error as Error).message },
      confidence: 'none',
      originalBinary: new Uint8Array(0),
      originalPrefix: '',
      originalPayload: '',
      dataPositions: [],
      charOffsets: []
    };
  }
}

/**
 * Encode item serial
 * Direct port from encode_item_serial in bl4editor.py
 */
export function encodeItemSerial(decodedItem: DecodedItem): string {
  try {
    const data = new Uint8Array(decodedItem.originalBinary);
    const stats = decodedItem.stats;
    const markers = decodedItem.markers || {};
    let originalPayload = decodedItem.originalPayload;
    let dataChanged = false;
    let payloadChanged = false;

    if (decodedItem.itemType === 'r') {
      // Weapon type
      if (stats.primaryStat !== undefined && stats.primaryStat !== decodedItem.rawFields['val16_at_0'] && data.length >= 2) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(0, stats.primaryStat, true);
        dataChanged = true;
      }
      if (stats.secondaryStat !== undefined && stats.secondaryStat !== decodedItem.rawFields['val16_at_12'] && data.length >= 14) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(12, stats.secondaryStat, true);
        dataChanged = true;
      }
      if (stats.rarity !== undefined && stats.rarity !== decodedItem.rawFields['byte_1'] && data.length >= 2) {
        data[1] = stats.rarity;
        dataChanged = true;
      }
      if (stats.manufacturer !== undefined && stats.manufacturer !== decodedItem.rawFields['byte_4'] && data.length >= 5) {
        data[4] = stats.manufacturer;
        dataChanged = true;
      }
      if (stats.itemClass !== undefined && stats.itemClass !== decodedItem.rawFields['byte_8'] && data.length >= 9) {
        data[8] = stats.itemClass;
        dataChanged = true;
      }
      if (stats.level !== undefined && stats.level !== decodedItem.rawFields['byte_13'] && data.length >= 14) {
        data[13] = stats.level;
        dataChanged = true;
      }
      // Handle tail triad for flags
      if (decodedItem.serial.startsWith('@Ugr') && 'tail_triad' in decodedItem.rawFields) {
        if (stats.flags && stats.flags.length === 3) {
          const newTriad = stats.flags.map(c => String.fromCharCode(c)).join('');
          const existingTriad = originalPayload.substring(originalPayload.length - 5, originalPayload.length - 2);
          if (newTriad !== existingTriad) {
            originalPayload = originalPayload.substring(0, originalPayload.length - 5) + newTriad + '00';
            payloadChanged = true;
          }
        }
      }
    } else if (decodedItem.itemType === 'e') {
      // Equipment type 'e'
      if (stats.primaryStat !== undefined && stats.primaryStat !== decodedItem.rawFields['val16_at_2'] && data.length >= 4) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(2, stats.primaryStat, true);
        dataChanged = true;
      }
      if (stats.secondaryStat !== undefined && stats.secondaryStat !== decodedItem.rawFields['val16_at_8'] && data.length >= 10) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(8, stats.secondaryStat, true);
        dataChanged = true;
      }
      if (stats.manufacturer !== undefined && stats.manufacturer !== decodedItem.rawFields['byte_1'] && data.length >= 2) {
        data[1] = stats.manufacturer;
        dataChanged = true;
      }
      if (stats.itemClass !== undefined && stats.itemClass !== decodedItem.rawFields['byte_3'] && data.length >= 4) {
        data[3] = stats.itemClass;
        dataChanged = true;
      }
      if (stats.rarity !== undefined && stats.rarity !== decodedItem.rawFields['byte_9'] && data.length >= 10) {
        data[9] = stats.rarity;
        dataChanged = true;
      }
      if (stats.level !== undefined && stats.level !== decodedItem.rawFields['val16_at_10'] && data.length >= 12) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(10, stats.level, true);
        dataChanged = true;
      }
    } else if (decodedItem.itemType === 'd') {
      // Equipment type 'd'
      if (stats.primaryStat !== undefined && stats.primaryStat !== decodedItem.rawFields['val16_at_4'] && data.length >= 6) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(4, stats.primaryStat, true);
        dataChanged = true;
      }
      if (stats.secondaryStat !== undefined && stats.secondaryStat !== decodedItem.rawFields['val16_at_8'] && data.length >= 10) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(8, stats.secondaryStat, true);
        dataChanged = true;
      }
      if (stats.manufacturer !== undefined && stats.manufacturer !== decodedItem.rawFields['byte_5'] && data.length >= 6) {
        data[5] = stats.manufacturer;
        dataChanged = true;
      }
      if (stats.itemClass !== undefined && stats.itemClass !== decodedItem.rawFields['byte_6'] && data.length >= 7) {
        data[6] = stats.itemClass;
        dataChanged = true;
      }
      if (stats.rarity !== undefined && stats.rarity !== decodedItem.rawFields['byte_14'] && data.length >= 15) {
        data[14] = stats.rarity;
        dataChanged = true;
      }
      if (stats.level !== undefined && stats.level !== decodedItem.rawFields['val16_at_10'] && data.length >= 12) {
        const view = new DataView(data.buffer, data.byteOffset);
        view.setUint16(10, stats.level, true);
        dataChanged = true;
      }
    }

    // Handle pool selector if present
    if ('pool_selector' in decodedItem.rawFields && 'length_nibble' in decodedItem.rawFields) {
      const pool = decodedItem.rawFields['pool_selector'];
      const nibble = decodedItem.rawFields['length_nibble'];
      if (pool === '/F' && nibble !== '5') {
        throw new Error('Pool /F requires length nibble 5');
      }
      const poolPos = markers[pool][0];
      const existingNibble = originalPayload[poolPos + pool.length + 1];
      if (existingNibble !== nibble) {
        originalPayload =
          originalPayload.substring(0, poolPos) +
          pool + '`' + nibble +
          originalPayload.substring(poolPos + pool.length + 2);
        payloadChanged = true;
      }
    }

    if (!dataChanged && !payloadChanged) {
      return decodedItem.serial;
    }

    const newSerial = bitPackEncode(
      data,
      decodedItem.originalPrefix,
      originalPayload,
      decodedItem.dataPositions,
      decodedItem.charOffsets
    );

    return newSerial;
  } catch (error) {
    console.error('Failed to encode serial:', error);
    return decodedItem.serial;
  }
}

/**
 * Get display name for an item
 */
export function getItemDisplayName(serial: string): string {
  if (!serial || !serial.startsWith('@U')) {
    return serial || 'None';
  }

  try {
    const decoded = decodeItemSerial(serial);
    if (decoded.itemType === 'error') {
      return `Item (${serial.substring(0, 10)}...)`;
    }

    const parts: string[] = [];
    
    if (decoded.weaponName) {
      parts.push(decoded.weaponName);
    }
    
    if (decoded.stats.level) {
      parts.push(`Lvl ${decoded.stats.level}`);
    }

    if (parts.length > 0) {
      return parts.join(' - ');
    }

    return `${decoded.itemCategory} (${decoded.itemType})`;
  } catch {
    return serial.substring(0, 20) + '...';
  }
}
