/**
 * Borderlands 4 Parts Generator
 * 
 * Since we can't replicate nicnl's exact algorithm without their source code or game data,
 * we'll create a practical parts generator that:
 * 1. Uses the random seed for consistent generation
 * 2. Provides reasonable part structures
 * 3. Can be extended when we learn more
 */

import { Mulberry32 } from './rng.ts';

export interface Part {
  id: number;
  chunks?: number[];
}

export interface PartsConfig {
  // Number of simple parts to generate
  simplePartCount: number;
  // Range for simple part IDs [min, max]
  simplePartRange: [number, number];
  // Parts that should have chunks
  chunkedParts?: Array<{
    id: number;
    chunkCount: number;
    chunkRange: [number, number];
  }>;
}

// Default configurations per item type
const DEFAULT_CONFIGS: Map<number, PartsConfig> = new Map([
  // Pistols (types 0-9)
  [0, { simplePartCount: 8, simplePartRange: [1, 100] }],
  [1, { simplePartCount: 8, simplePartRange: [1, 100] }],
  [2, { simplePartCount: 8, simplePartRange: [1, 100] }],  // Daedalus Pistol
  [3, { simplePartCount: 8, simplePartRange: [1, 100] }],
  [4, { simplePartCount: 8, simplePartRange: [1, 100] }],
  
  // Snipers
  [24, { simplePartCount: 10, simplePartRange: [1, 100] }],  // Jakobs Sniper
  
  // Gadgets (Knives, etc.)
  [267, { 
    simplePartCount: 2, 
    simplePartRange: [1, 10],
    chunkedParts: [{
      id: 245,
      chunkCount: 4,
      chunkRange: [20, 80]
    }]
  }],  // Jakobs Gadget
  
  // Shields (260-280 range)
  [268, { simplePartCount: 6, simplePartRange: [1, 100] }],
  [269, { simplePartCount: 6, simplePartRange: [1, 100] }],
  
  // Grenades (270-290 range)
  [274, { simplePartCount: 5, simplePartRange: [1, 100] }],
]);

/**
 * Generate parts for an item based on item type and random seed
 * 
 * NOTE: This is a BEST-EFFORT implementation. The actual game/nicnl's tool
 * likely has access to game data files that define exact part pools and rules.
 * 
 * @param itemType - The item type ID
 * @param randomSeed - The random seed from the serial
 * @param config - Optional custom configuration
 * @returns Array of parts
 */
export function generateParts(
  itemType: number,
  randomSeed: number,
  config?: PartsConfig
): Part[] {
  // Use default config or provided config
  const cfg = config || DEFAULT_CONFIGS.get(itemType) || {
    simplePartCount: 8,
    simplePartRange: [1, 100] as [number, number]
  };

  const rng = new Mulberry32(randomSeed);
  const parts: Part[] = [];

  // Generate simple parts
  const usedIds = new Set<number>();
  const [minId, maxId] = cfg.simplePartRange;
  const range = maxId - minId + 1;

  for (let i = 0; i < cfg.simplePartCount; i++) {
    let partId: number;
    let attempts = 0;
    
    // Generate unique part ID
    do {
      partId = minId + rng.nextInt(range);
      attempts++;
      
      // Prevent infinite loop
      if (attempts > 100) {
        partId = minId + i;
        break;
      }
    } while (usedIds.has(partId));
    
    usedIds.add(partId);
    parts.push({ id: partId });
  }

  // Generate chunked parts
  if (cfg.chunkedParts) {
    for (const chunkedPart of cfg.chunkedParts) {
      const chunks: number[] = [];
      const [minChunk, maxChunk] = chunkedPart.chunkRange;
      const chunkRange = maxChunk - minChunk + 1;

      for (let i = 0; i < chunkedPart.chunkCount; i++) {
        chunks.push(minChunk + rng.nextInt(chunkRange));
      }

      parts.push({
        id: chunkedPart.id,
        chunks
      });
    }
  }

  return parts;
}

/**
 * Format parts to nicnl's string format
 */
export function formatParts(parts: Part[]): string {
  const formatted = parts.map(part => {
    if (part.chunks && part.chunks.length > 0) {
      if (part.chunks.length === 1) {
        return `{${part.id}:${part.chunks[0]}}`;
      } else {
        return `{${part.id}:[${part.chunks.join(' ')}]}`;
      }
    } else {
      return `{${part.id}}`;
    }
  });

  return formatted.join(' ');
}

/**
 * Register a custom config for a specific item type
 */
export function registerConfig(itemType: number, config: PartsConfig) {
  DEFAULT_CONFIGS.set(itemType, config);
}

/**
 * Get the current config for an item type
 */
export function getConfig(itemType: number): PartsConfig | undefined {
  return DEFAULT_CONFIGS.get(itemType);
}

/**
 * Helper: Create a simple config
 */
export function createSimpleConfig(partCount: number, maxPartId: number = 100): PartsConfig {
  return {
    simplePartCount: partCount,
    simplePartRange: [1, maxPartId]
  };
}

/**
 * Helper: Create a config with chunks
 */
export function createConfigWithChunks(
  simplePartCount: number,
  chunkedPartId: number,
  chunkCount: number,
  chunkMax: number = 100
): PartsConfig {
  return {
    simplePartCount,
    simplePartRange: [1, 100],
    chunkedParts: [{
      id: chunkedPartId,
      chunkCount,
      chunkRange: [1, chunkMax]
    }]
  };
}
