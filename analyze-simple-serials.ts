import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

// Focus on serials with NO chunks - simpler structure
const simpleSerials = [
  {
    serial: '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW',
    output: '2, 0, 1, 2| 2, 2534|| {95} {2} {7} {61} {13} {29} {44} {50} {51}|',
    partIds: [95, 2, 7, 61, 13, 29, 44, 50, 51]
  },
  {
    serial: '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
    output: '20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|',
    partIds: [98, 62, 5, 3, 4, 7, 93, 82, 80, 11, 16, 26, 36, 37, 46, 50]
  }
];

function analyzeSimple(data: typeof simpleSerials[0]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Serial: ${data.serial}`);
  console.log(`Parts (${data.partIds.length}): ${data.partIds.join(', ')}`);
  console.log('='.repeat(80));
  
  const hex = b85DecodeToHex(data.serial);
  const binary = hexToBin(hex!);
  
  if (!binary) return;
  
  // Find parts start
  let partsStart = -1;
  for (let i = 80; i < 100; i++) {
    if (binary.slice(i, i + 3) === '000') {
      partsStart = i + 3;
      break;
    }
  }
  
  if (partsStart < 0) return;
  
  console.log(`\nParts start at bit ${partsStart}`);
  console.log(`Bits ${partsStart}-${partsStart + 80}:`);
  console.log(binary.slice(partsStart, partsStart + 81));
  
  // If structure is just: [count][ID][ID][ID]...
  // Let's try different count encodings
  
  console.log(`\n--- Testing: varint5 count + varint5 IDs ---`);
  let offset = partsStart;
  const count = decodeVarint5(binary, offset);
  console.log(`Count: ${count?.value} (expected ${data.partIds.length})`);
  
  if (count) {
    offset += count.bitsRead;
    console.log(`IDs start at bit ${offset}`);
    
    for (let i = 0; i < Math.min(count.value, 20); i++) {
      const id = decodeVarint5(binary, offset);
      if (!id) break;
      const expected = i < data.partIds.length ? data.partIds[i] : '?';
      const match = id.value === expected ? '✓' : '✗';
      console.log(`  [${i}] Bit ${offset}: ${id.value} (expected ${expected}) ${match}`);
      offset += id.bitsRead;
    }
  }
  
  // Try: raw 5-bit count
  console.log(`\n--- Testing: 5-bit raw count + varint5 IDs ---`);
  const count5bit = parseInt(binary.slice(partsStart, partsStart + 5), 2);
  console.log(`5-bit count: ${count5bit} (expected ${data.partIds.length})`);
  
  offset = partsStart + 5;
  for (let i = 0; i < Math.min(count5bit + 1, data.partIds.length + 2); i++) {
    const id = decodeVarint5(binary, offset);
    if (!id) break;
    const expected = i < data.partIds.length ? data.partIds[i] : '?';
    const match = id.value === expected ? '✓' : '✗';
    console.log(`  [${i}] Bit ${offset}: ${id.value} (expected ${expected}) ${match}`);
    offset += id.bitsRead;
  }
  
  // Try: 6-bit raw count
  console.log(`\n--- Testing: 6-bit raw count + varint5 IDs ---`);
  const count6bit = parseInt(binary.slice(partsStart, partsStart + 6), 2);
  console.log(`6-bit count: ${count6bit} (expected ${data.partIds.length})`);
  
  offset = partsStart + 6;
  for (let i = 0; i < Math.min(count6bit, data.partIds.length + 2); i++) {
    const id = decodeVarint5(binary, offset);
    if (!id) break;
    const expected = i < data.partIds.length ? data.partIds[i] : '?';
    const match = id.value === expected ? '✓' : '✗';
    console.log(`  [${i}] Bit ${offset}: ${id.value} (expected ${expected}) ${match}`);
    offset += id.bitsRead;
  }
  
  // Search for the first part ID
  console.log(`\n--- Searching for first part ID (${data.partIds[0]}) ---`);
  for (let i = partsStart; i < partsStart + 30; i++) {
    const val = decodeVarint5(binary, i);
    if (val?.value === data.partIds[0]) {
      console.log(`✓ Found ${data.partIds[0]} at bit ${i}`);
      console.log(`  That's ${i - partsStart} bits after parts start`);
      
      // Try decoding all IDs from here
      console.log(`\n  Decoding all IDs from bit ${i}:`);
      offset = i;
      for (let j = 0; j < data.partIds.length; j++) {
        const id = decodeVarint5(binary, offset);
        if (!id) break;
        const expected = data.partIds[j];
        const match = id.value === expected ? '✓' : '✗';
        console.log(`    [${j}] Bit ${offset}: ${id.value} (expected ${expected}) ${match}`);
        offset += id.bitsRead;
      }
      break;
    }
  }
}

console.log('ANALYZING NO-CHUNK SERIALS\n');
simpleSerials.forEach(analyzeSimple);
