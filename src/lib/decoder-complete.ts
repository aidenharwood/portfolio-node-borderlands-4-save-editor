/**
 * Enhanced Serial Decoder with Parts Generation
 * 
 * This module combines the core decoder with parts generation
 * to provide complete item information
 */

import { decodeSerial as coreDecodeSerial, serializeToString, DecodedSerial } from './nicnl-decoder.ts';
import { generatePartsFromSerial } from './parts-generator.ts';

export interface CompleteDecodedSerial extends DecodedSerial {
  partsGenerated: boolean;
  partsSource?: 'api' | 'table' | 'unknown';
}

/**
 * Decode a serial and generate its parts
 * 
 * This is the recommended way to decode serials as it provides
 * complete information including parts.
 */
export async function decodeSerialComplete(serial: string): Promise<CompleteDecodedSerial | null> {
  // First, decode the core data
  const decoded = coreDecodeSerial(serial);
  
  if (!decoded) {
    return null;
  }
  
  // Then, generate parts from the random seed
  try {
    const partsResult = await generatePartsFromSerial(serial);
    
    if (partsResult) {
      return {
        ...decoded,
        parts: partsResult.parts,
        partsGenerated: true,
        partsSource: partsResult.source
      };
    }
  } catch (error) {
    console.warn('Failed to generate parts, returning core data only:', error);
  }
  
  // Return core data even if parts generation fails
  return {
    ...decoded,
    partsGenerated: false
  };
}

/**
 * Serialize a complete decoded serial to nicnl format
 * This includes parts if they were generated
 */
export function serializeComplete(decoded: CompleteDecodedSerial): string {
  return serializeToString(decoded);
}

/**
 * Decode multiple serials in batch
 * Useful for processing inventories
 */
export async function decodeSerialsBatch(serials: string[]): Promise<Array<CompleteDecodedSerial | null>> {
  const results: Array<CompleteDecodedSerial | null> = [];
  
  for (const serial of serials) {
    const result = await decodeSerialComplete(serial);
    results.push(result);
    
    // Rate limit to avoid hammering the API
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

// Re-export core types and functions
export { DecodedSerial, coreDecodeSerial as decodeSerial, serializeToString };
export * from './nicnl-decoder.ts';
export * from './parts-generator.ts';
