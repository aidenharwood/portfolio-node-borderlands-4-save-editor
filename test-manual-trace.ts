import { b85DecodeToHex, hexToBin, decodeVarint5, readMajorType } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Random seed field ends at bit 89 (after reading varint5 from bit 74-88)
// According to code logic:
// - Bit 89-91: major type for PARTS COUNT (should be 100 or 110)
// - Then parts count value
// - Then for each part: major + ID + optional (major + chunk_count + chunks...)

console.log('Tracing from end of random seed:\n');

// We know random seed field:
// - Bit 59: Field ID 2 (varbit5, no major prefix)
// - Bit 68-70: "001" marker
// - Bit 71-73: Major "100"
// - Bit 74-88: Value 2493 (varint5)

console.log('After random seed (bit 89):');
const randomSeedEndsMajor = readMajorType(binary, 89);
console.log(`  Bits 89-91: ${randomSeedEndsMajor} (major type)`);

// If this is "000", it means end of fields
if (randomSeedEndsMajor === '000') {
  console.log('  -> End of fields marker\n');
  
  // Parts count should be next
  console.log('Parts count:');
  const partsCountMajor = readMajorType(binary, 92);
  console.log(`  Bits 92-94: ${partsCountMajor} (major type)`);
  
  if (partsCountMajor === '100') {
    const countResult = decodeVarint5(binary, 95);
    console.log(`  Bits 95-${95 + (countResult?.bitsRead || 0) - 1}: ${countResult?.value} (count)\n`);
    
    let offset = 95 + (countResult?.bitsRead || 0);
    
    // Now decode each part
    for (let i = 0; i < (countResult?.value || 0); i++) {
      console.log(`Part ${i}:`);
      const partMajor = readMajorType(binary, offset);
      console.log(`  Major at ${offset}: ${partMajor}`);
      offset += 3;
      
      if (partMajor === '100') {
        const idResult = decodeVarint5(binary, offset);
        console.log(`  ID: ${idResult?.value} (bits ${offset}-${offset + (idResult?.bitsRead || 0) - 1})`);
        offset += idResult?.bitsRead || 0;
        
        // Check for chunks
        const chunkCountMajor = readMajorType(binary, offset);
        console.log(`  Chunk count major at ${offset}: ${chunkCountMajor}`);
        
        if (chunkCountMajor === '100' || chunkCountMajor === '110') {
          offset += 3;
          const chunkCountResult = decodeVarint5(binary, offset);
          console.log(`    Chunk count: ${chunkCountResult?.value}`);
          offset += chunkCountResult?.bitsRead || 0;
          
          for (let j = 0; j < (chunkCountResult?.value || 0); j++) {
            const chunkMajor = readMajorType(binary, offset);
            offset += 3;
            const chunk = decodeVarint5(binary, offset);
            console.log(`      Chunk[${j}]: ${chunk?.value} (major ${chunkMajor})`);
            offset += chunk?.bitsRead || 0;
          }
        }
      }
      console.log();
    }
  }
}
