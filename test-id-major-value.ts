import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// New hypothesis: What if the structure is:
// - Major type 111 or similar indicating "parts section"
// - Count (6 parts)
// - Then for each part:
//   - Part ID (varint5)  
//   - Chunks indicator: major type 000 = no chunks, 100 = single chunk, 001 = array
//   - If chunks, the chunk values

// Let's look at bits 89-96 again (before part 7 starts at 96)
console.log('Bits 89-95 (before parts):');
console.log(binary.slice(89, 96), '=', parseInt(binary.slice(89, 96), 2));

// What if bits 89-91 are major type "000" = end of fields
// And bits 92-96 are a count?
console.log('\nBits 89-91:', binary.slice(89, 92), '(major type?)');
console.log('Bits 92-96:', binary.slice(92, 96), '=', parseInt(binary.slice(92, 96), 2));

// Or maybe it's:
// Bits 89-91: major type
// Bits 92-96: 5-bit count = 01111 = 15? No...

// Let me try: maybe there's NO count, and we just decode until we hit a terminator
// Let's try decoding from 96 with structure: ID, major, value/nothing

console.log('\n\nHypothesis: Parts are [ID][major][value?]...');
console.log('Decoding:\n');

let offset = 96;
for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}:`);
  console.log(`  ID: ${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  const major = binary.slice(offset, offset + 3);
  console.log(`  Major at ${offset}: ${major}`);
  
  // Don't advance offset yet - let's see ALL the patterns first
  offset += 3;
  
  if (major === '100') {
    const val = decodeVarint5(binary, offset);
    console.log(`    Value: ${val?.value} (bits ${offset}-${offset + (val?.bitsRead || 0) - 1})`);
    if (val) offset += val.bitsRead;
  } else if (major === '001') {
    const count = decodeVarint5(binary, offset);
    console.log(`    Array count: ${count?.value}`);
    if (count) {
      offset += count.bitsRead;
      for (let j = 0; j < count.value; j++) {
        const val = decodeVarint5(binary, offset);
        console.log(`      [${j}]: ${val?.value}`);
        if (val) offset += val.bitsRead;
      }
    }
  } else if (major === '000') {
    console.log(`    No chunks`);
  }
  console.log();
}
