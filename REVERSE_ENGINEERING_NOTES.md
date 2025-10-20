# Borderlands 4 Serial Format - Reverse Engineering Notes

## Successfully Decoded ✅

### Base85 Encoding
- Uses ASCII85/Base85 to encode binary data
- Verified against README example: perfect match
- Function: `b85DecodeToHex()`

### Item Type (bits 10-23)
- Encoded as varbit5
- Example: 321 (Assault Rifle)
- Location: After 7-bit prefix and 3-bit major type

### Version (bits 24-28)
- Encoded as varint5 or varbit5 (major type dependent)
- Usually 0

### Level (bits 29-58)
- 20-bit marker: `00000011001000001100`
- Followed by varint5 level value
- Example: 28, 30, 2, 10
- Function: `itemDecodeLevel()`

### Fields Section (bits 59+)
Fields use pattern: `[varbit5 field_id] + [001 marker] + [3-bit major] + [value]`

**Field 1 (Level):** Embedded in level marker
**Field 2 (Random Seed):**
- Bits 59-67: Field ID as varbit5 (value=2)
- Bits 68-70: `001` marker
- Bits 71-73: Major type `100` (varint5)
- Bits 74+: Random seed value as varint5
- Example values: 2493, 98, 2534, 3037

**Fields End:** Major type `000` indicates end of fields section

## Partially Decoded ⚠️

### Parts Section (BLOCKED)
**Location:** Starts immediately after `000` end-of-fields marker

**What We Know:**
1. Not sequential varint5 IDs
2. Not sequential varbit5 IDs
3. Contains metadata before/between IDs
4. Metadata encodes: part count, chunk information, array vs single chunks

**Tested Hypotheses (ALL FAILED):**
- ❌ 2-bit flags per part (00=none, 01=single, 10=array)
- ❌ 1-bit flags after each ID
- ❌ Bitmap of flags at start
- ❌ Inline chunk counts after each ID
- ❌ Major types before each part ID
- ❌ Raw 5/6/8-bit part count + IDs
- ❌ Varint5 count + varint5 IDs
- ❌ Varbit5 IDs instead of varint5

**Test Data:**
```
Serial 1: 6 parts, mixed chunks
  {7} {10} {246:22} {237:9} {246:[51 3]} {6}
  
Serial 2: 8 parts, mostly no chunks  
  {38} {14} {15} {16} {17} {19} {37} {244:1}
  
Serial 3: 9 parts, all no chunks
  {95} {2} {7} {61} {13} {29} {44} {50} {51}
  
Serial 4: 16 parts, all no chunks
  {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}
```

**Observations:**
- Part IDs found scattered (not sequential)
- Serial 4: First part ID (98) found 5 bits after parts start
- Serial 3: Part IDs found at various offsets (5, 16, 24, 27, 54, 70, 86 bits)
- Structure appears to be complex interleaved encoding

## Encoding Types Reference

### Varint5 (Variable-length 5-bit blocks)
- 5 bits per block: 4 data bits + 1 continuation bit
- LSB-first (reversed bit order)
- Continuation bit: 1=more blocks, 0=last block
- Max 4 blocks (20 bits total)
- Example: 7 → `11100` (1110=14 reversed, 0=last)
- Function: `decodeVarint5()`, `encodeVarint5()` (TODO)

### Varbit5 (Variable-length bit string)
- First 5 bits: length (LSB-first)
- Next N bits: value (LSB-first, where N = length)
- Example: 321 → length=9 (`10010`), value=321 (9 bits)
- Function: `decodeVarbit5()`, `encodeVarbit5()` (TODO)

### Major Types (3-bit prefixes)
- `000`: End marker / No value
- `001`: Marker (e.g., between field ID and value)
- `010`: Unknown (seen in parts section)
- `011`: Unknown
- `100`: Varint5 follows
- `101`: Unknown (causes decode failures)
- `110`: Varbit5 follows
- `111`: Unknown

## Binary Structure

```
Bits 0-6:    Prefix (0010000)
Bits 7-9:    Item type major (110 for varbit5)
Bits 10-23:  Item type value (varbit5)
Bits 24-26:  Version major
Bits 27-28:  Version value
Bits 29-48:  Level marker (20 bits)
Bits 49-58:  Level value (varint5)

Fields Section:
  [Field ID (varbit5, no major)]
  [001 marker]
  [Major type (3 bits)]
  [Field value]
  ... repeat ...
  [000 end marker]

Parts Section:
  [UNKNOWN STRUCTURE]
  Contains: part count, part IDs, chunk counts, chunk values
  Encoding: Complex, not yet reverse-engineered
```

## Test Files Created

- `test-parts-decode.ts` - Manual bit-level analysis
- `test-full-decode.ts` - Round-trip testing
- `test-step-by-step.ts` - Step-by-step decoder
- `test-find-parts.ts` - Systematic pattern search
- `test-decode-parts.ts` - Decode attempts
- `test-bit-analysis.ts` - Detailed bit patterns
- `test-from-96.ts` - Testing from known offsets
- `test-multiple-serials.ts` - Multi-serial analysis
- `test-compare-serials.ts` - Serial comparison
- `test-simple-structure.ts` - Simple encoding tests
- `analyze-with-outputs.ts` - Pattern analysis tool
- `analyze-simple-serials.ts` - No-chunk serial focus
- `find-pattern.ts` - Pattern identification
- `search-serial3.ts` - Serial 3 detailed search
- `test-varbit5-parts.ts` - Varbit5 hypothesis test

## Next Steps

### Option A: Ship Without Parts
1. Update UI to show working fields only
2. Add note: "Parts editing under research"
3. Provide fields-based editing (level, random seed)
4. Ship v1.0 with 80% functionality

### Option B: Community Outreach
1. Post on Borderlands modding Discord
2. Ask Reddit r/Borderlands community
3. Check for existing BL4 modding tools/repos
4. Request format specification or game file documentation

### Option C: Hex Editor Fallback
1. Provide raw hex/binary view of parts section
2. Build varint5/varbit5 encoder/decoder tools
3. Let advanced users manually edit binary
4. Include bit offset calculator

## References

- Nicnl's Deserializer: https://borderlands4-deserializer.nicnl.com/ (no public source)
- Test serials in `analyze-with-outputs.ts`
- Binary analysis in `test-compare-serials.ts`

## Status

**Working:** Base85, Item Type, Version, Level, Fields (Random Seed)
**Blocked:** Parts Section - requires format specification
**Decision:** Ship v1 without parts, continue research separately
