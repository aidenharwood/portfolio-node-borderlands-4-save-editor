// @ts-ignore
const { decodeItemSerial } = require('./serial-utils.ts');

// Test serials with known level and rarity values
const testSerials = [
  {
    serial: '@Ugr$Q9m/$Qa!a%H`NgZl^aX^(?UrYc',
    expected: { level: 16, rarity: 4 }
  },
  {
    serial: '@Ugr$fEm/$Qa!uWciRH#msL5)ET8;XSh',
    expected: { level: 16, rarity: 4 }
  },
  {
    serial: '@Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq',
    expected: { level: 30, rarity: 4 }
  },
  {
    serial: '@Uge8jxm/$Qa!t_/6Nfl~+c/es~-%J1',
    expected: { level: 13, rarity: 4 }
  },
  {
    serial: '@Uge8>*m/$Qa!dO_KNkwXXG&dv@00',
    expected: { level: 13, rarity: 4 }
  }
];

console.log('Testing BL4 serial decoding with known level/rarity values:');
console.log('==========================================================');

let passed = 0;
let total = testSerials.length;

testSerials.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.serial.substring(0, 20)}...`);
  console.log(`Expected: Level ${test.expected.level}, Rarity ${test.expected.rarity}`);

  try {
    const decoded = decodeItemSerial(test.serial);

    console.log(`Decoded:  Level ${decoded.stats.level || 'undefined'}, Rarity ${decoded.stats.rarity || 'undefined'}`);
    console.log(`Length: ${decoded.length} bytes`);

    const levelMatch = decoded.stats.level === test.expected.level;
    const rarityMatch = decoded.stats.rarity === test.expected.rarity;

    if (levelMatch && rarityMatch) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      if (!levelMatch) console.log(`  Level mismatch: got ${decoded.stats.level}, expected ${test.expected.level}`);
      if (!rarityMatch) console.log(`  Rarity mismatch: got ${decoded.stats.rarity}, expected ${test.expected.rarity}`);
    }

    // Show header analysis for debugging
    if (decoded.rawFields && decoded.length >= 4) {
      const headerBE = (decoded.rawFields['byte_0'] << 24) |
                      (decoded.rawFields['byte_1'] << 16) |
                      (decoded.rawFields['byte_2'] << 8) |
                      decoded.rawFields['byte_3'];
      console.log(`Header BE: 0x${headerBE.toString(16)} (${headerBE.toString(2).padStart(32, '0')})`);
    }

  } catch (error) {
    console.log(`❌ ERROR: ${(error as Error).message}`);
  }
});

console.log(`\n\nSummary: ${passed}/${total} tests passed`);

if (passed < total) {
  console.log('\nFailed tests indicate header bit field extraction needs refinement.');
  process.exit(1);
} else {
  console.log('\nAll tests passed! Header bit field extraction is working correctly.');
}