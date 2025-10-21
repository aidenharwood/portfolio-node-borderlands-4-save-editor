import { tryDecodeSerial } from './serial-utils'

// Test serials with known nicnl decoder values
const testSerials = [
  {
    serial: '@Ugr$Q9m/$Qa!a%H`NgZl^aX^(?UrYc',
    expected: { level: 16 }
  },
  {
    serial: '@Ugr$fEm/$Qa!uWciRH#msL5)ET8;XSh',
    expected: { level: 16 }
  },
  {
    serial: '@Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq',
    expected: { level: 30 }
  },
  {
    serial: '@Uge8jxm/$Qa!t_/6Nfl~+c/es~-%J1',
    expected: { level: 13 }
  },
  {
    serial: '@Uge8>*m/$Qa!dO_KNkwXXG&dv@00',
    expected: { level: 13 }
  }
]

console.log('Testing nicnl serial decoding against known values:')
console.log('==================================================')

let passed = 0
const total = testSerials.length

testSerials.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.serial.substring(0, 20)}...`)
  console.log(`Expected level: ${test.expected.level}`)

  const decoded = tryDecodeSerial(test.serial)

  if (!decoded) {
    console.log('❌ ERROR: Decoder returned null')
    return
  }

  console.log(`Decoded level: ${decoded.level ?? 'undefined'}`)

  if (decoded.level === test.expected.level) {
    console.log('✅ PASS')
    passed++
  } else {
    console.log('❌ FAIL')
    console.log(`  Level mismatch: got ${decoded.level}, expected ${test.expected.level}`)
  }
})

console.log(`\nSummary: ${passed}/${total} tests passed`)

if (passed < total) {
  console.log('\nSome serials did not match expected nicnl output.')
  process.exit(1)
} else {
  console.log('\nAll tests passed!')
}