# Practical Usage Guide

## Current Implementation Status

✅ **What Works:**
- Type definitions for deserialized format
- `parseDeserialized()` - Parse text format strings
- Base85 encode/decode (already existed)
- Documentation of the format

❌ **What Doesn't Work:**
- `decodeSerial()` - Direct bit-level decoding from serial to deserialized format

## How To Use Right Now

### Option 1: Use Nicnl's Web Tool (Recommended)

1. Go to https://borderlands4-serial-comparator.nicnl.com/
2. Paste your serial (e.g., `@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss`)
3. Copy the deserialized output (e.g., `269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|`)
4. Use our `parseDeserialized()` function:

```typescript
import { parseDeserialized } from './src/lib/serial-decoder';

const deserializedString = '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';
const parsed = parseDeserialized(deserializedString);

console.log(parsed);
// {
//   itemType: 269,
//   version: 0,
//   fields: [
//     { id: 1, value: 28 },    // level = 28
//     { id: 2, value: 1611 }   // random seed = 1611
//   ],
//   parts: [
//     { id: 5 },
//     { id: 7 },
//     { id: 243, values: [106, 101] },
//     { id: 6 },
//     { id: 243, values: [87] }
//   ],
//   varbits: [],
//   structs: [],
//   raw: '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|'
// }
```

### Option 2: Integrate With The Web API

If the web tool has an API, you could make requests to it:

```typescript
async function deserializeViaAPI(serial: string): Promise<string> {
  // Note: This is pseudocode - check if Nicnl's tool has an API
  const response = await fetch('https://borderlands4-serial-comparator.nicnl.com/api/deserialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serial })
  });
  
  const data = await response.json();
  return data.deserialized;
}

// Then use parseDeserialized
const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';
const deserializedString = await deserializeViaAPI(serial);
const parsed = parseDeserialized(deserializedString);
```

### Option 3: Manual Entry

For development/testing, you can manually enter deserialized strings:

```typescript
import { parseDeserialized } from './src/lib/serial-decoder';

// Test cases from Discord
const tests = {
  test1: parseDeserialized('269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|'),
  test2: parseDeserialized('7, 0, 1, 30| 2, 2477|| {19} {2} {6} {1:11} {18} {66} {68} {69} {17} {27} {34} {45} {81}|'),
  test3: parseDeserialized('20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|')
};
```

## Understanding The Format

### Deserialized String Structure

```
itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
```

### Field IDs

| ID | Meaning | Example |
|----|---------|---------|
| 1  | Level   | `1, 28\|` means level 28 |
| 2  | Random  | `2, 1611\|\|` means seed 1611 |

### Parts

- `{5}` - Simple part (ID 5, no values)
- `{243:[106 101]}` - Part 243 with values [106, 101]

### Modifying Items

To change an item's level:

```typescript
const original = '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';
const modified = '269, 0, 1, 50| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';
//                        ^^-- changed from 28 to 50

// Parse the modified string
const parsed = parseDeserialized(modified);

// To re-encode back to serial, you'd need Nicnl's encoder or the web tool
```

## Next Steps For Full Implementation

To complete the bit-level decoder, you would need to:

1. **Access Nicnl's Source Code**
   - The GitLab repo requires authentication
   - Could reach out to Nicnl directly
   
2. **Reverse Engineer From Examples**
   - Collect many more serial/deserialized pairs
   - Find patterns in how values are encoded
   - Build a lookup table or formula
   
3. **Use Browser DevTools On The Web Tool**
   - Open https://borderlands4-serial-comparator.nicnl.com/
   - Open browser DevTools
   - Find and copy the JavaScript code that does the decoding
   - Port it to TypeScript

## Recommended Approach

For a production application:

1. **Short term**: Use the web tool manually or via API
2. **Medium term**: Cache deserialized strings locally
3. **Long term**: Implement full decoder once you have access to working code

## Files Reference

- `src/lib/serial-decoder.ts` - Decoder types and `parseDeserialized()`
- `src/lib/serial-codec.ts` - Helper functions
- `SERIAL_DECODER_NOTES.md` - Technical documentation
- `TEST_CASES.md` - Test data
- `IMPLEMENTATION_SUMMARY.md` - Overall status

## Example: Working With Item Manager

```typescript
import { itemManager } from './src/lib/item-manager';
import { parseDeserialized } from './src/lib/serial-decoder';

// If you have a deserialized string from the web tool:
const deserializedString = '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';
const parsed = parseDeserialized(deserializedString);

// Extract useful info
const level = parsed.fields.find(f => f.id === 1)?.value || 1;
const randomSeed = parsed.fields.find(f => f.id === 2)?.value || 0;

console.log(`Item Level: ${level}`);
console.log(`Random Seed: ${randomSeed}`);
console.log(`Parts: ${parsed.parts.map(p => p.id).join(', ')}`);
```

##Summary

While the full bit-level decoder isn't working yet, you can still:
- ✅ Parse deserialized strings from Nicnl's tool
- ✅ Extract and modify fields
- ✅ Understand the format structure
- ❌ Directly decode base85 serials (need external tool for now)
