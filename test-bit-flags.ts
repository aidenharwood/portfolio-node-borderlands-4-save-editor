import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// New idea: What if after each part ID, there's a single BIT flag?
// 0 = no chunks, 1 = has chunks
// Then if has chunks, there's another flag: 0 = single, 1 = array?

console.log('Testing single-bit flags:\n');

let offset = 96;
for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  const hasChunks = binary[offset];
  console.log(`  Has chunks? ${hasChunks} (bit ${offset})`);
  offset++;
  
  if (hasChunks === '1') {
    const isArray = binary[offset];
    console.log(`  Is array? ${isArray} (bit ${offset})`);
    offset++;
    
    if (isArray === '1') {
      const count = decodeVarint5(binary, offset);
      console.log(`  Array count: ${count?.value}`);
      if (count) {
        offset += count.bitsRead;
        for (let j = 0; j < count.value; j++) {
          const val = decodeVarint5(binary, offset);
          console.log(`    [${j}]: ${val?.value}`);
          if (val) offset += val.bitsRead;
        }
      }
    } else {
      const val = decodeVarint5(binary, offset);
      console.log(`  Single chunk: ${val?.value}`);
      if (val) offset += val.bitsRead;
    }
  }
  console.log();
}
