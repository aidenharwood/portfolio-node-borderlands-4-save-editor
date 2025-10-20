/**
 * Manual implementation following the README example EXACTLY
 * From: https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md
 * 
 * The README shows this example for a level 50 item:
 * 
 * "Step 4: the level bits are right after the marker
 * 00100001101001010111000101100000000110010000011000100111000001001001001100100000010
 *                              --------------------LLLLc
 *        continuation bit=1, we must read 5 more bits -|
 * 
 * Step 5: continuation bit was 1, we must continue
 * 00100001101001010111000101100000000110010000011000100111000001001001001100100000010
 *                              -------------------------LLLLc
 *                      continuation bit=0, we done reading -|
 * 
 * Step 4: assemble the data
 * LLLLc LLLc: 01001 11000
 * 
 * Step 5: discard the continuation bit, we don't need them anymore
 * LLLL  LLLL: 0100  1100
 * 
 * Step 6: reverse the string:
 * 01001100 => 00110010
 * 
 * Step 7: binary to decimal
 * 00110010 => 50
 * "
 */

import { bitPackDecode } from './src/lib/utils/serial-utils';

const serial = '@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss';
const expectedLevel = 28;

const { data } = bitPackDecode(serial, true);

// Convert to bit string
let bitString = '';
for (let i = 0; i < data.length; i++) {
  const byte = data[i];
  for (let bit = 0; bit < 8; bit++) {
    bitString += (byte >>> bit) & 1;
  }
}

console.log('Serial:', serial);
console.log('Expected level:', expectedLevel);
console.log('');

// According to README: "the level bits seems always positioned after a specific bit pattern: `00000011001000001100`"
const marker = '00000011001000001100';
const markerIndex = bitString.indexOf(marker);

console.log('Looking for marker:', marker);
console.log('Found at bit index:', markerIndex);

if (markerIndex >= 0) {
  console.log('');
  console.log('Reading level after marker:');
  
  let bitOffset = markerIndex + marker.length;
  
  // Read first block of 5 bits
  const block1 = bitString.substring(bitOffset, bitOffset + 5);
  console.log(`Block 1: ${block1}`);
  const continue1 = parseInt(block1[4]);
  const nibble1 = block1.substring(0, 4);
  console.log(`  Continue bit: ${continue1}, Data nibble: ${nibble1}`);
  
  bitOffset += 5;
  
  if (continue1 === 1) {
    const block2 = bitString.substring(bitOffset, bitOffset + 5);
    console.log(`Block 2: ${block2}`);
    const continue2 = parseInt(block2[4]);
    const nibble2 = block2.substring(0, 4);
    console.log(`  Continue bit: ${continue2}, Data nibble: ${nibble2}`);
    
    // Assemble nibbles
    const assembled = nibble1 + nibble2;
    console.log(`Assembled nibbles: ${assembled}`);
    
    // Reverse
    const reversed = assembled.split('').reverse().join('');
    console.log(`Reversed: ${reversed}`);
    
    // Convert to decimal
    const level = parseInt(reversed, 2);
    console.log(`Level: ${level}`);
  } else {
    // Only one block
    const reversed = nibble1.split('').reverse().join('');
    const level = parseInt(reversed, 2);
    console.log(`Level (single block): ${level}`);
  }
}
