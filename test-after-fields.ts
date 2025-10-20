import { b85DecodeToHex, hexToBin, itemDecodeLevel, readMajorType, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';

const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);
const levelInfo = itemDecodeLevel(binary);

console.log('After level, at bit', levelInfo!.lastLevelBit);

// Decode field ID 2 (random seed)
let offset = levelInfo!.lastLevelBit;

// Field ID (varbit5)
const fieldIdResult = decodeVarbit5(binary, offset);
console.log('Field ID:', fieldIdResult);
offset += fieldIdResult!.bitsRead;

// "001" marker
console.log('Marker:', binary.slice(offset, offset + 3));
offset += 3;

// Field value major
console.log('Field value major:', binary.slice(offset, offset + 3));
offset += 3;

// Field value
const fieldValueResult = decodeVarint5(binary, offset);
console.log('Field value (random seed):', fieldValueResult);
offset += fieldValueResult!.bitsRead;

console.log('\n=== After random seed field, at bit', offset, '===');
console.log('Remaining bits:', binary.length - offset);
console.log('Next 50 bits:', binary.slice(offset, offset + 50));
console.log();

// Check if there are more fields
console.log('Trying to read next field ID (varbit5):');
const nextFieldIdResult = decodeVarbit5(binary, offset);
console.log('Next field ID result:', nextFieldIdResult);

if (nextFieldIdResult && nextFieldIdResult.value !== 0) {
  console.log('-> Found another field, ID:', nextFieldIdResult.value);
} else {
  console.log('-> No more fields');
}

// Check for parts section
console.log('\nChecking for parts section:');
console.log('Next major type:', binary.slice(offset, offset + 3));

const partCountMajor = readMajorType(binary, offset);
if (partCountMajor === '100') {
  console.log('-> Major type is 100 (varint5)');
  offset += 3;
  const partCountResult = decodeVarint5(binary, offset);
  console.log('Part count:', partCountResult);
} else if (partCountMajor === '110') {
  console.log('-> Major type is 110 (varbit5)');
  offset += 3;
  const partCountResult = decodeVarbit5(binary, offset);
  console.log('Part count:', partCountResult);
} else {
  console.log('-> Unknown major type:', partCountMajor);
}
