<template>
  <Page>
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-2">Serial Structure Debugger</h1>
          <p class="text-muted-foreground">Decode and analyze BL4 serial structure field-by-field</p>
        </div>

        <!-- Serial Input -->
        <div class="rounded-lg border border-border/60 bg-card/60 p-4">
          <label class="block text-sm font-medium text-foreground mb-2">Item Serial</label>
          <div class="flex gap-2">
            <input 
              v-model="serialInput" 
              type="text" 
              @input="handleDecode"
              class="flex-1 font-mono rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Paste a BL4 item serial..." 
            />
            <button 
              @click="copyToClipboard(serialInput)"
              class="px-4 py-2 rounded-md border border-border/60 bg-background hover:bg-muted/50 text-foreground transition">
              <i class="pi pi-copy"></i>
            </button>
          </div>
          <div v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</div>
        </div>

        <!-- Options -->
        <div class="rounded-lg border border-border/60 bg-card/60 p-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="flipBits" @change="handleDecode"
                class="w-4 h-4 rounded border-border/60 bg-background text-accent focus:ring-2 focus:ring-ring" />
              <span class="text-sm text-foreground">Flip bits (BL4 standard)</span>
            </label>
          </div>
        </div>

        <!-- Decoded Structure -->
        <div v-if="decoded" class="space-y-4">
          <!-- Field List -->
          <div class="rounded-lg border border-border/60 bg-card/60 overflow-hidden">
            <div class="bg-muted/30 px-4 py-3 border-b border-border/60">
              <h2 class="text-lg font-semibold text-foreground">Decoded Fields</h2>
            </div>
            <div class="divide-y divide-border/40">
              <div 
                v-for="(field, idx) in decoded.fields" 
                :key="idx"
                class="px-4 py-3 hover:bg-muted/20 transition cursor-pointer"
                @click="selectedField = field">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-foreground">{{ field.name }}</span>
                      <span class="text-xs font-mono text-muted-foreground">
                        bits {{ field.bitStart }}-{{ field.bitEnd }}
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-3 text-xs">
                      <span class="text-muted-foreground">
                        Type: <span class="font-mono text-foreground">{{ field.type }}</span>
                      </span>
                      <span class="text-muted-foreground">
                        Value: <span class="font-mono text-foreground">{{ field.value }}</span>
                      </span>
                      <span v-if="field.hex" class="text-muted-foreground">
                        Hex: <span class="font-mono text-foreground">{{ field.hex }}</span>
                      </span>
                      <span v-if="field.chunks" class="text-muted-foreground">
                        Chunks: <span class="font-mono text-foreground">{{ field.chunks }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-mono text-muted-foreground">{{ field.bits.length }} bits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bit Visualization -->
          <div v-if="selectedField" class="rounded-lg border border-border/60 bg-card/60 p-4">
            <h3 class="text-sm font-semibold text-foreground mb-3">{{ selectedField.name }} - Bit Details</h3>
            <div class="space-y-3">
              <div class="font-mono text-sm bg-background rounded-md p-3 overflow-x-auto">
                <div class="text-muted-foreground mb-1 text-xs">Binary:</div>
                <div class="break-all">
                  <template v-if="selectedField.type.startsWith('varint')">
                    <span 
                      v-for="(segment, idx) in formatVarintBits(selectedField)" 
                      :key="idx"
                      :class="segment.isContinuation ? 'bg-blue-500/30 text-blue-600 font-bold px-0.5' : 'bg-accent/30 text-accent-foreground'"
                    >{{ segment.text }}</span>
                  </template>
                  <span v-else class="bg-accent/30 text-accent-foreground">{{ selectedField.bits }}</span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-muted-foreground">Decimal:</span>
                  <span class="ml-2 font-mono text-foreground">{{ selectedField.value }}</span>
                </div>
                <div v-if="selectedField.hex">
                  <span class="text-muted-foreground">Hexadecimal:</span>
                  <span class="ml-2 font-mono text-foreground">{{ selectedField.hex }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Bit range:</span>
                  <span class="ml-2 font-mono text-foreground">{{ selectedField.bitStart }}-{{ selectedField.bitEnd }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Length:</span>
                  <span class="ml-2 font-mono text-foreground">{{ selectedField.bits.length }} bits</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Reversed:</span>
                  <span class="ml-2 font-mono text-foreground">{{ getReversedValue(selectedField) }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Reversed Hex:</span>
                  <span class="ml-2 font-mono text-foreground">{{ getReversedHex(selectedField) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Binary View -->
          <div class="rounded-lg border border-border/60 bg-card/60 p-4">
            <h3 class="text-sm font-semibold text-foreground mb-3">Complete Binary Structure</h3>
            <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto break-all leading-relaxed">
              <template v-for="field in decoded.fields" :key="field.bitStart">
                <span 
                  :class="[
                    'inline-block transition-colors cursor-pointer',
                    selectedField === field ? 'bg-accent text-accent-foreground font-bold' : 'hover:bg-muted/50'
                  ]"
                  @click="selectedField = field"
                  :title="`${field.name}: ${field.value}`"
                >{{ field.bits }}</span>
              </template>
              <span class="text-muted-foreground">{{ decoded.remainder }}</span>
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              Total bits decoded: {{ decoded.totalBitsDecoded }} / {{ decoded.totalBits }}
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="rounded-lg border border-border/60 bg-card/60 p-3">
              <div class="text-xs text-muted-foreground mb-1">Fields</div>
              <div class="text-xl font-bold text-foreground">{{ decoded.fields.length }}</div>
            </div>
            <div class="rounded-lg border border-border/60 bg-card/60 p-3">
              <div class="text-xs text-muted-foreground mb-1">Decoded Bits</div>
              <div class="text-xl font-bold text-foreground">{{ decoded.totalBitsDecoded }}</div>
            </div>
            <div class="rounded-lg border border-border/60 bg-card/60 p-3">
              <div class="text-xs text-muted-foreground mb-1">Total Bits</div>
              <div class="text-xl font-bold text-foreground">{{ decoded.totalBits }}</div>
            </div>
            <div class="rounded-lg border border-border/60 bg-card/60 p-3">
              <div class="text-xs text-muted-foreground mb-1">Remaining</div>
              <div class="text-xl font-bold text-foreground">{{ decoded.totalBits - decoded.totalBitsDecoded }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Page from '../layouts/Page.vue'

const serialInput = ref('')
const flipBits = ref(true)
const error = ref('')
const selectedField = ref<DecodedField | null>(null)

interface DecodedField {
  name: string
  type: string
  bitStart: number
  bitEnd: number
  bits: string
  value: string
  hex?: string
  chunks?: number
  chunkSize?: number
}

interface DecodedStructure {
  fields: DecodedField[]
  totalBits: number
  totalBitsDecoded: number
  remainder: string
}

const decoded = ref<DecodedStructure | null>(null)

// RAW ANALYSIS MODE - Don't assume structure, just parse what we can confirm
// We'll parse header bits, then just read varints until we run out
const fieldDefinitions = [
  { name: 'Header Bits (unknown)', type: 'bits', length: 7 },  // First 7 bits - unknown purpose
  { name: 'Varint8 #1', type: 'varint', chunkSize: 8 },
  { name: 'Varint4 #1', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #2', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #3', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #4', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #5', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #6 (LEVEL at bit 40/45/49)', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #7', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #8', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #9', type: 'varint', chunkSize: 4 },
  { name: 'Varint4 #10', type: 'varint', chunkSize: 4 },
  // Keep adding as needed
]

function base85ToBinary(serial: string, flipBits: boolean): Uint8Array | null {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~'
    const prefixMatch = serial.match(/^([a-zA-Z]{4})/)
    if (!prefixMatch) return null
    
    const payload = serial.slice(4)
    const chunks: string[] = []
    let i = 0
    
    while (i < payload.length) {
      const remainingBytes = Math.floor((payload.length - i - 1) / 5) * 4 + ((payload.length - i - 1) % 5)
      let chunkLen: number
      
      if (remainingBytes >= 4) {
        chunkLen = 5
      } else if (remainingBytes === 3) {
        chunkLen = 4
      } else if (remainingBytes === 2) {
        chunkLen = 3
      } else if (remainingBytes === 1) {
        chunkLen = 2
      } else {
        break
      }
      
      chunks.push(payload.slice(i, i + chunkLen))
      i += chunkLen
    }
    
    const bytes: number[] = []
    for (const chunk of chunks) {
      let value = 0n
      for (let j = 0; j < chunk.length; j++) {
        const charIndex = alphabet.indexOf(chunk[j])
        if (charIndex === -1) return null
        value = value * 85n + BigInt(charIndex)
      }
      
      const numBytes = chunk.length - 1
      for (let j = numBytes - 1; j >= 0; j--) {
        bytes.push(Number((value >> BigInt(j * 8)) & 0xFFn))
      }
    }
    
    const result = new Uint8Array(bytes)
    
    if (flipBits) {
      for (let i = 0; i < result.length; i++) {
        let byte = result[i]
        byte = ((byte & 0xF0) >> 4) | ((byte & 0x0F) << 4)
        byte = ((byte & 0xCC) >> 2) | ((byte & 0x33) << 2)
        byte = ((byte & 0xAA) >> 1) | ((byte & 0x55) << 1)
        result[i] = byte
      }
    }
    
    return result
  } catch {
    return null
  }
}

function bytesToBitString(bytes: Uint8Array): string {
  let bits = ''
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0')
  }
  return bits
}

function readVarint(bitString: string, cursor: number, chunkSize: number): { value: number, bits: string, end: number, chunks: number } {
  let bits = ''
  let valueBits = ''
  let continueBit = 1
  let chunks = 0
  
  while (continueBit === 1 && cursor < bitString.length) {
    const chunk = bitString.slice(cursor, cursor + chunkSize)
    if (chunk.length < chunkSize) break
    
    bits += chunk
    valueBits += chunk
    cursor += chunkSize
    chunks++
    
    if (cursor < bitString.length) {
      continueBit = parseInt(bitString[cursor], 10)
      bits += continueBit.toString()
      cursor++
      
      if (continueBit === 0) break
    } else {
      break
    }
  }
  
  const value = valueBits ? parseInt(valueBits, 2) : 0
  return { value, bits, end: cursor, chunks }
}

function handleDecode() {
  error.value = ''
  decoded.value = null
  selectedField.value = null
  
  if (!serialInput.value.trim()) return
  
  try {
    const binary = base85ToBinary(serialInput.value, flipBits.value)
    if (!binary) {
      error.value = 'Invalid serial format'
      return
    }
    
    const bitString = bytesToBitString(binary)
    const fields: DecodedField[] = []
    let cursor = 0
    
    for (const fieldDef of fieldDefinitions) {
      if (cursor >= bitString.length) break
      
      if (fieldDef.type === 'bits') {
        const length = fieldDef.length!
        const bits = bitString.slice(cursor, cursor + length)
        const value = parseInt(bits || '0', 2)
        
        fields.push({
          name: fieldDef.name,
          type: `${length} bits`,
          bitStart: cursor,
          bitEnd: cursor + bits.length - 1,
          bits,
          value: value.toString(),
          hex: '0x' + value.toString(16).toUpperCase()
        })
        
        cursor += bits.length
      } else if (fieldDef.type === 'varint') {
        const result = readVarint(bitString, cursor, fieldDef.chunkSize!)
        
        fields.push({
          name: fieldDef.name,
          type: `varint${fieldDef.chunkSize}`,
          bitStart: cursor,
          bitEnd: result.end - 1,
          bits: result.bits,
          value: result.value.toString(),
          hex: '0x' + result.value.toString(16).toUpperCase(),
          chunks: result.chunks,
          chunkSize: fieldDef.chunkSize
        })
        
        cursor = result.end
      }
    }
    
    decoded.value = {
      fields,
      totalBits: bitString.length,
      totalBitsDecoded: cursor,
      remainder: bitString.slice(cursor)
    }
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to decode serial'
  }
}

function formatVarintBits(field: DecodedField) {
  if (!field.chunkSize) return [{ text: field.bits, isContinuation: false }]
  
  const segments: Array<{ text: string, isContinuation: boolean }> = []
  const chunkSize = field.chunkSize
  let i = 0
  
  while (i < field.bits.length) {
    const chunk = field.bits.slice(i, i + chunkSize)
    segments.push({ text: chunk, isContinuation: false })
    i += chunkSize
    
    if (i < field.bits.length) {
      segments.push({ text: field.bits[i], isContinuation: true })
      i++
    }
  }
  
  return segments
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function getReversedValue(field: DecodedField): string {
  if (!field.bits) return '0'
  // Get data bits only (exclude continuation bits for varints)
  let dataBits = field.bits
  if (field.chunkSize && field.type.startsWith('varint')) {
    // Extract only data bits, skip continuation bits
    dataBits = ''
    const chunkSize = field.chunkSize
    let i = 0
    while (i < field.bits.length) {
      dataBits += field.bits.slice(i, i + chunkSize)
      i += chunkSize + 1 // Skip continuation bit
    }
  }
  const reversed = dataBits.split('').reverse().join('')
  return parseInt(reversed || '0', 2).toString()
}

function getReversedHex(field: DecodedField): string {
  if (!field.bits) return '0x0'
  let dataBits = field.bits
  if (field.chunkSize && field.type.startsWith('varint')) {
    dataBits = ''
    const chunkSize = field.chunkSize
    let i = 0
    while (i < field.bits.length) {
      dataBits += field.bits.slice(i, i + chunkSize)
      i += chunkSize + 1
    }
  }
  const reversed = dataBits.split('').reverse().join('')
  const value = parseInt(reversed || '0', 2)
  return '0x' + value.toString(16).toUpperCase()
}
</script>
