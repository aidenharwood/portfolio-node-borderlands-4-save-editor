import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

// Let's verify the varint5 encoding
console.log('Varint5 encoding check:\n');

// We found that bit 96 decodes to 7
const r96 = decodeVarint5(binary, 96);
console.log(`Bit 96: value=${r96?.value}, bitsRead=${r96?.bitsRead}`);
console.log(`  Bits: ${binary.slice(96, 96 + (r96?.bitsRead || 5))}`);

// And we know 246 is at bit 118
console.log(`\nBit 118 should be 246:`);
const r118 = decodeVarint5(binary, 118);
console.log(`  value=${r118?.value}, bitsRead=${r118?.bitsRead}`);
console.log(`  Bits: ${binary.slice(118, 118 + (r118?.bitsRead || 10))}`);

// Let's decode from 96 onwards without assuming structure
console.log('\n\nDecoding sequential varint5 from bit 96:');
let offset = 96;
const values: number[] = [];
for (let i = 0; i < 20 && offset < 200; i++) {
  const r = decodeVarint5(binary, offset);
  if (!r) {
    console.log(`  [${i}] Bit ${offset}: FAILED`);
    break;
  }
  console.log(`  [${i}] Bit ${offset}-${offset + r.bitsRead - 1}: ${r.value} (${binary.slice(offset, offset + r.bitsRead)})`);
  values.push(r.value);
  offset += r.bitsRead;
}

console.log('\nValues:', values);
console.log('\nExpected: 7, 10, 246, 22, 237, 9, 246, ...');
