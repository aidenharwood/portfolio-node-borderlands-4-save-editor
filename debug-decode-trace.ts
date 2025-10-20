/**
 * Deep debug - trace through the decoding step by step
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';
const expected = '269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|';

console.log('Serial:', serial);
console.log('Expected:', expected);
console.log('');

const { data } = bitPackDecode(serial, true);

console.log('First 10 bytes (hex):', Array.from(data.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('First 10 bytes (dec):', Array.from(data.slice(0, 10)).join(' '));
console.log('');

// Helper to read bits
function readBits(data: Uint8Array, bitOffset: number, bitCount: number): number {
  let result = 0;
  for (let i = 0; i < bitCount; i++) {
    const byteIndex = Math.floor((bitOffset + i) / 8);
    const bitIndex = (bitOffset + i) % 8;
    if (byteIndex >= data.length) break;
    const bit = (data[byteIndex] >>> bitIndex) & 1;
    result |= bit << i;
  }
  return result;
}

// Show bit stream
console.log('Bit stream analysis:');
console.log('');

// First 7 bits (static prefix)
const prefix = readBits(data, 0, 7);
console.log(`Bits 0-6 (prefix):    ${prefix.toString(2).padStart(7, '0')} = ${prefix} (expected: 0010000 = 16)`);

// Next 3 bits (major type for item type)
const itemTypeMajor = readBits(data, 7, 3);
console.log(`Bits 7-9 (major):     ${itemTypeMajor.toString(2).padStart(3, '0')} = ${itemTypeMajor} (varint5=100=4, varbit5=110=6)`);

if (itemTypeMajor === 4) { // varint5
  console.log('Decoding as Varint5...');
  
  let bitOffset = 10;
  let value = 0;
  let shift = 0;
  
  for (let block = 0; block < 4; block++) {
    const blockBits = readBits(data, bitOffset, 5);
    const continueBit = blockBits & 1;
    const dataNibble = (blockBits >>> 1) & 0xF;
    
    console.log(`  Block ${block}: bits ${bitOffset}-${bitOffset+4} = ${blockBits.toString(2).padStart(5, '0')} -> continue=${continueBit}, data=${dataNibble.toString(2).padStart(4, '0')} (${dataNibble})`);
    
    value |= dataNibble << shift;
    shift += 4;
    bitOffset += 5;
    
    console.log(`    Current value: ${value}`);
    
    if (continueBit === 0) {
      console.log(`    STOP (continue bit = 0)`);
      break;
    }
  }
  
  console.log(`  Final item type value: ${value} (expected: 269)`);
} else if (itemTypeMajor === 6) { // varbit5
  console.log('Decoding as Varbit5...');
  
  const lengthBits = readBits(data, 10, 5);
  console.log(`  Length bits: ${lengthBits.toString(2).padStart(5, '0')} = ${lengthBits}`);
  
  const value = readBits(data, 15, lengthBits);
  console.log(`  Value: ${value} (expected: 269)`);
}

console.log('');
console.log('Expected breakdown of 269:');
console.log('  269 in binary: ' + (269).toString(2));
console.log('  269 = 0x10D');
console.log('  As nibbles: 1101 (13) and 0001 (1)');
console.log('  As varint5: should be 1101 1 (block 1: continue) + 0001 0 (block 2: stop)');
console.log('  As varbit5 with length 9: should be 01001 (9) + 100001101 (269)');
