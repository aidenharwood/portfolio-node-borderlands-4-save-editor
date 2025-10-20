import { b85DecodeToHex, hexToBin } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const hex = b85DecodeToHex(serial);
const binary = hexToBin(hex!);

console.log('Analyzing bits 89-120 in detail:\n');

for (let i = 89; i <= 105; i++) {
  const next3 = binary.slice(i, i + 3);
  const next5 = binary.slice(i, i + 5);
  const next8 = binary.slice(i, i + 8);
  
  console.log(`Bit ${i}:`);
  console.log(`  3 bits: ${next3}`);
  console.log(`  5 bits: ${next5} = ${parseInt(next5, 2)}`);
  console.log(`  8 bits: ${next8} = ${parseInt(next8, 2)}`);
  console.log();
}

// Now let's check the actual byte layout
console.log('\n=== Byte View Starting at Bit 88 (byte 11) ===\n');
const startByte = Math.floor(89 / 8);
for (let byteIdx = startByte; byteIdx < startByte + 5; byteIdx++) {
  const bitStart = byteIdx * 8;
  const byteBits = binary.slice(bitStart, bitStart + 8);
  console.log(`Byte ${byteIdx} (bits ${bitStart}-${bitStart+7}): ${byteBits} = 0x${parseInt(byteBits, 2).toString(16).padStart(2, '0')}`);
}
