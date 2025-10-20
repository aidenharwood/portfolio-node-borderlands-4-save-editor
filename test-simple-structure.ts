import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Hypothesis: Maybe I had the varint5 decoding wrong!
// Let me check if bit 96 is PART of a varint5 that started earlier

console.log('Testing varint5 from various starts before 96:');
for (let start = 89; start <= 95; start++) {
  const r = decodeVarint5(binary, start);
  console.log(`  Bit ${start}: value=${r?.value}, bitsRead=${r?.bitsRead}, ends at bit ${start + (r?.bitsRead || 0)}`);
  
  if (start + (r?.bitsRead || 0) === 96) {
    console.log(`    ^^ This ends exactly at bit 96!`);
  }
  if (start + (r?.bitsRead || 0) === 101) {
    console.log(`    ^^ This ends exactly at bit 101 (start of part 10)!`);
  }
}

console.log('\n---\n');

// What if the structure is simpler than I thought?
// Maybe after "000" end-of-fields, the parts section is just:
// [varint5 count][for each: varint5 ID, varint5 chunk_count, chunks...]

console.log('Simple structure test: [count][ID][chunkCount][chunks...]...\n');

// Try reading count from bit 92
const countFrom92 = decodeVarint5(binary, 92);
console.log(`Count from bit 92: ${countFrom92?.value} (bits 92-${92 + (countFrom92?.bitsRead || 0) - 1})`);

if (countFrom92) {
  let offset = 92 + countFrom92.bitsRead;
  console.log(`Parts start at bit ${offset}\n`);
  
  for (let i = 0; i < countFrom92.value && i < 10; i++) {
    const id = decodeVarint5(binary, offset);
    console.log(`Part ${i}: ID=${id?.value} at bits ${offset}-${offset + (id?.bitsRead || 0) - 1}`);
    if (!id) break;
    offset += id.bitsRead;
    
    const chunkCount = decodeVarint5(binary, offset);
    console.log(`  Chunk count: ${chunkCount?.value} at bits ${offset}-${offset + (chunkCount?.bitsRead || 0) - 1}`);
    if (!chunkCount) break;
    offset += chunkCount.bitsRead;
    
    if (chunkCount.value > 0 && chunkCount.value < 100) {
      for (let j = 0; j < chunkCount.value; j++) {
        const chunk = decodeVarint5(binary, offset);
        console.log(`    Chunk[${j}]: ${chunk?.value}`);
        if (!chunk) break;
        offset += chunk.bitsRead;
      }
    }
    console.log();
  }
}
