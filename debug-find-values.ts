/**
 * Let's work backwards from the KNOWN deserialized format
 * and try to figure out where each piece is in the binary
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const testCases = [
  {
    serial: '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss',
    deserialized: '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|',
    itemType: 269,
    level: 28,
    random: 1611,
    parts: [5, 7, 243, 6, 243]
  }
];

for (const test of testCases) {
  console.log('Serial:', test.serial);
  console.log('Expected:', test.deserialized);
  console.log('');
  
  const { data } = bitPackDecode(test.serial, true);
  
  console.log('Binary data (first 20 bytes hex):');
  console.log(Array.from(data.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('');
  
  console.log('Looking for known values as raw bytes:');
  console.log(`Item type ${test.itemType} = 0x${test.itemType.toString(16)} = [${test.itemType & 0xFF}, ${(test.itemType >> 8) & 0xFF}]`);
  console.log(`Level ${test.level} = 0x${test.level.toString(16)}`);
  console.log(`Random ${test.random} = 0x${test.random.toString(16)} = [${test.random & 0xFF}, ${(test.random >> 8) & 0xFF}]`);
  console.log('');
  
  // Search for these values as little-endian 16-bit
  for (let i = 0; i < data.length - 1; i++) {
    const value = data[i] | (data[i + 1] << 8);
    if (value === test.itemType) {
      console.log(`Found itemType ${test.itemType} at byte offset ${i}`);
    }
    if (value === test.level) {
      console.log(`Found level ${test.level} at byte offset ${i}`);
    }
    if (value === test.random) {
      console.log(`Found random ${test.random} at byte offset ${i}`);
    }
  }
  
  // Maybe they're stored as single bytes?
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value === test.level) {
      console.log(`Found level ${test.level} as single byte at offset ${i}`);
    }
    if (value === (test.itemType & 0xFF)) {
      console.log(`Found itemType low byte ${test.itemType & 0xFF} at offset ${i}`);
    }
  }
}
