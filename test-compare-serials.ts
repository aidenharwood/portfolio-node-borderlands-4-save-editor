import { b85DecodeToHex, hexToBin, decodeVarint5, decodeVarbit5 } from './src/lib/nicnl-decoder';

const serials = [
  '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05',
  '@Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq',
  '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW',
  '@UgdhV<Fme!Kpj6O0RG}8tsNq8CP&HAL`qWKS9n>FGAJi+<FH}zi',
  '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
];

function analyzeSerial(serial: string, index: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Serial ${index + 1}: ${serial}`);
  console.log('='.repeat(80));
  
  const hex = b85DecodeToHex(serial);
  const binary = hexToBin(hex!);
  
  if (!binary) {
    console.log('Failed to decode');
    return;
  }
  
  console.log(`Length: ${binary.length} bits (${Math.ceil(binary.length / 8)} bytes)`);
  
  // Find random seed field (field ID 2)
  let offset = 59; // Start after level
  let randomSeedEnd = -1;
  
  while (offset < binary.length - 20) {
    const fieldId = decodeVarbit5(binary, offset);
    if (!fieldId || fieldId.value === 0) break;
    
    offset += fieldId.bitsRead;
    
    // Check for "001" marker
    if (binary.slice(offset, offset + 3) === '001') {
      offset += 3;
      
      // Read field value
      const major = binary.slice(offset, offset + 3);
      offset += 3;
      
      if (major === '100') {
        const value = decodeVarint5(binary, offset);
        if (value) {
          console.log(`Field ${fieldId.value}: ${value.value}`);
          offset += value.bitsRead;
          
          if (fieldId.value === 2) {
            randomSeedEnd = offset;
          }
        }
      }
      
      // Check for end of fields
      if (binary.slice(offset, offset + 3) === '000') {
        console.log(`Fields end at bit ${offset}`);
        break;
      }
    } else {
      break;
    }
  }
  
  if (randomSeedEnd > 0 && binary.slice(randomSeedEnd, randomSeedEnd + 3) === '000') {
    const partsStart = randomSeedEnd + 3;
    console.log(`Parts section starts at bit ${partsStart}`);
    console.log(`\nBits ${partsStart}-${Math.min(partsStart + 60, binary.length)}:`);
    console.log(binary.slice(partsStart, Math.min(partsStart + 61, binary.length)));
    
    // Break into groups of 5
    console.log('\nFormatted (5-bit groups):');
    for (let i = partsStart; i < Math.min(partsStart + 60, binary.length); i += 5) {
      const bits = binary.slice(i, i + 5);
      const val = parseInt(bits + '0'.repeat(5 - bits.length), 2);
      console.log(`  ${i}-${Math.min(i + 4, binary.length - 1)}: ${bits.padEnd(5, ' ')} = ${val}`);
    }
    
    // Try decoding as sequential varint5
    console.log('\nFirst 10 varint5 values:');
    offset = partsStart;
    for (let i = 0; i < 10 && offset < binary.length - 5; i++) {
      const val = decodeVarint5(binary, offset);
      if (!val) break;
      console.log(`  [${i}] Bit ${offset}: ${val.value}`);
      offset += val.bitsRead;
    }
  }
}

console.log('Analyzing all serials for patterns...\n');
serials.forEach((serial, idx) => analyzeSerial(serial, idx));

console.log('\n\n' + '='.repeat(80));
console.log('COMPARISON');
console.log('='.repeat(80));
console.log('\nPlease manually test these serials at:');
console.log('https://borderlands4-deserializer.nicnl.com/');
console.log('\nThen compare the outputs with the binary patterns above.');
