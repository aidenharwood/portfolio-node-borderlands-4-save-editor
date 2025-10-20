import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected parts: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// We know:
// - 246 is at bit 118
// - 237 is at bit 168
// - Part sequence should be: 7, 10, 246, 237, 246, 6

// Let's decode backwards from bit 118
console.log('Working backwards from 246 at bit 118:\n');

// Try to find where 10 ends / 246 starts
// 10 in varint5: 01010 (5 bits)
// 7 in varint5: 01110 or... wait let me recalculate
// 7 in varint5: 0111 + 0 (no continuation) = 01110

// Search for 7 (01110) and 10 (01010)
console.log('7 in varint5: 01110');
console.log('10 in varint5: 01010');

// Let's decode from various starting points before 118
for (let start = 106; start <= 117; start++) {
  const r1 = decodeVarint5(binary, start);
  if (!r1) continue;
  
  const r2 = decodeVarint5(binary, start + r1.bitsRead);
  if (!r2) continue;
  
  const r3 = decodeVarint5(binary, start + r1.bitsRead + r2.bitsRead);
  if (!r3) continue;
  
  if (r1.value === 7 && r2.value === 10 && r3.value === 246) {
    console.log(`\n✓ Found sequence at bit ${start}!`);
    console.log(`  Part 1: 7 at bits ${start}-${start + r1.bitsRead - 1}`);
    console.log(`  Part 2: 10 at bits ${start + r1.bitsRead}-${start + r1.bitsRead + r2.bitsRead - 1}`);
    console.log(`  Part 3: 246 at bits ${start + r1.bitsRead + r2.bitsRead}-${start + r1.bitsRead + r2.bitsRead + r3.bitsRead - 1}`);
    
    // Now decode what comes after 246
    let offset = start + r1.bitsRead + r2.bitsRead + r3.bitsRead;
    console.log(`\n  After 246 (bit ${offset}):`);
    
    // 246 should have chunk 22
    const chunk = decodeVarint5(binary, offset);
    if (chunk) {
      console.log(`    Chunk: ${chunk.value} at bits ${offset}-${offset + chunk.bitsRead - 1}`);
      offset += chunk.bitsRead;
    }
    
    // Next should be 237
    const p4 = decodeVarint5(binary, offset);
    if (p4) {
      console.log(`  Part 4: ${p4.value} at bits ${offset}-${offset + p4.bitsRead - 1}`);
      offset += p4.bitsRead;
      
      // 237 should have chunk 9
      const chunk2 = decodeVarint5(binary, offset);
      if (chunk2) {
        console.log(`    Chunk: ${chunk2.value} at bits ${offset}-${offset + chunk2.bitsRead - 1}`);
        offset += chunk2.bitsRead;
      }
    }
    
    // Next should be 246 again
    const p5 = decodeVarint5(binary, offset);
    if (p5) {
      console.log(`  Part 5: ${p5.value} at bits ${offset}-${offset + p5.bitsRead - 1}`);
      offset += p5.bitsRead;
      
      // 246 should have chunks [51, 3]
      // How do we know it's an array? Maybe there's a marker?
      console.log(`    Next bits: ${binary.slice(offset, offset + 20)}`);
      const next3 = binary.slice(offset, offset + 3);
      console.log(`    Next 3 bits: ${next3} (major type?)`);
    }
  }
}
