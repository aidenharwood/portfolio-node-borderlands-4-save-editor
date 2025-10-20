import { b85DecodeToHex, hexToBin, decodeVarint5, readMajorType } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// We know bit 96-100 decode to varint5(7)
// And bit 101-105 decode to varint5(10)

// So maybe:
// Bit 89-91: 000 (end of fields)
// Bit 92-94: 010 (parts section marker?)
// Bit 95: ???
// Bit 96-100: varint5(7)
// Bit 101-105: varint5(10)

// What if parts don't have major types before the IDs?
// And bit 95 is just a single-bit flag or part of some other structure?

console.log('Bits 89-95:', binary.slice(89, 96));
console.log('  89-91: 000');
console.log('  92-94: 010');
console.log('  95: ' + binary[95]);
console.log();

// What if the structure is:
// - 000 = end of fields
// - 010 = parts section start  
// - 1/0 = has more parts?
// - Then just varint5 IDs without major types?

console.log('Hypothesis: Parts are just varint5 IDs without major types\n');

let offset = 96;
const parts: any[] = [];

// Expected: 7, 10, 246, 22, 237, 9, 246, [51, 3], 6
// So 6 part IDs: 7, 10, 246, 237, 246, 6
// And chunks interspersed: after 246 comes 22, after 237 comes 9, after 246 comes [51, 3]

// How do we know if a varint5 is a part ID or a chunk?
// Maybe there's a flag AFTER each part ID indicating if it has chunks?

for (let i = 0; i < 20 && offset < 250; i++) {
  const result = decodeVarint5(binary, offset);
  if (!result) break;
  
  console.log(`[${i}] Bit ${offset}-${offset + result.bitsRead - 1}: varint5(${result.value})`);
  console.log(`     Next bit: ${binary[offset + result.bitsRead]}`);
  console.log(`     Next 2 bits: ${binary.slice(offset + result.bitsRead, offset + result.bitsRead + 2)}`);
  offset += result.bitsRead;
  
  if (i >= 12) break; // Stop after enough values
}
