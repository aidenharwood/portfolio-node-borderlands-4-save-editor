/**
 * Analyze the exact bit structure against the README
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';

const { data } = bitPackDecode(serial, true);

// Convert to full bit string (LSB first)
let bitString = '';
for (let i = 0; i < Math.min(data.length, 20); i++) {
  const byte = data[i];
  for (let bit = 0; bit < 8; bit++) {
    bitString += (byte >>> bit) & 1;
  }
}

console.log('First 160 bits (LSB-first within each byte):');
for (let i = 0; i < Math.min(160, bitString.length); i += 10) {
  const bits = bitString.substring(i, i + 10);
  const offset = i.toString().padStart(4, ' ');
  console.log(`${offset}: ${bits}`);
}

console.log('');
console.log('Analysis:');
console.log('');

// According to README: "Observed: serials always starts with this static prefix: `001 0000`"
console.log('README says static prefix is: 001 0000');
console.log('Our first 7 bits are:        ', bitString.substring(0, 7));
console.log('');

// Let me check what pattern we actually have
console.log('Checking different interpretations:');
console.log('Bits 0-2:   ', bitString.substring(0, 3), '(should be 001 if major type)');
console.log('Bits 3-6:   ', bitString.substring(3, 7), '(should be 0000 if static)');
console.log('Bits 0-6:   ', bitString.substring(0, 7), '(full 7-bit prefix)');
console.log('');

console.log('Trying to find item type 269 = 0b100001101:');
console.log('269 in binary: 100001101 (9 bits)');
console.log('269 as nibbles: [13, 1, 0, 0] = [1101, 0001, 0000, 0000]');
console.log('');

// Let's try to manually find where 269 might be encoded
console.log('Looking for patterns in bit stream:');
for (let offset = 0; offset < 50; offset++) {
  const bits = bitString.substring(offset, offset + 9);
  const value = parseInt(bits, 2);
  if (value === 269) {
    console.log(`Found 269 at bit offset ${offset}: ${bits}`);
  }
}

// Try reversed
for (let offset = 0; offset < 50; offset++) {
  const bits = bitString.substring(offset, offset + 9).split('').reverse().join('');
  const value = parseInt(bits, 2);
  if (value === 269) {
    console.log(`Found 269 (reversed) at bit offset ${offset}`);
  }
}

console.log('');
console.log('Let me try decoding assuming the prefix is actually at bit 0:');
console.log('Bit 0-2 (major type?): ', bitString.substring(0, 3), '=', parseInt(bitString.substring(0, 3), 2));
console.log('Bit 3-6 (struct ID?):  ', bitString.substring(3, 7), '=', parseInt(bitString.substring(3, 7), 2));
console.log('Bit 7-9 (next major):  ', bitString.substring(7, 10), '=', parseInt(bitString.substring(7, 10), 2));
