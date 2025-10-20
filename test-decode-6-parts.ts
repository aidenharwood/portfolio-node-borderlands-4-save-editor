import { b85DecodeToHex, hexToBin, decodeVarint5, readMajorType } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Based on previous test, parts start at bit 96
// But first we need the count. Where is it?
// Bits 89-95 = 0000101 = 5... not 6
// Maybe count is at a different location

// Let me try the Nicnl pattern: after fields end marker (000), there's:
// - Some marker/padding
// - Parts count
// - Parts data

console.log('Bits 89-120:');
for (let i = 89; i < 120; i += 5) {
  const bits = binary.slice(i, i + 5);
  const val = parseInt(bits, 2);
  console.log(`  ${i}-${i+4}: ${bits} = ${val}`);
}

// Let's try decoding parts starting at 96, reading 6 parts
console.log('\n\nDecoding 6 parts starting at bit 96:');
let offset = 96;
const parts: any[] = [];

for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  console.log(`Part ${i}: ID=${idResult.value} at bit ${offset}`);
  offset += idResult.bitsRead;
  
  // Check for chunks - look for major type after ID
  const major = readMajorType(binary, offset);
  console.log(`  Major type at ${offset}: ${major}`);
  
  if (major === '100') { // varint5 - single chunk
    offset += 3;
    const chunk = decodeVarint5(binary, offset);
    console.log(`  Single chunk: ${chunk.value}`);
    offset += chunk.bitsRead;
    parts.push({ id: idResult.value, chunks: [chunk.value] });
  } else if (major === '001') { // array of chunks
    offset += 3;
    const countResult = decodeVarint5(binary, offset);
    console.log(`  Chunk count: ${countResult.value}`);
    offset += countResult.bitsRead;
    
    const chunks: number[] = [];
    for (let j = 0; j < countResult.value; j++) {
      const chunkResult = decodeVarint5(binary, offset);
      console.log(`    Chunk[${j}]: ${chunkResult.value}`);
      chunks.push(chunkResult.value);
      offset += chunkResult.bitsRead;
    }
    parts.push({ id: idResult.value, chunks });
  } else if (major === '000') { // no chunks
    offset += 3;
    parts.push({ id: idResult.value });
  } else {
    console.log(`  Unknown major type ${major} - treating as no chunks`);
    parts.push({ id: idResult.value });
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
