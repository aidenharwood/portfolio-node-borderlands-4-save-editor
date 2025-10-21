<template>
  <Page>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-2">BL4 Item Editor</h1>
          <p class="text-muted-foreground">Modify item level and random seed (reroll)</p>
        </div>

        <!-- Serial Input -->
        <div class="rounded-lg border border-border/60 bg-card/60 p-4">
          <label class="block text-sm font-medium text-foreground mb-2">Item Serial</label>
          <div class="flex gap-2">
            <input 
              v-model="serialInput" 
              type="text" 
              @input="handleDecode"
              class="flex-1 font-mono text-sm rounded-md border border-border/60 bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="@Ugr$WBm/!9x!X=5&qXxA;nj3OOD#<4R" 
            />
            <button 
              @click="pasteSample"
              class="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10">
              Sample
            </button>
          </div>
          <div v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</div>
        </div>

        <!-- Decoded Item Info -->
        <div v-if="decoded" class="space-y-4">
          <!-- Item Summary Card -->
          <div class="rounded-lg border border-border/60 bg-gradient-to-br from-card/60 to-card/80 p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div class="text-xs text-muted-foreground mb-1">Item Type</div>
                <div class="font-semibold text-foreground">{{ decoded.itemType }}</div>
                <div class="text-xs text-muted-foreground">{{ decoded.itemTypeName }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">Manufacturer</div>
                <div class="font-semibold text-foreground">{{ decoded.manufacturer || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">Current Level</div>
                <div class="text-2xl font-bold text-accent">{{ decoded.level }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">Random Seed</div>
                <div class="font-mono text-sm text-foreground">{{ decoded.randomSeed }}</div>
              </div>
            </div>
          </div>

          <!-- Level Editor -->
          <div class="rounded-lg border border-border/60 bg-card/60 p-4">
            <h3 class="text-lg font-semibold text-foreground mb-4">Modify Level</h3>
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm text-foreground">New Level: <span class="text-xl font-bold text-accent">{{ newLevel }}</span></label>
                  <div class="flex gap-2">
                    <button 
                      @click="newLevel = 1"
                      class="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10">
                      Min (1)
                    </button>
                    <button 
                      @click="newLevel = 50"
                      class="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10">
                      Max (50)
                    </button>
                  </div>
                </div>
                <input 
                  v-model.number="newLevel" 
                  type="range" 
                  min="1" 
                  max="50" 
                  class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div class="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Level 1</span>
                  <span>Level 50</span>
                </div>
              </div>
              
              <button 
                @click="applyLevelChange"
                :disabled="newLevel === decoded.level"
                class="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                Apply Level Change
              </button>
            </div>
          </div>

          <!-- Random Seed Editor -->
          <div class="rounded-lg border border-border/60 bg-card/60 p-4">
            <h3 class="text-lg font-semibold text-foreground mb-4">Reroll Random Seed</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-foreground mb-2">
                  New Random Seed (0-65535)
                </label>
                <input 
                  v-model.number="newSeed" 
                  type="number" 
                  min="0" 
                  max="65535"
                  class="w-full font-mono text-sm rounded-md border border-border/60 bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div class="flex gap-2">
                <button 
                  @click="randomizeSeed"
                  class="flex-1 px-4 py-2 rounded-md border border-border/60 bg-background hover:bg-muted/50 transition">
                  <i class="pi pi-refresh mr-2"></i>
                  Random Seed
                </button>
                <button 
                  @click="applySeedChange"
                  :disabled="newSeed === decoded.randomSeed"
                  class="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                  Apply Seed Change
                </button>
              </div>
            </div>
          </div>

          <!-- Modified Serial Output -->
          <div v-if="modifiedSerial" class="rounded-lg border border-border/60 bg-background/80 p-4">
            <h3 class="text-lg font-semibold text-foreground mb-3">✅ Modified Serial</h3>
            <div class="flex gap-2">
              <input 
                :value="modifiedSerial" 
                readonly
                class="flex-1 font-mono text-sm rounded-md border border-border/60 bg-background px-3 py-2 focus:outline-none"
              />
              <button 
                @click="copyToClipboard(modifiedSerial)"
                class="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10">
                <i class="pi pi-copy"></i>
              </button>
            </div>
            
            <!-- Verification -->
            <div v-if="modifiedDecoded" class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-md bg-background p-2">
                <span class="text-muted-foreground">Level:</span>
                <span class="ml-2 font-bold" :class="modifiedDecoded.level === newLevel ? 'text-green-500' : 'text-destructive'">
                  {{ modifiedDecoded.level }}
                </span>
                <span v-if="modifiedDecoded.level === newLevel" class="ml-1 text-green-500">✓</span>
              </div>
              <div class="rounded-md bg-background p-2">
                <span class="text-muted-foreground">Random Seed:</span>
                <span class="ml-2 font-mono text-foreground">{{ modifiedDecoded.randomSeed }}</span>
              </div>
              <div class="rounded-md bg-background p-2">
                <span class="text-muted-foreground">Item Type:</span>
                <span class="ml-2" :class="modifiedDecoded.itemType === decoded.itemType ? 'text-green-500' : 'text-destructive'">
                  {{ modifiedDecoded.itemType }}
                </span>
                <span v-if="modifiedDecoded.itemType === decoded.itemType" class="ml-1 text-green-500">✓</span>
              </div>
              <div class="rounded-md bg-background p-2">
                <span class="text-muted-foreground">Manufacturer:</span>
                <span class="ml-2 text-foreground">{{ modifiedDecoded.manufacturer }}</span>
              </div>
            </div>
          </div>

          <!-- Technical Details (Collapsible) -->
          <details class="rounded-lg border border-border/60 bg-card/60">
            <summary class="px-4 py-3 cursor-pointer hover:bg-muted/20 transition select-none">
              <span class="text-sm font-medium text-foreground">Technical Details</span>
            </summary>
            <div class="px-4 pb-4 space-y-3 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <span class="text-muted-foreground">Version:</span>
                  <span class="ml-2 font-mono">{{ decoded.version }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Fields:</span>
                  <span class="ml-2 font-mono">{{ decoded.fields.length }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Parts:</span>
                  <span class="ml-2 font-mono">{{ decoded.parts.length }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Binary Length:</span>
                  <span class="ml-2 font-mono">{{ decoded.binary.length }} bits</span>
                </div>
              </div>
              
              <div>
                <div class="text-xs text-muted-foreground mb-1">Binary (first 100 bits):</div>
                <div class="font-mono text-xs bg-background rounded-md p-2 overflow-x-auto break-all">
                  {{ decoded.binary.slice(0, 100) }}...
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Page from '../layouts/Page.vue'
import { decodeSerial, type DecodedSerial } from '../lib/serial-decoder'
import { modifyLevel, modifyRandomSeed } from '../lib/serial-encoder'

const serialInput = ref('')
const error = ref('')
const decoded = ref<DecodedSerial | null>(null)
const modifiedSerial = ref('')
const modifiedDecoded = ref<DecodedSerial | null>(null)

const newLevel = ref(1)
const newSeed = ref(0)

// Sample serial for testing
const sampleSerial = '@Ugr$WBm/!9x!X=5&qXxA;nj3OOD#<4R' // L1 Jakobs Knife

function pasteSample() {
  serialInput.value = sampleSerial
  handleDecode()
}

function handleDecode() {
  error.value = ''
  decoded.value = null
  modifiedSerial.value = ''
  modifiedDecoded.value = null
  
  if (!serialInput.value.trim()) return
  
  try {
    const result = decodeSerial(serialInput.value)
    
    if (!result) {
      error.value = 'Failed to decode serial. Please check the format.'
      return
    }
    
    decoded.value = result
    newLevel.value = result.level || 1
    newSeed.value = result.randomSeed || 0
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to decode serial'
  }
}

function applyLevelChange() {
  if (!decoded.value) return
  
  try {
    modifiedSerial.value = modifyLevel(decoded.value, newLevel.value)
    
    // Verify the modification
    modifiedDecoded.value = decodeSerial(modifiedSerial.value)
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to modify level'
  }
}

function applySeedChange() {
  if (!decoded.value) return
  
  try {
    modifiedSerial.value = modifyRandomSeed(decoded.value, newSeed.value)
    
    // Verify the modification
    modifiedDecoded.value = decodeSerial(modifiedSerial.value)
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to modify random seed'
  }
}

function randomizeSeed() {
  newSeed.value = Math.floor(Math.random() * 65536)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Could add a toast notification here
    })
}
</script>
