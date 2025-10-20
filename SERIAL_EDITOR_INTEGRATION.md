# Serial Editor Integration - Nicnl Decoder

## Summary

Successfully integrated Nicnl's reverse-engineered decoder into the serial editor's field editor section.

## Changes Made

### 1. Import Nicnl Decoder
```typescript
import { decodeSerial } from '../../lib/nicnl-decoder'
```

### 2. Updated Field Definitions
Replaced manual bit-parsing field definitions with Nicnl-based definitions:

**Before:**
- Generic "Unknown byte", "Unknown flag", etc.
- Manual level extraction with reverse flag

**After:**
```typescript
const fieldDefinitions: StructureFieldDef[] = [
  { name: 'Prefix', type: 'bits', length: 7 }, // 001 0000 static prefix
  { name: 'Item Type (major)', type: 'bits', length: 3 }, // 100 or 110
  { name: 'Item Type', type: 'varint', length: 4, reverse: true, addToEditor: true },
  { name: 'Version', type: 'varint', length: 4, reverse: false, addToEditor: false },
  { name: 'Level Marker', type: 'bits', length: 20 }, // 00000011001000001100
  { name: 'Level', type: 'varint', length: 4, reverse: true, addToEditor: true },
  { name: 'Random Seed (major)', type: 'bits', length: 3 },
  { name: 'Random Seed', type: 'varint', length: 4, reverse: true, addToEditor: true },
]
```

### 3. Integrated Nicnl's Decoder Values
Modified `structureFields` computed property to:
1. Call `decodeSerial()` on the current serial
2. Extract level, random seed, and item type from Nicnl's decoder
3. Use these values instead of manual bit parsing when available

```typescript
const nicnlDecoded = serialInput.value ? decodeSerial(serialInput.value) : null;
const nicnlFields = new Map<string, { value: number }>();
if (nicnlDecoded) {
  if (nicnlDecoded.level !== undefined) {
    nicnlFields.set('Level', { value: nicnlDecoded.level });
  }
  // ... other fields
}
```

### 4. Fallback Logic
Keeps existing manual decoding as fallback for fields where Nicnl's decoder doesn't have values.

## Benefits

✅ **Accurate Level Extraction** - Uses Nicnl's marker-based method
✅ **Item Type Detection** - Correctly reads itemType field
✅ **Random Seed** - Extracts random seed when present
✅ **Future-proof** - Easy to add more fields as decoder improves
✅ **No Breaking Changes** - Falls back to manual parsing for unknown fields

## Field Editor Display

The field editor now shows:
- **Item Type** - With correct varint5 decoding
- **Level** - Using Nicnl's exact extraction method (bit 49 after marker)
- **Random Seed** - When present in the serial

Each field is:
- Editable via input box
- Shows bit position range
- Displays hex representation
- Highlights in bit string view

## Testing

Test with known serials:
```
@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
Expected: itemType=269, level=28, randomSeed=1611
```

The field editor should now display these values accurately in the "Field Editor" section with the ability to modify them.

## Next Steps

To further improve:
1. Add more field types from Nicnl's decoder as they're discovered
2. Implement version field extraction
3. Add parts section decoding
4. Create encoders that match Nicnl's format exactly

## Files Modified

- `src/components/editors/SerialEditorFullPage.vue`
  - Added Nicnl decoder import
  - Updated field definitions to match Nicnl's format
  - Integrated decoder values into structure fields
  - Maintained backward compatibility with fallback parsing

## Credits

All decoder logic credit goes to **@Nicnl** and **@InflamedSebi** for their reverse engineering work on the Borderlands 4 serial format.
