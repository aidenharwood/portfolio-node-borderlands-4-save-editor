import { b85DecodeToHex, hexToBin, decodeVarint5, readMajorType } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// New hypothesis: major type 010 might mean "inline array without count"
// or it could mean "parts section starts here"

console.log('Testing if major 010 indicates "parts section":');
console.log('Bits 89-91: 000 (end of fields)');
console.log('Bits 92-94: 010 (parts section marker?)\n');

// If 010 means "start of parts", then parts start at bit 95
// And maybe there's NO explicit count, just decode until you hit a terminator

let offset = 95;
const parts: any[] = [];

console.log('Decoding parts from bit 95:\n');

for (let i = 0; i < 10 && offset < 250; i++) {
  const major = readMajorType(binary, offset);
  console.log(`[${i}] Bit ${offset}: major=${major}`);
  
  if (major === '000') {
    console.log('  -> End of parts\n');
    break;
  }
  
  offset += 3;
  
  if (major === '100') {
    const idResult = decodeVarint5(binary, offset);
    console.log(`  Part ID: ${idResult?.value} (bits ${offset}-${offset + (idResult?.bitsRead || 0) - 1})`);
    offset += idResult?.bitsRead || 0;
    
    // Check for chunks
    const chunkMajor = readMajorType(binary, offset);
    console.log(`  Chunk major at ${offset}: ${chunkMajor}`);
    
    if (chunkMajor === '100') {
      offset += 3;
      const chunkCountResult = decodeVarint5(binary, offset);
      console.log(`    Chunk count: ${chunkCountResult?.value}`);
      offset += chunkCountResult?.bitsRead || 0;
      
      const chunks: number[] = [];
      for (let j = 0; j < (chunkCountResult?.value || 0); j++) {
        const cMajor = readMajorType(binary, offset);
        offset += 3;
        const chunk = decodeVarint5(binary, offset);
        console.log(`      Chunk[${j}]: ${chunk?.value} (major ${cMajor})`);
        chunks.push(chunk?.value || 0);
        offset += chunk?.bitsRead || 0;
      }
      parts.push({ id: idResult?.value, chunks });
    } else if (chunkMajor === '000') {
      console.log('    No chunks (major 000)');
      parts.push({ id: idResult?.value });
    } else {
      console.log(`    Unknown chunk major ${chunkMajor}`);
      parts.push({ id: idResult?.value });
    }
  }
  console.log();
}

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
