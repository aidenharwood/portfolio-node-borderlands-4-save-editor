import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder.ts';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Expected: {7} {10} {246:22} {237:9} {246:[51 3]} {6}');
console.log('Parts: 7 (no), 10 (no), 246 (yes-single), 237 (yes-single), 246 (yes-array), 6 (no)\n');

// Hypothesis: bits 89-95 encode which parts have chunks
console.log('Bits 89-95: ' + binary.slice(89, 96));
console.log('  89-91: 000 (end of fields)');
console.log('  92-95: 0101\n');

// If bits 92-95 or a larger range encode chunk flags:
// Expected flags: 0, 0, 1, 1, 1, 0 (for 6 parts)
// That's binary: 000110 or 011000 (depending on order)

console.log('Expected chunk flags (LSB first): 0, 0, 1, 1, 1, 0 = 011100');
console.log('Expected chunk flags (MSB first): 0, 0, 1, 1, 1, 0 = 001110');
console.log();

// Let me search for this pattern
const searchPattern1 = '011100';
const searchPattern2 = '001110';
const idx1 = binary.indexOf(searchPattern1);
const idx2 = binary.indexOf(searchPattern2);

console.log(`Pattern 011100 at bit: ${idx1}`);
console.log(`Pattern 001110 at bit: ${idx2}`);
console.log();

// Actually, wait - maybe the flags also encode array vs single?
// 00 = no chunks
// 01 = single chunk
// 10 = array of chunks

// So for 6 parts: 00, 00, 01, 01, 10, 00
// That's: 00 00 01 01 10 00 = 000001011000 (12 bits)

console.log('Expected with 2-bit flags: 00, 00, 01, 01, 10, 00 = 000001011000');
console.log('Or reversed: 00 10 01 01 00 00 = 001001010000');
console.log();

const pattern2bit = '000001011000';
const idx2bit = binary.indexOf(pattern2bit);
console.log(`Pattern at bit: ${idx2bit}`);

// Let me also just manually look at a wider range
console.log('\nBits 89-115:');
console.log(binary.slice(89, 115));

// Break it down
console.log('\nFormatted:');
for (let i = 89; i < 115; i += 6) {
  console.log(`  ${i}-${i+5}: ${binary.slice(i, i+6)}`);
}
