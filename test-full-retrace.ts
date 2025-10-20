import { b85DecodeToHex, hexToBin, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Let me retrace the ENTIRE decode from the beginning:\n');

// We established:
// - Bits 10-23: Item type varbit5 = 321
// - Bits 29-48: Level marker + level varint5 = 28
// - Bits 49-58: Level value continuation

console.log('After level (bit 59):');
console.log('Reading fields section:\n');

// Field 1 (level): Already extracted as 28

// Field 2 (random seed):
// - Bits 59-67: Field ID varbit5 = 2
console.log('Bits 59-67: Field ID');
const fieldId = decodeVarbit5(binary, 59);
console.log(`  Value: ${fieldId?.value}, ends at bit ${59 + (fieldId?.bitsRead || 0)}`);

// - Bits 68-70: "001" marker
console.log(`Bits 68-70: ${binary.slice(68, 71)} (should be 001)`);

// - Bits 71-73: Major type
console.log(`Bits 71-73: ${binary.slice(71, 74)} (major type, should be 100)`);

// - Bits 74+: Random seed value
console.log('Bits 74+: Random seed value');
const randomSeed = decodeVarint5(binary, 74);
console.log(`  Value: ${randomSeed?.value}, ends at bit ${74 + (randomSeed?.bitsRead || 0)}`);

const afterRandomSeed = 74 + (randomSeed?.bitsRead || 0);
console.log(`\nAfter random seed: bit ${afterRandomSeed}\n`);

// Check for more fields
console.log(`Bits ${afterRandomSeed}-${afterRandomSeed + 2}: ${binary.slice(afterRandomSeed, afterRandomSeed + 3)}`);

if (binary.slice(afterRandomSeed, afterRandomSeed + 3) === '000') {
  console.log('  -> End of fields (major 000)\n');
  
  const partsStart = afterRandomSeed + 3;
  console.log(`Parts section starts at bit ${partsStart}`);
  console.log(`Bits ${partsStart}-${partsStart + 20}: ${binary.slice(partsStart, partsStart + 21)}`);
  
  // Try decoding from here
  console.log('\nDecoding from parts start:\n');
  let offset = partsStart;
  
  for (let i = 0; i < 15; i++) {
    const val = decodeVarint5(binary, offset);
    if (!val) break;
    console.log(`[${i}] Bit ${offset}-${offset + val.bitsRead - 1}: varint5(${val.value})`);
    offset += val.bitsRead;
    
    if (offset > partsStart + 100) break;
  }
}
