# Serial Decoder Update Summary

## What Was Done

### 1. Created New Decoder Infrastructure

**File: `src/lib/serial-decoder.ts`**
- Created type definitions matching the new deserialized format
- Added `DecodedSerial` interface with fields for itemType, version, fields, and parts
- Implemented `parseDeserialized()` function to parse the text format back to structured data
- Added stub for `decodeSerial()` function (full implementation requires complex bit-level parsing)

**File: `src/lib/serial-codec.ts`**
- Created helper functions `getBasicInfo()` and `isValidSerial()`
- Provides simple validation and metadata extraction

### 2. Documented the New Format

**File: `SERIAL_DECODER_NOTES.md`**
- Comprehensive documentation of the deserialized format
- Explanation of field identifiers (1=level, 2=random seed)
- Data types specification (Varint5, Varbit5, Struct, Terminator)
- Binary encoding details
- Test cases with expected outputs
- Implementation roadmap

**File: `README.md`**
- Added serial format documentation section
- Included test serials and their expected deserialized outputs
- Links to reference implementations

### 3. Test Files

**File: `test-new-decoder.ts`**
- Test script for validating decoder against reference serials
- Shows current implementation status

**File: `debug-binary.ts`**
- Debug script for analyzing binary structure
- Helps visualize the bit-level encoding

## New Deserialized Format

The format is based on research from:
- https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
- Discord conversations between @Nicnl and @valkyr

### Format Structure
```
itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
```

### Example
```
Serial:       @Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
Deserialized: 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

**Breakdown:**
- `269` - Item type (weapon category)
- `0` - Version
- `1, 28|` - Field 1 (level) = 28
- `2, 1611||` - Field 2 (random seed) = 1611
- `{5}` - Part ID 5
- `{243:[106 101]}` - Part ID 243 with values [106, 101]

## Key Insights from Discord

### Field Identifiers
From the Discord conversation, we learned:

1. **Field ID 1 = Level**
   - `1, 28|` means "level field with value 28"
   - The "1" prepares the game to read the level
   - Can be inserted/removed to change item level

2. **Field ID 2 = Random Seed**
   - `2, 1611||` means "random seed field with value 1611"
   - Controls randomization of item properties
   - Can be swapped with level field

3. **Order Flexibility**
   - Fields can appear in any order: `1, 28| 2, 1611||` or `2, 1611| 1, 28||`
   - Game re-encodes to canonical order (1 before 2) on load

### Example Modification from Discord
```
Original (level 1):
269, 0, 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|

Modified (level 28):
269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

Simply inserting `1, 28|` changed the item from level 1 to level 28!

## Data Types

### Varint5
- 3-bit major type: `100`
- Variable number of 5-bit blocks
- Each block: 1 continuation bit + 4 data bits
- LSB-first assembly

### Varbit5
- 3-bit major type: `110`
- 5-bit length field
- Variable-length data
- LSB-first assembly

### Parts with Values
- `{part_id}` - Simple part
- `{part_id:[val1 val2 ...]}` - Part with chunk values

## What's Not Implemented

The `decodeSerial()` function was implemented with varint5/varbit5 logic but **does not produce correct results**. After extensive debugging and testing against the three reference serials, the decoder outputs incorrect values for itemType and fields.

**Issues discovered:**
1. The bit patterns documented in the README don't match what's in the actual serials
2. The "marker" pattern for finding the level bits is not present in our test serials
3. The varint5/varbit5 decoding logic may be correct, but the overall structure/offsets are wrong
4. Nicnl's actual implementation source code is not publicly accessible (GitLab requires auth)

**What was attempted:**
1. ✅ Bit-level stream reader implemented
2. ✅ Varint5 decoder implemented
3. ✅ Varbit5 decoder implemented  
4. ❌ Correct parsing of item structure (wrong offsets/interpretation)
5. ❌ Validation against test cases (all 3 tests fail)

**What actually works:**
- ✅ `parseDeserialized()` - Parses the text format strings perfectly
- ✅ Type definitions and interfaces
- ✅ Documentation of the format

## Recommended Solution

Use **Option A** from the original plan:
- Integrate with Nicnl's web tool: https://borderlands4-serial-comparator.nicnl.com/
- Use the provided `parseDeserialized()` function to parse the output
- This is the most practical solution until the actual source code is available

1. **Bit-level stream reader** - Read arbitrary bits from byte array
2. **Varint5 decoder** - Parse continuation bits and assemble nibbles
3. **Varbit5 decoder** - Read variable-length bit sequences
4. **Struct parser** - Handle struct markers and terminators
5. **Parts parser** - Distinguish simple parts from parts with values

## Next Steps

### Option A: Use External Tool
Integrate with Nicnl's web tool for deserialization:
- Web API: https://borderlands4-serial-comparator.nicnl.com/
- Parse returned string using `parseDeserialized()`

### Option B: Implement Locally
Port the reference implementation:
- Python: https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker
- JavaScript: https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker/-/blob/main/lib/b85.js

### Option C: Hybrid
- Simple decoder for common cases
- Fall back to external tool for complex items

## Files Modified

### New Files
- `src/lib/serial-decoder.ts` - Decoder types and stub implementation
- `src/lib/serial-codec.ts` - Helper functions
- `SERIAL_DECODER_NOTES.md` - Comprehensive documentation
- `test-new-decoder.ts` - Test script
- `debug-binary.ts` - Debug tool

### Modified Files
- `README.md` - Added serial format documentation

### Existing Files (No Changes)
- `src/lib/item-manager.ts` - Already imports from serial-decoder
- `src/lib/utils/serial-utils.ts` - Existing base85 encode/decode still used

## Testing

Run the test script to see current status:
```bash
npx tsx test-new-decoder.ts
```

Expected result: Currently fails because the decoder is a stub. Once a full implementation is added, all three test cases should pass.

## References

- **Format Spec:** https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
- **Web Tool:** https://borderlands4-serial-comparator.nicnl.com/
- **Python Implementation:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker
- **Discord Discussion:** See user request for full conversation about field identifiers
