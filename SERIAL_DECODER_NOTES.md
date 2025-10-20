# Borderlands 4 Serial Decoder - Implementation Notes

## Overview

This document explains the new deserialization format for Borderlands 4 item serials based on the research documented at:
- https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
- Discord conversations between @Nicnl and @valkyr

## Deserialized Format

The new format is a human-readable representation of the binary data:

```
itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
```

### Example

**Serial:**
```
@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
```

**Deserialized:**
```
269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

**Breakdown:**
- `269` - Item type (weapon/item category identifier)
- `0` - Version
- `1, 28|` - Field pair: field ID 1 (level) = 28
- `2, 1611||` - Field pair: field ID 2 (random seed) = 1611
- `{5}` - Part ID 5 (simple part, no values)
- `{7}` - Part ID 7 (simple part)
- `{243:[106 101]}` - Part ID 243 with chunk values [106, 101]
- `{6}` - Part ID 6
- `{243:87}` - Part ID 243 with value 87

## Field Identifiers

From the Discord conversation, we know these field identifiers:

- **1** = Level identifier
  - When you see `1, 28|` it means "this is the level field, and its value is 28"
  - The game reads "1" and knows "the next value is the item level"
  
- **2** = Random seed identifier
  - When you see `2, 1611||` it means "this is the random seed field, and its value is 1611"
  - The game reads "2" and knows "the next value is the random seed"

The Discord conversation showed that these identifiers can be swapped:
```
Original: 269, 0, 2, 1611 | 1, 28|| ...
Swapped:  269, 0, 1, 28 | 2, 1611|| ...
```

Both work in-game, but the game re-encodes them back to the canonical order (1 before 2).

## Data Types

The binary format uses variable-length integer encoding:

### Varint5
- **Major type:** `100` (3 bits)
- **Format:** Blocks of 5 bits
  - LSB (bit 0): Continuation bit (1 = more blocks follow, 0 = last block)
  - Bits 1-4: Data nibble (4 bits of actual value)
- **Maximum:** 4 blocks total = 16 bits of data

**Example:**
```
Type  Block1  Block2
100   10001   00010
      ^^^^    ^^^^
      data    data
      |       |
      +-------+-- Value assembled LSB-first
```

### Varbit5
- **Major type:** `110` (3 bits)
- **Format:** 5-bit length + N bits of data
- **Length field:** 5 bits (LSB-first) specifying how many data bits follow
- **Data:** N bits of payload (LSB-first)

**Example:**
```
Type  Length  Data
110   11000   101
      ^^^^^   ^^^
      24      value=5 (binary 101)
```

### Struct
- **Major type:** `001` (3 bits)
- **Format:** 4-bit struct ID + contents + terminator
- **Terminator:** `000` (3 bits)

### Terminator
- **Pattern:** `000` (3 bits)
- **Purpose:** Marks end of structures/arrays, or acts as separator

## Binary Encoding Details

### Bit Order
- **Within bytes:** LSB-first (bit 0 is rightmost when reading as binary)
- **Reading:** Start from bit 0 and read upward
- **Example:** Byte `0x21` = `10000100` in memory, read as `00100001` (LSB-first)

### Base85 Encoding
1. Serialize item data to bytes
2. Mirror each byte (reverse bit order: 76543210 → 01234567)
3. Encode to base85 (big-endian) using custom alphabet
4. Add `@U` prefix

**Alphabet:**
```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~
```

## Test Cases

### Test 1
```
Serial:      @Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
Deserialized: 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

### Test 2
```
Serial:      @Ugd77*Fg_4rx=zp;RG}I*T&N7HBq}9pC29=n4yqJt7iug5
Deserialized: 7, 0, 1, 30| 2, 2477|| {19} {2} {6} {1:11} {18} {66} {68} {69} {17} {27} {34} {45} {81}|
```

### Test 3
```
Serial:      @UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00
Deserialized: 20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|
```

## Implementation Status

### Current Status
The `serial-decoder.ts` file contains:
- ✅ Type definitions for the deserialized format
- ✅ Function to parse deserialized strings back to structured data
- ❌ Full bit-level varint5/varbit5 decoder (stub only)

### What's Needed
To implement a full decoder, you need to:

1. **Bit stream reader**
   - Read arbitrary bit sequences from byte array
   - Handle LSB-first bit ordering within bytes

2. **Varint5 decoder**
   - Read 3-bit major type
   - Loop through 5-bit blocks
   - Extract 4-bit data nibbles
   - Check continuation bit
   - Assemble nibbles LSB-first

3. **Varbit5 decoder**
   - Read 3-bit major type
   - Read 5-bit length field
   - Read N bits of data
   - Assemble value LSB-first

4. **Serial parser**
   - Skip static prefix `001 0000`
   - Decode item type (varint5 or varbit5)
   - Decode version (usually 0)
   - Decode field pairs until double-pipe
   - Decode parts list
   - Handle parts with chunk values

## Reference Implementations

For a complete working implementation, see:

- **Web Tool:** https://borderlands4-serial-comparator.nicnl.com/
- **Python:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker
- **JavaScript:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker/-/blob/main/lib/b85.js

## Integration with Existing Code

The `item-manager.ts` expects a `decodeSerial()` function that returns:

```typescript
{
  serial: string;
  itemType: number;
  version: number;
  fields: Array<{ id: number; value: number }>;
  parts: Array<{ id: number; values?: number[] }>;
  varbits: VarbitData[];
  structs: any[];
  raw: string;
}
```

The `raw` field should contain the human-readable deserialized format shown above.

## Next Steps

1. **Option A: Use External Tool**
   - Integrate with Nicnl's web API for deserialization
   - Parse the returned string using `parseDeserialized()`

2. **Option B: Implement Locally**
   - Port the Python/JavaScript decoder to TypeScript
   - Implement bit-level varint5/varbit5 parsing
   - Test against all three reference serials

3. **Option C: Hybrid Approach**
   - Use external tool for complex items
   - Implement simple decoder for common cases
   - Fall back to external tool when needed
