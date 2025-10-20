# Test Cases for Serial Decoder

These are the reference test cases from the user request and GitHub repository.

## Test Case 1: Level 28 Item

**Serial:**
```
@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
```

**Expected Deserialized:**
```
269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

**Breakdown:**
- Item Type: 269
- Version: 0
- Level (field 1): 28
- Random Seed (field 2): 1611
- Parts: 5, 7, 243 (with values 106, 101), 6, 243 (with value 87)

## Test Case 2: Level 30 Item

**Serial:**
```
@Ugd77*Fg_4rx=zp;RG}I*T&N7HBq}9pC29=n4yqJt7iug5
```

**Expected Deserialized:**
```
7, 0, 1, 30| 2, 2477|| {19} {2} {6} {1:11} {18} {66} {68} {69} {17} {27} {34} {45} {81}|
```

**Breakdown:**
- Item Type: 7
- Version: 0
- Level (field 1): 30
- Random Seed (field 2): 2477
- Parts: 19, 2, 6, 1 (with value 11), 18, 66, 68, 69, 17, 27, 34, 45, 81

## Test Case 3: Level 10 Item

**Serial:**
```
@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00
```

**Expected Deserialized:**
```
20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|
```

**Breakdown:**
- Item Type: 20
- Version: 0
- Level (field 1): 10
- Random Seed (field 2): 3037
- Parts: 98, 62, 5, 3, 4, 7, 93, 82, 80, 11, 16, 26, 36, 37, 46, 50

## Discord Modification Example

From the Discord conversation, this example shows how adding a level field works:

**Original (Level 1, no level field):**
```
Serial:       @Ugr$ZC7-2Rw(4ro7J{oOO4K?a~Zvg
Deserialized: 269, 0, 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

**Modified (Level 28, level field inserted):**
```
Serial:       @Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
Deserialized: 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

Notice how inserting `1, 28|` changed the serial and gave the item a level of 28!

## Validation Criteria

A correct decoder should:
1. ✅ Extract the correct item type
2. ✅ Identify version (usually 0)
3. ✅ Decode field pairs correctly (field ID and value)
4. ✅ Parse parts list with simple parts `{id}`
5. ✅ Parse parts with values `{id:[val1 val2 ...]}`
6. ✅ Maintain separator structure (`|` for fields, `||` before parts)

## Running Tests

Use the provided test script:
```bash
npx tsx test-new-decoder.ts
```

This will decode all three test cases and compare against expected output.

## Current Status

As of this update:
- ❌ Test 1: FAIL (decoder is a stub)
- ❌ Test 2: FAIL (decoder is a stub)
- ❌ Test 3: FAIL (decoder is a stub)

Once a proper varint5/varbit5 decoder is implemented, all tests should pass.

## Reference Implementation

For a working implementation, see:
- **Python:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker/-/blob/main/borderlands_4_base85_decoder.py
- **JavaScript:** https://gitlab.nicnl.com/Nicnl/borderlands_4_item_tinker/-/blob/main/lib/b85.js
- **Web Tool:** https://borderlands4-serial-comparator.nicnl.com/
