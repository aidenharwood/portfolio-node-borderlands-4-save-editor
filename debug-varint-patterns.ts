/**
 * Try different decoding strategies
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';

const { data } = bitPackDecode(serial, true);

// Convert to full bit string (LSB first)
let bitString = '';
for (let i = 0; i < data.length; i++) {
  const byte = data[i];
  for (let bit = 0; bit < 8; bit++) {
    bitString += (byte >>> bit) & 1;
  }
}

console.log('Testing different starting offsets for varint5 decoding:');
console.log('');

function decodeVarint5FromOffset(bitString: string, startOffset: number): number {
  let bitOffset = startOffset;
  let value = 0;
  let shift = 0;
  
  console.log(`Starting at bit ${startOffset}:`);
  
  for (let block = 0; block < 4; block++) {
    const blockStr = bitString.substring(bitOffset, bitOffset + 5);
    if (blockStr.length < 5) break;
    
    const continueBit = parseInt(blockStr[0]);
    const dataNibble = parseInt(blockStr.substring(1), 2);
    
    console.log(`  Block ${block} @ ${bitOffset}: ${blockStr} -> continue=${continueBit}, nibble=${dataNibble.toString(2).padStart(4, '0')} (${dataNibble})`);
    
    value |= dataNibble << shift;
    shift += 4;
    bitOffset += 5;
    
    if (continueBit === 0) {
      console.log(`  Result: ${value}`);
      return value;
    }
  }
  
  console.log(`  Result (max blocks): ${value}`);
  return value;
}

// Try offset 0 (after no prefix)
console.log('=== Offset 0 (no prefix) ===');
decodeVarint5FromOffset(bitString, 0);
console.log('');

// Try offset 7 (after 7-bit prefix)
console.log('=== Offset 7 (after 001 0000 prefix) ===');
decodeVarint5FromOffset(bitString, 7);
console.log('');

// Try offset 10 (after 7-bit prefix + 3-bit major type)
console.log('=== Offset 10 (after prefix + major type 100) ===');
decodeVarint5FromOffset(bitString, 10);
console.log('');

// The README shows examples where level 30 = 0b11110 is encoded
// Let's see if we can find 28 (level from our test case)
console.log('Looking for level=28 in bit stream:');
console.log('28 in binary: ' + (28).toString(2).padStart(5, '0'));

// 28 would be encoded as varint5:
// 28 = 0x1C = 0b11100
// As nibbles: 1100 (12) and 0001 (1)
// As varint5: 1100 1 (continue) + 0001 0 (stop)
// Or: 11001 00010

for (let i = 0; i < 100; i++) {
  const pattern = bitString.substring(i, i + 10);
  if (pattern === '1100100010') {
    console.log(`Found varint5(28) pattern at bit ${i}`);
  }
}

console.log('');
console.log('Looking for 1611 (random seed):');
console.log('1611 = 0x64B = 0b11001001011');
// As nibbles: 1011 (11), 0100 (4), 0110 (6)
// As varint5: 1011 1 + 0100 1 + 0110 0
//            10111 01001 01100

for (let i = 0; i < 150; i++) {
  const pattern = bitString.substring(i, i + 15);
  if (pattern === '101110100101100') {
    console.log(`Found varint5(1611) pattern at bit ${i}`);
  }
}
