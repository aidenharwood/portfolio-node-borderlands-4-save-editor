<template>
  <div class="w-full h-full flex flex-col bg-background border border-border/60 rounded-xl modal-container">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-accent/20 rounded-md flex items-center justify-center">
          <i class="pi pi-code text-accent"></i>
        </div>
        <div>
          <h2 class="text-lg font-semibold">{{ decodedItem?.itemType ? `Item Editor (Type: ${decodedItem.itemType})` :
            'Serial Editor' }}</h2>
          <p class="text-sm text-muted-foreground">{{ decodedItem ? 'Edit item stats and serial' : 'Enter a serial todecode' }}</p>
        </div>
      </div>
      <button type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition hover:border-border hover:text-foreground"
        @click="handleClose">
        <i class="pi pi-times text-sm"></i>
        <span class="sr-only">Close</span>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
      <!-- Serial Input -->
      <div class="rounded-lg border border-border/60 bg-card/60 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-foreground">Item Serial</span>
          <div class="flex items-center gap-2">
            <button type="button" @click="handleRevertToOriginal"
              v-if="originalSerial && serialInput !== originalSerial"
              :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-2', 'bg-accent/10 text-accent']"
              title="Revert to original serial">
              <i class="pi pi-refresh text-xs"></i>
              Revert
            </button>
            <button type="button" @click="handleResetAll" v-if="hasAnyChanges"
              :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-2', 'bg-destructive/10 text-destructive']"
              title="Reset all changes">
              <i class="pi pi-undo text-xs"></i>
              Reset All
            </button>
            <button type="button" @click="copyToClipboard(serialInput)"
              :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-2']">
              <i class="pi pi-copy text-xs"></i>
              Copy
            </button>
          </div>
        </div>
        <input v-model="serialInput" type="text" @input="handleSerialInput" @blur="handleSerialManualEdit"
          class="w-full break-all font-mono rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Paste a serial or start typing..."
          title="Edit serial directly or modify stats below to auto-generate" />
        <p v-if="decodeError" class="mt-2 text-xs text-destructive">{{ decodeError }}</p>

      </div>

      <!-- Stats Editor (only show when decoded) -->
      <div v-if="decodedItem && decodedItem.itemType !== 'error'" class="space-y-4">
        <!-- Item Info -->
        <!-- <div class="rounded-lg border border-accent/40 bg-accent/5 p-4">
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-muted-foreground">Type:</span>
                      <span class="ml-2 font-medium">{{ decodedItem.itemType }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Category:</span>
                      <span class="ml-2 font-medium">{{ decodedItem.itemCategory }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Data Length:</span>
                      <span class="ml-2 font-medium">{{ decodedItem.length }} bytes</span>
                    </div>
                  </div>
                </div> -->

        <!-- Main Stats -->
        <!-- <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                  <h3 class="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Main Stats</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Primary Stat
                        <span class="text-xs text-muted-foreground/60">(Main weapon damage/equipment power)</span>
                      </label>
                      <input v-model.number="editableStats.primaryStat" type="number" min="0" max="65535"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Secondary Stat
                        <span class="text-xs text-muted-foreground/60">(Secondary weapon/equipment stats)</span>
                      </label>
                      <input v-model.number="editableStats.secondaryStat" type="number" min="0" max="65535"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Level
                        <span class="text-xs text-muted-foreground/60">(Item level)</span>
                      </label>
                      <input v-model.number="editableStats.level" type="number" min="1" max="72"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Rarity
                        <span class="text-xs text-muted-foreground/60">(Item quality level)</span>
                      </label>
                      <input v-model.number="editableStats.rarity" type="number" min="0" max="5"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Manufacturer
                        <span class="text-xs text-muted-foreground/60">(Manufacturer code)</span>
                      </label>
                      <input v-model.number="editableStats.manufacturer" type="number" min="0" max="255"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-muted-foreground mb-1">
                        Item Class
                        <span class="text-xs text-muted-foreground/60">(Specific weapon/equipment type)</span>
                      </label>
                      <input v-model.number="editableStats.itemClass" type="number" min="0" max="255"
                        @input="handleStatsChange"
                        class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div> -->

        <!-- Field Editor -->
        <div v-if="editableFields.length > 0" class="rounded-lg border border-border/60 bg-card/60 p-4">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Field Editor</h3>
              <p class="text-xs text-muted-foreground">Quick access to commonly edited fields</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="field in editableFields" :key="field.id" class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ field.name }}
                <span class="text-[10px] font-mono text-muted-foreground/60 ml-1">({{ field.bitStart }}-{{ field.bitEnd }})</span>
              </label>
              <div class="flex items-center gap-2">
                <input 
                  :value="field.value"
                  @change="(e) => handleFieldValueChange(field, (e.target as HTMLInputElement).value)"
                  type="number"
                  class="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-mono" />
                <div class="flex flex-col text-[9px] text-muted-foreground">
                  <span>{{ getStructureReversedValue(field) }}</span>
                  <span class="font-mono">{{ field.hex }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Inspector -->
        <div class="rounded-lg border border-border/60 bg-card/60 p-4">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Debug Inspector</h3>
              <p class="text-xs text-muted-foreground">Bit-level breakdown to help reverse engineer serial structure.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <span class="text-xs text-muted-foreground">Reverse bits</span>
                <input type="checkbox" v-model="flipBits"
                  class="w-4 h-4 rounded border-border/60 bg-background text-accent focus:ring-2 focus:ring-ring focus:ring-offset-2" />
              </label>
              <button type="button" :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-3', 'py-1.5', 'bg-background/80']"
                @click="showDebugPanel = !showDebugPanel">
                <i class="pi" :class="showDebugPanel ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                <span>{{ showDebugPanel ? 'Hide' : 'Show' }}</span>
              </button>
            </div>
          </div>

          <div v-if="showDebugPanel" class="space-y-4">
            <!-- <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Max DB Version
                        <input v-model.number="debugConfig.maxDatabaseVersion" type="number" min="0"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                          placeholder="0 = unknown" />
                      </label>
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        InventoryBalance bits
                        <input v-model.number="debugConfig.balanceBits" type="number" min="0" max="64"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                          placeholder="Set manually" />
                      </label>
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        InventoryData bits
                        <input v-model.number="debugConfig.inventoryBits" type="number" min="0" max="64"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground" />
                      </label>
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        ManufacturerData bits
                        <input v-model.number="debugConfig.manufacturerBits" type="number" min="0" max="64"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground" />
                      </label>
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Part entry bits
                        <input v-model.number="debugConfig.partBits" type="number" min="0" max="64"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                          placeholder="Defaults to InventoryData" />
                      </label>
                      <label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Generic part bits
                        <input v-model.number="debugConfig.genericPartBits" type="number" min="0" max="64"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground" />
                      </label>
                    </div> -->

            <div class="rounded-md border border-border/50 bg-background/70 p-3 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-medium text-muted-foreground uppercase tracking-wide">Serial Comparator</span>
                <button type="button" v-if="compareSerialInput"
                  class="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30"
                  @click="compareSerialInput = ''">
                  <i class="pi pi-times"></i>
                  Clear
                </button>
              </div>
              <input v-model.trim="compareSerialInput" type="text"
                placeholder="Paste another serial to compute bit diffs"
                class="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-[11px] text-foreground" />
              <p v-if="compareAnalysis.error" class="text-xs text-destructive flex items-center gap-1">
                <i class="pi pi-exclamation-triangle"></i>
                {{ compareAnalysis.error }}
              </p>
              <template v-else-if="compareAnalysis.active">

                <!-- LCS Inline Diff -->
                <div v-if="compareAnalysis.hasChanges" class="space-y-3">
                  <!-- Serial Comparison -->
                  <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                    <div class="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Serial Comparison
                    </div>
                    <!-- Base Serial -->
                    <div class="text-xs text-muted-foreground mb-1">Base</div>
                    <div class="font-mono text-xs bg-background rounded-md p-3 mb-3 break-all">
                      {{ serialInput }}
                    </div>

                    <!-- Compare Serial -->
                    <div class="text-xs text-muted-foreground mb-1">Compare</div>
                    <div class="font-mono text-xs bg-background rounded-md p-3 break-all">
                      {{ compareSerialInput }}
                    </div>
                  </div>

                  <!-- Hex Comparison -->
                  <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Hex Comparison</h3>
                      <div class="text-xs text-muted-foreground">
                        Base: {{ compareAnalysis.baseBytes.length }} bytes / Compare: {{
                          compareAnalysis.compareBytes.length }} bytes
                      </div>
                    </div>

                    <div class="space-y-3">
                      <!-- Base Hex -->
                      <div>
                        <div class="text-xs text-muted-foreground mb-1">Base</div>
                        <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto">
                          <div class="flex gap-4">
                            <!-- Offset column -->
                            <div class="text-muted-foreground select-none">
                              <div v-for="row in hexComparisonRows.base" :key="row.offset">{{ row.offset }}</div>
                            </div>
                            <!-- Hex data -->
                            <div class="flex-1">
                              <div v-for="row in hexComparisonRows.base" :key="row.offset" class="whitespace-nowrap">
                                <span v-for="(byte, idx) in row.bytes" :key="idx" :class="[
                                  'inline-block w-6 text-center',
                                  byte.baseValue !== undefined ? (
                                    byte.status === 'removed' ? 'bg-red-500/20 text-red-600 font-semibold' :
                                      byte.status === 'changed' ? 'bg-red-500/20 text-red-600 font-semibold' :
                                        'text-muted-foreground'
                                  ) : 'text-muted-foreground/30'
                                ]">
                                  {{ byte.baseValue !== undefined ? byte.baseValue.toString(16).padStart(2,
                                  '0').toUpperCase() : '--' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Compare Hex -->
                      <div>
                        <div class="text-xs text-muted-foreground mb-1">Compare</div>
                        <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto">
                          <div class="flex gap-4">
                            <!-- Offset column -->
                            <div class="text-muted-foreground select-none">
                              <div v-for="row in hexComparisonRows.compare" :key="row.offset">{{ row.offset }}</div>
                            </div>
                            <!-- Hex data -->
                            <div class="flex-1">
                              <div v-for="row in hexComparisonRows.compare" :key="row.offset" class="whitespace-nowrap">
                                <span v-for="(byte, idx) in row.bytes" :key="idx" :class="[
                                  'inline-block w-6 text-center',
                                  byte.compareValue !== undefined ? (
                                    byte.status === 'added' ? 'bg-green-500/20 text-green-600 font-semibold' :
                                      byte.status === 'changed' ? 'bg-green-500/20 text-green-600 font-semibold' :
                                        'text-muted-foreground'
                                  ) : 'text-muted-foreground/30'
                                ]">
                                  {{ byte.compareValue !== undefined ? byte.compareValue.toString(16).padStart(2,
                                  '0').toUpperCase() : '--' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Binary Comparison -->
                  <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Binary Comparison</h3>
                      <div class="text-xs text-muted-foreground">
                        Base: {{ compareAnalysis.baseBytes.length }} bytes / Compare: {{
                          compareAnalysis.compareBytes.length }} bytes
                      </div>
                    </div>

                    <div class="space-y-3">
                      <!-- Base Binary -->
                      <div>
                        <div class="text-xs text-muted-foreground mb-1">Base</div>
                        <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto">
                          <div class="flex gap-4">
                            <div class="text-muted-foreground select-none">
                              <div v-for="row in hexComparisonRows.base" :key="row.offset">{{ row.offset }}</div>
                            </div>
                            <div class="flex-1">
                              <div v-for="row in hexComparisonRows.base" :key="row.offset" class="whitespace-nowrap">
                                <span v-for="(byte, idx) in row.bytes" :key="idx" :class="[
                                  idx > 0 ? 'ml-2' : '',
                                  byte.baseValue !== undefined ? (
                                    byte.status === 'removed' ? 'bg-red-500/20 text-red-600 font-semibold' :
                                      byte.status === 'changed' ? 'bg-red-500/20 text-red-600 font-semibold' :
                                        'text-muted-foreground'
                                  ) : 'text-muted-foreground/30'
                                ]">{{ byte.baseValue !== undefined ? byte.baseValue.toString(2).padStart(8,
                                  '0') : '--------' }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Compare Binary -->
                      <div>
                        <div class="text-xs text-muted-foreground mb-1">Compare</div>
                        <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto">
                          <div class="flex gap-4">
                            <div class="text-muted-foreground select-none">
                              <div v-for="row in hexComparisonRows.compare" :key="row.offset">{{ row.offset }}</div>
                            </div>
                            <div class="flex-1">
                              <div v-for="row in hexComparisonRows.compare" :key="row.offset" class="whitespace-nowrap">
                                <span v-for="(byte, idx) in row.bytes" :key="idx" :class="[
                                  idx > 0 ? 'ml-2' : '',
                                  byte.compareValue !== undefined ? (
                                    byte.status === 'added' ? 'bg-green-500/20 text-green-600 font-semibold' :
                                      byte.status === 'changed' ? 'bg-green-500/20 text-green-600 font-semibold' :
                                        'text-muted-foreground'
                                  ) : 'text-muted-foreground/30'
                                ]">{{ byte.compareValue !== undefined ?
                                              byte.compareValue.toString(2).padStart(8, '0') : '--------' }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="text-xs text-green-700 flex items-center gap-1">
                  <i class="pi pi-check-circle"></i>
                  No differences detected - serials are identical.
                </p>
              </template>
              <p v-else class="text-xs text-muted-foreground">Enter a second serial to compare against the currently
                decoded item.</p>
            </div>

            <!-- <div class="rounded-md border border-border/50 overflow-hidden">
                      <table class="w-full text-xs">
                        <thead class="bg-muted/40 text-muted-foreground uppercase tracking-wide">
                          <tr>
                            <th class="px-3 py-2 text-left font-semibold">Field</th>
                            <th class="px-3 py-2 text-left font-semibold">Bits</th>
                            <th class="px-3 py-2 text-left font-semibold">Value</th>
                            <th class="px-3 py-2 text-left font-semibold">Hex / Raw</th>
                            <th class="px-3 py-2 text-left font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!debugAnalysis.fields.length" class="border-t border-border/40">
                            <td colspan="5" class="px-3 py-3 text-muted-foreground text-center">Configure bit lengths to start parsing.</td>
                          </tr>
                          <tr v-for="field in debugAnalysis.fields" :key="field.id" class="border-t border-border/40">
                            <td class="px-3 py-2 font-medium text-foreground">{{ field.label }}</td>
                            <td class="px-3 py-2 text-muted-foreground">{{ field.bitLength }} ({{ field.startBit }}&ndash;{{ field.startBit + field.bitLength - 1 }})</td>
                            <td class="px-3 py-2 font-mono text-foreground break-all">{{ field.value }}</td>
                            <td class="px-3 py-2 font-mono text-muted-foreground break-all">
                              <div v-if="field.hex" class="text-foreground">{{ field.hex }}</div>
                              <div>{{ field.rawBits }}</div>
                            </td>
                            <td class="px-3 py-2 text-muted-foreground">{{ field.note || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-if="debugAnalysis.stopReason" class="px-3 py-2 text-xs text-amber-600 border-t border-border/40">
                        {{ debugAnalysis.stopReason }}
                      </div>
                    </div>

                    <div v-if="debugAnalysis.warnings.length"
                      class="rounded-md border border-amber-400/50 bg-amber-500/10 p-3 text-xs space-y-2">
                      <div class="flex items-center gap-2 text-amber-700 font-medium">
                        <i class="pi pi-exclamation-triangle text-sm"></i>
                        Warnings
                      </div>
                      <ul class="space-y-1 list-disc list-inside">
                        <li v-for="(warning, idx) in debugAnalysis.warnings" :key="idx" class="text-amber-800">
                          {{ warning }}
                        </li>
                      </ul>
                    </div> -->

            <div class="rounded-md border border-border/50 bg-background/70 p-3 text-xs space-y-3">
              <div class="flex flex-wrap items-center gap-3 text-muted-foreground">
                <span>Total bits: {{ debugAnalysis.totalBits }}</span>
                <span>Consumed: {{ debugAnalysis.consumedBits }}</span>
                <span>Remaining: {{ debugAnalysis.remainderBits }}</span>
                <span v-if="debugAnalysis.serialVersion !== null">Serial version: {{ debugAnalysis.serialVersion
                  }}</span>
                <button type="button"
                  class="ml-auto inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30 disabled:opacity-50"
                  @click="copyToClipboard(debugAnalysis.bitString)" :disabled="!debugAnalysis.bitString">
                  <i class="pi pi-copy"></i>
                  Copy bits
                </button>
              </div>
              <div>
                <span class="text-muted-foreground">Trailing bits:</span>
                <code class="mt-1 block font-mono break-all rounded bg-card/60 px-2 py-1 text-foreground">
      {{ debugAnalysis.remainderBitsValue || '(none)' }}
    </code>
              </div>

              <!-- Bit String with Highlighting -->
              <div v-if="annotatedBitString.length > 0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-muted-foreground">Bit string (highlighted fields):</span>
                  <button type="button"
                    class="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30 disabled:opacity-50"
                    @click="copyToClipboard(debugAnalysis.bitString)" :disabled="!debugAnalysis.bitString">
                    <i class="pi pi-copy"></i>
                    Copy
                  </button>
                </div>
                <code class="mt-1 block font-mono break-all rounded bg-card/60 px-2 py-1 text-foreground max-h-48 overflow-y-auto">
                  <span 
                    v-for="(segment, idx) in annotatedBitString" 
                    :key="idx"
                    :class="segment.highlight ? 'underline decoration-2 decoration-accent bg-accent/10 text-accent-foreground font-semibold' : ''"
                    :title="segment.fieldName">{{ segment.text }}</span>
                </code>
              </div>

              <div class="space-y-2">
                <div class="text-muted-foreground font-medium">Manual Bit Reader</div>
                <div class="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <label class="flex flex-col gap-1 sm:col-span-2">
                    <span>Start bit</span>
                    <input v-model.number="manualBitStart" type="number" min="0"
                      class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground" />
                  </label>
                  <label class="flex flex-col gap-1 sm:col-span-2">
                    <span>Length (bits)</span>
                    <input v-model.number="manualBitLength" type="number" min="0"
                      class="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground" />
                  </label>
                  <div class="sm:col-span-1 flex flex-col gap-1">
                    <span>Hex (BE)</span>
                    <span class="font-mono text-foreground">{{ manualBitPreview?.valueHex ?? '—' }}</span>
                  </div>
                  <div class="sm:col-span-1 flex flex-col gap-1">
                    <span>Hex (LE)</span>
                    <span class="font-mono text-foreground">{{ manualBitPreview?.valueHexLE ?? '—' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="useContinuationBit"
                      class="w-4 h-4 rounded border-border/60 bg-background text-accent focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                    <span class="text-xs text-muted-foreground">Use continuation bit (read chunks until continuation bit
                      = 0)</span>
                  </label>
                </div>
                <div class="text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border/40">
                  <span class="font-medium">💡 Tip:</span> To find why a field moves (e.g., level at bit 49 vs 40),
                  paste the second serial into the "Compare" field below and look for differences in the hex/binary
                  comparison.
                  Variable-length fields (like varints with different values) will cause offsets to shift.
                </div>
                <div class="flex flex-wrap gap-4 text-muted-foreground items-center">
                  <label class="flex items-center gap-1">
                    <span>Unsigned (BE):</span>
                    <input v-model="editingValueUnsignedBE" type="text" @blur="handleValueEdit('unsignedBE')"
                      @keydown.enter="handleValueEdit('unsignedBE')"
                      class="w-32 font-mono text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <span>Signed (BE): <span class="font-mono text-foreground">{{ manualBitPreview?.valueDecSigned ?? '—'
                      }}</span></span>
                  <label class="flex items-center gap-1">
                    <span>Unsigned (LE):</span>
                    <input v-model="editingValueUnsignedLE" type="text" @blur="handleValueEdit('unsignedLE')"
                      @keydown.enter="handleValueEdit('unsignedLE')"
                      class="w-32 font-mono text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <span>Signed (LE): <span class="font-mono text-foreground">{{ manualBitPreview?.valueDecLESigned ??
                      '—'
                      }}</span></span>
                </div>
                <div class="flex flex-wrap gap-4 text-muted-foreground items-center">
                  <label class="flex items-center gap-1">
                    <span>Inverted (BE):</span>
                    <input v-model="editingValueInvertedBE" type="text" @blur="handleValueEdit('invertedBE')"
                      @keydown.enter="handleValueEdit('invertedBE')"
                      class="w-32 font-mono text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <label class="flex items-center gap-1">
                    <span>Inverted (LE):</span>
                    <input v-model="editingValueInvertedLE" type="text" @blur="handleValueEdit('invertedLE')"
                      @keydown.enter="handleValueEdit('invertedLE')"
                      class="w-32 font-mono text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                </div>
                <div class="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Bits: <span class="font-mono text-foreground">{{ manualBitPreview?.length ?? 0 }}</span></span>
                  <span>Bytes: <span class="font-mono text-foreground">{{ manualBitPreview?.byteLength ?? 0
                      }}</span></span>
                  <span>Byte span: <span class="font-mono text-foreground">{{ manualBitPreview?.byteSpan ?? 0
                      }}</span></span>
                  <span v-if="useContinuationBit && manualBitPreview?.length">Varint range: <span
                      class="font-mono text-foreground">{{ manualBitPreview.start }}-{{ manualBitPreview.start +
                      manualBitPreview.length - 1 }}</span></span>
                </div>
                <div class="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Start byte: <span class="font-mono text-foreground">{{ formatBytePosition(manualBitPreview,
                      'start')
                      }}</span></span>
                  <span>End byte: <span class="font-mono text-foreground">{{ formatBytePosition(manualBitPreview, 'end')
                      }}</span></span>
                  <span>Bit offset: <span class="font-mono text-foreground">{{ formatBitOffset(manualBitPreview)
                      }}</span></span>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" v-model="editingBitsDirectly"
                        class="w-4 h-4 rounded border-border/60 bg-background text-accent focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                      <span class="text-xs text-muted-foreground">Edit bits directly</span>
                    </label>
                  </div>
                  <template v-if="editingBitsDirectly">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs text-muted-foreground">Bit string (0s and 1s only)</label>
                      <input v-model="editingBitsValue" type="text" 
                        @blur="handleBitStringEdit" 
                        @keydown.enter="handleBitStringEdit"
                        @keydown.esc="editingBitsDirectly = false"
                        placeholder="Enter bits (e.g., 101010)"
                        class="w-full font-mono text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <div class="text-xs text-muted-foreground">Current: {{ manualBitPreview?.selection ?? '' }} ({{ manualBitPreview?.length ?? 0 }} bits)</div>
                    </div>
                  </template>
                  <template v-else>
                    <code
                      class="block max-h-64 overflow-auto font-mono break-all whitespace-pre-wrap rounded bg-card/60 px-2 py-1 text-foreground">
      <span class="text-muted-foreground">{{ manualBitPreview?.prefix ?? '' }}</span><template
        v-if="useContinuationBit && formattedBitSelection"><span v-for="(segment, idx) in formattedBitSelection" :key="idx" :class="segment.isContinuation ? 'bg-blue-500/30 text-blue-600 font-bold px-0.5' : 'bg-accent/30 text-accent-foreground font-semibold'">{{ segment.text }}</span></template><span
        v-else class="bg-accent/30 text-accent-foreground font-semibold">{{ manualBitPreview?.selection ?? ''
        }}</span><span class="text-muted-foreground">{{ manualBitPreview?.suffix ?? '' }}</span>
    </code>
                  </template>
                </div>
                <div class="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Serial chunk: <span class="font-mono text-foreground">{{ formatSerialChunk(manualBitPreview)
                      }}</span></span>
                  <span>Serial chars: <span class="font-mono text-foreground">{{ formatSerialCharRange(manualBitPreview)
                      }}</span></span>
                  <span>Serial length: <span class="font-mono text-foreground">{{ manualBitPreview?.serialLength ?? 0
                      }}</span></span>
                  <span v-if="(manualBitPreview?.serialPrefixLength ?? 0) > 0">Prefix length: <span
                      class="font-mono text-foreground">{{ manualBitPreview?.serialPrefixLength }}</span></span>
                </div>
                <code v-if="manualBitPreview?.serialLength"
                  class="block max-h-40 overflow-auto font-mono break-all whitespace-pre-wrap rounded bg-card/60 px-2 py-1 text-foreground">
      <span class="text-muted-foreground">{{ manualBitPreview?.serialPreviewPrefix ?? '' }}</span><span
        class="bg-accent/30 text-accent-foreground font-semibold">{{ manualBitPreview?.serialPreviewSelection ?? ''
        }}</span><span class="text-muted-foreground">{{ manualBitPreview?.serialPreviewSuffix ?? '' }}</span>
    </code>
              </div>
            </div>

            <!-- Structure Decoder -->
            <div class="rounded-md border border-border/50 bg-background/70 p-3 text-xs space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-foreground">Serial Structure</div>
                <button type="button" @click="showStructureDecoder = !showStructureDecoder"
                  class="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30">
                  <i :class="showStructureDecoder ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                  {{ showStructureDecoder ? 'Hide' : 'Show' }}
                </button>
              </div>

              <div v-if="showStructureDecoder" class="space-y-3">
                <div class="text-xs text-muted-foreground">
                  Field-by-field breakdown of the serial header structure
                </div>

                <!-- Decoded Fields -->
                <div class="space-y-1">
                  <div v-for="(field, idx) in structureFields" :key="idx"
                    class="rounded border border-border/40 bg-card/40 px-2 py-1.5 hover:bg-muted/20 transition cursor-pointer"
                    @click="selectedStructureField = field">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="text-xs font-medium text-foreground truncate">{{ field.name }}</span>
                        <span class="text-[9px] font-mono text-muted-foreground shrink-0">{{ field.bitStart }}-{{ field.bitEnd }}</span>
                        <span class="text-[9px] text-muted-foreground shrink-0">{{ field.type }}</span>
                        <span v-if="field.chunks" class="text-[9px] text-muted-foreground shrink-0">{{ field.chunks }}ch</span>
                      </div>
                      <div class="flex items-baseline gap-2 shrink-0">
                        <template v-if="editingFieldId === field.id">
                          <input 
                            ref="fieldEditInputRef"
                            v-model="editingFieldValue"
                            @blur="handleFieldEditComplete"
                            @keydown.enter="handleFieldEditComplete"
                            @keydown.esc="handleFieldEditCancel"
                            type="text"
                            class="w-24 text-sm font-mono rounded border border-accent bg-accent/10 px-2 py-0.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                        </template>
                        <template v-else>
                          <div 
                            class="text-base font-bold font-mono text-accent cursor-text hover:bg-accent/10 px-1 rounded transition"
                            @dblclick="handleFieldEditStart(field)"
                            :title="'Double-click to edit. Current: ' + field.value">
                            {{ field.value }}
                            <sub class="text-[9px] font-normal text-muted-foreground ml-0.5">
                              {{ getStructureReversedValue(field) }}
                            </sub>
                          </div>
                        </template>
                        <span v-if="field.hex" class="text-[9px] font-mono text-muted-foreground">{{ field.hex }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selected Field Details -->
                <div v-if="selectedStructureField" class="rounded border border-accent/40 bg-accent/5 p-3 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="text-xs font-semibold text-foreground mb-1">{{ selectedStructureField.name }}</div>
                      <div class="text-[10px] text-muted-foreground">{{ selectedStructureField.type }} • bits {{ selectedStructureField.bitStart }}-{{ selectedStructureField.bitEnd }}</div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Regular Value</div>
                      <div class="text-xl font-bold font-mono text-foreground">{{ selectedStructureField.value }}</div>
                      <div class="text-[10px] font-mono text-muted-foreground">{{ selectedStructureField.hex }}</div>
                    </div>
                    <div class="space-y-1">
                      <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Inverse Value</div>
                      <div class="text-xl font-bold font-mono text-foreground">{{ getStructureReversedValue(selectedStructureField) }}</div>
                      <div class="text-[10px] font-mono text-muted-foreground">0x{{ parseInt(getStructureReversedValue(selectedStructureField)).toString(16).toUpperCase() }}</div>
                    </div>
                  </div>
                  <div class="font-mono text-xs bg-background rounded p-2 overflow-x-auto break-all">
                    <template v-if="selectedStructureField.type.startsWith('varint')">
                      <span v-for="(segment, idx) in formatStructureVarintBits(selectedStructureField)" :key="idx"
                        :class="segment.isContinuation ? 'bg-blue-500/30 text-blue-600 font-bold px-0.5' : 'bg-accent/30 text-accent-foreground'">{{
                        segment.text }}</span>
                    </template>
                    <span v-else class="bg-accent/30 text-accent-foreground">{{ selectedStructureField.bits }}</span>
                  </div>
                </div>

                <!-- Summary -->
                <div class="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                  <span>Fields: <span class="font-mono text-foreground">{{ structureFields.length }}</span></span>
                  <span>Decoded: <span class="font-mono text-foreground">{{ structureTotalDecoded }}</span> bits</span>
                  <span>Remaining: <span class="font-mono text-foreground">{{ debugAnalysis.totalBits -
                      structureTotalDecoded
                      }}</span> bits</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hex View -->
        <div class="rounded-lg border border-border/60 bg-card/60 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Hex Editor</h3>
            <div class="text-xs text-muted-foreground">
              {{ decodedItem.length }} bytes
            </div>
          </div>
          <div class="font-mono text-xs bg-background rounded-md p-3 overflow-x-auto">
            <div class="flex gap-4">
              <!-- Offset column -->
              <div class="text-muted-foreground select-none">
                <div v-for="row in hexRows" :key="row.offset" class="leading-relaxed">
                  {{ row.offset }}
                </div>
              </div>
              <!-- Hex data -->
              <div class="flex-1">
                <div v-for="row in hexRows" :key="row.offset" class="leading-relaxed whitespace-nowrap">
                  <span v-for="(byte, idx) in row.bytes" :key="idx" @click="handleByteClick(byte.byteIndex)" :class="[
                    'inline-block w-6 text-center cursor-pointer hover:bg-muted/50 transition-colors',
                    getHexCellHighlight(byte.byteIndex, byte.changed),
                    editingByteIndex === byte.byteIndex ? 'ring-2 ring-primary' : ''
                  ]"
                    :title="byte.changed ? `Changed from 0x${byte.original?.toString(16).padStart(2, '0').toUpperCase()} to 0x${byte.value.toString(16).padStart(2, '0').toUpperCase()}\nClick to edit` : 'Click to edit'">
                    <input v-if="editingByteIndex === byte.byteIndex" ref="byteInputRef" v-model="editingByteValue"
                      @blur="handleByteEditComplete" @keydown.enter="handleByteEditComplete"
                      @keydown.esc="handleByteEditCancel" maxlength="2"
                      class="w-6 text-center bg-primary/20 border-0 outline-none text-foreground font-mono text-xs p-0"
                      style="appearance: none;" />
                    <span v-else>{{ byte.value.toString(16).padStart(2, '0').toUpperCase() }}</span>
                  </span>
                </div>
              </div>
              <!-- ASCII column -->
              <div class="text-muted-foreground">
                <div v-for="row in hexRows" :key="row.offset" class="leading-relaxed">
                  <span v-for="(byte, idx) in row.bytes" :key="idx"
                    :class="getAsciiHighlight(byte.byteIndex, byte.changed)">
                    {{ byte.ascii }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-else-if="decodedItem && decodedItem.itemType === 'error'"
        class="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <div class="flex items-center gap-2 text-destructive mb-2">
          <i class="pi pi-exclamation-triangle"></i>
          <span class="font-medium">Failed to decode serial</span>
        </div>
        <p class="text-sm text-destructive/80">
          {{ decodedItem.rawFields?.error || 'Unknown error occurred while decoding this serial.' }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between border-t border-border/60 bg-card/60 px-6 py-4 flex-shrink-0">
      <div class="text-xs text-muted-foreground">
      </div>
      <div class="flex items-center gap-3">
        <button type="button" @click="handleClose"
          :class="[BUTTON_BASE, 'px-4', 'font-medium', 'text-foreground', 'bg-background/80']">
          Cancel
        </button>
        <button type="button" @click="handleSave"
          :class="[BUTTON_BASE, 'px-4', 'font-medium', 'bg-accent', 'text-accent-foreground']">
          <i class="pi pi-save text-xs"></i>
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, reactive } from 'vue'
import { decodeItemSerial, bitPackEncode, bitPackDecode, type DecodedItem, type ItemStats } from '../../lib/utils/serial-utils'

// Props & Emits
interface Props {
  serial: string
  flags?: number
  state_flags?: number
  isModal?: boolean // Whether this is displayed in a modal (vs full page)
}

const props = withDefaults(defineProps<Props>(), {
  isModal: false
})
const emit = defineEmits<{
  close: []
  save: [payload: { serial: string; flags?: number; state_flags?: number }]
}>()

// Refs
const serialInput = ref('')
const originalSerial = ref('')
const originalStats = ref<ItemStats>({})
const originalBinaryData = ref<Uint8Array | null>(null)
const decodedItem = ref<DecodedItem | null>(null)
const editableStats = ref<ItemStats>({
  primaryStat: undefined,
  secondaryStat: undefined,
  level: undefined,
  rarity: undefined,
  manufacturer: undefined,
  itemClass: undefined
})
const decodeError = ref('')
const serialUpdatedFromStats = ref(false)
const editingByteIndex = ref<number | null>(null)
const editingByteValue = ref<string>('')

// Constants
const BUTTON_BASE =
  'inline-flex items-center text-center gap-2 rounded-lg border p-2 text-xs'

// Computed
const hasAnyChanges = computed(() => {
  if (!originalStats.value) return false

  return editableStats.value.primaryStat !== originalStats.value.primaryStat ||
    editableStats.value.secondaryStat !== originalStats.value.secondaryStat ||
    editableStats.value.level !== originalStats.value.level ||
    editableStats.value.rarity !== originalStats.value.rarity ||
    editableStats.value.manufacturer !== originalStats.value.manufacturer ||
    editableStats.value.itemClass !== originalStats.value.itemClass
})

interface HexByte {
  value: number;
  changed: boolean;
  original?: number;
  ascii: string;
  byteIndex: number;
}

interface HexRow {
  offset: string;
  bytes: HexByte[];
}

interface DebugConfig {
  maxDatabaseVersion: number;
  balanceBits: number;
  inventoryBits: number;
  manufacturerBits: number;
  partBits: number;
  genericPartBits: number;
}

interface DebugFieldDisplay {
  id: string;
  label: string;
  bitLength: number;
  startBit: number;
  value: string;
  hex?: string;
  note?: string;
  rawBits: string;
}

interface DebugAnalysisResult {
  fields: DebugFieldDisplay[];
  warnings: string[];
  stopReason?: string;
  remainderBits: number;
  remainderBitsValue: string;
  consumedBits: number;
  totalBits: number;
  serialVersion: number | null;
  bitString: string;
}

interface ManualBitPreview {
  prefix: string;
  selection: string;
  suffix: string;
  valueHex: string;
  valueDec: string;
  valueDecSigned: string;
  valueHexLE: string;
  valueDecLE: string;
  valueDecLESigned: string;
  valueDecInverted: string;
  valueDecInvertedLE: string;
  byteLength: number;
  byteSpan: number;
  start: number;
  length: number;
  startByteIndex: number;
  endByteIndex: number;
  startBitOffset: number;
  endBitOffset: number;
  startRowOffset: string;
  endRowOffset: string;
  startColumn: string;
  endColumn: string;
  serialCharStart: number;
  serialCharEnd: number;
  serialChunkStart: number;
  serialChunkEnd: number;
  serialLength: number;
  serialPrefixLength: number;
  serialPreviewPrefix: string;
  serialPreviewSelection: string;
  serialPreviewSuffix: string;
  selectionWithoutContinuationBits: string;
  useContinuationBit: boolean;
  continuationBitlength: number;
}

interface StructureField {
  id: string;
  name: string;
  type: string;
  bitStart: number;
  bitEnd: number;
  bits: string;
  value: string;
  hex?: string;
  chunks?: number;
  length?: number;
  reverse?: boolean;
}

interface StructureFieldDef {
  name: string;
  type: 'bits' | 'varint';
  length?: number;
  conditional?: boolean; // If true, only read if previous field value === 1
  reverse?: boolean; // If true, display inverse value prominently
  highlightBits?: boolean; // If true, underline these bits in the bit string display
  addToEditor?: boolean; // If true, add to the easy editor section
}

interface BitDiffSegment {
  start: number;
  length: number;
}

// Kept for potential future use - hex/binary diff view interfaces
// interface HexDiffByte {
//   value: string;
//   valueBinary: string;
//   status: 'same' | 'changed' | 'added' | 'removed';
//   baseByte?: string;
//   compareByte?: string;
//   baseByteBinary?: string;
//   compareByteBinary?: string;
// }

// interface CompareHexRow {
//   offset: string;
//   baseBytes: HexDiffByte[];
//   compareBytes: HexDiffByte[];
// }

interface CompareAnalysis {
  active: boolean;
  bitString: string;
  totalBits: number;
  diffCount: number;
  diffSegments: BitDiffSegment[];
  firstDiff?: number;
  compareLength: number;
  error?: string;
  hasChanges: boolean;
  changedBytes: number;
  addedBytes: number;
  removedBytes: number;
  baseBytes: Uint8Array;
  compareBytes: Uint8Array;
}

const showDebugPanel = ref(!props.isModal) // Expanded by default in full page, collapsed in modal

const debugConfig = reactive<DebugConfig>({
  maxDatabaseVersion: 0,
  balanceBits: 0,
  inventoryBits: 0,
  manufacturerBits: 0,
  partBits: 0,
  genericPartBits: 0
})

const manualBitStart = ref(0)
const manualBitLength = ref(16)
const useContinuationBit = ref(false)
const compareSerialInput = ref('')
const flipBits = ref(true) // Toggle for bit reversal (default: enabled for BL4 serials)
const showStructureDecoder = ref(false)
const selectedStructureField = ref<StructureField | null>(null)
const editingFieldId = ref<string | null>(null)
const editingFieldValue = ref('')
const editingValueUnsignedBE = ref('')
const editingValueUnsignedLE = ref('')
const editingValueInvertedBE = ref('')
const editingValueInvertedLE = ref('')
const editingBitsDirectly = ref(false)
const editingBitsValue = ref('')

// RAW ANALYSIS MODE - Don't assume structure, just parse what we can confirm
// We'll parse header bits, then just read sequential varints to find patterns
// Compare items with firmware vs without to identify which varint field varies
const fieldDefinitions: StructureFieldDef[] = [
  { name: 'Unknown byte', type: 'bits', length: 8 },
  { name: 'Unknown flag', type: 'bits', length: 1 },
  { name: 'Unknown nibble (from prev flag)', type: 'bits', length: 4, conditional: true },
  { name: 'Unknown flag', type: 'bits', length: 1 },
  { name: 'Unknown int5 (from prev flag)', type: 'bits', length: 5, conditional: true },
  { name: 'Unknown int5', type: 'bits', length: 5 },
  { name: 'Unknown int25', type: 'bits', length: 25 },
  { name: 'Level', type: 'varint', length: 4, reverse: true, highlightBits: true, addToEditor: true },
]

function bitsToByteArray(bits: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8).padEnd(8, '0');
    bytes.push(parseInt(chunk, 2));
  }
  return bytes;
}

const hexRows = computed((): HexRow[] => {
  if (!decodedItem.value || decodedItem.value.itemType === 'error') {
    return [];
  }

  const currentData = decodedItem.value.originalBinary;
  const originalData = originalBinaryData.value;
  const rows: HexRow[] = [];
  const bytesPerRow = 16;

  for (let i = 0; i < currentData.length; i += bytesPerRow) {
    const rowBytes: HexByte[] = [];

    for (let j = 0; j < bytesPerRow && (i + j) < currentData.length; j++) {
      const byteIndex = i + j;
      const currentByte = currentData[byteIndex];
      const originalByte = originalData?.[byteIndex];
      const changed = originalData !== null && originalByte !== undefined && originalByte !== currentByte;

      // Convert to ASCII (printable chars only)
      const ascii = currentByte >= 32 && currentByte <= 126 ? String.fromCharCode(currentByte) : '.';

      rowBytes.push({
        value: currentByte,
        changed,
        original: originalByte,
        ascii,
        byteIndex
      });
    }

    rows.push({
      offset: i.toString(16).padStart(4, '0').toUpperCase(),
      bytes: rowBytes
    });
  }

  return rows;
});

interface HexComparisonByte {
  baseValue?: number;
  compareValue?: number;
  changed: boolean;
  status: 'same' | 'changed' | 'added' | 'removed';
}

interface HexComparisonRow {
  offset: string;
  bytes: HexComparisonByte[];
}

const hexComparisonRows = computed<{ base: HexComparisonRow[], compare: HexComparisonRow[] }>(() => {
  if (!compareAnalysis.value.active || !lcsComparison.value) {
    return { base: [], compare: [] };
  }

  // Use LCS hex segments to build byte-aligned rows with padding
  const baseHexSegments = lcsComparison.value.hexBaseSegments;
  const compareHexSegments = lcsComparison.value.hexCompareSegments;

  // Convert hex segments to byte array with padding info
  const baseBytes: HexComparisonByte[] = [];
  const compareBytes: HexComparisonByte[] = [];

  // Process base hex segments (2 hex chars = 1 byte)
  for (const segment of baseHexSegments) {
    for (let i = 0; i < segment.text.length; i += 2) {
      const hexByte = segment.text.substr(i, 2);
      if (hexByte === '  ') {
        // Space padding from LCS
        baseBytes.push({
          baseValue: undefined,
          compareValue: undefined,
          changed: false,
          status: 'removed'
        });
      } else {
        const value = parseInt(hexByte, 16);
        baseBytes.push({
          baseValue: isNaN(value) ? undefined : value,
          compareValue: undefined,
          changed: segment.type !== 'match',
          status: segment.type === 'removed' ? 'removed' : segment.type === 'match' ? 'same' : 'changed'
        });
      }
    }
  }

  // Process compare hex segments
  for (const segment of compareHexSegments) {
    for (let i = 0; i < segment.text.length; i += 2) {
      const hexByte = segment.text.substr(i, 2);
      if (hexByte === '  ') {
        // Space padding from LCS
        compareBytes.push({
          baseValue: undefined,
          compareValue: undefined,
          changed: false,
          status: 'added'
        });
      } else {
        const value = parseInt(hexByte, 16);
        compareBytes.push({
          baseValue: undefined,
          compareValue: isNaN(value) ? undefined : value,
          changed: segment.type !== 'match',
          status: segment.type === 'added' ? 'added' : segment.type === 'match' ? 'same' : 'changed'
        });
      }
    }
  }

  const maxLength = Math.max(baseBytes.length, compareBytes.length);
  const bytesPerRow = 16;

  const baseRows: HexComparisonRow[] = [];
  const compareRows: HexComparisonRow[] = [];

  for (let i = 0; i < maxLength; i += bytesPerRow) {
    const baseRowBytes: HexComparisonByte[] = [];
    const compareRowBytes: HexComparisonByte[] = [];

    for (let j = 0; j < bytesPerRow && (i + j) < maxLength; j++) {
      const byteIndex = i + j;
      baseRowBytes.push(baseBytes[byteIndex] || {
        baseValue: undefined,
        compareValue: undefined,
        changed: false,
        status: 'same'
      });
      compareRowBytes.push(compareBytes[byteIndex] || {
        baseValue: undefined,
        compareValue: undefined,
        changed: false,
        status: 'same'
      });
    }

    baseRows.push({
      offset: i.toString(16).padStart(4, '0').toUpperCase(),
      bytes: baseRowBytes
    });

    compareRows.push({
      offset: i.toString(16).padStart(4, '0').toUpperCase(),
      bytes: compareRowBytes
    });
  }

  return { base: baseRows, compare: compareRows };
});

function bytesToBitString(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    result += byte.toString(2).padStart(8, '0');
  }
  return result;
}

function bitsToBigInt(bits: string): bigint {
  if (!bits) {
    return 0n;
  }
  return BigInt('0b' + bits);
}

function bitsToHexString(bits: string): string | undefined {
  if (!bits) {
    return undefined;
  }
  const value = bitsToBigInt(bits);
  const hexLength = Math.ceil(bits.length / 4);
  const hex = value.toString(16).padStart(hexLength, '0').toUpperCase();
  return `0x${hex}`;
}

function formatBytePosition(preview: ManualBitPreview | null, position: 'start' | 'end'): string {
  if (!preview) {
    return '—';
  }
  const isStart = position === 'start';
  const index = isStart ? preview.startByteIndex : preview.endByteIndex;
  const row = isStart ? preview.startRowOffset : preview.endRowOffset;
  const column = isStart ? preview.startColumn : preview.endColumn;
  return `#${index} (row ${row}, col ${column})`;
}

function formatBitOffset(preview: ManualBitPreview | null): string {
  if (!preview) {
    return '—';
  }
  if (preview.length > 0) {
    return `${preview.startBitOffset}-${preview.endBitOffset}`;
  }
  return `${preview.startBitOffset}`;
}

function formatSerialChunk(preview: ManualBitPreview | null): string {
  if (!preview || preview.serialChunkStart < 0 || preview.serialChunkEnd < 0) {
    return '—';
  }
  const start = preview.serialChunkStart;
  const end = preview.serialChunkEnd;
  return start === end ? `#${start}` : `#${start}–#${end}`;
}

function formatSerialCharRange(preview: ManualBitPreview | null): string {
  if (!preview || preview.serialLength === 0 || preview.serialCharStart < 0 || preview.serialCharEnd < preview.serialCharStart) {
    return '—';
  }
  const start = Math.min(preview.serialCharStart, preview.serialLength - 1);
  const end = Math.min(preview.serialCharEnd, preview.serialLength - 1);
  if (start >= end) {
    return `char ${start}`;
  }
  return `${start}-${end}`;
}

function readStructureVarint(bitString: string, cursor: number, length: number): { value: number, bits: string, end: number, chunks: number } {
  let bits = '';
  let valueBits = '';
  let continueBit = 1;
  let chunks = 0;

  while (continueBit === 1 && cursor < bitString.length) {
    const chunk = bitString.slice(cursor, cursor + length);
    if (chunk.length < length) break;

    bits += chunk;
    valueBits += chunk;
    cursor += length;
    chunks++;

    if (cursor < bitString.length) {
      continueBit = parseInt(bitString[cursor], 10);
      bits += continueBit.toString();
      cursor++;

      if (continueBit === 0) break;
    } else {
      break;
    }
  }

  const value = valueBits ? parseInt(valueBits, 2) : 0;
  return { value, bits, end: cursor, chunks };
}

const structureFields = computed((): StructureField[] => {
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) return [];

  const fields: StructureField[] = [];
  let cursor = 0;

  for (let i = 0; i < fieldDefinitions.length; i++) {
    const fieldDef = fieldDefinitions[i];
    if (cursor >= bitString.length) break;

    // Check if this field is conditional
    if (fieldDef.conditional) {
      // Look at the previous field's value
      if (fields.length === 0) {
        // No previous field, skip this conditional field
        continue;
      }
      const prevField = fields[fields.length - 1];
      const prevValue = parseInt(prevField.value, 10);
      
      // Only read this field if previous field value is 1
      if (prevValue !== 1) {
        continue;
      }
    }

    if (fieldDef.type === 'bits') {
      const length = fieldDef.length!;
      const bits = bitString.slice(cursor, cursor + length);
      const value = parseInt(bits || '0', 2);

      fields.push({
        id: `bits-${cursor}-${length}`,
        name: fieldDef.name,
        type: `${length} bits`,
        bitStart: cursor,
        bitEnd: cursor + bits.length - 1,
        bits,
        value: value.toString(),
        hex: '0x' + value.toString(16).toUpperCase(),
        reverse: fieldDef.reverse
      });

      cursor += bits.length;
    } else if (fieldDef.type === 'varint') {
      const result = readStructureVarint(bitString, cursor, fieldDef.length!);
      
      // Decode value accounting for reversal
      let decodedValue = result.value;
      if (fieldDef.reverse) {
        // Each chunk's bits are reversed AND chunks are in reverse order
        const chunkSize = fieldDef.length!;
        const chunks: string[] = [];
        let bitPos = 0;
        
        // Read all chunks and reverse each chunk's bits
        for (let c = 0; c < result.chunks; c++) {
          const chunkStart = bitPos;
          const chunk = result.bits.slice(chunkStart, chunkStart + chunkSize);
          const reversed = chunk.split('').reverse().join('');
          chunks.push(reversed);
          bitPos += chunkSize + 1; // +1 for continuation bit
        }
        
        // Reverse the order of chunks (least significant first → most significant first)
        chunks.reverse();
        const valueBits = chunks.join('');
        
        decodedValue = parseInt(valueBits || '0', 2);
        console.log(`[DECODE] field="${fieldDef.name}" bits="${result.bits}" → rawValue=${result.value} → chunks=${JSON.stringify(chunks)} → valueBits="${valueBits}" → decodedValue=${decodedValue}`);
      }

      fields.push({
        id: `varint-${cursor}-${fieldDef.length}`,
        name: fieldDef.name,
        type: `varint${fieldDef.length}`,
        bitStart: cursor,
        bitEnd: result.end - 1,
        bits: result.bits,
        value: decodedValue.toString(),
        hex: '0x' + decodedValue.toString(16).toUpperCase(),
        chunks: result.chunks,
        length: fieldDef.length,
        reverse: fieldDef.reverse
      });

      cursor = result.end;
    }
  }

  return fields;
});

const structureTotalDecoded = computed(() => {
  if (!structureFields.value.length) return 0;
  const lastField = structureFields.value[structureFields.value.length - 1];
  return lastField.bitEnd + 1;
});

const editableFields = computed(() => {
  return structureFields.value.filter(field => {
    const fieldDef = fieldDefinitions.find(def => def.name === field.name);
    return fieldDef?.addToEditor === true;
  });
});

const annotatedBitString = computed(() => {
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) return [];

  const segments: Array<{ text: string; highlight: boolean; fieldName?: string }> = [];
  let currentPos = 0;

  // Get all fields with highlightBits enabled
  const highlightFields = structureFields.value.filter(field => {
    const fieldDef = fieldDefinitions.find(def => def.name === field.name);
    return fieldDef?.highlightBits === true;
  }).sort((a, b) => a.bitStart - b.bitStart);

  for (const field of highlightFields) {
    // Add unhighlighted segment before this field
    if (currentPos < field.bitStart) {
      segments.push({
        text: bitString.slice(currentPos, field.bitStart),
        highlight: false
      });
    }

    // Add highlighted segment for this field
    segments.push({
      text: bitString.slice(field.bitStart, field.bitEnd + 1),
      highlight: true,
      fieldName: field.name
    });

    currentPos = field.bitEnd + 1;
  }

  // Add remaining unhighlighted segment
  if (currentPos < bitString.length) {
    segments.push({
      text: bitString.slice(currentPos),
      highlight: false
    });
  }

  return segments;
});

function formatStructureVarintBits(field: StructureField) {
  if (!field.length) return [{ text: field.bits, isContinuation: false }];

  const segments: Array<{ text: string, isContinuation: boolean }> = [];
  const length = field.length;
  let i = 0;

  while (i < field.bits.length) {
    const chunk = field.bits.slice(i, i + length);
    segments.push({ text: chunk, isContinuation: false });
    i += length;

    if (i < field.bits.length) {
      segments.push({ text: field.bits[i], isContinuation: true });
      i++;
    }
  }

  return segments;
}

function getStructureReversedValue(field: StructureField): string {
  if (!field.bits) return '0';
  // Get data bits only (exclude continuation bits for varints)
  let dataBits = field.bits;
  if (field.length && field.type.startsWith('varint')) {
    // Extract only data bits, skip continuation bits
    dataBits = '';
    const length = field.length;
    let i = 0;
    while (i < field.bits.length) {
      dataBits += field.bits.slice(i, i + length);
      i += length + 1; // Skip continuation bit
    }
  }
  const reversed = dataBits.split('').reverse().join('');
  return parseInt(reversed || '0', 2).toString();
}

function handleBitStringEdit() {
  if (!manualBitPreview.value || !decodedItem.value || decodedItem.value.itemType === 'error') {
    return;
  }

  // Validate input - only 0s and 1s allowed
  const newBits = editingBitsValue.value.trim();
  if (!/^[01]+$/.test(newBits)) {
    console.warn('Invalid bit string - only 0s and 1s allowed');
    return;
  }

  const preview = manualBitPreview.value;
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) return;

  // Replace the bits in the bit string
  const newBitString = bitString.slice(0, preview.start) + newBits + bitString.slice(preview.start + preview.length);

  // Convert back to bytes
  const newBytes = new Uint8Array(Math.ceil(newBitString.length / 8));
  for (let i = 0; i < newBitString.length; i += 8) {
    const byteBits = newBitString.slice(i, i + 8).padEnd(8, '0');
    newBytes[Math.floor(i / 8)] = parseInt(byteBits, 2);
  }

  // Re-encode to serial
  try {
    const newSerial = bitPackEncode(
      newBytes,
      decodedItem.value.originalPrefix,
      decodedItem.value.originalPayload,
      decodedItem.value.dataPositions,
      decodedItem.value.charOffsets,
      flipBits.value
    );
    serialInput.value = newSerial;

    // Re-decode to update everything
    const reDecoded = decodeItemSerial(newSerial, flipBits.value);
    if (reDecoded.itemType !== 'error') {
      decodedItem.value = reDecoded;
      editableStats.value = {
        primaryStat: reDecoded.stats.primaryStat,
        secondaryStat: reDecoded.stats.secondaryStat,
        level: reDecoded.stats.level,
        rarity: reDecoded.stats.rarity,
        manufacturer: reDecoded.stats.manufacturer,
        itemClass: reDecoded.stats.itemClass
      };
    }
  } catch (error) {
    console.error('Failed to update bit string:', error);
  }

  editingBitsDirectly.value = false;
}

function handleValueEdit(type: 'unsignedBE' | 'unsignedLE' | 'invertedBE' | 'invertedLE') {
  if (!manualBitPreview.value || !decodedItem.value || decodedItem.value.itemType === 'error') {
    return;
  }

  let newValueStr = '';
  switch (type) {
    case 'unsignedBE':
      newValueStr = editingValueUnsignedBE.value;
      break;
    case 'unsignedLE':
      newValueStr = editingValueUnsignedLE.value;
      break;
    case 'invertedBE':
      newValueStr = editingValueInvertedBE.value;
      break;
    case 'invertedLE':
      newValueStr = editingValueInvertedLE.value;
      break;
  }

  // Parse the value
  let newValue: bigint;
  try {
    newValue = BigInt(newValueStr.trim());
    if (newValue < 0n) {
      return; // Don't allow negative values for unsigned
    }
  } catch {
    return; // Invalid number
  }

  const preview = manualBitPreview.value;
  // Account for continuation bits when calculating actual data length
  const { selectionWithoutContinuationBits } = preview;
  const dataBits = selectionWithoutContinuationBits.split('');
  const totalBitLength = preview.length; // Total including continuation bits

  // Convert value to binary string (using data length)
  let newBits = newValue.toString(2).padStart(dataBits.length, '0');

  // Truncate if too long
  if (newBits.length > dataBits.length) {
    newBits = newBits.slice(newBits.length - dataBits.length);
  }

  // Handle different types
  if (type === 'unsignedLE' || type === 'invertedLE') {
    // For LE, we need to reverse the byte order
    // Pad to byte boundary
    const paddedBits = newBits.padStart(Math.ceil(newBits.length / 8) * 8, '0');
    const bytes: number[] = [];
    for (let i = 0; i < paddedBits.length; i += 8) {
      bytes.push(parseInt(paddedBits.slice(i, i + 8), 2));
    }
    // Reverse bytes
    bytes.reverse();
    // Convert back to bits
    newBits = bytes.map(b => b.toString(2).padStart(8, '0')).join('');
    // Trim back to original length
    newBits = newBits.slice(newBits.length - dataBits.length);
  }

  if (type === 'invertedBE' || type === 'invertedLE') {
    // Reverse the bit order (since inverted shows reversed)
    newBits = newBits.split('').reverse().join('');
  }

  // Now reconstruct the full bit string including continuation bits
  let reconstructedBits = '';
  let dataBitIndex = 0;

  if (preview.useContinuationBit) {
    // Reconstruct with continuation bits
    const length = preview.continuationBitlength;
    for (let i = 0; i < totalBitLength;) {
      // Add chunk of data bits
      const chunkEnd = Math.min(dataBitIndex + length, dataBits.length);
      const chunkLen = chunkEnd - dataBitIndex;
      reconstructedBits += newBits.slice(dataBitIndex, dataBitIndex + chunkLen);
      dataBitIndex += chunkLen;
      i += chunkLen;

      // Add continuation bit if not at the end
      if (i < totalBitLength) {
        const isLastChunk = dataBitIndex >= dataBits.length;
        reconstructedBits += isLastChunk ? '0' : '1';
        i++;
      }
    }
  } else {
    reconstructedBits = newBits;
  }

  // Replace the bits in the original bit string
  const bitString = debugAnalysis.value.bitString;
  const start = preview.start;
  const newBitString = bitString.slice(0, start) + reconstructedBits + bitString.slice(start + totalBitLength);

  // Convert back to bytes
  const newBytes = new Uint8Array(Math.ceil(newBitString.length / 8));
  for (let i = 0; i < newBitString.length; i += 8) {
    const byteBits = newBitString.slice(i, i + 8).padEnd(8, '0');
    newBytes[Math.floor(i / 8)] = parseInt(byteBits, 2);
  }

  // Update the decoded item with new binary data
  if (decodedItem.value) {
    decodedItem.value.originalBinary = newBytes;

    // Re-encode to update the serial using bitPackEncode directly
    try {
      const newSerial = bitPackEncode(
        newBytes,
        decodedItem.value.originalPrefix,
        decodedItem.value.originalPayload,
        decodedItem.value.dataPositions,
        decodedItem.value.charOffsets,
        flipBits.value
      );
      serialInput.value = newSerial;
    } catch (error) {
      console.error('Failed to re-encode serial after value edit:', error);
    }
  }
}

const compareAnalysis = computed<CompareAnalysis>(() => {
  const baseBits = debugAnalysis.value.bitString;
  const totalBits = baseBits.length;
  const serial = compareSerialInput.value.trim();
  const baseBytes = decodedItem.value?.originalBinary ?? new Uint8Array();

  if (!serial) {
    return {
      active: false,
      bitString: '',
      totalBits,
      diffCount: 0,
      diffSegments: [],
      compareLength: 0,
      hasChanges: false,
      changedBytes: 0,
      addedBytes: 0,
      removedBytes: 0,
      baseBytes,
      compareBytes: new Uint8Array()
    };
  }

  try {
    const compareDecoded = bitPackDecode(serial, flipBits.value);
    const compareBytes = compareDecoded.data;
    const compareBits = bytesToBitString(compareBytes);
    const maxLen = Math.max(baseBits.length, compareBits.length);
    let diffCount = 0;
    const segments: BitDiffSegment[] = [];
    let segmentStart: number | null = null;

    for (let i = 0; i < maxLen; i++) {
      const bitA = baseBits[i] ?? '0';
      const bitB = compareBits[i] ?? '0';
      if (bitA !== bitB) {
        diffCount += 1;
        if (segmentStart === null) {
          segmentStart = i;
        }
      } else if (segmentStart !== null) {
        segments.push({ start: segmentStart, length: i - segmentStart });
        segmentStart = null;
      }
    }

    if (segmentStart !== null) {
      segments.push({ start: segmentStart, length: maxLen - segmentStart });
    }

    const firstDiff = segments.length ? segments[0].start : undefined;

    // Calculate byte-level changes
    const baseLength = baseBytes.length;
    const compareLength = compareBytes.length;
    const minLength = Math.min(baseLength, compareLength);
    let changedBytes = 0;

    for (let i = 0; i < minLength; i++) {
      if (baseBytes[i] !== compareBytes[i]) {
        changedBytes++;
      }
    }

    const addedBytes = Math.max(0, compareLength - baseLength);
    const removedBytes = Math.max(0, baseLength - compareLength);
    const hasChanges = changedBytes > 0 || addedBytes > 0 || removedBytes > 0;

    return {
      active: true,
      bitString: compareBits,
      totalBits,
      diffCount,
      diffSegments: segments,
      firstDiff,
      compareLength: compareBits.length,
      hasChanges,
      changedBytes,
      addedBytes,
      removedBytes,
      baseBytes,
      compareBytes
    };
  } catch (error) {
    return {
      active: false,
      bitString: '',
      totalBits,
      diffCount: 0,
      diffSegments: [],
      compareLength: 0,
      error: (error as Error).message || 'Failed to decode comparison serial',
      hasChanges: false,
      changedBytes: 0,
      addedBytes: 0,
      removedBytes: 0,
      baseBytes,
      compareBytes: new Uint8Array()
    };
  }
});

// LCS (Longest Common Subsequence) algorithm
function computeLCS(str1: string, str2: string): number[][] {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

interface LCSSegment {
  text: string;
  type: 'match' | 'diff' | 'added' | 'removed';
}

interface LCSComparison {
  baseSegments: LCSSegment[];
  compareSegments: LCSSegment[];
  matchPercent: number;
  diffPercent: number;
  addedPercent: number;
  hexBaseSegments: LCSSegment[];
  hexCompareSegments: LCSSegment[];
  binaryBaseSegments: LCSSegment[];
  binaryCompareSegments: LCSSegment[];
}

const lcsComparison = computed<LCSComparison>(() => {
  if (!compareAnalysis.value.active || !compareSerialInput.value) {
    return {
      baseSegments: [],
      compareSegments: [],
      matchPercent: 0,
      diffPercent: 0,
      addedPercent: 0,
      hexBaseSegments: [],
      hexCompareSegments: [],
      binaryBaseSegments: [],
      binaryCompareSegments: []
    };
  }

  const base = serialInput.value;
  const compare = compareSerialInput.value;
  const dp = computeLCS(base, compare);

  // Backtrack to find the diff
  const baseSegments: LCSSegment[] = [];
  const compareSegments: LCSSegment[] = [];
  const diffBar: string[] = [];

  let i = base.length;
  let j = compare.length;
  let baseTemp = '';
  let compareTemp = '';
  let baseType: 'match' | 'diff' | 'removed' = 'match';
  let compareType: 'match' | 'diff' | 'added' = 'match';

  const flushBase = () => {
    if (baseTemp) {
      baseSegments.unshift({ text: baseTemp, type: baseType });
      baseTemp = '';
    }
  };

  const flushCompare = () => {
    if (compareTemp) {
      compareSegments.unshift({ text: compareTemp, type: compareType });
      compareTemp = '';
    }
  };

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && base[i - 1] === compare[j - 1]) {
      // Match
      if (baseType !== 'match') {
        flushBase();
        baseType = 'match';
      }
      if (compareType !== 'match') {
        flushCompare();
        compareType = 'match';
      }
      baseTemp = base[i - 1] + baseTemp;
      compareTemp = compare[j - 1] + compareTemp;
      diffBar.unshift('=');
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Added in compare
      if (compareType !== 'added') {
        flushCompare();
        compareType = 'added';
      }
      if (baseType !== 'diff') {
        flushBase();
        baseType = 'diff';
      }
      baseTemp = ' ' + baseTemp;
      compareTemp = compare[j - 1] + compareTemp;
      diffBar.unshift('+');
      j--;
    } else {
      // Removed from base (or different)
      if (baseType !== 'removed') {
        flushBase();
        baseType = 'removed';
      }
      if (compareType !== 'diff') {
        flushCompare();
        compareType = 'diff';
      }
      baseTemp = base[i - 1] + baseTemp;
      compareTemp = ' ' + compareTemp;
      diffBar.unshift('-');
      i--;
    }
  }

  flushBase();
  flushCompare();

  // Ensure both sequences are padded to the same length
  let baseLength = baseSegments.reduce((sum, seg) => sum + seg.text.length, 0);
  let compareLength = compareSegments.reduce((sum, seg) => sum + seg.text.length, 0);

  if (baseLength < compareLength) {
    // Pad base with spaces
    const lastSeg = baseSegments[baseSegments.length - 1];
    if (lastSeg && lastSeg.type === 'diff') {
      lastSeg.text += ' '.repeat(compareLength - baseLength);
    } else {
      baseSegments.push({ text: ' '.repeat(compareLength - baseLength), type: 'diff' });
    }
  } else if (compareLength < baseLength) {
    // Pad compare with spaces
    const lastSeg = compareSegments[compareSegments.length - 1];
    if (lastSeg && lastSeg.type === 'diff') {
      lastSeg.text += ' '.repeat(baseLength - compareLength);
    } else {
      compareSegments.push({ text: ' '.repeat(baseLength - compareLength), type: 'diff' });
    }
  }

  // Calculate percentages
  const totalChars = Math.max(base.length, compare.length);
  const matchCount = diffBar.filter(c => c === '=').length;
  const diffCount = diffBar.filter(c => c === '-').length;
  const addedCount = diffBar.filter(c => c === '+').length;

  // Now do the same for hex representation
  const baseHex = Array.from(compareAnalysis.value.baseBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const compareHex = Array.from(compareAnalysis.value.compareBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const hexDp = computeLCS(baseHex, compareHex);

  // Backtrack for hex diff
  const hexBaseSegments: LCSSegment[] = [];
  const hexCompareSegments: LCSSegment[] = [];
  const hexDiffBar: string[] = [];

  let hi = baseHex.length;
  let hj = compareHex.length;
  let hexBaseTemp = '';
  let hexCompareTemp = '';
  let hexBaseType: 'match' | 'diff' | 'removed' = 'match';
  let hexCompareType: 'match' | 'diff' | 'added' = 'match';

  const flushHexBase = () => {
    if (hexBaseTemp) {
      hexBaseSegments.unshift({ text: hexBaseTemp, type: hexBaseType });
      hexBaseTemp = '';
    }
  };

  const flushHexCompare = () => {
    if (hexCompareTemp) {
      hexCompareSegments.unshift({ text: hexCompareTemp, type: hexCompareType });
      hexCompareTemp = '';
    }
  };

  while (hi > 0 || hj > 0) {
    if (hi > 0 && hj > 0 && baseHex[hi - 1] === compareHex[hj - 1]) {
      // Match
      if (hexBaseType !== 'match') {
        flushHexBase();
        hexBaseType = 'match';
      }
      if (hexCompareType !== 'match') {
        flushHexCompare();
        hexCompareType = 'match';
      }
      hexBaseTemp = baseHex[hi - 1] + hexBaseTemp;
      hexCompareTemp = compareHex[hj - 1] + hexCompareTemp;
      hexDiffBar.unshift('=');
      hi--;
      hj--;
    } else if (hj > 0 && (hi === 0 || hexDp[hi][hj - 1] >= hexDp[hi - 1][hj])) {
      // Added in compare
      if (hexCompareType !== 'added') {
        flushHexCompare();
        hexCompareType = 'added';
      }
      if (hexBaseType !== 'diff') {
        flushHexBase();
        hexBaseType = 'diff';
      }
      hexBaseTemp = ' ' + hexBaseTemp;
      hexCompareTemp = compareHex[hj - 1] + hexCompareTemp;
      hexDiffBar.unshift('+');
      hj--;
    } else {
      // Removed from base
      if (hexBaseType !== 'removed') {
        flushHexBase();
        hexBaseType = 'removed';
      }
      if (hexCompareType !== 'diff') {
        flushHexCompare();
        hexCompareType = 'diff';
      }
      hexBaseTemp = baseHex[hi - 1] + hexBaseTemp;
      hexCompareTemp = ' ' + hexCompareTemp;
      hexDiffBar.unshift('-');
      hi--;
    }
  }

  flushHexBase();
  flushHexCompare();

  // Ensure both hex sequences are padded to the same length
  let hexBaseLength = hexBaseSegments.reduce((sum, seg) => sum + seg.text.length, 0);
  let hexCompareLength = hexCompareSegments.reduce((sum, seg) => sum + seg.text.length, 0);

  if (hexBaseLength < hexCompareLength) {
    // Pad hex base with spaces
    const lastSeg = hexBaseSegments[hexBaseSegments.length - 1];
    if (lastSeg && lastSeg.type === 'diff') {
      lastSeg.text += ' '.repeat(hexCompareLength - hexBaseLength);
    } else {
      hexBaseSegments.push({ text: ' '.repeat(hexCompareLength - hexBaseLength), type: 'diff' });
    }
  } else if (hexCompareLength < hexBaseLength) {
    // Pad hex compare with spaces
    const lastSeg = hexCompareSegments[hexCompareSegments.length - 1];
    if (lastSeg && lastSeg.type === 'diff') {
      lastSeg.text += ' '.repeat(hexBaseLength - hexCompareLength);
    } else {
      hexCompareSegments.push({ text: ' '.repeat(hexBaseLength - hexCompareLength), type: 'diff' });
    }
  }

  // Convert hex segments to binary representation (based on hex diff, not separate LCS)
  const binaryBaseSegments: LCSSegment[] = [];
  const binaryCompareSegments: LCSSegment[] = [];

  // Convert each hex segment to binary
  for (const hexSeg of hexBaseSegments) {
    let binaryText = '';
    for (let i = 0; i < hexSeg.text.length; i++) {
      const char = hexSeg.text[i];
      if (char === ' ') {
        // Space padding - convert to 4 space characters (one hex char = 4 bits)
        binaryText += '    ';
      } else {
        // Convert hex char to 4-bit binary
        const nibble = parseInt(char, 16);
        if (!isNaN(nibble)) {
          binaryText += nibble.toString(2).padStart(4, '0');
        } else {
          binaryText += '    '; // Invalid hex char, treat as space
        }
      }
    }
    binaryBaseSegments.push({ text: binaryText, type: hexSeg.type });
  }

  for (const hexSeg of hexCompareSegments) {
    let binaryText = '';
    for (let i = 0; i < hexSeg.text.length; i++) {
      const char = hexSeg.text[i];
      if (char === ' ') {
        // Space padding - convert to 4 space characters (one hex char = 4 bits)
        binaryText += '    ';
      } else {
        // Convert hex char to 4-bit binary
        const nibble = parseInt(char, 16);
        if (!isNaN(nibble)) {
          binaryText += nibble.toString(2).padStart(4, '0');
        } else {
          binaryText += '    '; // Invalid hex char, treat as space
        }
      }
    }
    binaryCompareSegments.push({ text: binaryText, type: hexSeg.type });
  }

  return {
    baseSegments,
    compareSegments,
    matchPercent: Math.round((matchCount / totalChars) * 100),
    diffPercent: Math.round((diffCount / totalChars) * 100),
    addedPercent: Math.round((addedCount / totalChars) * 100),
    hexBaseSegments,
    hexCompareSegments,
    binaryBaseSegments,
    binaryCompareSegments
  };
});

// Kept for potential future use - hex/binary diff view
// const compareHexRows = computed((): CompareHexRow[] => {
//   if (!compareAnalysis.value.active || !compareAnalysis.value.hasChanges) {
//     return [];
//   }
//   ... (implementation commented out)
// });

const debugAnalysis = computed<DebugAnalysisResult>(() => {
  const empty: DebugAnalysisResult = {
    fields: [],
    warnings: [],
    stopReason: undefined,
    remainderBits: 0,
    remainderBitsValue: '',
    consumedBits: 0,
    totalBits: 0,
    serialVersion: null,
    bitString: ''
  };

  if (!decodedItem.value || decodedItem.value.itemType === 'error') {
    return empty;
  }

  // Bit flipping happens during decode, not during display
  const bitString = bytesToBitString(decodedItem.value.originalBinary);
  const totalBits = bitString.length;
  let cursor = 0;
  const fields: DebugFieldDisplay[] = [];
  const warnings: string[] = [];
  let stopReason: string | undefined;
  let serialVersion: number | null = null;

  const readField = (label: string, bitLength: number, note?: string) => {
    if (stopReason || bitLength <= 0) {
      return null as null;
    }

    if (cursor + bitLength > totalBits) {
      stopReason = `Not enough bits to read ${label} (${bitLength} requested, ${Math.max(totalBits - cursor, 0)} available).`;
      return null;
    }

    const bits = bitString.slice(cursor, cursor + bitLength);
    const valueBig = bitsToBigInt(bits);
    const safeNumber = valueBig <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(valueBig) : null;
    const valueString = safeNumber !== null ? safeNumber.toString() : valueBig.toString(10);
    const field: DebugFieldDisplay = {
      id: `${label.replace(/\s+/g, '_')}_${cursor}`,
      label,
      bitLength,
      startBit: cursor,
      value: valueString,
      hex: bitsToHexString(bits),
      note,
      rawBits: bits
    };
    fields.push(field);
    cursor += bitLength;
    return { bits, value: valueBig, field };
  };

  const serialField = readField('Serial Version', 8, 'Expected: 3 or 4');
  if (serialField) {
    serialVersion = Number(serialField.value);
    if (serialVersion !== 3 && serialVersion !== 4 && serialVersion !== 5) {
      warnings.push(`Unexpected serial version ${serialVersion}.`);
      const baseNote = serialField.field.note ? `${serialField.field.note}. ` : '';
      serialField.field.note = `${baseNote}Observed value ${serialVersion}.`;
    }
  }

  const seedField = readField('Encryption Seed', 32, '0 indicates clear payload');
  if (seedField && seedField.value !== 0n) {
    const seedHex = seedField.field.hex ?? seedField.value.toString(16);
    seedField.field.note = `Non-zero seed (${seedHex}). Decryption not yet implemented.`;
    warnings.push('Encryption seed is non-zero; remaining bytes may require decryption.');
  }

  readField('Checksum (0xFFFF masked)', 16, 'Checksum computed with 0xFFFF placeholder');

  const constantField = readField('Constant 0x80', 8, 'Should equal 128');
  if (constantField) {
    const constValue = Number(constantField.value);
    if (constValue !== 128) {
      warnings.push(`Constant byte expected 128, found ${constValue}.`);
      constantField.field.note = `Unexpected value (${constValue}).`;
    }
  }

  const dbVersionField = readField('Database Version', 7, 'Compare against Max DB version');
  if (dbVersionField) {
    const dbVersion = Number(dbVersionField.value);
    if (debugConfig.maxDatabaseVersion > 0 && dbVersion > debugConfig.maxDatabaseVersion) {
      warnings.push(`Database version ${dbVersion} exceeds configured max ${debugConfig.maxDatabaseVersion}.`);
      dbVersionField.field.note = `Above configured maximum (${debugConfig.maxDatabaseVersion}).`;
    } else if (debugConfig.maxDatabaseVersion === 0) {
      dbVersionField.field.note = 'Set Max DB version to enable validation.';
    }
  }

  if (debugConfig.balanceBits > 0) {
    readField('InventoryBalanceData', debugConfig.balanceBits, `Configured bits: ${debugConfig.balanceBits}`);
  }

  if (debugConfig.inventoryBits > 0) {
    readField('InventoryData', debugConfig.inventoryBits, `Configured bits: ${debugConfig.inventoryBits}`);
  }

  if (debugConfig.manufacturerBits > 0) {
    readField('ManufacturerData', debugConfig.manufacturerBits, `Configured bits: ${debugConfig.manufacturerBits}`);
  }

  readField('Item Level', 7);

  const partCountField = readField('Part Count', 6);
  const partCount = partCountField ? Number(partCountField.value) : 0;

  if (partCount > 0) {
    const partBits = debugConfig.partBits || debugConfig.inventoryBits;
    if (partBits > 0) {
      for (let i = 0; i < partCount; i++) {
        if (stopReason) break;
        readField(`Part[${i}]`, partBits, `Configured bits: ${partBits}`);
      }
    } else {
      warnings.push('Part entries not parsed: set Part entry bits in Debug Inspector.');
    }
  }

  const genericCountField = readField('Generic Part Count', 4);
  const genericCount = genericCountField ? Number(genericCountField.value) : 0;

  if (genericCount > 0) {
    const genericBits = debugConfig.genericPartBits || debugConfig.inventoryBits;
    if (genericBits > 0) {
      for (let i = 0; i < genericCount; i++) {
        if (stopReason) break;
        readField(`GenericPart[${i}]`, genericBits, `Configured bits: ${genericBits}`);
      }
    } else {
      warnings.push('Generic parts not parsed: set Generic part bits in Debug Inspector.');
    }
  }

  const extraByteCountField = readField('Extra Data Byte Count', 8);
  const extraByteCount = extraByteCountField ? Number(extraByteCountField.value) : 0;

  if (extraByteCount > 0) {
    for (let i = 0; i < extraByteCount; i++) {
      if (stopReason) break;
      readField(`ExtraData[${i}]`, 8);
    }
  }

  const reservedField = readField('Reserved (should be 0)', 4, 'Abort if non-zero');
  if (reservedField && reservedField.value !== 0n) {
    warnings.push('Reserved bits are non-zero; unknown format beyond this point.');
    reservedField.field.note = `Unexpected value (${reservedField.field.value}).`;
  }

  if (serialVersion !== null && serialVersion >= 4) {
    readField('Anointment Reroll Count', 8);
  }

  if (serialVersion !== null && serialVersion >= 5) {
    readField('Chaos Level', 7);
  }

  const remainderBits = Math.max(totalBits - cursor, 0);
  const remainderBitsValue = remainderBits > 0 ? bitString.slice(cursor) : '';

  if (!stopReason) {
    if (remainderBits >= 8) {
      warnings.push(`More than 8 trailing bits remain (${remainderBits}).`);
    }
    if (remainderBitsValue.includes('1')) {
      warnings.push('Trailing bits contain non-zero data.');
    }
  }

  return {
    fields,
    warnings,
    stopReason,
    remainderBits,
    remainderBitsValue,
    consumedBits: cursor,
    totalBits,
    serialVersion,
    bitString
  };
});

const manualBitPreview = computed<ManualBitPreview | null>(() => {
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) {
    return null;
  }

  const total = bitString.length;
  if (total === 0) {
    return null;
  }

  const start = Math.max(0, Math.min(manualBitStart.value, total));
  const length = Math.max(0, manualBitLength.value);

  let selection = '';
  let selectionWithoutContinuationBits = ''; // For value calculations
  let actualEnd = start;

  // If continuation bit mode is enabled, read chunks until continuation bit is 0
  if (useContinuationBit.value && length > 0) {
    let cursor = start;
    let continueBit = 1;

    while (continueBit === 1 && cursor < total) {
      // Read the chunk
      const chunkEnd = Math.min(total, cursor + length);
      const chunk = bitString.slice(cursor, chunkEnd);

      if (chunk.length === 0) {
        break;
      }

      // Add chunk to both selections
      selection += chunk;
      selectionWithoutContinuationBits += chunk;
      cursor = chunkEnd;

      // Check the continuation bit (next bit after chunk)
      if (cursor < total) {
        continueBit = parseInt(bitString[cursor], 10);
        cursor++; // Move past the continuation bit

        // Add the continuation bit to the selection for visualization only
        selection += continueBit.toString();
        // Don't add continuation bit to the value calculation
      } else {
        break;
      }
    }

    actualEnd = cursor;
  } else {
    // Normal mode: just read the specified length
    actualEnd = Math.min(total, start + length);
    selection = bitString.slice(start, actualEnd);
    selectionWithoutContinuationBits = selection;
  }

  const hasSelection = selection.length > 0;
  const startByteIndex = Math.floor(start / 8);
  const startBitOffset = start % 8;
  const startRowOffset = (Math.floor(startByteIndex / 16) * 16).toString(16).padStart(4, '0').toUpperCase();
  const startColumn = (startByteIndex % 16).toString(16).toUpperCase();
  let endByteIndex = startByteIndex;
  let endBitOffset = startBitOffset;
  let endRowOffset = startRowOffset;
  let endColumn = startColumn;
  let byteSpan = 0;

  if (hasSelection) {
    endByteIndex = Math.floor((actualEnd - 1) / 8);
    endBitOffset = (actualEnd - 1) % 8;
    endRowOffset = (Math.floor(endByteIndex / 16) * 16).toString(16).padStart(4, '0').toUpperCase();
    endColumn = (endByteIndex % 16).toString(16).toUpperCase();
    byteSpan = endByteIndex - startByteIndex + 1;
  }

  const serialPrefix = decodedItem.value?.originalPrefix ?? '';
  const payload = decodedItem.value?.originalPayload ?? '';
  const serialPrefixLength = serialPrefix.length;
  const fullSerial = `${serialPrefix}${payload}`;
  const serialLength = fullSerial.length;
  const originalBinary = decodedItem.value?.originalBinary ?? new Uint8Array();
  const totalBytes = originalBinary.length;
  const fullChunks = Math.floor(totalBytes / 4);
  const remainderBytes = totalBytes % 4;
  const totalChunks = remainderBytes > 0 ? fullChunks + 1 : fullChunks;

  const chunkCharLength = (chunkIndex: number): number => {
    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      return 0;
    }
    if (chunkIndex < fullChunks) {
      return 5;
    }
    if (remainderBytes > 0 && chunkIndex === fullChunks) {
      return remainderBytes + 1;
    }
    return 0;
  };

  const chunkCharOffset = (chunkIndex: number): number => {
    if (chunkIndex <= 0) {
      return 0;
    }
    let offset = 0;
    const capped = Math.min(Math.max(chunkIndex, 0), totalChunks);
    for (let i = 0; i < capped; i += 1) {
      offset += chunkCharLength(i);
    }
    return offset;
  };

  let serialChunkStart = -1;
  let serialChunkEnd = -1;
  if (hasSelection && totalChunks > 0) {
    const rawChunkStart = Math.floor(startByteIndex / 4);
    const rawChunkEnd = Math.floor(endByteIndex / 4);
    serialChunkStart = Math.max(0, Math.min(rawChunkStart, totalChunks - 1));
    serialChunkEnd = Math.max(serialChunkStart, Math.min(rawChunkEnd, totalChunks - 1));
  }

  let serialCharStart = -1;
  let serialCharEnd = -1;
  if (serialChunkStart >= 0 && serialChunkEnd >= serialChunkStart) {
    const charOffset = chunkCharOffset(serialChunkStart);
    let charLength = 0;
    for (let i = serialChunkStart; i <= serialChunkEnd; i += 1) {
      charLength += chunkCharLength(i);
    }
    if (charLength > 0) {
      serialCharStart = serialPrefixLength + charOffset;
      serialCharEnd = serialPrefixLength + charOffset + charLength - 1;
    }
  }

  const hasPayload = serialLength > 0;
  const serialHasRange = hasPayload && serialCharStart >= 0 && serialCharEnd >= serialCharStart;
  let serialPreviewPrefix = '';
  let serialPreviewSelection = '';
  let serialPreviewSuffix = '';

  if (serialHasRange) {
    const safeStart = Math.max(0, Math.min(serialCharStart, serialLength));
    const safeEnd = Math.max(safeStart, Math.min(serialCharEnd + 1, serialLength));
    serialPreviewPrefix = fullSerial.slice(0, safeStart);
    serialPreviewSelection = fullSerial.slice(safeStart, safeEnd);
    serialPreviewSuffix = fullSerial.slice(safeEnd);
  } else {
    serialPreviewPrefix = fullSerial;
    serialPreviewSelection = '';
    serialPreviewSuffix = '';
  }

  if (!hasSelection) {
    return {
      prefix: bitString.slice(0, start),
      selection: '',
      suffix: bitString.slice(start),
      valueHex: '—',
      valueDec: '—',
      valueDecSigned: '—',
      valueHexLE: '—',
      valueDecLE: '—',
      valueDecLESigned: '—',
      valueDecInverted: '—',
      valueDecInvertedLE: '—',
      byteLength: 0,
      byteSpan,
      start,
      length: 0,
      startByteIndex,
      endByteIndex,
      startBitOffset,
      endBitOffset,
      startRowOffset,
      endRowOffset,
      startColumn,
      endColumn,
      serialCharStart,
      serialCharEnd,
      serialChunkStart,
      serialChunkEnd,
      serialLength,
      serialPrefixLength,
      serialPreviewPrefix,
      serialPreviewSelection,
      serialPreviewSuffix,
      selectionWithoutContinuationBits: '',
      useContinuationBit: useContinuationBit.value,
      continuationBitlength: length
    };
  }

  const prefix = bitString.slice(0, start);
  const suffix = bitString.slice(actualEnd);

  // Use selectionWithoutContinuationBits for all value calculations
  const valueString = selectionWithoutContinuationBits;
  const valueBig = bitsToBigInt(valueString);

  // Calculate signed value for BE (two's complement)
  const bitLength = valueString.length;
  const signBit = valueString[0] === '1';
  let valueDecSigned: string;
  if (signBit && bitLength > 0) {
    // Negative number in two's complement
    const maxValue = 1n << BigInt(bitLength);
    const signedValue = valueBig - maxValue;
    valueDecSigned = signedValue.toString(10);
  } else {
    valueDecSigned = valueBig.toString(10);
  }

  // Calculate byte length based on value string (without continuation bits)
  const valueBitLength = valueString.length;
  const valueByteLength = valueBitLength % 8 === 0 ? valueBitLength / 8 : 0;

  // Calculate LE values for all byte lengths >= 1
  let valueHexLE: string;
  let valueDecLE: string;
  let valueDecLESigned: string;

  if (valueByteLength >= 1) {
    const bytes = bitsToByteArray(valueString);
    let leValue = 0n;
    for (let i = 0; i < bytes.length; i++) {
      leValue += BigInt(bytes[i]) << BigInt(8 * i);
    }
    const expectedHexLength = bytes.length * 2;
    valueHexLE = `0x${leValue.toString(16).padStart(expectedHexLength, '0').toUpperCase()}`;
    valueDecLE = leValue.toString(10);

    // Calculate signed LE
    const leBits = bytes.map(b => b.toString(2).padStart(8, '0')).reverse().join('');
    const leSignBit = leBits[0] === '1';
    if (leSignBit && bitLength > 0) {
      const maxValue = 1n << BigInt(bitLength);
      const signedValue = leValue - maxValue;
      valueDecLESigned = signedValue.toString(10);
    } else {
      valueDecLESigned = leValue.toString(10);
    }
  } else {
    valueHexLE = '—';
    valueDecLE = '—';
    valueDecLESigned = '—';
  }

  // Calculate inverted values (reverse bit order: first bit becomes last)
  const invertedSelection = valueString.split('').reverse().join('');
  const invertedValueBig = bitsToBigInt(invertedSelection);
  const valueDecInverted = invertedValueBig.toString(10);

  // Calculate inverted LE
  let valueDecInvertedLE: string;
  if (valueByteLength >= 1) {
    const invertedBytes = bitsToByteArray(invertedSelection);
    let invertedLeValue = 0n;
    for (let i = 0; i < invertedBytes.length; i++) {
      invertedLeValue += BigInt(invertedBytes[i]) << BigInt(8 * i);
    }
    valueDecInvertedLE = invertedLeValue.toString(10);
  } else {
    valueDecInvertedLE = '—';
  }

  return {
    prefix,
    selection,
    suffix,
    valueHex: bitsToHexString(valueString) ?? '0x0',
    valueDec: valueBig.toString(10),
    valueDecSigned,
    valueHexLE,
    valueDecLE,
    valueDecLESigned,
    valueDecInverted,
    valueDecInvertedLE,
    byteLength: valueByteLength,
    byteSpan,
    start,
    length: selection.length,
    startByteIndex,
    endByteIndex,
    startBitOffset,
    endBitOffset,
    startRowOffset,
    endRowOffset,
    startColumn,
    endColumn,
    serialCharStart,
    serialCharEnd,
    serialChunkStart,
    serialChunkEnd,
    serialLength,
    serialPrefixLength,
    serialPreviewPrefix,
    serialPreviewSelection,
    serialPreviewSuffix,
    selectionWithoutContinuationBits,
    useContinuationBit: useContinuationBit.value,
    continuationBitlength: length
  };
});

const selectedByteIndices = computed(() => {
  const preview = manualBitPreview.value;
  if (!preview || preview.length <= 0) {
    return new Set<number>();
  }
  const set = new Set<number>();
  for (let i = preview.startByteIndex; i <= preview.endByteIndex; i += 1) {
    set.add(i);
  }
  return set;
});

const formattedBitSelection = computed(() => {
  const preview = manualBitPreview.value;
  if (!preview || !useContinuationBit.value || !preview.selection) {
    return null;
  }

  // Parse the selection to identify chunks and continuation bits
  const length = manualBitLength.value;
  const selection = preview.selection;
  const segments: { text: string; isContinuation: boolean }[] = [];

  let i = 0;
  while (i < selection.length) {
    // Read chunk
    const chunk = selection.slice(i, i + length);
    if (chunk.length > 0) {
      segments.push({ text: chunk, isContinuation: false });
      i += chunk.length;
    }

    // Read continuation bit if present
    if (i < selection.length) {
      segments.push({ text: selection[i], isContinuation: true });
      i++;
    }
  }

  return segments;
});

function getHexCellHighlight(byteIndex: number, changed: boolean): string {
  if ((manualBitPreview.value?.length ?? 0) > 0 && selectedByteIndices.value.has(byteIndex)) {
    return 'bg-accent/30 text-primary-foreground font-semibold rounded';
  }
  if (changed) {
    return 'bg-red-500/20 text-red-600 font-semibold rounded';
  }
  return 'text-foreground';
}

function getAsciiHighlight(byteIndex: number, changed: boolean): string {
  if ((manualBitPreview.value?.length ?? 0) > 0 && selectedByteIndices.value.has(byteIndex)) {
    return 'bg-accent/30 text-accent-foreground font-semibold rounded';
  }
  if (changed) {
    return 'bg-red-500/20 text-red-600 font-semibold rounded';
  }
  return '';
}

watch(
  () => debugAnalysis.value.totalBits,
  (totalBits) => {
    if (totalBits <= 0) {
      manualBitStart.value = 0;
      manualBitLength.value = 0;
      return;
    }

    if (manualBitLength.value === 0) {
      manualBitLength.value = Math.min(16, totalBits);
    }

    if (manualBitStart.value > totalBits) {
      manualBitStart.value = Math.max(0, totalBits - Math.max(manualBitLength.value, 0));
    }
  }
);

watch(manualBitStart, (value) => {
  if (!Number.isFinite(value) || value < 0) {
    manualBitStart.value = 0;
  }
});

watch(manualBitLength, (value) => {
  if (!Number.isFinite(value) || value < 0) {
    manualBitLength.value = 0;
  }
});

// Sync editing value fields with manualBitPreview
watch(manualBitPreview, (preview) => {
  if (preview) {
    editingValueUnsignedBE.value = preview.valueDec;
    editingValueUnsignedLE.value = preview.valueDecLE;
    editingValueInvertedBE.value = preview.valueDecInverted;
    editingValueInvertedLE.value = preview.valueDecInvertedLE;
    editingBitsValue.value = preview.selection || '';
  } else {
    editingValueUnsignedBE.value = '';
    editingValueUnsignedLE.value = '';
    editingValueInvertedBE.value = '';
    editingValueInvertedLE.value = '';
    editingBitsValue.value = '';
  }
}, { immediate: true });

// Watch for flipBits changes to re-decode
watch(flipBits, () => {
  if (serialInput.value) {
    // Reset original binary data so the re-decoded data becomes the new baseline
    originalBinaryData.value = null;
    handleDecode();
  }
});

// Watch for prop changes
watch(
  () => props.serial,
  (newSerial) => {
    serialInput.value = newSerial
    originalSerial.value = newSerial
    handleDecode()
  },
  { immediate: true }
)

// Handlers
function handleByteClick(byteIndex: number) {
  if (!decodedItem.value || decodedItem.value.itemType === 'error') return;

  editingByteIndex.value = byteIndex;
  editingByteValue.value = decodedItem.value.originalBinary[byteIndex].toString(16).padStart(2, '0').toUpperCase();

  // Focus the input on next tick
  nextTick(() => {
    const input = document.querySelector('input[maxlength="2"]') as HTMLInputElement;
    if (input) {
      input.select();
    }
  });
}

function handleByteEditComplete() {
  if (editingByteIndex.value === null || !decodedItem.value || decodedItem.value.itemType === 'error') {
    editingByteIndex.value = null;
    return;
  }

  // Validate hex input
  const hexValue = editingByteValue.value.trim();
  if (!/^[0-9A-Fa-f]{1,2}$/.test(hexValue)) {
    // Invalid hex, cancel edit
    editingByteIndex.value = null;
    return;
  }

  const newByteValue = parseInt(hexValue, 16);
  const byteIndex = editingByteIndex.value;

  const currentItem = decodedItem.value;
  const newBinary = new Uint8Array(currentItem.originalBinary);
  newBinary[byteIndex] = newByteValue;

  try {
    const newSerial = bitPackEncode(
      newBinary,
      currentItem.originalPrefix,
      currentItem.originalPayload,
      currentItem.dataPositions,
      currentItem.charOffsets,
      flipBits.value
    );
    serialInput.value = newSerial;

    // Re-decode to update everything
    const reDecoded = decodeItemSerial(newSerial, flipBits.value);
    if (reDecoded.itemType !== 'error') {
      decodedItem.value = reDecoded;

      // Update editable stats
      editableStats.value = {
        primaryStat: reDecoded.stats.primaryStat,
        secondaryStat: reDecoded.stats.secondaryStat,
        level: reDecoded.stats.level,
        rarity: reDecoded.stats.rarity,
        manufacturer: reDecoded.stats.manufacturer,
        itemClass: reDecoded.stats.itemClass
      };

      serialUpdatedFromStats.value = true;
      setTimeout(() => {
        serialUpdatedFromStats.value = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to re-encode after byte edit:', error);
  }

  editingByteIndex.value = null;
}

function handleByteEditCancel() {
  editingByteIndex.value = null;
}

function handleFieldEditStart(field: StructureField) {
  editingFieldId.value = field.id;
  // Use the decoded value directly (reversal already applied during decode)
  editingFieldValue.value = field.value;
  
  nextTick(() => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function handleFieldEditComplete() {
  if (editingFieldId.value === null || !decodedItem.value || decodedItem.value.itemType === 'error') {
    editingFieldId.value = null;
    return;
  }

  const field = structureFields.value.find(f => f.id === editingFieldId.value);
  if (!field) {
    editingFieldId.value = null;
    return;
  }

  // Parse the new value
  let newValue: number;
  try {
    newValue = parseInt(editingFieldValue.value.trim(), 10);
    if (isNaN(newValue) || newValue < 0) {
      editingFieldId.value = null;
      return;
    }
  } catch {
    editingFieldId.value = null;
    return;
  }

  // Get current bit string
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) {
    editingFieldId.value = null;
    return;
  }

  let newBits: string;
  const originalFieldLength = field.bitEnd - field.bitStart + 1;
  
  if (field.type.startsWith('varint')) {
    // Handle varint encoding with possible extension/shrinking
    const chunkSize = field.length || 4;
    // Pass the reverse flag to encoder so it matches game's format
    newBits = encodeVarint(newValue, chunkSize, field.reverse || false);
  } else {
    // Handle fixed-length bits field
    const bitLength = field.bitEnd - field.bitStart + 1;
    let valueBits = newValue.toString(2);
    
    // Apply reversal if needed
    if (field.reverse) {
      valueBits = valueBits.split('').reverse().join('');
    }
    
    // Pad or truncate to exact length
    if (valueBits.length < bitLength) {
      valueBits = valueBits.padStart(bitLength, '0');
    } else if (valueBits.length > bitLength) {
      console.warn(`Value ${newValue} requires ${valueBits.length} bits but field only has ${bitLength} bits. Truncating.`);
      valueBits = valueBits.slice(valueBits.length - bitLength);
    }
    
    newBits = valueBits;
  }

  // Replace the bits in the bit string, accounting for length changes
  // Remove the original field bits (using originalFieldLength) and insert the new bits
  const afterOriginalField = field.bitStart + originalFieldLength;
  const newBitString = bitString.slice(0, field.bitStart) + newBits + bitString.slice(afterOriginalField);

  // Convert back to bytes - maintain original byte array size
  const originalByteCount = decodedItem.value.originalBinary.length;
  const maxBits = originalByteCount * 8;
  
  // Truncate or pad the bit string to match original byte count
  let finalBitString: string;
  if (newBitString.length > maxBits) {
    // Varint grew beyond available space - truncate trailing bits
    console.warn(`Bit string grew beyond original bounds (${newBitString.length} > ${maxBits}). Truncating.`);
    finalBitString = newBitString.slice(0, maxBits);
  } else if (newBitString.length < maxBits) {
    // Varint shrunk - pad with zeros at the end to maintain byte array size
    console.warn(`Bit string shrunk below original bounds (${newBitString.length} < ${maxBits}). Padding.`);
    finalBitString = newBitString.padEnd(maxBits, '0');
  } else {
    finalBitString = newBitString;
  }
  
  const newBytes = new Uint8Array(originalByteCount);
  for (let i = 0; i < originalByteCount; i++) {
    const start = i * 8;
    const byteBits = finalBitString.slice(start, start + 8);
    newBytes[i] = parseInt(byteBits, 2);
  }

  // Re-encode to serial
  try {
    const newSerial = bitPackEncode(
      newBytes,
      decodedItem.value.originalPrefix,
      decodedItem.value.originalPayload,
      decodedItem.value.dataPositions,
      decodedItem.value.charOffsets,
      flipBits.value
    );
    serialInput.value = newSerial;

    // Re-decode to update everything
    const reDecoded = decodeItemSerial(newSerial, flipBits.value);
    if (reDecoded.itemType !== 'error') {
      decodedItem.value = reDecoded;
      editableStats.value = {
        primaryStat: reDecoded.stats.primaryStat,
        secondaryStat: reDecoded.stats.secondaryStat,
        level: reDecoded.stats.level,
        rarity: reDecoded.stats.rarity,
        manufacturer: reDecoded.stats.manufacturer,
        itemClass: reDecoded.stats.itemClass
      };
    }
  } catch (error) {
    console.error('Failed to update field:', error);
  }

  editingFieldId.value = null;
}

function handleFieldEditCancel() {
  editingFieldId.value = null;
}

function handleFieldValueChange(field: StructureField, newValueStr: string) {
  if (!decodedItem.value || decodedItem.value.itemType === 'error') {
    return;
  }

  // Parse the new value
  let newValue: number;
  try {
    newValue = parseInt(newValueStr.trim(), 10);
    if (isNaN(newValue) || newValue < 0) {
      return;
    }
  } catch {
    return;
  }

  // Get current bit string
  const bitString = debugAnalysis.value.bitString;
  if (!bitString) {
    return;
  }

  let newBits: string;
  const originalFieldLength = field.bitEnd - field.bitStart + 1;
  
  if (field.type.startsWith('varint')) {
    // Handle varint encoding with possible extension/shrinking
    const chunkSize = field.length || 4;
    // Pass the reverse flag to encoder so it matches game's format
    newBits = encodeVarint(newValue, chunkSize, field.reverse || false);
    console.log(`[CHANGE-ENCODE] field="${field.name}" value=${newValue} → bits="${newBits}" (reverse=${field.reverse})`);
  } else {
    // Handle fixed-length bits field
    const bitLength = field.bitEnd - field.bitStart + 1;
    let valueBits = newValue.toString(2);
    
    // Apply reversal if needed
    if (field.reverse) {
      valueBits = valueBits.split('').reverse().join('');
    }
    
    // Pad or truncate to exact length
    if (valueBits.length < bitLength) {
      valueBits = valueBits.padStart(bitLength, '0');
    } else if (valueBits.length > bitLength) {
      console.warn(`Value ${newValue} requires ${valueBits.length} bits but field only has ${bitLength} bits. Truncating.`);
      valueBits = valueBits.slice(valueBits.length - bitLength);
    }
    
    newBits = valueBits;
  }

  // Replace the bits in the bit string, accounting for length changes
  // Remove the original field bits (using originalFieldLength) and insert the new bits
  const afterOriginalField = field.bitStart + originalFieldLength;
  const newBitString = bitString.slice(0, field.bitStart) + newBits + bitString.slice(afterOriginalField);
  console.log(`[CHANGE-BITSTRING] oldBits="${bitString.slice(field.bitStart, afterOriginalField)}" → newBits="${newBits}"`);
  console.log(`[CHANGE-BITSTRING] field.bitStart=${field.bitStart}, newBits.length=${newBits.length}, totalLength=${newBitString.length}`);

  // Convert back to bytes - maintain original byte array size
  const originalByteCount = decodedItem.value.originalBinary.length;
  const maxBits = originalByteCount * 8;
  
  // Truncate or pad the bit string to match original byte count
  let finalBitString: string;
  if (newBitString.length > maxBits) {
    // Varint grew beyond available space - truncate trailing bits
    console.warn(`Bit string grew beyond original bounds (${newBitString.length} > ${maxBits}). Truncating.`);
    finalBitString = newBitString.slice(0, maxBits);
  } else if (newBitString.length < maxBits) {
    // Varint shrunk - pad with zeros at the end to maintain byte array size
    finalBitString = newBitString.padEnd(maxBits, '0');
  } else {
    finalBitString = newBitString;
  }
  
  const newBytes = new Uint8Array(originalByteCount);
  for (let i = 0; i < originalByteCount; i++) {
    const start = i * 8;
    const byteBits = finalBitString.slice(start, start + 8);
    newBytes[i] = parseInt(byteBits, 2);
  }
  console.log(`[CHANGE-BYTES] Level field bits (40-49): "${finalBitString.slice(40, 50)}"`);
  console.log(`[CHANGE-BYTES] Byte 5 (bits 40-47): "${finalBitString.slice(40, 48)}" = ${parseInt(finalBitString.slice(40, 48), 2)}`);
  console.log(`[CHANGE-BYTES] Byte 6 (bits 48-55): "${finalBitString.slice(48, 56)}" = ${parseInt(finalBitString.slice(48, 56), 2)}`);

  // Re-encode to serial
  try {
    const newSerial = bitPackEncode(
      newBytes,
      decodedItem.value.originalPrefix,
      decodedItem.value.originalPayload,
      decodedItem.value.dataPositions,
      decodedItem.value.charOffsets,
      flipBits.value
    );
    serialInput.value = newSerial;

    // Re-decode to update everything
    const reDecoded = decodeItemSerial(newSerial, flipBits.value);
    if (reDecoded.itemType !== 'error') {
      decodedItem.value = reDecoded;
      editableStats.value = {
        primaryStat: reDecoded.stats.primaryStat,
        secondaryStat: reDecoded.stats.secondaryStat,
        level: reDecoded.stats.level,
        rarity: reDecoded.stats.rarity,
        manufacturer: reDecoded.stats.manufacturer,
        itemClass: reDecoded.stats.itemClass
      };
    }
  } catch (error) {
    console.error('Failed to update field:', error);
  }
}

function encodeVarint(value: number, chunkSize: number, reverse: boolean): string {
  // Convert value to binary
  let valueBits = value.toString(2);
  
  // Encode as varint with continuation bits
  let result = '';
  const chunks: string[] = [];
  
  // Split into chunks (from right to left, least significant first)
  while (valueBits.length > 0) {
    let chunk: string;
    if (valueBits.length <= chunkSize) {
      // Last chunk - take remaining bits and pad to full chunkSize
      chunk = valueBits.padStart(chunkSize, '0');
      valueBits = '';
    } else {
      // Take rightmost chunkSize bits
      chunk = valueBits.slice(-chunkSize);
      valueBits = valueBits.slice(0, -chunkSize);
    }
    chunks.unshift(chunk);
  }
  
  // If no chunks, add a zero chunk
  if (chunks.length === 0) {
    chunks.push('0'.repeat(chunkSize));
  }
  
  // If reverse flag, reverse the chunk array order AND reverse each chunk's bits
  if (reverse) {
    chunks.reverse();
  }
  
  console.log(`[ENCODE-VARINT] value=${value} → chunks=${JSON.stringify(chunks)} (reverse=${reverse})`);
  
  // Add continuation bits (1 for all but the last chunk, 0 for the last)
  for (let i = 0; i < chunks.length; i++) {
    let chunkBits = chunks[i];
    const continuationBit = i < chunks.length - 1 ? '1' : '0';
    
    // If reverse flag, reverse each chunk's bits
    if (reverse) {
      chunkBits = chunkBits.split('').reverse().join('');
    }
    
    result += chunkBits + continuationBit;
  }
  
  return result;
}

function handleDecode() {
  if (!serialInput.value) {
    decodedItem.value = null
    decodeError.value = ''
    return
  }

  try {
    const decoded = decodeItemSerial(serialInput.value, flipBits.value)

    // Store original binary data on first decode
    if (!originalBinaryData.value && decoded.itemType !== 'error') {
      originalBinaryData.value = new Uint8Array(decoded.originalBinary);
    }

    decodedItem.value = decoded
    decodeError.value = ''
    serialUpdatedFromStats.value = false

    if (decoded.itemType !== 'error') {
      // Populate editable stats from decoded item
      editableStats.value = {
        primaryStat: decoded.stats.primaryStat,
        secondaryStat: decoded.stats.secondaryStat,
        level: decoded.stats.level,
        rarity: decoded.stats.rarity,
        manufacturer: decoded.stats.manufacturer,
        itemClass: decoded.stats.itemClass
      }

      // Store original stats for comparison
      originalStats.value = { ...editableStats.value }
    }
  } catch (error) {
    decodeError.value = error instanceof Error ? error.message : 'Failed to decode serial'
    decodedItem.value = null
  }
}

// TODO: Re-enable when stats editor is uncommented in template
// function handleStatsChange() {
//   if (!decodedItem.value || decodedItem.value.itemType === 'error') {
//     return
//   }
//   
//   try {
//     // Create a modified item with edited stats
//     const modifiedItem: DecodedItem = {
//       ...decodedItem.value,
//       stats: {
//         ...decodedItem.value.stats,
//         ...editableStats.value
//       }
//     }
//     
//     // Re-encode and update the serial
//     const newSerial = encodeItemSerial(modifiedItem, flipBits.value)
//     serialInput.value = newSerial
//     
//     // Decode the new serial to update the binary view
//     const newDecoded = decodeItemSerial(newSerial, flipBits.value)
//     decodedItem.value = newDecoded
//     
//     serialUpdatedFromStats.value = true
//     
//     // Hide the message after 2 seconds
//     setTimeout(() => {
//       serialUpdatedFromStats.value = false
//     }, 2000)
//   } catch (error) {
//     console.error('Failed to encode serial from stats:', error)
//     decodeError.value = 'Failed to update serial from stats'
//   }
// }

function handleSerialInput() {
  // Decode immediately on input to update the view
  handleDecode()
}

function handleSerialManualEdit() {
  // If user manually edits the serial, re-decode it
  if (serialInput.value !== originalSerial.value) {
    handleDecode()
  }
}

function handleResetAll() {
  serialInput.value = originalSerial.value
  editableStats.value = { ...originalStats.value }
  originalBinaryData.value = null
  handleDecode()
  serialUpdatedFromStats.value = false
}

function handleRevertToOriginal() {
  // Revert to the original serial that was passed in
  if (originalSerial.value) {
    serialInput.value = originalSerial.value
    originalBinaryData.value = null
    handleDecode()
    serialUpdatedFromStats.value = false
  }
}

function handleClose() {
  emit('close')
}

function handleSave() {
  emit('save', {
    serial: serialInput.value,
    flags: props.flags,
    state_flags: props.state_flags
  })
  handleClose()
}

function copyToClipboard(text?: string | null) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Success - could show a notification if needed
    })
    .catch(() => {
      // Error - could show an error message if needed
    })
}
</script>
<script lang="ts">
// Ensure SFC has a default export for TS/consumers
export default {}
</script>

<style scoped>
/* Custom scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: hsl(var(--accent) / 0.6);
}

/* Firefox scrollbar styling */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) hsl(var(--muted) / 0.3);
}

/* Ensure modal container fills available space properly */
.modal-container {
  max-height: 100vh;
  max-height: 100dvh; /* Dynamic viewport height for mobile */
  overflow: hidden; /* Prevent outer overflow, let inner content scroll */
  border-radius: 0.75rem; /* Match rounded-xl */
  display: flex;
  flex-direction: column;
}
</style>
