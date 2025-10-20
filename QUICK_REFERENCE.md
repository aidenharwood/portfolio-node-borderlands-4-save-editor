# Quick Reference - Serial Decoder

## Format At A Glance

```
itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
```

## Example

```
@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
↓
269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

## Field IDs

| ID | Meaning | Example |
|----|---------|---------|
| 1  | Level   | `1, 28\|` = Level 28 |
| 2  | Random  | `2, 1611\|\|` = Seed 1611 |

## Parts Format

| Format | Meaning |
|--------|---------|
| `{5}` | Simple part with ID 5 |
| `{243:[106 101]}` | Part 243 with values [106, 101] |

## Data Types (Binary)

| Type | Major Bits | Format |
|------|------------|--------|
| Varint5 | `100` | Blocks of 5 bits (4 data + 1 continue) |
| Varbit5 | `110` | 5-bit length + N bits data |
| Struct | `001` | 4-bit ID + contents + terminator |
| Terminator | `000` | End marker |

## Files

| File | Purpose |
|------|---------|
| `src/lib/serial-decoder.ts` | Main decoder (STUB - needs implementation) |
| `src/lib/serial-codec.ts` | Helper functions |
| `SERIAL_DECODER_NOTES.md` | Full technical documentation |
| `TEST_CASES.md` | Test data |
| `IMPLEMENTATION_SUMMARY.md` | What's done and what's needed |

## Test

```bash
npx tsx test-new-decoder.ts
```

## References

- **Spec:** https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
- **Web Tool:** https://borderlands4-serial-comparator.nicnl.com/
- **Python:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker

## Status

✅ Types defined  
✅ Parser for deserialized format  
✅ Documentation complete  
❌ Full decoder implementation (stub only)

## Next Step

Implement bit-level parsing in `decodeSerial()` function or integrate with Nicnl's web API.
