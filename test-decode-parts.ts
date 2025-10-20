import { b85DecodeToHex, hexToBin, itemDecodeLevel, readMajorType, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('=== Decoding Parts Section Starting at Bit 98 ===\n');

let offset = 98;
console.log(`Bit ${offset}-${offset+2}: ${binary.slice(offset, offset + 3)} (major type)`);
offset += 3;

console.log(`Bit ${offset}+: Reading varint5...`);
const countResult = decodeVarint5(binary, offset);
console.log(`  Count: ${countResult?.value}`);
offset += countResult!.bitsRead;

console.log(`\n=== Reading ${countResult?.value} Parts ===\n`);

const parts: any[] = [];

for (let i = 0; i < countResult!.value; i++) {
  console.log(`--- Part ${i + 1} ---`);
  console.log(`  Offset: ${offset}`);
  
  const partIdMajor = binary.slice(offset, offset + 3);
  console.log(`  Major type: ${partIdMajor}`);
  offset += 3;
  
  let partIdResult: any;
  if (partIdMajor === '100') {
    partIdResult = decodeVarint5(binary, offset);
  } else if (partIdMajor === '110') {
    partIdResult = decodeVarbit5(binary, offset);
  }
  
  console.log(`  Part ID: ${partIdResult?.value}`);
  offset += partIdResult!.bitsRead;
  
  // Check for chunks
  const chunkMajor = binary.slice(offset, offset + 3);
  console.log(`  Next major: ${chunkMajor}`);
  
  if (chunkMajor === '100' || chunkMajor === '110') {
    offset += 3;
    
    let chunkCountResult: any;
    if (chunkMajor === '100') {
      chunkCountResult = decodeVarint5(binary, offset);
    } else {
      chunkCountResult = decodeVarbit5(binary, offset);
    }
    
    console.log(`  Chunk count: ${chunkCountResult?.value}`);
    offset += chunkCountResult!.bitsRead;
    
    const chunks: number[] = [];
    for (let j = 0; j < chunkCountResult!.value; j++) {
      const chunkValueMajor = binary.slice(offset, offset + 3);
      offset += 3;
      
      let chunkValueResult: any;
      if (chunkValueMajor === '100') {
        chunkValueResult = decodeVarint5(binary, offset);
      } else if (chunkValueMajor === '110') {
        chunkValueResult = decodeVarbit5(binary, offset);
      }
      
      console.log(`    Chunk ${j + 1}: ${chunkValueResult?.value}`);
      chunks.push(chunkValueResult!.value);
      offset += chunkValueResult!.bitsRead;
    }
    
    parts.push({ id: partIdResult!.value, chunks });
  } else {
    console.log(`  No chunks`);
    parts.push({ id: partIdResult!.value });
  }
  
  console.log();
}

console.log('=== Final Result ===');
console.log('Parts decoded:', parts.length);
console.log('Parts:', JSON.stringify(parts, null, 2));
console.log();
console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}');
console.log('Got:');
const formatted = parts.map(p => {
  if (p.chunks) {
    if (p.chunks.length === 1) {
      return `{${p.id}:${p.chunks[0]}}`;
    } else {
      return `{${p.id}:[${p.chunks.join(' ')}]}`;
    }
  }
  return `{${p.id}}`;
}).join(' ');
console.log(formatted);
