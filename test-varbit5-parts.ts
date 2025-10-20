import { b85DecodeToHex, hexToBin, decodeVarbit5, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial3 = '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW';
const partIds = [95, 2, 7, 61, 13, 29, 44, 50, 51];

const hex = b85DecodeToHex(serial3);
const binary = hexToBin(hex!);

if (binary) {
  console.log('Testing VARBIT5 encoding for part IDs:\n');
  
  const partsStart = 93;
  
  // Calculate varbit5 encoding for 95
  console.log('95 in varbit5:');
  console.log('  95 = 0b1011111 (7 bits)');
  console.log('  Length: 7 (0b00111 in 5 bits, LSB-first = 11100)');
  console.log('  Value: 1011111 (LSB-first = 1111101)');
  console.log('  Full encoding: 11100 1111101 (12 bits)');
  
  const pattern95varbit = '111001111101';
  const idx = binary.indexOf(pattern95varbit);
  console.log(`\nSearching for "${pattern95varbit}": ${idx >= 0 ? `Found at bit ${idx}` : 'Not found'}`);
  
  if (idx >= 0) {
    console.log(`  Offset from parts start: ${idx - partsStart}`);
  }
  
  // Try decoding as varbit5 from parts start
  console.log(`\n\nDecoding as varbit5 from bit ${partsStart}:`);
  let offset = partsStart;
  for (let i = 0; i < 12; i++) {
    const val = decodeVarbit5(binary, offset);
    if (!val) {
      console.log(`  [${i}] Bit ${offset}: FAILED`);
      break;
    }
    const expected = i < partIds.length ? partIds[i] : '?';
    const match = val.value === expected ? '✓' : '✗';
    console.log(`  [${i}] Bit ${offset}: ${val.value} (expected ${expected}) ${match}`);
    offset += val.bitsRead;
    
    if (offset > partsStart + 150) break;
  }
  
  // Try from bit 98 (where we found ID 2 as varint5)
  console.log(`\n\nWhat if there's a 5-bit header, and IDs start at bit 98?`);
  console.log(`Header (bits 93-97): ${binary.slice(93, 98)}`);
  console.log(`As decimal: ${parseInt(binary.slice(93, 98), 2)}`);
  
  offset = 98;
  console.log(`\nDecoding as varbit5 from bit ${offset}:`);
  for (let i = 0; i < partIds.length + 2; i++) {
    const val = decodeVarbit5(binary, offset);
    if (!val) {
      console.log(`  [${i}] Bit ${offset}: FAILED`);
      break;
    }
    const expected = i < partIds.length ? partIds[i] : '?';
    const match = val.value === expected ? '✓' : '✗';
    console.log(`  [${i}] Bit ${offset}-${offset + val.bitsRead - 1}: ${val.value} (expected ${expected}) ${match}`);
    offset += val.bitsRead;
  }
}
