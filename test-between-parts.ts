import { b85DecodeToHex, hexToBin } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}\n');

// We know:
// - Bit 96-100: 7
// - Bit 101-105: 10
// - Bit 118-127: 246

// What's between bit 106 and bit 118?
console.log('Bits 106-117:', binary.slice(106, 118));
console.log('As decimal:', parseInt(binary.slice(106, 118), 2));

// Maybe there's a "parts count" or "has chunks" marker?
// Let's see bits 106-117 in detail
for (let i = 106; i < 118; i++) {
  const bit = binary[i];
  const remaining = binary.slice(i, 118);
  console.log(`Bit ${i}: ${bit} | Remaining to 118: ${remaining} (${remaining.length} bits)`);
}

// Actually, let me check if {7} and {10} have "no chunks" markers
// Maybe after each part ID without chunks, there's a 000 or similar
console.log('\n\nAfter part 7 (bit 101):');
console.log('  3 bits:', binary.slice(101, 104));

console.log('\nAfter part 10 (bit 106):');
console.log('  3 bits:', binary.slice(106, 109));
console.log('  5 bits:', binary.slice(106, 111));

// What if parts with no chunks have major type 000 after them?
// And parts with chunks have major type 100 for single chunk?
if (binary.slice(101, 104) === '000') {
  console.log('\n  -> Bit 101-103 is 000, might mean "no chunks for part 7"');
  console.log('  -> Next part would start at bit 104');
  
  const nextBits = binary.slice(104, 109);
  console.log(`     Bits 104-108: ${nextBits} = ${parseInt(nextBits, 2)}`);
}
