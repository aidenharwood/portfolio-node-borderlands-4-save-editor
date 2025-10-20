import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// Testing 2-bit flags: 00=no chunks, 10=single, 11=array?

console.log('Testing 2-bit flags:\n');

let offset = 96;
for (let i = 0; i < 6; i++) {
  const idResult = decodeVarint5(binary, offset);
  if (!idResult) break;
  
  console.log(`Part ${i}: ID=${idResult.value} at bits ${offset}-${offset + idResult.bitsRead - 1}`);
  offset += idResult.bitsRead;
  
  const flag = binary.slice(offset, offset + 2);
  console.log(`  Flag: ${flag} (bits ${offset}-${offset + 1})`);
  offset += 2;
  
  if (flag === '10') {
    const val = decodeVarint5(binary, offset);
    console.log(`  Single chunk: ${val?.value}`);
    if (val) offset += val.bitsRead;
  } else if (flag === '11') {
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
  } else if (flag === '00') {
    console.log(`  No chunks`);
  } else {
    console.log(`  Unknown flag 01`);
  }
  console.log();
}
