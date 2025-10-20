import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Hypothesis: 00 and 01 = no chunks, 10 = single, 11 = array
// But skip the flag for no-chunk parts?

console.log('What if parts without chunks have NO flag?\n');

let offset = 96;
const parts: any[] = [];

for (let i = 0; i < 20 && offset < 250; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`[${i}] ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  // Check next 2 bits
  const next2 = binary.slice(offset, offset + 2);
  console.log(`    Next 2 bits: ${next2}`);
  
  // If it looks like a varint5 start (check if next 5 bits decode to something reasonable)
  const peekNext = decodeVarint5(binary, offset);
  console.log(`    Peek as varint5: ${peekNext?.value}`);
  
  // Expected next IDs: after 7 comes 10, after 10 comes 246, etc.
  const expectedNext = [10, 246, 22, 237, 9, 246, 51, 3, 6];
  if (expectedNext.includes(peekNext?.value || -1)) {
    console.log(`    -> Looks like next part ID! No chunks for ${idResult.value}`);
    parts.push({ id: idResult.value });
  } else {
    console.log(`    -> Might be a flag or chunk`);
    // Try reading as flag
    offset += 2;
    
    if (next2 === '10') {
      const val = decodeVarint5(binary, offset);
      console.log(`      Single chunk: ${val?.value}`);
      parts.push({ id: idResult.value, chunks: [val?.value] });
      if (val) offset += val.bitsRead;
    } else if (next2 === '11') {
      const count = decodeVarint5(binary, offset);
      console.log(`      Array count: ${count?.value}`);
      if (count) {
        offset += count.bitsRead;
        const chunks: number[] = [];
        for (let j = 0; j < count.value; j++) {
          const val = decodeVarint5(binary, offset);
          console.log(`        [${j}]: ${val?.value}`);
          if (val) {
            chunks.push(val.value);
            offset += val.bitsRead;
          }
        }
        parts.push({ id: idResult.value, chunks });
      }
    }
  }
  console.log();
  
  if (parts.length >= 6) break;
}

console.log('\n\nFinal parts:');
parts.forEach(p => {
  if (!p.chunks) {
    console.log(`{${p.id}}`);
  } else if (p.chunks.length === 1) {
    console.log(`{${p.id}:${p.chunks[0]}}`);
  } else {
    console.log(`{${p.id}:[${p.chunks.join(' ')}]}`);
  }
});
