/**
 * Debug script to analyze binary structure of known serials
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';
const expected = '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';

console.log('Serial:', serial);
console.log('Expected:', expected);
console.log('');

const { data } = bitPackDecode(serial, true);

console.log('Binary data (hex):', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Binary data (dec):', Array.from(data).join(' '));
console.log('Total bytes:', data.length);
console.log('');

// Convert to binary string
let binaryString = '';
for (let i = 0; i < data.length; i++) {
  const byte = data[i];
  for (let bit = 0; bit < 8; bit++) {
    binaryString += (byte >>> bit) & 1;
  }
}

console.log('Binary string (LSB first):');
for (let i = 0; i < Math.min(binaryString.length, 200); i += 10) {
  const offset = i.toString().padStart(4, ' ');
  const bits = binaryString.substring(i, i + 10);
  console.log(`${offset}: ${bits}`);
}

console.log('');
console.log('Looking for patterns:');
console.log('- Item type 269 in binary: 0b' + (269).toString(2));
console.log('- Level 28 in binary: 0b' + (28).toString(2));
console.log('- Random 1611 in binary: 0b' + (1611).toString(2));
console.log('');

// Try to parse varint5 manually
console.log('Trying to parse as varint5 encoding:');
console.log('');

// According to README, format should be:
// itemType, version, field_id, field_value, field_id, field_value...
// 269, 0, 1, 28| 2, 1611||
// 
// And from discord: "1" is identifier that level follows, "2" is identifier that random follows

console.log('First 50 bytes in binary (grouped by byte):');
for (let i = 0; i < Math.min(data.length, 50); i++) {
  const byte = data[i];
  let bits = '';
  for (let bit = 0; bit < 8; bit++) {
    bits += (byte >>> bit) & 1;
  }
  console.log(`Byte ${i.toString().padStart(2)}: ${bits} (${byte.toString().padStart(3)}) 0x${byte.toString(16).padStart(2, '0')}`);
}
