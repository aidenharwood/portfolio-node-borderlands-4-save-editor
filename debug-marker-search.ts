/**
 * The marker from README doesn't match. Let's try different interpretations
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';

const { data } = bitPackDecode(serial, true);

// Convert to bit string
let bitString = '';
for (let i = 0; i < data.length; i++) {
  const byte = data[i];
  for (let bit = 0; bit < 8; bit++) {
    bitString += (byte >>> bit) & 1;
  }
}

console.log('First 100 bits:');
console.log(bitString.substring(0, 100));
console.log('');

const marker = '00000011001000001100';
console.log('Looking for marker (as-is):', marker);
console.log('Found:', bitString.indexOf(marker) >= 0 ? 'YES' : 'NO');

const markerReversed = marker.split('').reverse().join('');
console.log('Looking for marker (reversed):', markerReversed);
console.log('Found:', bitString.indexOf(markerReversed) >= 0 ? 'YES' : 'NO');

// Maybe it's MSB-first representation in the README?
// Let's try converting the marker to what it would be if bytes were MSB-first
// marker = 00000011001000001100
// Split into groups: 00000011 | 00100000 | 1100
// Reverse each byte: 11000000 | 00000100 | 0011 
// Result: 110000000000010000011

const markerMSB = '110000000000010000011000';
console.log('Looking for marker (bytes MSB-first):', markerMSB);
const idx = bitString.indexOf(markerMSB);
console.log('Found:', idx >= 0 ? `YES at ${idx}` : 'NO');

// What if we just search for smaller patterns?
console.log('');
console.log('Searching for partial patterns:');

const patterns = [
  '0000001100',
  '1000001100',
  '0110010000',
  '0011001000'
];

for (const pattern of patterns) {
  const idx = bitString.indexOf(pattern);
  if (idx >= 0) {
    console.log(`  Found "${pattern}" at bit ${idx}`);
  }
}

// Let's also look at the actual byte boundaries
console.log('');
console.log('First 10 bytes as bits (showing byte boundaries):');
for (let i = 0; i < 10; i++) {
  const byte = data[i];
  let bits = '';
  for (let bit = 0; bit < 8; bit++) {
    bits += (byte >>> bit) & 1;
  }
  console.log(`Byte ${i}: ${bits} (0x${byte.toString(16).padStart(2, '0')})`);
}
