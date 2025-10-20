// Item Serial Manager - High-level service for managing item serials
// Uses local decoder functions from serial-decoder.ts
import { getBasicInfo, isValidSerial } from './serial-codec.js';
import { decodeSerial, type VarbitData } from './serial-decoder.js';

// Interface matching the local decoder output
interface DeserializedItem {
  level: number;
  properties: Array<{ type: number; value: number | number[] }>;
  parts: Array<{ id: number; values?: number[] }>;
  raw?: string;
  [key: string]: any;
}

export interface ItemData {
  serial: string;
  deserialized: DeserializedItem;
  metadata: {
    level: number;
    category: string;
    manufacturer: string;
    rarity?: string;
    name?: string;
  };
  basicInfo: ReturnType<typeof getBasicInfo>;
}

export class ItemSerialManager {
  private cache = new Map<string, ItemData>();

  /**
   * Load and parse an item serial using local decoder
   */
  async loadItem(serial: string): Promise<ItemData> {
    // Check cache first
    if (this.cache.has(serial)) {
      return this.cache.get(serial)!;
    }

    // Validate format
    if (!isValidSerial(serial)) {
      throw new Error('Invalid serial format');
    }

    // Get basic info (no API call)
    const basicInfo = getBasicInfo(serial);

    // Decode using local decoder
    const decoded = decodeSerial(serial);
    
    // The decoded.parts already contains all part IDs in the correct order
    // Format: simple parts as {id} and parts with chunk values as {id:[values]}
    const parts: Array<{ id: number; values?: number[] }> = [];
    
    // Process varbits to get parts with their chunk data
    decoded.varbits.forEach((varbit: VarbitData) => {
      // If chunks4 has multiple values, it's a part with data
      if (varbit.chunks4 && varbit.chunks4.length > 1) {
        parts.push({
          id: varbit.chunks4[0],
          values: varbit.chunks4.slice(1)
        });
      } else {
        // Simple part ID
        parts.push({
          id: varbit.value
        });
      }
    });
    
    // Build the raw deserialized string showing all decoded data
    let rawString = 'Decoded Parts: ';
    parts.forEach((part, idx) => {
      if (idx > 0) rawString += ' ';
      if (part.values && part.values.length > 0) {
        rawString += `{${part.id}:[${part.values.join(' ')}]}`;
      } else {
        rawString += `{${part.id}}`;
      }
    });
    
    // Convert decoded data to DeserializedItem format
    const deserialized: DeserializedItem = {
      level: 1,
      properties: [],
      parts: parts,
      raw: rawString,
      serial: decoded.serial,
      varbits: decoded.varbits,
      structs: decoded.structs
    };
    
    const metadata = {
      level: 1,
      category: 'Weapon',
      manufacturer: 'Unknown'
    };

    const itemData: ItemData = {
      serial,
      deserialized,
      metadata,
      basicInfo
    };

    // Cache the result
    this.cache.set(serial, itemData);

    return itemData;
  }

  /**
   * Modify item level (STUB - NOT IMPLEMENTED)
   */
  async modifyLevel(_serial: string, _newLevel: number): Promise<string> {
    throw new Error('Not implemented - use serial-utils.ts functions instead');
  }

  /**
   * Modify item property (STUB - NOT IMPLEMENTED)
   */
  async modifyProperty(_serial: string, _propertyType: number, _newValue: number): Promise<string> {
    throw new Error('Not implemented - use serial-utils.ts functions instead');
  }

  /**
   * Add or remove parts (STUB - NOT IMPLEMENTED)
   */
  async modifyParts(_serial: string, _parts: Array<{ id: number; values?: number[] }>): Promise<string> {
    throw new Error('Not implemented - use serial-utils.ts functions instead');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached item count
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const itemManager = new ItemSerialManager();
