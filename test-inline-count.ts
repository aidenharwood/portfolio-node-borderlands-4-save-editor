import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// We KNOW:
// - Bit 96-100: var int5(7) ✓
// - Bit 101-105: varint5(10) ✓  
// - Bit 118: starts 246

// So there's NO flag bit between 7 and 10!
// Maybe the flags are at the START, not interleaved?

console.log('Hypothesis: Flags are packed at the beginning\n');
console.log('Structure might be:');
console.log('  [count][flags bitfield][IDs and chunks...]');
console.log();

// If there are 6 parts, and 2 bits per flag (00=no, 10=single, 11=array)
// That's 12 bits of flags

// Or maybe 1 bit per part for "has chunks" (6 bits)
// Then another bit per part-with-chunks for "is array" (3 bits in this case)

// Let's look at bits before the first ID (96)
console.log('Bits 89-95 (before first ID):');
for (let i = 89; i < 96; i++) {
  console.log(`  Bit ${i}: ${binary[i]}`);
}
console.log();

// 89-91: 000 (end of fields)
// 92: 0
// 93: 1
// 94: 0
// 95: 1

// What if bits 92-95 are NOT a count, but a different structure?
// Or what if the count is encoded differently?

console.log('Alternative: What if parts have NO flags, and chunks immediately follow IDs?');
console.log('And we determine "is this a chunk or next part ID" by context?\n');

// Expected values in order: 7 (ID), 10 (ID), 246 (ID), 22 (chunk), 237 (ID), 9 (chunk), 246 (ID), 51 (chunk), 3 (chunk), 6 (ID)

// How would we know 22 is a chunk and not an ID?
// Maybe there's a parts COUNT, and after reading N IDs, everything else is chunks?

// But that doesn't work because chunks are per-part...

console.log('Let me try: each part is [ID][chunk_count as varint5][chunks...]\n');

let offset = 96;
const parts: any[] = [];

for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  // Try reading chunk count
  const countResult = decodeVarint5(binary, offset);
  console.log(`  Next varint5: ${countResult?.value} at bits ${offset}-${offset + (countResult?.bitsRead || 0) - 1}`);
  
  // If it's 0, no chunks. If > 0, read that many chunks
  if (countResult && countResult.value === 0) {
    console.log(`  -> No chunks`);
    offset += countResult.bitsRead;
    parts.push({ id: idResult.value });
  } else if (countResult && countResult.value > 0 && countResult.value < 10) {
    // Probably a chunk count
    console.log(`  -> ${countResult.value} chunks`);
    offset += countResult.bitsRead;
    const chunks: number[] = [];
    for (let j = 0; j < countResult.value; j++) {
      const chunk = decodeVarint5(binary, offset);
      console.log(`    Chunk[${j}]: ${chunk?.value}`);
      if (chunk) {
        chunks.push(chunk.value);
        offset += chunk.bitsRead;
      }
    }
    parts.push({ id: idResult.value, chunks });
  } else {
    console.log(`  -> Treating ${countResult?.value} as next part ID, this part has no chunks`);
    parts.push({ id: idResult.value });
  }
  console.log();
}

console.log('\nDecoded:');
parts.forEach(p => {
  if (!p.chunks) {
    console.log(`{${p.id}}`);
  } else if (p.chunks.length === 1) {
    console.log(`{${p.id}:${p.chunks[0]}}`);
  } else {
    console.log(`{${p.id}:[${p.chunks.join(' ')}]}`);
  }
});
