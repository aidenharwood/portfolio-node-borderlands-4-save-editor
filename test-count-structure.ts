import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected 6 parts: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Bits 89-95: 0000101
console.log('Bits 89-95: ' + binary.slice(89, 96));
console.log('  As 7-bit number:', parseInt(binary.slice(89, 96), 2)); // = 5
console.log('  Last 5 bits (90-94):', binary.slice(90, 95)); // = 00101 = 5
console.log('  Last 5 bits (91-95):', binary.slice(91, 96)); // = 00101 + 1 = 0010 + 11 = ???
console.log();

// What if:
// - Bit 89-91: 000 (end of fields)
// - Bit 92-96: varint5 parts count?

const partsCountAttempt = decodeVarint5(binary, 92);
console.log('Varint5 starting at bit 92:', partsCountAttempt);
console.log();

// Or bits 90-94 as a 5-bit raw number = 5?
const raw5 = parseInt(binary.slice(90, 95), 2);
console.log('Bits 90-94 as raw 5-bit number:', raw5);
console.log();

// The count is 6, not 5. So maybe it's raw + 1?
if (raw5 === 5) {
  console.log('✓ Bits 90-94 = 5, and we expect 6 parts. Maybe it\'s raw value + 1?\n');
}

// Let me try decoding with:
// - Bits 89-91: 000 end of fields
// - Bits 90-94: 5-bit raw parts count (add 1)
// - Bit 95: skip?
// - Bits 96+: parts

console.log('Testing structure: 000 + [5-bit count] + padding? + parts\n');
console.log('Parts count (bits 90-94): 00101 = 5, actual count = 6\n');

let offset = 95;
console.log(`Starting parts decode at bit ${offset}:\n`);
console.log(`Bit ${offset}: ${binary[offset]}`); // The "1" bit

// What if bit 95 is just alignment/padding?
offset = 96;

for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  const hasChunks = binary[offset];
  console.log(`  Has chunks: ${hasChunks} (bit ${offset})`);
  offset++;
  
  if (hasChunks === '1') {
    const isArray = binary[offset];
    console.log(`  Is array: ${isArray} (bit ${offset})`);
    offset++;
    
    if (isArray === '1') {
      const countResult = decodeVarint5(binary, offset);
      console.log(`  Array count: ${countResult?.value}`);
      if (countResult) {
        offset += countResult.bitsRead;
        for (let j = 0; j < countResult.value; j++) {
          const chunk = decodeVarint5(binary, offset);
          console.log(`    Chunk[${j}]: ${chunk?.value}`);
          if (chunk) offset += chunk.bitsRead;
        }
      }
    } else {
      const chunk = decodeVarint5(binary, offset);
      console.log(`  Single chunk: ${chunk?.value}`);
      if (chunk) offset += chunk.bitsRead;
    }
  }
  console.log();
}
