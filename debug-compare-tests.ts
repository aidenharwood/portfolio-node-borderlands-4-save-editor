/**
 * Compare all three test cases to find common patterns
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const tests = [
  {
    serial: '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss',
    itemType: 269,
    level: 28,
    random: 1611
  },
  {
    serial: '@Ugd77*Fg_4rx=zp;RG}I*T&N7HBq}9pC29=n4yqJt7iug5',
    itemType: 7,
    level: 30,
    random: 2477
  },
  {
    serial: '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
    itemType: 20,
    level: 10,
    random: 3037
  }
];

for (const test of tests) {
  console.log('='.repeat(80));
  console.log(`Serial: ${test.serial.substring(0, 30)}...`);
  console.log(`Expected: itemType=${test.itemType}, level=${test.level}, random=${test.random}`);
  console.log('');
  
  const { data } = bitPackDecode(test.serial, true);
  
  console.log('First 16 bytes (hex):');
  console.log(Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('');
  
  console.log('First 16 bytes (decimal):');
  console.log(Array.from(data.slice(0, 16)).join(' '));
  console.log('');
  
  // Look for itemType in the data
  console.log(`ItemType ${test.itemType}:`);
  console.log(`  As single byte: ${test.itemType < 256 ? test.itemType : 'too large'}`);
  console.log(`  As 16-bit LE: [${test.itemType & 0xFF}, ${(test.itemType >> 8) & 0xFF}]`);
  
  // Check third character of serial (type identifier)
  const typeChar = test.serial[2];
  console.log(`  Serial type char: '${typeChar}' (all test cases have different type chars)`);
  console.log('');
}

console.log('='.repeat(80));
console.log('Observation: All three have different @U prefix characters:');
console.log('  Test 1: @Ugr$ (r)');
console.log('  Test 2: @Ugd7 (d)');
console.log('  Test 3: @UgwS (w - note: actually "wS" suggesting different encoding)');
console.log('');
console.log('The third character might encode something about the item type/category');
