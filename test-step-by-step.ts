import { b85DecodeToHex, hexToBin, itemDecodeLevel, readMajorType, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const expected = '321, 0, 1, 28| 2, 2493|| {7} {10} {246:22} {237:9} {246:[51 3]} {6}|';

console.log('Expected output has:');
console.log('  - Random seed: 2493');
console.log('  - 6 parts: 7, 10, 246 (with 1 chunk: 22), 237 (with 1 chunk: 9), 246 (with 2 chunks: 51, 3), 6');
console.log();

const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Binary length:', binary.length, 'bits');
console.log();

// Find level
const levelInfo = itemDecodeLevel(binary);
console.log('Level info:', levelInfo);
console.log();

// Check what's after level
let offset = levelInfo!.lastLevelBit;
console.log(`=== After level, at bit ${offset} ===`);
console.log('Next 50 bits:', binary.slice(offset, offset + 50));
console.log();

// Try to read random seed
console.log('Next major type (should be field ID or random seed):', binary.slice(offset, offset + 3));
let seedMajor = binary.slice(offset, offset + 3);

if (seedMajor === '001') {
  // Field ID marker - read field ID first
  offset += 3;
  const fieldIdMajor = binary.slice(offset, offset + 3);
  console.log('Field ID major type:', fieldIdMajor);
  offset += 3;
  
  let fieldIdResult: any = null;
  if (fieldIdMajor === '100') {
    fieldIdResult = decodeVarint5(binary, offset);
  } else if (fieldIdMajor === '110') {
    fieldIdResult = decodeVarbit5(binary, offset);
  }
  
  console.log('Field ID:', fieldIdResult);
  if (fieldIdResult) offset += fieldIdResult.bitsRead;
  
  // Now read the field value
  const fieldValueMajor = binary.slice(offset, offset + 3);
  console.log('Field value major type:', fieldValueMajor);
  offset += 3;
  
  let fieldValueResult: any = null;
  if (fieldValueMajor === '100') {
    fieldValueResult = decodeVarint5(binary, offset);
  } else if (fieldValueMajor === '110') {
    fieldValueResult = decodeVarbit5(binary, offset);
  }
  
  console.log('Field value (random seed):', fieldValueResult);
  if (fieldValueResult) offset += fieldValueResult.bitsRead;
} else if (seedMajor === '100') {
  offset += 3;
  const result = decodeVarint5(binary, offset);
  console.log('Random seed (varint5):', result);
  if (result) offset += result.bitsRead;
} else if (seedMajor === '110') {
  offset += 3;
  const result = decodeVarbit5(binary, offset);
  console.log('Random seed (varbit5):', result);
  if (result) offset += result.bitsRead;
} else {
  console.log('Unknown major type for random seed:', seedMajor);
}

console.log();
console.log(`=== After random seed, at bit ${offset} ===`);
console.log('Next 50 bits:', binary.slice(offset, offset + 50));
console.log();

// Try to read parts count
console.log('Next major type (should be parts count):', binary.slice(offset, offset + 3));
const partCountMajor = binary.slice(offset, offset + 3);

if (partCountMajor === '100') {
  offset += 3;
  const partCountResult = decodeVarint5(binary, offset);
  console.log('Parts count (varint5):', partCountResult);
  if (partCountResult) {
    offset += partCountResult.bitsRead;
    console.log(`Will read ${partCountResult.value} parts`);
  }
} else if (partCountMajor === '110') {
  offset += 3;
  const partCountResult = decodeVarbit5(binary, offset);
  console.log('Parts count (varbit5):', partCountResult);
  if (partCountResult) {
    offset += partCountResult.bitsRead;
    console.log(`Will read ${partCountResult.value} parts`);
  }
} else {
  console.log('Unknown major type for parts count:', partCountMajor);
}
