/**
 * Nicnl API Client for Borderlands 4 Serial Deserialization
 * 
 * Provides a TypeScript wrapper around Nicnl's deserializer API.
 * https://borderlands4-deserializer.nicnl.com/
 */

export interface NicnlDeserializedResponse {
  success?: boolean;
  deserialized: string;
  additional_data?: string;
  readme?: string;
  error?: string;
}

export interface ParsedSerial {
  itemType: number;
  version: number;
  level?: number;
  randomSeed?: number;
  fields: Array<{ id: number; value: number }>;
  parts: Array<{ id: number; chunks?: number[] }>;
  raw: string;
}

/**
 * Call Nicnl's API to deserialize a BL4 serial
 */
export async function deserializeSerial(serial: string): Promise<NicnlDeserializedResponse> {
  const response = await fetch('https://borderlands4-deserializer.nicnl.com/api/v1/deserialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://borderlands4-deserializer.nicnl.com',
      'Referer': 'https://borderlands4-deserializer.nicnl.com/',
    },
    body: JSON.stringify({ serial_b85: serial })
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      return { deserialized: '', error: errorJson.error || 'Unknown error' };
    } catch {
      return { deserialized: '', error: `HTTP ${response.status}: ${errorText}` };
    }
  }

  const data = await response.json();
  return data;
}

/**
 * Parse deserialized string into structured data
 * 
 * Format: "itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|"
 * Example: "24, 0, 1, 50| 2, 3269|| {95} {2} {3} {8} {13} {25} {44} {50}|"
 */
export function parseDeserialized(deserialized: string): ParsedSerial {
  // Split on || to separate fields from parts
  const [fieldsSection, partsSection] = deserialized.split('||');
  
  // Parse fields section: itemType, version, field_id, field_value| ...
  const fieldTokens = fieldsSection.split(/[,|]/).map(s => s.trim()).filter(Boolean);
  
  const itemType = parseInt(fieldTokens[0]) || 0;
  const version = parseInt(fieldTokens[1]) || 0;
  
  // Parse field pairs (after itemType and version)
  const fields: Array<{ id: number; value: number }> = [];
  for (let i = 2; i < fieldTokens.length; i += 2) {
    if (i + 1 < fieldTokens.length) {
      const id = parseInt(fieldTokens[i]);
      const value = parseInt(fieldTokens[i + 1]);
      if (!isNaN(id) && !isNaN(value)) {
        fields.push({ id, value });
      }
    }
  }
  
  // Parse parts section: {id} or {id:[val1 val2 val3]} or {id:val}
  const parts: Array<{ id: number; chunks?: number[] }> = [];
  
  if (partsSection) {
    // Match patterns: {id}, {id:val}, {id:[val1 val2 val3]}
    const partRegex = /\{(\d+)(?::(?:(\d+)|\[([^\]]+)\]))?\}/g;
    let match: RegExpExecArray | null;
    
    while ((match = partRegex.exec(partsSection)) !== null) {
      const id = parseInt(match[1]);
      
      if (match[3]) {
        // Format: {id:[val1 val2 val3]}
        const chunks = match[3].split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));
        parts.push({ id, chunks });
      } else if (match[2]) {
        // Format: {id:val}
        const chunk = parseInt(match[2]);
        if (!isNaN(chunk)) {
          parts.push({ id, chunks: [chunk] });
        }
      } else {
        // Format: {id}
        parts.push({ id });
      }
    }
  }
  
  // Extract specific field values
  const level = fields.find(f => f.id === 1)?.value;
  const randomSeed = fields.find(f => f.id === 2)?.value;
  
  return {
    itemType,
    version,
    level,
    randomSeed,
    fields,
    parts,
    raw: deserialized
  };
}

/**
 * Serialize structured data back to deserialized string format
 */
export function serializeToDeserialized(parsed: ParsedSerial): string {
  let result = `${parsed.itemType}, ${parsed.version}`;
  
  // Add fields
  if (parsed.fields.length > 0) {
    for (let i = 0; i < parsed.fields.length; i++) {
      const field = parsed.fields[i];
      if (i === 0) {
        result += `, ${field.id}, ${field.value}|`;
      } else {
        result += ` ${field.id}, ${field.value}|`;
      }
    }
  }
  
  // Add separator
  result += '|';
  
  // Add parts
  if (parsed.parts.length > 0) {
    result += ' ';
    const partStrings: string[] = [];
    
    for (const part of parsed.parts) {
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
    
    result += partStrings.join(' ');
  }
  
  result += '|';
  
  return result;
}

/**
 * Helper: Change level of an item
 */
export function changeLevel(parsed: ParsedSerial, newLevel: number): ParsedSerial {
  const newFields = [...parsed.fields];
  const levelFieldIndex = newFields.findIndex(f => f.id === 1);
  
  if (levelFieldIndex >= 0) {
    newFields[levelFieldIndex] = { id: 1, value: newLevel };
  } else {
    newFields.unshift({ id: 1, value: newLevel });
  }
  
  return {
    ...parsed,
    level: newLevel,
    fields: newFields,
    raw: ''
  };
}

/**
 * Helper: Change random seed
 */
export function changeRandomSeed(parsed: ParsedSerial, newSeed: number): ParsedSerial {
  const newFields = [...parsed.fields];
  const seedFieldIndex = newFields.findIndex(f => f.id === 2);
  
  if (seedFieldIndex >= 0) {
    newFields[seedFieldIndex] = { id: 2, value: newSeed };
  } else {
    newFields.push({ id: 2, value: newSeed });
  }
  
  return {
    ...parsed,
    randomSeed: newSeed,
    fields: newFields,
    raw: ''
  };
}

/**
 * Helper: Add or remove parts
 */
export function setParts(parsed: ParsedSerial, parts: Array<{ id: number; chunks?: number[] }>): ParsedSerial {
  return {
    ...parsed,
    parts,
    raw: ''
  };
}
