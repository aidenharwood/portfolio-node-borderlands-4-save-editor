<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-0"
      leave-to-class="opacity-100">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="handleClose">
        <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200"
          leave-from-class="opacity-0 scale-95" leave-to-class="opacity-100 scale-100">
          <div v-if="show"
            class="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border/60 bg-background shadow-2xl">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-accent/20 rounded-md flex items-center justify-center">
                  <i class="pi pi-code text-accent"></i>
                </div>
                <div>
                  <h2 class="text-lg font-semibold">{{ decodedItem?.itemType ? `Item Editor (Type: ${decodedItem.itemType})` : 'Serial Editor' }}</h2>
                  <p class="text-sm text-muted-foreground">{{ decodedItem ? 'Edit item stats and serial' : 'Enter a serial to decode' }}</p>
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
            <div class="max-h-[calc(90vh-140px)] overflow-y-auto p-6 space-y-4">
              <!-- Serial Input -->
              <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-foreground">Item Serial</span>
                  <div class="flex items-center gap-2">
                    <button type="button" @click="handleRevertToOriginal" v-if="originalSerial && serialInput !== originalSerial"
                      :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-2', 'bg-accent/10 text-accent']" title="Revert to original serial">
                      <i class="pi pi-refresh text-xs"></i>
                      Revert
                    </button>
                    <button type="button" @click="handleResetAll" v-if="hasAnyChanges"
                      :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-2', 'bg-destructive/10 text-destructive']" title="Reset all changes">
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
                
                <!-- Reserialization Check -->
                <div v-if="decodedItem && decodedItem.itemType !== 'error'" class="mt-3 text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-muted-foreground font-medium">Reserialization Check:</span>
                    <span v-if="reserializeResult.matches" class="flex items-center gap-1 text-green-600">
                      <i class="pi pi-check-circle"></i>
                      Success
                    </span>
                    <span v-else class="flex items-center gap-1 text-amber-600">
                      <i class="pi pi-exclamation-triangle"></i>
                      Failure
                    </span>
                  </div>
                  <div v-if="!reserializeResult.matches" class="space-y-1">
                    <div class="flex items-start gap-2">
                      <span class="text-muted-foreground w-20 flex-shrink-0">Original:</span>
                      <code class="flex-1 font-mono text-foreground bg-muted/30 px-2 py-1 rounded break-all">{{ serialInput }}</code>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="text-muted-foreground w-20 flex-shrink-0">Reserialized:</span>
                      <code class="flex-1 font-mono text-foreground bg-muted/30 px-2 py-1 rounded break-all">{{ reserializeResult.reserialized }}</code>
                    </div>
                    <div v-if="reserializeResult.firstDiffPos !== -1" class="flex items-start gap-2 text-amber-600">
                      <span class="w-20 flex-shrink-0">Diff at pos:</span>
                      <span class="font-mono">{{ reserializeResult.firstDiffPos }} - '{{ reserializeResult.originalChar }}' vs '{{ reserializeResult.reserializedChar }}'</span>
                    </div>
                  </div>
                </div>
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
                <div class="rounded-lg border border-border/60 bg-card/60 p-4">
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
                </div>

                <!-- Debug Inspector -->
                <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Debug Inspector</h3>
                      <p class="text-xs text-muted-foreground">Bit-level breakdown to help reverse engineer serial structure.</p>
                    </div>
                    <button type="button"
                      :class="[BUTTON_BASE, 'ml-0', 'rounded-md', 'px-3', 'py-1.5', 'bg-background/80']"
                      @click="showDebugPanel = !showDebugPanel">
                      <i class="pi" :class="showDebugPanel ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                      <span>{{ showDebugPanel ? 'Hide' : 'Show' }}</span>
                    </button>
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
                          <button type="button"
                            v-if="compareSerialInput"
                            class="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30"
                            @click="compareSerialInput = ''">
                            <i class="pi pi-times"></i>
                            Clear
                          </button>
                        </div>
                        <input v-model.trim="compareSerialInput"
                          type="text"
                          placeholder="Paste another serial to compute bit diffs"
                          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-[11px] text-foreground" />
                        <p v-if="compareAnalysis.error" class="text-xs text-destructive flex items-center gap-1">
                          <i class="pi pi-exclamation-triangle"></i>
                          {{ compareAnalysis.error }}
                        </p>
                        <template v-else-if="compareAnalysis.active">
                          <div class="flex flex-wrap items-center gap-3 text-muted-foreground">
                            <span>Base bits: <span class="font-mono text-foreground">{{ debugAnalysis.totalBits }}</span></span>
                            <span>Compare bits: <span class="font-mono text-foreground">{{ compareAnalysis.compareLength }}</span></span>
                            <span>Diff bits: <span class="font-mono text-foreground">{{ compareAnalysis.diffCount }}</span></span>
                            <span v-if="compareAnalysis.firstDiff !== undefined">First diff @ <span class="font-mono text-foreground">{{ compareAnalysis.firstDiff }}</span></span>
                          </div>
                          <div v-if="compareAnalysis.diffSegments.length" class="rounded-md border border-border/40 bg-background/80 overflow-hidden">
                            <table class="w-full text-[11px]">
                              <thead class="bg-muted/40 text-muted-foreground uppercase tracking-wide">
                                <tr>
                                  <th class="px-3 py-2 text-left font-semibold">Range</th>
                                  <th class="px-3 py-2 text-left font-semibold">Length</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="segment in compareSegmentsPreview" :key="segment.start" class="border-t border-border/40">
                                  <td class="px-3 py-1.5 font-mono text-foreground">{{ segment.start }}&ndash;{{ segment.start + segment.length - 1 }}</td>
                                  <td class="px-3 py-1.5 font-mono text-foreground">{{ segment.length }} bits</td>
                                </tr>
                              </tbody>
                            </table>
                            <div v-if="compareHasMoreSegments" class="px-3 py-1 text-xs text-muted-foreground border-t border-border/40">
                              Showing first {{ compareSegmentsPreview.length }} diff segments of {{ compareAnalysis.diffSegments.length }}.
                            </div>
                          </div>
                          <p v-else class="text-xs text-green-700 flex items-center gap-1">
                            <i class="pi pi-check-circle"></i>
                            No bit differences detected.
                          </p>
                        </template>
                        <p v-else class="text-xs text-muted-foreground">Enter a second serial to compare against the currently decoded item.</p>
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
                        <span v-if="debugAnalysis.serialVersion !== null">Serial version: {{ debugAnalysis.serialVersion }}</span>
                        <button type="button"
                          class="ml-auto inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted/30 disabled:opacity-50"
                          @click="copyToClipboard(debugAnalysis.bitString)"
                          :disabled="!debugAnalysis.bitString">
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
                        <div class="flex flex-wrap gap-4 text-muted-foreground">
                          <span>Decimal (BE): <span class="font-mono text-foreground">{{ manualBitPreview?.valueDec ?? '—' }}</span></span>
                          <span>Decimal (LE): <span class="font-mono text-foreground">{{ manualBitPreview?.valueDecLE ?? '—' }}</span></span>
                          <span>Bits: <span class="font-mono text-foreground">{{ manualBitPreview?.length ?? 0 }}</span></span>
                          <span>Bytes: <span class="font-mono text-foreground">{{ manualBitPreview?.byteLength ?? 0 }}</span></span>
                          <span>Byte span: <span class="font-mono text-foreground">{{ manualBitPreview?.byteSpan ?? 0 }}</span></span>
                        </div>
                        <div class="flex flex-wrap gap-4 text-muted-foreground">
                          <span>Start byte: <span class="font-mono text-foreground">{{ formatBytePosition(manualBitPreview, 'start') }}</span></span>
                          <span>End byte: <span class="font-mono text-foreground">{{ formatBytePosition(manualBitPreview, 'end') }}</span></span>
                          <span>Bit offset: <span class="font-mono text-foreground">{{ formatBitOffset(manualBitPreview) }}</span></span>
                        </div>
                        <code class="block max-h-64 overflow-auto font-mono break-all whitespace-pre-wrap rounded bg-card/60 px-2 py-1 text-foreground">
                          <span class="text-muted-foreground">{{ manualBitPreview?.prefix ?? '' }}</span><span class="bg-accent/30 text-accent-foreground font-semibold">{{ manualBitPreview?.selection ?? '' }}</span><span class="text-muted-foreground">{{ manualBitPreview?.suffix ?? '' }}</span>
                        </code>
                        <div class="flex flex-wrap gap-4 text-muted-foreground">
                          <span>Serial chunk: <span class="font-mono text-foreground">{{ formatSerialChunk(manualBitPreview) }}</span></span>
                          <span>Serial chars: <span class="font-mono text-foreground">{{ formatSerialCharRange(manualBitPreview) }}</span></span>
                          <span>Serial length: <span class="font-mono text-foreground">{{ manualBitPreview?.serialLength ?? 0 }}</span></span>
                          <span v-if="(manualBitPreview?.serialPrefixLength ?? 0) > 0">Prefix length: <span class="font-mono text-foreground">{{ manualBitPreview?.serialPrefixLength }}</span></span>
                        </div>
                        <code v-if="manualBitPreview?.serialLength" class="block max-h-40 overflow-auto font-mono break-all whitespace-pre-wrap rounded bg-card/60 px-2 py-1 text-foreground">
                          <span class="text-muted-foreground">{{ manualBitPreview?.serialPreviewPrefix ?? '' }}</span><span class="bg-accent/30 text-accent-foreground font-semibold">{{ manualBitPreview?.serialPreviewSelection ?? '' }}</span><span class="text-muted-foreground">{{ manualBitPreview?.serialPreviewSuffix ?? '' }}</span>
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Hex View -->
                <div class="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Binary Data (Hex View)</h3>
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
                          <span v-for="(byte, idx) in row.bytes" :key="idx"
                            @click="handleByteClick(byte.byteIndex)"
                            :class="[
                              'inline-block w-6 text-center cursor-pointer hover:bg-muted/50 transition-colors',
                              getHexCellHighlight(byte.byteIndex, byte.changed),
                              editingByteIndex === byte.byteIndex ? 'ring-2 ring-primary' : ''
                            ]"
                            :title="byte.changed ? `Changed from 0x${byte.original?.toString(16).padStart(2, '0').toUpperCase()} to 0x${byte.value.toString(16).padStart(2, '0').toUpperCase()}\nClick to edit` : 'Click to edit'">
                            <input v-if="editingByteIndex === byte.byteIndex"
                              ref="byteInputRef"
                              v-model="editingByteValue"
                              @blur="handleByteEditComplete"
                              @keydown.enter="handleByteEditComplete"
                              @keydown.esc="handleByteEditCancel"
                              maxlength="2"
                              class="w-6 text-center bg-primary/20 border-0 outline-none text-foreground font-mono text-xs p-0"
                              style="appearance: none;"
                            />
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
            <div class="flex items-center justify-between border-t border-border/60 bg-card/60 px-6 py-4">
              <div class="text-xs text-muted-foreground">
                <span v-if="decodedItem">Confidence: {{ decodedItem.confidence }}</span>
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
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, reactive } from 'vue'
import { decodeItemSerial, encodeItemSerial, bitPackEncode, bitPackDecode, type DecodedItem, type ItemStats } from '../../lib/utils/serial-utils'

// Props & Emits
interface Props {
  serial: string
  flags?: number
  state_flags?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [payload: { serial: string; flags?: number; state_flags?: number }]
}>()

const show = ref(true)

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
  valueHexLE?: string;
  valueDecLE?: string;
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
}

interface BitDiffSegment {
  start: number;
  length: number;
}

interface CompareAnalysis {
  active: boolean;
  bitString: string;
  totalBits: number;
  diffCount: number;
  diffSegments: BitDiffSegment[];
  firstDiff?: number;
  compareLength: number;
  error?: string;
}

const showDebugPanel = ref(true)

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
const compareSerialInput = ref('')

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

function bytesToBitString(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i].toString(2).padStart(8, '0');
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

const compareAnalysis = computed<CompareAnalysis>(() => {
  const baseBits = debugAnalysis.value.bitString;
  const totalBits = baseBits.length;
  const serial = compareSerialInput.value.trim();

  if (!serial) {
    return {
      active: false,
      bitString: '',
      totalBits,
      diffCount: 0,
      diffSegments: [],
      compareLength: 0
    };
  }

  try {
    const compareDecoded = bitPackDecode(serial);
    const compareBits = bytesToBitString(compareDecoded.data);
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

    return {
      active: true,
      bitString: compareBits,
      totalBits,
      diffCount,
      diffSegments: segments,
      firstDiff,
      compareLength: compareBits.length
    };
  } catch (error) {
    return {
      active: false,
      bitString: '',
      totalBits,
      diffCount: 0,
      diffSegments: [],
      compareLength: 0,
      error: (error as Error).message || 'Failed to decode comparison serial'
    };
  }
});

const compareSegmentsPreview = computed(() => compareAnalysis.value.diffSegments.slice(0, 10));
const compareHasMoreSegments = computed(() => compareAnalysis.value.diffSegments.length > compareSegmentsPreview.value.length);

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
  const rawLength = Math.max(0, manualBitLength.value);
  const end = Math.min(total, start + rawLength);
  const selection = bitString.slice(start, end);
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
    endByteIndex = Math.floor((end - 1) / 8);
    endBitOffset = (end - 1) % 8;
    endRowOffset = (Math.floor(endByteIndex / 16) * 16).toString(16).padStart(4, '0').toUpperCase();
    endColumn = (endByteIndex % 16).toString(16).toUpperCase();
    byteSpan = endByteIndex - startByteIndex + 1;
  }

  const byteLength = selection.length % 8 === 0 ? selection.length / 8 : 0;
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
      valueHexLE: '—',
      valueDecLE: '—',
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
      serialPreviewSuffix
    };
  }

  const prefix = bitString.slice(0, start);
  const suffix = bitString.slice(end);
  const valueBig = bitsToBigInt(selection);
  let valueHexLE: string | undefined;
  let valueDecLE: string | undefined;

  if (byteLength > 1) {
    const bytes = bitsToByteArray(selection);
    let leValue = 0n;
    for (let i = 0; i < bytes.length; i++) {
      leValue += BigInt(bytes[i]) << BigInt(8 * i);
    }
    const expectedHexLength = bytes.length * 2;
    valueHexLE = `0x${leValue.toString(16).padStart(expectedHexLength, '0').toUpperCase()}`;
    valueDecLE = leValue.toString(10);
  }

  return {
    prefix,
    selection,
    suffix,
    valueHex: bitsToHexString(selection) ?? '0x0',
    valueDec: valueBig.toString(10),
    valueHexLE: valueHexLE ?? '—',
    valueDecLE: valueDecLE ?? '—',
    byteLength,
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
    serialPreviewSuffix
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

function getHexCellHighlight(byteIndex: number, changed: boolean): string {
  if ((manualBitPreview.value?.length ?? 0) > 0 && selectedByteIndices.value.has(byteIndex)) {
    return 'bg-accent/30 text-primary-foreground font-semibold rounded';
  }
  if (changed) {
    return 'font-semibold rounded border-1 border-accent/30';
  }
  return 'text-foreground';
}

function getAsciiHighlight(byteIndex: number, changed: boolean): string {
  if ((manualBitPreview.value?.length ?? 0) > 0 && selectedByteIndices.value.has(byteIndex)) {
    return 'bg-accent/30 text-accent-foreground font-semibold rounded';
  }
  if (changed) {
    return 'text-accent-foreground font-semibold rounded';
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

interface ReserializeResult {
  matches: boolean;
  reserialized: string;
  firstDiffPos: number;
  originalChar: string;
  reserializedChar: string;
}

const reserializeResult = computed((): ReserializeResult => {
  const defaultResult: ReserializeResult = {
    matches: true,
    reserialized: '',
    firstDiffPos: -1,
    originalChar: '',
    reserializedChar: ''
  };

  if (!decodedItem.value || decodedItem.value.itemType === 'error' || !serialInput.value) {
    return defaultResult;
  }

  try {
    // Re-encode the decoded item without any modifications
    const reserialized = encodeItemSerial(decodedItem.value);
    const matches = reserialized === serialInput.value;
    
    let firstDiffPos = -1;
    let originalChar = '';
    let reserializedChar = '';

    if (!matches) {
      // Find first difference
      const minLength = Math.min(serialInput.value.length, reserialized.length);
      for (let i = 0; i < minLength; i++) {
        if (serialInput.value[i] !== reserialized[i]) {
          firstDiffPos = i;
          originalChar = serialInput.value[i];
          reserializedChar = reserialized[i];
          break;
        }
      }
      
      // If no char difference found but lengths differ
      if (firstDiffPos === -1 && serialInput.value.length !== reserialized.length) {
        firstDiffPos = minLength;
        originalChar = serialInput.value.length > reserialized.length ? serialInput.value[minLength] : '(end)';
        reserializedChar = reserialized.length > serialInput.value.length ? reserialized[minLength] : '(end)';
      }
    }

    return {
      matches,
      reserialized,
      firstDiffPos,
      originalChar,
      reserializedChar
    };
  } catch (error) {
    return {
      matches: false,
      reserialized: `Error: ${(error as Error).message}`,
      firstDiffPos: -1,
      originalChar: '',
      reserializedChar: ''
    };
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
      currentItem.charOffsets
    );
    serialInput.value = newSerial;
    
    // Re-decode to update everything
    const reDecoded = decodeItemSerial(newSerial);
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

function handleDecode() {
  if (!serialInput.value) {
    decodedItem.value = null
    decodeError.value = ''
    return
  }
  
  try {
    const decoded = decodeItemSerial(serialInput.value)
    
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

function handleStatsChange() {
  if (!decodedItem.value || decodedItem.value.itemType === 'error') {
    return
  }
  
  try {
    // Create a modified item with edited stats
    const modifiedItem: DecodedItem = {
      ...decodedItem.value,
      stats: {
        ...decodedItem.value.stats,
        ...editableStats.value
      }
    }
    
    // Re-encode and update the serial
    const newSerial = encodeItemSerial(modifiedItem)
    serialInput.value = newSerial
    
    // Decode the new serial to update the binary view
    const newDecoded = decodeItemSerial(newSerial)
    decodedItem.value = newDecoded
    
    serialUpdatedFromStats.value = true
    
    // Hide the message after 2 seconds
    setTimeout(() => {
      serialUpdatedFromStats.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to encode serial from stats:', error)
    decodeError.value = 'Failed to update serial from stats'
  }
}

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

