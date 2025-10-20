import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// What if there's a count before the parts?
// Bits 89-95 = 0000101 = 5
// Let's check bit 89 onwards

console.log('Checking for parts count:');
for (let start = 89; start <= 95; start++) {
  const result = decodeVarint5(binary, start);
  if (result) {
    console.log(`  Varint5 at bit ${start}: ${result.value} (${result.bitsRead} bits)`);
    if (result.value === 6) {
      console.log(`    ^^ THIS IS THE COUNT!`);
      console.log(`    Parts would start at bit ${start + result.bitsRead}`);
    }
  }
}

// Let's also check if part 246 appears anywhere
// 246 in varint5 would be encoded as... let me calculate:
// 246 = 11110110 in binary
// varint5: 5 bits at a time, LSB first, continuation bit
// 246 / 16 = 15 remainder 6
// So: [0110 1] [1111 0] = 01101 11110
console.log('\n246 in varint5 encoding:');
console.log('  246 % 16 = 6, 246 / 16 = 15');
console.log('  Block 0: 0110 + continuation 1 = 01101');
console.log('  Block 1: 1111 + continuation 0 = 11110');
console.log('  Full encoding: 01101 11110 (10 bits)');

// Search for this pattern
const pattern = '0110111110';
const idx = binary.indexOf(pattern);
console.log(`\nSearching for 246 pattern (${pattern}):`, idx >= 0 ? `Found at bit ${idx}` : 'Not found');

if (idx >= 0) {
  console.log(`Context: ...${binary.slice(idx - 10, idx)}[${pattern}]${binary.slice(idx + 10, idx + 20)}...`);
}

// Let's try 237 too
// 237 = 11101101
// 237 % 16 = 13, 237 / 16 = 14
// Block 0: 1101 + 1 = 11011
// Block 1: 1110 + 0 = 11100
const pattern237 = '1101111100';
const idx237 = binary.indexOf(pattern237);
console.log(`\nSearching for 237 pattern (${pattern237}):`, idx237 >= 0 ? `Found at bit ${idx237}` : 'Not found');

if (idx237 >= 0) {
  console.log(`Context: ...${binary.slice(idx237 - 10, idx237)}[${pattern237}]${binary.slice(idx237 + 10, idx237 + 20)}...`);
}
