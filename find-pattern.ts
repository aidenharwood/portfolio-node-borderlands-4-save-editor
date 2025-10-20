import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const tests = [
  {
    serial: '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW',
    partIds: [95, 2, 7, 61, 13, 29, 44, 50, 51], // 9 parts
    partsStart: 93
  },
  {
    serial: '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
    partIds: [98, 62, 5, 3, 4, 7, 93, 82, 80, 11, 16, 26, 36, 37, 46, 50], // 16 parts
    partsStart: 87
  }
];

tests.forEach(test => {
  const hex = b85DecodeToHex(test.serial);
  const binary = hexToBin(hex!);
  if (!binary) return;
  
  console.log(`\nSerial with ${test.partIds.length} parts:`);
  console.log(`Parts start at bit ${test.partsStart}`);
  
  // Check first 10 bits
  const first10 = binary.slice(test.partsStart, test.partsStart + 10);
  console.log(`First 10 bits: ${first10}`);
  console.log(`  As 5-bit: ${parseInt(binary.slice(test.partsStart, test.partsStart + 5), 2)}`);
  console.log(`  As 6-bit: ${parseInt(binary.slice(test.partsStart, test.partsStart + 6), 2)}`);
  console.log(`  As 8-bit: ${parseInt(binary.slice(test.partsStart, test.partsStart + 8), 2)}`);
  
  // Search for first part ID within first 20 bits
  console.log(`\nSearching for first part ID (${test.partIds[0]}):`);
  for (let offset = test.partsStart; offset < test.partsStart + 20; offset++) {
    const val = decodeVarint5(binary, offset);
    if (val?.value === test.partIds[0]) {
      console.log(`  ✓ Found at bit ${offset} (${offset - test.partsStart} bits from start)`);
      
      // What are the bits before it?
      const bitsBefore = offset - test.partsStart;
      console.log(`  Bits before: ${binary.slice(test.partsStart, offset)}`);
      console.log(`  As decimal: ${parseInt(binary.slice(test.partsStart, offset), 2)}`);
      
      // Could this be the count?
      console.log(`  Is this the count? ${test.partIds.length} parts expected`);
      
      // Try all IDs from this offset
      console.log(`\n  Decoding IDs:`);
      let o = offset;
      let allMatch = true;
      for (let i = 0; i < test.partIds.length; i++) {
        const id = decodeVarint5(binary, o);
        if (!id) {
          console.log(`    [${i}] FAILED to decode at bit ${o}`);
          allMatch = false;
          break;
        }
        const match = id.value === test.partIds[i];
        if (!match) allMatch = false;
        console.log(`    [${i}] ${id.value} ${match ? '✓' : '✗ expected ' + test.partIds[i]}`);
        o += id.bitsRead;
      }
      
      console.log(`\n  All parts match: ${allMatch ? '✓✓✓' : '✗'}`);
      break;
    }
  }
});

console.log('\n\nCONCLUSION:');
console.log('Need to find the pattern in the bits BEFORE the first part ID.');
console.log('These bits likely encode: part count, chunk flags, or other metadata.');
