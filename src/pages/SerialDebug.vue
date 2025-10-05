<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Serial Debug Console</h1>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Test Serial:</label>
        <input 
          v-model="testSerial" 
          class="w-full p-2 border rounded"
          placeholder="Enter serial to test"
        />
      </div>
      
      <button 
        @click="testDecode" 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Decode
      </button>
      
      <div v-if="result" class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 class="font-bold mb-2">Results:</h3>
        <div class="space-y-2 text-sm font-mono">
          <div><strong>Payload:</strong> {{ result.payload }}</div>
          <div><strong>Payload Length:</strong> {{ result.payload?.length }}</div>
          <div class="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div><strong>Our Implementation:</strong></div>
            <div>Binary (hex): {{ result.binaryHex }}</div>
            <div>Bytes: {{ result.actualLength }}</div>
          </div>
          <div class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div><strong>Original b85-raw:</strong></div>
            <div>Binary (hex): {{ result.originalHex }}</div>
            <div>Bytes: {{ result.originalLength }}</div>
          </div>
          <div class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div><strong>Expected:</strong> 8060e084a20e460954c2204ca8bfa0ce522a1d42ca839a9b00872a85</div>
            <div><strong>Expected Bytes:</strong> {{ result.expectedLength }}</div>
          </div>
          <div><strong>Match:</strong> {{ result.match ? '✅ YES' : '❌ NO' }}</div>
        </div>
      </div>
      
      <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-800 rounded">
        <strong>Error:</strong> {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { bitPackDecode } from '@/lib/utils/serial-utils'
import { decodeBase85 } from '@/lib/utils/b85-raw'

const testSerial = ref('@Ugy3L+2}Ta0Od!Hk&Y-`jLLDkno0@~lg(`;t')
const result = ref<any>(null)
const error = ref('')

function testDecode() {
  try {
    error.value = ''
    
    const decoded = bitPackDecode(testSerial.value)
    const binaryHex = Array.from(decoded.data).map(b => b.toString(16).padStart(2, '0')).join('')
    const expected = '8060e084a20e460954c2204ca8bfa0ce522a1d42ca839a9b00872a85'
    
    // Also test with the original b85-raw implementation
    const payload = testSerial.value.startsWith('@Ug') ? testSerial.value.slice(3) : testSerial.value
    const originalDecoded = decodeBase85(payload)
    const originalHex = Array.from(originalDecoded).map(b => b.toString(16).padStart(2, '0')).join('')
    
    result.value = {
      payload: decoded.originalPayload,
      binaryHex,
      match: binaryHex === expected,
      actualLength: decoded.data.length,
      expectedLength: 32,
      originalHex,
      originalLength: originalDecoded.length
    }
    
    console.log('=== Our Implementation ===')
    console.log('Decoded payload:', decoded.originalPayload)
    console.log('Payload length:', decoded.originalPayload.length)
    console.log('Binary hex:', binaryHex)
    console.log('Actual bytes:', decoded.data.length)
    
    console.log('=== Original b85-raw Implementation ===')
    console.log('Binary hex:', originalHex)
    console.log('Bytes:', originalDecoded.length)
    
    console.log('=== Comparison ===')
    console.log('Expected:  ', expected)
    console.log('Expected bytes:', 32)
    console.log('Match with original b85-raw:', originalHex === expected)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Decode error:', err)
  }
}

// Auto-test on mount
testDecode()
</script>