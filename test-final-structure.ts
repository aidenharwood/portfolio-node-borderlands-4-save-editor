import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');
console.log('Decoding with: [varint5 ID][1 bit: has chunks?]...\n');

let offset = 96;
const parts: any[] = [];

for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  const hasChunks = binary[offset];
  console.log(`  Has chunks: ${hasChunks} (bit ${offset})`);
  offset++;
  
  if (hasChunks === '1') {
    // Has chunks - but is it single or array?
    // Let's check the next bit too
    const isArray = binary[offset];
    console.log(`  Is array: ${isArray} (bit ${offset})`);
    offset++;
    
    if (isArray === '1') {
      // Array of chunks
      const countResult = decodeVarint5(binary, offset);
      console.log(`  Array count: ${countResult?.value}`);
      if (countResult) {
        offset += countResult.bitsRead;
        const chunks: number[] = [];
        for (let j = 0; j < countResult.value; j++) {
          const chunk = decodeVarint5(binary, offset);
          if (!chunk) break;
          console.log(`    Chunk[${j}]: ${chunk.value}`);
          chunks.push(chunk.value);
          offset += chunk.bitsRead;
        }
        parts.push({ id: idResult.value, chunks });
      }
    } else {
      // Single chunk
      const chunk = decodeVarint5(binary, offset);
      console.log(`  Single chunk: ${chunk?.value}`);
      if (chunk) {
        parts.push({ id: idResult.value, chunks: [chunk.value] });
        offset += chunk.bitsRead;
      }
    }
  } else {
    // No chunks
    parts.push({ id: idResult.value });
  }
  console.log();
}

console.log('\nFinal parts:');
parts.forEach(p => {
  if (!p.chunks) {
    console.log(`{${p.id}}`);
  } else if (p.chunks.length === 1) {
    console.log(`{${p.id}:${p.chunks[0]}}`);
  } else {
    console.log(`{${p.id}:[${p.chunks.join(' ')}]}`);
  }
});

console.log('\nExpected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}');
