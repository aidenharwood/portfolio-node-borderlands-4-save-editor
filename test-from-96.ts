import { b85DecodeToHex, hexToBin, decodeVarint5, decodeVarbit5, readMajorType } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Testing from bit 96:\n');

let offset = 96;

// Major type 111 might mean something different
console.log(`Bit ${offset}-${offset+2}: ${binary.slice(offset, offset + 3)} (major type)`);

// What if 111 means "raw bits" or "skip"?
// Let's try treating it as a 5-bit value directly
const next5 = binary.slice(offset, offset + 5);
console.log(`5 bits at ${offset}: ${next5} = ${parseInt(next5, 2)}`);

// Or maybe parts section doesn't have a major type for the count?
// Let's try reading varint5 directly starting at bit 96
console.log('\nTrying varint5 starting at bit 96:');
const varint5From96 = decodeVarint5(binary, 96);
console.log('Result:', varint5From96);

// Try from 97
console.log('\nTrying varint5 starting at bit 97:');
const varint5From97 = decodeVarint5(binary, 97);
console.log('Result:', varint5From97);

// What about interpreting the bits 89-95 as some kind of separator?
console.log('\nBits 89-95:', binary.slice(89, 96));
console.log('As number:', parseInt(binary.slice(89, 96), 2));

// Let's try assuming parts start at bit 96 with major type 110 (varbit5)
console.log('\nTrying varbit5 starting at bit 99:');
const varbit5From99 = decodeVarbit5(binary, 99);
console.log('Result:', varbit5From99);

// Or maybe the count is embedded without major type?
// Expected: 6 parts
// 6 in binary: 110 (3 bits) or 0110 (4 bits) or 01100 (5 bits, varint5 encoding)
console.log('\nLooking for 6:');
console.log('  3 bits (110):', binary.slice(89, 120).indexOf('110'), '(not unique)');
console.log('  5 bits varint5 (01100):', binary.slice(89, 120).indexOf('01100'));

const idx = binary.slice(89).indexOf('01100');
if (idx >= 0) {
  const globalIdx = 89 + idx;
  console.log(`  Found at bit ${globalIdx}`);
  console.log(`  Context: ${binary.slice(globalIdx - 5, globalIdx)}[01100]${binary.slice(globalIdx + 5, globalIdx + 15)}`);
}
