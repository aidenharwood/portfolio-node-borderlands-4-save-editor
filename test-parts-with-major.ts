import { b85DecodeToHex, hexToBin, decodeVarint5, readMajorType } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Parts start at bit 96 (first part ID = 7)
// Each part: varint5 ID, then check NEXT bits for major type
console.log('Decoding parts starting at bit 96:\n');
let offset = 96;
const parts: any[] = [];

for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bit ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  // Now check major type for chunks
  const majorBits = binary.slice(offset, offset + 3);
  console.log(`  Next 3 bits at ${offset}: ${majorBits}`);
  
  if (majorBits === '100') { // varint5 - single chunk
    console.log(`  -> Single chunk (major 100)`);
    offset += 3;
    const chunk = decodeVarint5(binary, offset);
    if (!chunk) break;
    console.log(`     Chunk value: ${chunk.value} (bits ${offset}-${offset + chunk.bitsRead - 1})`);
    offset += chunk.bitsRead;
    parts.push({ id: idResult.value, chunks: [chunk.value] });
  } else if (majorBits === '001') { // array marker
    console.log(`  -> Array of chunks (major 001)`);
    offset += 3;
    const countResult = decodeVarint5(binary, offset);
    if (!countResult) break;
    console.log(`     Count: ${countResult.value} (bits ${offset}-${offset + countResult.bitsRead - 1})`);
    offset += countResult.bitsRead;
    
    const chunks: number[] = [];
    for (let j = 0; j < countResult.value; j++) {
      const chunkResult = decodeVarint5(binary, offset);
      if (!chunkResult) break;
      console.log(`     Chunk[${j}]: ${chunkResult.value} (bits ${offset}-${offset + chunkResult.bitsRead - 1})`);
      chunks.push(chunkResult.value);
      offset += chunkResult.bitsRead;
    }
    parts.push({ id: idResult.value, chunks });
  } else if (majorBits === '000') { // end/no chunks
    console.log(`  -> No chunks (major 000)`);
    // DON'T skip the 000 - it might be the next part's ID!
    // Actually wait - if it's 000, what does that mean?
    // Let's try NOT advancing offset
    parts.push({ id: idResult.value });
  } else {
    console.log(`  -> Unknown major ${majorBits}, assuming no chunks`);
    parts.push({ id: idResult.value });
  }
  
  console.log();
}

console.log('Final offset:', offset);
console.log('\nDecoded parts:');
parts.forEach(p => {
  if (!p.chunks) {
    console.log(`{${p.id}}`);
  } else if (p.chunks.length === 1) {
    console.log(`{${p.id}:${p.chunks[0]}}`);
  } else {
    console.log(`{${p.id}:[${p.chunks.join(' ')}]}`);
  }
});
