import { decodeSerial, b85DecodeToHex, hexToBin } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const expected = '321, 0, 1, 28| 2, 2493|| {7} {10} {246:22} {237:9} {246:[51 3]} {6}|';

console.log('Serial:', serial);
console.log('Expected:', expected);
console.log();

// Step 1: Decode to hex
const hex = b85DecodeToHex(serial);
console.log('Hex:', hex);
console.log();

// Step 2: Convert to binary
const binary = hexToBin(hex!);
console.log('Binary length:', binary.length, 'bits');
console.log('First 200 bits:', binary.slice(0, 200));
console.log();

// Step 3: Decode using our function
const decoded = decodeSerial(serial);
console.log('Decoded:', JSON.stringify(decoded, null, 2));
console.log();

// Let's manually parse to understand the structure
console.log('=== Manual Analysis ===');
let offset = 0;

// Prefix (7 bits)
console.log(`Bits 0-6: ${binary.slice(0, 7)} (prefix)`);
offset = 7;

// Item type major (3 bits)
const itemTypeMajor = binary.slice(7, 10);
console.log(`Bits 7-9: ${itemTypeMajor} (item type major)`);
offset = 10;

// Let's decode varint5 manually
function decodeVarint5Manual(bin: string, start: number) {
  let valueBits = '';
  let pos = start;
  let blocks = 0;
  
  while (pos < bin.length) {
    const block = bin.slice(pos, pos + 5);
    if (block.length < 5) break;
    
    valueBits += block.slice(0, 4); // Data bits
    blocks++;
    
    const continueBit = block[4];
    pos += 5;
    
    if (continueBit === '0') break;
    if (blocks >= 4) break; // Max 4 blocks
  }
  
  // Reverse bits (LSB-first)
  const reversed = valueBits.split('').reverse().join('');
  const value = parseInt(reversed.padStart(16, '0'), 2);
  
  return { value, bitsRead: blocks * 5, valueBits, reversed, blocks };
}

// Varbit5 decoder
function decodeVarbit5Manual(bin: string, start: number) {
  // First 5 bits: length (LSB-first)
  const lengthBits = bin.slice(start, start + 5);
  const lengthReversed = lengthBits.split('').reverse().join('');
  const length = parseInt(lengthReversed, 2);
  
  // Next N bits: payload (LSB-first)
  const payloadBits = bin.slice(start + 5, start + 5 + length);
  const payloadReversed = payloadBits.split('').reverse().join('');
  const value = parseInt(payloadReversed, 2);
  
  return { value, bitsRead: 5 + length, lengthBits, payloadBits, length };
}

// Item type (check major type to decide varint5 or varbit5)
let itemTypeResult: any;
if (itemTypeMajor === '100') {
  itemTypeResult = decodeVarint5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + itemTypeResult.bitsRead - 1}: Item type = ${itemTypeResult.value} (varint5, ${itemTypeResult.blocks} blocks)`);
} else if (itemTypeMajor === '110') {
  itemTypeResult = decodeVarbit5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + itemTypeResult.bitsRead - 1}: Item type = ${itemTypeResult.value} (varbit5, ${itemTypeResult.length} bits)`);
}
if (itemTypeResult) offset += itemTypeResult.bitsRead;

// Version major (3 bits)
const versionMajor = binary.slice(offset, offset + 3);
console.log(`Bits ${offset}-${offset + 2}: ${versionMajor} (version major)`);
offset += 3;

// Version
let versionResult: any;
if (versionMajor === '100') {
  versionResult = decodeVarint5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + versionResult.bitsRead - 1}: Version = ${versionResult.value} (varint5, ${versionResult.blocks} blocks)`);
} else if (versionMajor === '110') {
  versionResult = decodeVarbit5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + versionResult.bitsRead - 1}: Version = ${versionResult.value} (varbit5, ${versionResult.length} bits)`);
}
if (versionResult) offset += versionResult.bitsRead;

// Level marker (20 bits)
const levelMarker = '00000011001000001100';
const markerPos = binary.indexOf(levelMarker, offset);
console.log(`\nLevel marker found at bit ${markerPos}`);
offset = markerPos + 20;

// Level
const levelResult = decodeVarint5Manual(binary, offset);
console.log(`Bits ${offset}-${offset + levelResult.bitsRead - 1}: Level = ${levelResult.value} (${levelResult.blocks} blocks)`);
offset += levelResult.bitsRead;

// Random seed major (3 bits)
const seedMajor = binary.slice(offset, offset + 3);
console.log(`Bits ${offset}-${offset + 2}: ${seedMajor} (random seed major)`);
offset += 3;

// Random seed
let seedResult: any;
if (seedMajor === '100') {
  seedResult = decodeVarint5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + seedResult.bitsRead - 1}: Random seed = ${seedResult.value} (varint5, ${seedResult.blocks} blocks)`);
} else if (seedMajor === '110') {
  seedResult = decodeVarbit5Manual(binary, offset);
  console.log(`Bits ${offset}-${offset + seedResult.bitsRead - 1}: Random seed = ${seedResult.value} (varbit5, ${seedResult.length} bits)`);
}
if (seedResult) offset += seedResult.bitsRead;

console.log(`\n=== After fields, at bit ${offset} ===`);
console.log('Remaining bits:', binary.length - offset);
console.log('Next 100 bits:', binary.slice(offset, offset + 100));

// Now try to decode parts
console.log('\n=== Decoding Parts ===');

// Expected parts: {7} {10} {246:22} {237:9} {246:[51 3]} {6}
// That's 6 parts total

// Parts might start with a count or a marker
console.log('Next major type:', binary.slice(offset, offset + 3));

// Try reading as varint5 (could be part count)
if (binary.slice(offset, offset + 3) === '100') {
  offset += 3;
  const partCountResult = decodeVarint5Manual(binary, offset);
  console.log(`Part count: ${partCountResult.value} (${partCountResult.blocks} blocks)`);
  offset += partCountResult.bitsRead;
  
  // Now read each part
  for (let i = 0; i < partCountResult.value; i++) {
    console.log(`\n--- Part ${i + 1} ---`);
    console.log(`Offset: ${offset}`);
    console.log(`Next 3 bits (major): ${binary.slice(offset, offset + 3)}`);
    
    // Read part ID (major + varint5)
    const idMajor = binary.slice(offset, offset + 3);
    offset += 3;
    const idResult = decodeVarint5Manual(binary, offset);
    console.log(`Part ID: ${idResult.value} (${idResult.blocks} blocks)`);
    offset += idResult.bitsRead;
    
    // Check if there's a chunk count or direct chunks
    console.log(`Next 3 bits (chunk indicator?): ${binary.slice(offset, offset + 3)}`);
    const chunkMajor = binary.slice(offset, offset + 3);
    
    if (chunkMajor === '100') {
      // Has chunks
      offset += 3;
      const chunkCountResult = decodeVarint5Manual(binary, offset);
      console.log(`Chunk count: ${chunkCountResult.value} (${chunkCountResult.blocks} blocks)`);
      offset += chunkCountResult.bitsRead;
      
      // Read each chunk value
      for (let j = 0; j < chunkCountResult.value; j++) {
        const chunkValueMajor = binary.slice(offset, offset + 3);
        offset += 3;
        const chunkValueResult = decodeVarint5Manual(binary, offset);
        console.log(`  Chunk ${j + 1}: ${chunkValueResult.value}`);
        offset += chunkValueResult.bitsRead;
      }
    } else {
      console.log(`No chunks for this part`);
    }
  }
  
  console.log(`\nFinal offset: ${offset}`);
  console.log(`Bits remaining: ${binary.length - offset}`);
}
