import { b85DecodeToHex, hexToBin, decodeVarint5, decodeVarbit5, readMajorType } from './src/lib/nicnl-decoder';

const serials = [
  '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05', // Original test serial
  '@Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq',
  '@Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW',
  '@UgdhV<Fme!Kpj6O0RG}8tsNq8CP&HAL`qWKS9n>FGAJi+<FH}zi',
  '@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00',
];

async function testSerial(serial: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${serial}`);
  console.log('='.repeat(80));
  
  // Call Nicnl's API
  try {
    const response = await fetch('https://borderlands4-deserializer.nicnl.com/api/deserialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serial }),
    });
    
    if (!response.ok) {
      console.log(`API Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log('\nNicnl Output:', data.deserialized || data);
    
    // Parse the deserialized string
    const parts = data.deserialized?.split('||') || [];
    if (parts.length >= 3) {
      console.log('\nParsed:');
      console.log('  Fields:', parts[0]);
      console.log('  Additional fields:', parts[1]);
      console.log('  Parts:', parts[2]);
      
      // Count parts
      const partMatches = parts[2].match(/\{[^}]+\}/g);
      const partCount = partMatches?.length || 0;
      console.log(`  Part count: ${partCount}`);
      
      // Analyze each part
      if (partMatches) {
        console.log('\n  Part breakdown:');
        partMatches.forEach((part, idx) => {
          const hasChunks = part.includes(':') || part.includes('[');
          const isArray = part.includes('[');
          console.log(`    [${idx}] ${part} - ${!hasChunks ? 'no chunks' : isArray ? 'array' : 'single chunk'}`);
        });
      }
    }
    
    // Analyze binary structure
    const hex = b85DecodeToHex(serial);
    const binary = hexToBin(hex!);
    
    console.log('\nBinary Analysis:');
    console.log(`  Hex length: ${hex?.length} chars (${(hex?.length || 0) / 2} bytes)`);
    console.log(`  Binary length: ${binary?.length} bits`);
    
    // Find where fields end (look for major 000)
    let fieldsEndBit = -1;
    for (let i = 60; i < 100 && i < (binary?.length || 0) - 3; i++) {
      if (binary?.slice(i, i + 3) === '000') {
        // Check if this is after a field value
        const prevMajor = readMajorType(binary, i - 15);
        if (prevMajor === '100' || prevMajor === '110') {
          fieldsEndBit = i;
          break;
        }
      }
    }
    
    if (fieldsEndBit > 0 && binary) {
      console.log(`  Fields end at bit: ${fieldsEndBit}`);
      console.log(`  Parts section starts at bit: ${fieldsEndBit + 3}`);
      
      const partsStart = fieldsEndBit + 3;
      console.log(`  Bits ${partsStart}-${partsStart + 30}:`, binary.slice(partsStart, partsStart + 31));
      
      // Try to find part IDs by looking for known small values
      console.log('\n  Searching for part IDs (varint5 values 1-20):');
      for (let bit = partsStart; bit < partsStart + 50 && bit < binary.length - 10; bit++) {
        const val = decodeVarint5(binary, bit);
        if (val && val.value > 0 && val.value < 300) {
          console.log(`    Bit ${bit}: varint5(${val.value}) [${val.bitsRead} bits]`);
        }
      }
    }
    
  } catch (error) {
    console.log('Error:', error);
  }
}

async function main() {
  for (const serial of serials) {
    await testSerial(serial);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
}

main();
