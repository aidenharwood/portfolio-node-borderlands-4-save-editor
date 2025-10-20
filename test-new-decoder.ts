/**
 * Test the new serial decoder against known reference serials
 */

import { decodeSerial } from './src/lib/serial-decoder';

// Test serials from the user request
const testCases = [
  {
    serial: '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss',
    expected: '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|'
  },
  {
    serial: '@Ugd77*Fg_4rx=zp;RG}I*T&N7HBq}9pC29=n4yqJt7iug5',
    expected: '7, 0, 1, 30| 2, 2477|| {19} {2} {6} {1:11} {18} {66} {68} {69} {17} {27} {34} {45} {81}|'
  },
  {
    serial: '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
    expected: '20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|'
  }
];

console.log('Testing new decoder...\n');

for (const test of testCases) {
  console.log('Serial:', test.serial);
  console.log('Expected:', test.expected);
  
  try {
    const decoded = decodeSerial(test.serial);
    console.log('Decoded: ', decoded.raw);
    console.log('Match:   ', decoded.raw === test.expected ? '✓ PASS' : '✗ FAIL');
    console.log('');
    console.log('Details:');
    console.log('  Item Type:', decoded.itemType);
    console.log('  Version:', decoded.version);
    console.log('  Fields:', decoded.fields);
    console.log('  Parts:', decoded.parts);
    console.log('  Varbits:', decoded.varbits.length, 'entries');
    console.log('');
  } catch (error) {
    console.log('ERROR:', error);
    console.log('');
  }
  
  console.log('---\n');
}
