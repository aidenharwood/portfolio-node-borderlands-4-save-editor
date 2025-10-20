import { b85DecodeToHex, hexToBin, itemDecodeLevel, readMajorType, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
// Expected parts: {7} {10} {246:22} {237:9} {246:[51 3]} {6}
// That's 6 parts: [7, 10, 246, 237, 246, 6]
// Part 246 appears twice - once with chunk 22, once with chunks [51, 3]

const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('=== Searching for Part Values in Binary ===\n');

// Helper to encode a number as varint5
function encodeVarint5(value: number): string {
  const bin = value.toString(2);
  const reversed = bin.split('').reverse().join('');
  const chunks: string[] = [];
  
  for (let i = 0; i < reversed.length; i += 4) {
    const chunk = reversed.slice(i, i + 4).padEnd(4, '0');
    const isLast = i + 4 >= reversed.length;
    chunks.push(chunk + (isLast ? '0' : '1'));
  }
  
  return chunks.join('');
}

// Helper to encode as varbit5
function encodeVarbit5(value: number): string {
  const bin = value.toString(2);
  const length = bin.length;
  const lengthBin = length.toString(2).split('').reverse().join('').padEnd(5, '0');
  const valueBin = bin.split('').reverse().join('');
  return lengthBin + valueBin;
}

const partValues = [7, 10, 246, 237, 246, 6];
const chunkValues = [22, 9, 51, 3];

console.log('Part IDs as varint5:');
partValues.forEach(v => {
  const encoded = encodeVarint5(v);
  console.log(`  ${v}: ${encoded} (${encoded.length} bits)`);
});

console.log('\nPart IDs as varbit5:');
partValues.forEach(v => {
  const encoded = encodeVarbit5(v);
  console.log(`  ${v}: ${encoded} (${encoded.length} bits)`);
});

console.log('\nChunk values as varint5:');
chunkValues.forEach(v => {
  const encoded = encodeVarint5(v);
  console.log(`  ${v}: ${encoded} (${encoded.length} bits)`);
});

console.log('\n=== Searching in Binary ===\n');

// Search for part count (6) at different offsets
console.log('Searching for part count (6):');
const count6Varint5 = encodeVarint5(6);
const count6Varbit5 = encodeVarbit5(6);
console.log(`  Varint5: ${count6Varint5}`);
console.log(`  Varbit5: ${count6Varbit5}`);

let idx = binary.indexOf(count6Varint5);
if (idx >= 0) {
  console.log(`  Found varint5(6) at bit ${idx}`);
  console.log(`  Context: ...${binary.slice(Math.max(0, idx - 10), idx)}[${count6Varint5}]${binary.slice(idx + count6Varint5.length, idx + count6Varint5.length + 20)}...`);
}

idx = binary.indexOf(count6Varbit5);
if (idx >= 0) {
  console.log(`  Found varbit5(6) at bit ${idx}`);
}

// Search for first part (7)
console.log('\nSearching for first part ID (7):');
const part7Varint5 = encodeVarint5(7);
const part7Varbit5 = encodeVarbit5(7);
console.log(`  Varint5: ${part7Varint5}`);
console.log(`  Varbit5: ${part7Varbit5}`);

idx = binary.indexOf(part7Varint5);
if (idx >= 0) {
  console.log(`  Found varint5(7) at bit ${idx}`);
  console.log(`  Before: ${binary.slice(Math.max(0, idx - 15), idx)}`);
  console.log(`  Match:  ${part7Varint5}`);
  console.log(`  After:  ${binary.slice(idx + part7Varint5.length, idx + part7Varint5.length + 20)}`);
}

// Try interpreting from bit 89 onwards with different strategies
console.log('\n=== Trying Different Strategies from Bit 89 ===\n');

let offset = 89;
console.log(`Starting at bit ${offset}:`);
console.log(`Next 60 bits: ${binary.slice(offset, offset + 60)}`);

// Strategy 1: Skip 000 marker, then read major type
console.log('\nStrategy 1: Skip 000 (3 bits), read next major + count');
offset = 92;
console.log(`  Bit ${offset}-${offset+2}: ${binary.slice(offset, offset + 3)} (major type?)`);

// Strategy 2: Skip 000 marker + some padding
console.log('\nStrategy 2: Skip to byte boundary');
const nextByteBoundary = Math.ceil(89 / 8) * 8;
console.log(`  Next byte boundary: bit ${nextByteBoundary}`);
console.log(`  Bits ${nextByteBoundary}-${nextByteBoundary+3}: ${binary.slice(nextByteBoundary, nextByteBoundary + 3)}`);

// Strategy 3: Skip 000 and try varbit5 for count
console.log('\nStrategy 3: Read varbit5 starting at bit 89 (treat 000 as length prefix)');
const varbit5FromBit89 = decodeVarbit5(binary, 89);
console.log(`  Result:`, varbit5FromBit89);

// Strategy 4: Read varint5 starting at different offsets
console.log('\nStrategy 4: Try reading varint5/varbit5 from different offsets:');
for (let testOffset = 89; testOffset <= 100; testOffset++) {
  const major = binary.slice(testOffset, testOffset + 3);
  if (major === '100') {
    const result = decodeVarint5(binary, testOffset + 3);
    if (result && result.value >= 1 && result.value <= 10) {
      console.log(`  ✓ Bit ${testOffset}: major=100, varint5=${result.value} (could be part count!)`);
    }
  } else if (major === '110') {
    const result = decodeVarbit5(binary, testOffset + 3);
    if (result && result.value >= 1 && result.value <= 10) {
      console.log(`  ✓ Bit ${testOffset}: major=110, varbit5=${result.value} (could be part count!)`);
    }
  }
}
