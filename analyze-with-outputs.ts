import { b85DecodeToHex, hexToBin, decodeVarint5 } from './src/lib/nicnl-decoder';

// PASTE NICNL OUTPUTS HERE:
const nicnlResults = [
  {
    serial: '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05',
    output: '321, 0, 1, 28| 2, 2493|| {7} {10} {246:22} {237:9} {246:[51 3]} {6}|'
  },
  {
    serial: '@Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq',
    output: '273, 0, 1, 30| 2, 98|| {38} {14} {15} {16} {17} {19} {37} {244:1}|'
  },
  {
    serial: '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW',
    output: '2, 0, 1, 2| 2, 2534|| {95} {2} {7} {61} {13} {29} {44} {50} {51}|'
  },
  {
    serial: '@UgdhV<Fme!Kpj6O0RG}8tsNq8CP&HAL`qWKS9n>FGAJi+<FH}zi',
    output: 'PASTE_HERE'
  },
  {
    serial: '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
    output: '20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|'
  },
];

function parseParts(partsStr: string) {
  const parts: Array<{id: number, chunks?: number[], type: 'none' | 'single' | 'array'}> = [];
  const matches = partsStr.match(/\{([^}]+)\}/g);
  
  if (!matches) return parts;
  
  for (const match of matches) {
    const content = match.slice(1, -1); // Remove { }
    
    if (content.includes('[')) {
      // Array: {246:[51 3]}
      const [idStr, arrayStr] = content.split(':[');
      const id = parseInt(idStr);
      const chunks = arrayStr.slice(0, -1).split(' ').map(Number);
      parts.push({ id, chunks, type: 'array' });
    } else if (content.includes(':')) {
      // Single: {246:22}
      const [idStr, chunkStr] = content.split(':');
      const id = parseInt(idStr);
      const chunk = parseInt(chunkStr);
      parts.push({ id, chunks: [chunk], type: 'single' });
    } else {
      // No chunks: {7}
      const id = parseInt(content);
      parts.push({ id, type: 'none' });
    }
  }
  
  return parts;
}

function analyzeWithOutput(serial: string, output: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Serial: ${serial}`);
  console.log(`Output: ${output}`);
  console.log('='.repeat(80));
  
  if (output === 'PASTE_HERE') {
    console.log('⚠️  No output provided yet\n');
    return;
  }
  
  const sections = output.split('||');
  const partsSection = sections[sections.length - 1] || ''; // Last section has parts
  const parts = parseParts(partsSection);
  
  console.log(`\nParts (${parts.length} total):`);
  parts.forEach((part, idx) => {
    const chunkInfo = part.type === 'none' ? 'no chunks' : 
                      part.type === 'single' ? `single chunk: ${part.chunks![0]}` :
                      `array chunks: [${part.chunks!.join(', ')}]`;
    console.log(`  [${idx}] ID ${part.id}: ${chunkInfo}`);
  });
  
  // Binary analysis
  const hex = b85DecodeToHex(serial);
  const binary = hexToBin(hex!);
  
  if (!binary) return;
  
  // Find parts start (after fields end marker 000)
  let partsStart = -1;
  for (let i = 80; i < 100 && i < binary.length - 3; i++) {
    if (binary.slice(i, i + 3) === '000') {
      partsStart = i + 3;
      break;
    }
  }
  
  if (partsStart < 0) {
    console.log('\n⚠️  Could not find parts section start');
    return;
  }
  
  console.log(`\nBinary Analysis:`);
  console.log(`  Parts start at bit ${partsStart}`);
  
  // Calculate expected encoding overhead
  // 2-bit flags per part would need: partCount * 2 bits
  const flagBits2 = parts.length * 2;
  console.log(`  If 2-bit flags: ${flagBits2} bits metadata`);
  
  // Show the metadata region
  console.log(`\n  Bits ${partsStart}-${partsStart + flagBits2 + 5}:`);
  console.log(`  ${binary.slice(partsStart, partsStart + flagBits2 + 6)}`);
  
  // Expected 2-bit encoding
  const expected2bit = parts.map(p => 
    p.type === 'none' ? '00' : p.type === 'single' ? '01' : '10'
  ).join('');
  console.log(`\n  Expected 2-bit flags: ${expected2bit}`);
  console.log(`  Actual:               ${binary.slice(partsStart, partsStart + flagBits2)}`);
  console.log(`  Match: ${binary.slice(partsStart, partsStart + flagBits2) === expected2bit ? '✓' : '✗'}`);
  
  // Try reversed
  const reversed = expected2bit.split('').reverse().join('');
  console.log(`\n  Expected (reversed):  ${reversed}`);
  console.log(`  Match: ${binary.slice(partsStart, partsStart + flagBits2) === reversed ? '✓' : '✗'}`);
  
  // Show where IDs should start
  const idsStart = partsStart + flagBits2;
  console.log(`\n  After flags, IDs start at bit ${idsStart}`);
  console.log(`  Next 30 bits: ${binary.slice(idsStart, idsStart + 30)}`);
  
  // Try decoding IDs
  console.log(`\n  Decoding part IDs from bit ${idsStart}:`);
  let offset = idsStart;
  for (let i = 0; i < Math.min(parts.length + 3, 10); i++) {
    const val = decodeVarint5(binary, offset);
    if (!val) break;
    const expected = i < parts.length ? parts[i].id : '?';
    const match = val.value === expected ? '✓' : '✗';
    console.log(`    [${i}] Bit ${offset}: ${val.value} (expected ${expected}) ${match}`);
    offset += val.bitsRead;
  }
}

console.log('ANALYZING SERIALS WITH NICNL OUTPUTS\n');
console.log('After pasting outputs in this file, run again to see analysis.\n');

nicnlResults.forEach(({ serial, output }) => analyzeWithOutput(serial, output));

console.log('\n\n' + '='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80));
console.log('\n1. Visit: https://borderlands4-deserializer.nicnl.com/');
console.log('2. Test each serial and copy the "Deserialized" output');
console.log('3. Paste into the nicnlResults array in this file');
console.log('4. Run this script again to see pattern analysis');
