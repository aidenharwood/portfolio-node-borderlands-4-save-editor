const bin = '001000011010010100000101011000000001100100000110000111100000010001000011001011111011100100000101111000101010101001010101101111101011011000000010110111011101100100001010110111110001011001100111000100110000010101100010000000';

console.log('Field structure:');
console.log('Bits 59-67: Field ID (varbit5) = 2');
console.log('Bits 68-70:', bin.slice(68, 71), '(unknown)');
console.log('Bits 71-73:', bin.slice(71, 74), '(major type)');
console.log('Bits 74+: Field value');
console.log();

// Try as varint5 starting at bit 74
console.log('Trying varint5 decode starting at bit 74:');
let offset = 74;
let valueBits = '';
let blocks = 0;

while (offset < bin.length && blocks < 4) {
  const chunk = bin.slice(offset, offset + 5);
  const data = chunk.slice(0, 4);
  const cont = chunk[4];
  valueBits += data;
  blocks++;
  console.log(`  Block ${blocks}: ${chunk} (data=${data}, cont=${cont})`);
  offset += 5;
  if (cont === '0') break;
}

const reversed = valueBits.split('').reverse().join('');
const value = parseInt(reversed.padStart(16, '0'), 2);
console.log();
console.log('Value bits:', valueBits);
console.log('Reversed:', reversed);
console.log('Value:', value);
console.log('Expected:', 2493);
console.log('Match:', value === 2493 ? '✅' : '❌');
