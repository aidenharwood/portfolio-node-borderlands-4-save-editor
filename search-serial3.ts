import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

const serial3 = '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW';
const partIds = [95, 2, 7, 61, 13, 29, 44, 50, 51];

const hex = b85DecodeToHex(serial3);
const binary = hexToBin(hex!);

if (binary) {
  console.log(`Looking for part IDs: ${partIds.join(', ')}\n`);
  
  // Search for ANY of the part IDs in the first 100 bits after parts start
  const partsStart = 93;
  
  for (const partId of partIds) {
    console.log(`Searching for ${partId}:`);
    for (let offset = partsStart; offset < partsStart + 100; offset++) {
      const val = decodeVarint5(binary, offset);
      if (val?.value === partId) {
        console.log(`  ✓ Found at bit ${offset} (offset ${offset - partsStart})`);
        break;
      }
    }
  }
  
  // Show bits 93-150 in detail
  console.log(`\n\nBits 93-150:`);
  console.log(binary.slice(93, 151));
  
  console.log(`\nFormatted (10-bit groups):`);
  for (let i = 93; i < 150; i += 10) {
    console.log(`  ${i}: ${binary.slice(i, i + 10)}`);
  }
  
  // Manually calculate what 95 would be in varint5
  console.log(`\n\n95 in varint5:`);
  console.log(`  95 = 64 + 31 = 0x5F`);
  console.log(`  95 / 16 = 5 remainder 15`);
  console.log(`  Block 0: 1111 + continuation 1 = 11111`);
  console.log(`  Block 1: 0101 + continuation 0 = 01010`);
  console.log(`  Full: 11111 01010 (10 bits)`);
  
  const pattern95 = '1111101010';
  const idx95 = binary.indexOf(pattern95);
  console.log(`\nSearching for pattern "${pattern95}":`, idx95 >= 0 ? `Found at bit ${idx95}` : 'Not found');
  
  if (idx95 >= 0) {
    console.log(`  That's ${idx95 - 93} bits after parts start (bit 93)`);
    console.log(`  Context: ...${binary.slice(idx95 - 5, idx95)}[${pattern95}]${binary.slice(idx95 + 10, idx95 + 15)}...`);
  }
}
