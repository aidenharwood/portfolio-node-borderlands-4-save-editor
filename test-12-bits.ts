import { b85DecodeToHex, hexToBin } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}');
console.log('Chunk types: none, none, single, single, array, none\n');

// We know:
// - Bits 96-100: varint5(7)
// - Bits 101-105: varint5(10)
// - Bits 106-117: ??? (12 bits)
// - Bits 118-127: varint5(246)

console.log('Bits 106-117 (12 bits between part 10 and part 246):');
const mystery = binary.slice(106, 118);
console.log(mystery);
console.log();

// If this is 2 bits per part for 6 parts = 12 bits
// And encoding is: 00=none, 01=single, 10=array

// Expected: 00 (7), 00 (10), 01 (246), 01 (237), 10 (246), 00 (6)
// = 00 00 01 01 10 00 = 000001011000

console.log('Expected if 2-bit encoding (00=none, 01=single, 10=array):');
console.log('  00 00 01 01 10 00 = 000001011000');
console.log('  Actual:             ' + mystery);
console.log('  Match:', mystery === '000001011000');
console.log();

// Or maybe it's reversed: 00 10 01 01 00 00 = 001001010000
console.log('Expected if reversed order:');
console.log('  00 10 01 01 00 00 = 001001010000');
console.log('  Actual:             ' + mystery);
console.log('  Match:', mystery === '001001010000');
console.log();

// Let's decode the actual bits
console.log('Bits 106-117 broken into pairs:');
for (let i = 0; i < 12; i += 2) {
  const pair = mystery.slice(i, i + 2);
  console.log(`  ${106 + i}-${106 + i + 1}: ${pair}`);
}
