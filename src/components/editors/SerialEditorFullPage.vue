<template>
  <div class="flex h-full flex-col rounded-xl border border-border/60 bg-background">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/60 px-5 py-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-foreground">Borderlands 4 Serial Editor</h2>
        <p class="text-xs text-muted-foreground">
          Serial changes decode automatically. Adjust numeric fields or edit the deserialized string directly.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          :class="[BUTTON_BASE, PRIMARY_BUTTON]"
          @click="handleSave"
          :disabled="saveDisabled"
        >
          <i class="pi pi-save text-[10px]" />
          <span :class="BUTTON_LABEL">Save</span>
        </button>
        <button type="button" :class="BUTTON_BASE" @click="handleReset" :disabled="!decoded">
          <i class="pi pi-refresh text-[10px]" />
          <span :class="BUTTON_LABEL">Reset</span>
        </button>
        <button type="button" :class="BUTTON_BASE" @click="handleRevert" :disabled="!originalSerial">
          <i class="pi pi-undo text-[10px]" />
          <span :class="BUTTON_LABEL">Revert</span>
        </button>
        <button type="button" :class="BUTTON_BASE" @click="handleClose">
          <i class="pi pi-times text-[10px]" />
          <span :class="BUTTON_LABEL">Close</span>
        </button>
      </div>
    </header>

    <div class="flex-1 space-y-4 overflow-y-auto p-5">
      <section class="rounded-lg border border-border/60 bg-card/60 p-3 space-y-3">
        <div class="flex gap-2">
        <input
          v-model="serialInput"
          type="text"
          spellcheck="false"
          class="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="@U..."
        />
            <button type="button" :class="BUTTON_BASE" @click="copyToClipboard(serialInput)">
              <i class="pi pi-copy text-[10px]" />
              Copy
            </button>
        </div>
        <p v-if="decodeError" class="text-xs text-destructive">{{ decodeError }}</p>

        <div v-if="hasSerial" class="space-y-2">
          <div class="flex gap-2">            
          <input
            v-model="deserializedEditor"
            type="text"
            spellcheck="false"
            class="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]}..."
          />
            <button type="button" :class="BUTTON_BASE" @click="copyToClipboard(deserializedEditor)">
              <i class="pi pi-copy text-[10px]" />
              Copy
            </button>
          </div>
          <p v-if="deserializedError" class="text-xs text-destructive">{{ deserializedError }}</p>
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div class="space-y-4">
          <section class="rounded-lg border border-border/60 bg-card/60 p-3 space-y-3" v-if="structureReady">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-medium text-foreground">Item Metadata</h3>
              <span class="text-[11px] text-muted-foreground">
                {{ itemTypeLabel }}
              </span>
            </div>
            <div class="grid gap-2 text-xs md:grid-cols-2">
              <label class="flex flex-col gap-1">
                <span class="text-muted-foreground">Item Type</span>
                <input
                  type="number"
                  :value="itemType"
                  @input="updateItemType(($event.target as HTMLInputElement).value)"
                  class="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-muted-foreground">Version</span>
                <input
                  type="number"
                  :value="version"
                  @input="updateVersion(($event.target as HTMLInputElement).value)"
                  class="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-muted-foreground">Level (Field 1)</span>
                <input
                  type="number"
                  :value="levelValue"
                  @input="updateLevel(($event.target as HTMLInputElement).value)"
                  class="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-muted-foreground">Random Seed (Field 2)</span>
                <input
                  type="number"
                  :value="seedValue"
                  @input="updateSeed(($event.target as HTMLInputElement).value)"
                  class="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          </section>

          <section class="rounded-lg border border-border/60 bg-card/60 p-3 space-y-3" v-if="structureReady">
            <div class="flex items-center justify-between text-sm">
              <h3 class="font-medium text-foreground">Fields</h3>
              <button type="button" :class="BUTTON_BASE" @click="addField">
                <i class="pi pi-plus text-[10px]" />
                Add
              </button>
            </div>
            <div v-if="fields.length === 0" class="rounded-md border border-border/60 bg-background px-3 py-4 text-center text-[11px] text-muted-foreground">
              No fields yet. Add one or edit the deserialized string.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(field, index) in fields"
                :key="field.key"
                class="grid gap-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs md:grid-cols-[90px_minmax(0,1fr)_auto]"
              >
                <label class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-muted-foreground">Id</span>
                  <input
                    type="number"
                    :value="field.id"
                    @input="updateFieldId(field, ($event.target as HTMLInputElement).value)"
                    class="rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-muted-foreground">Value</span>
                  <input
                    type="number"
                    :value="field.value"
                    @input="updateFieldValue(field, ($event.target as HTMLInputElement).value)"
                    class="rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                  />
                </label>
                <div class="flex items-center justify-end">
                  <button
                    type="button"
                    :class="ICON_BUTTON"
                    @click="removeField(index)"
                    aria-label="Remove field"
                  >
                    <i class="pi pi-times text-base" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-4">
          <section class="rounded-lg border border-border/60 bg-card/60 p-3 space-y-3" v-if="structureReady">
            <div class="flex items-center justify-between text-sm">
              <h3 class="font-medium text-foreground">Parts</h3>
              <button type="button" :class="BUTTON_BASE" @click="addPart">
                <i class="pi pi-plus text-[10px]" />
                Add Part
              </button>
            </div>
            <div v-if="parts.length === 0" class="rounded-md border border-border/60 bg-background px-3 py-4 text-center text-[11px] text-muted-foreground">
              No parts defined. Add them here or via the deserialized editor.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(part, index) in parts"
                :key="part.key"
                class="space-y-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <label class="flex items-center gap-1">
                      <span class="text-muted-foreground">Id</span>
                      <input
                        type="number"
                        :value="part.id"
                        @input="updatePartId(part, ($event.target as HTMLInputElement).value)"
                        class="w-20 rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                      />
                    </label>
                    <span class="text-muted-foreground whitespace-nowrap">{{ part.chunks.length }} chunk{{ part.chunks.length === 1 ? '' : 's' }}</span>
                  </div>
                  <button
                    type="button"
                    :class="ICON_BUTTON"
                    @click="removePart(index)"
                    aria-label="Remove part"
                  >
                    <i class="pi pi-times text-base" />
                  </button>
                </div>

                <div class="space-y-1" v-if="part.chunks.length">
                  <div
                    v-for="(chunk, chunkIndex) in part.chunks"
                    :key="`${part.key}-chunk-${chunkIndex}`"
                    class="flex items-center gap-2"
                  >
                    <span class="text-muted-foreground">Chunk {{ chunkIndex + 1 }}</span>
                    <input
                      type="number"
                      :value="chunk"
                      @input="updateChunk(part, chunkIndex, ($event.target as HTMLInputElement).value)"
                      class="w-24 rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      :class="ICON_BUTTON"
                      @click="removeChunk(part, chunkIndex)"
                      aria-label="Remove chunk"
                    >
                      <i class="pi pi-times text-base" />
                    </button>
                  </div>
                </div>

                <button type="button" :class="BUTTON_BASE" @click="addChunk(part)">
                  <i class="pi pi-plus text-[10px]" />
                  Add Chunk
                </button>
              </div>
            </div>
          </section>

          <section v-if="structureReady && encodingError" class="rounded-lg border border-border/60 bg-destructive/10 p-3 text-xs text-destructive">
            {{ encodingError }}
          </section>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DecodedSerial, DeserializedStructure, FieldInfo, PartInfo } from '@/lib/serial-decoder'
import { decodeSerial, buildDeserializedString, parseDeserializedStructure } from '@/lib/serial-decoder'
import { encodeBase85, serialFromString, serialize } from '@/lib/b4s'
import { getItemTypeName } from '@/lib/item-type-map'

interface Props {
  serial: string
  flags?: number
  state_flags?: number
  isModal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isModal: false
})
const emit = defineEmits<{
  close: []
  save: [payload: { serial: string; flags?: number; state_flags?: number }]
}>()

interface EditableField extends FieldInfo {
  key: number
}

interface EditablePart extends PartInfo {
  key: number
  chunks: number[]
}

const BUTTON_BASE = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-3 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10 disabled:opacity-60 disabled:cursor-not-allowed'
const PRIMARY_BUTTON = 'border-accent/60 bg-accent text-accent-foreground hover:bg-accent/90'
const ICON_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10'
const BUTTON_LABEL = 'text-[11px] font-semibold uppercase tracking-wide'

const serialInput = ref<string>('')
const originalSerial = ref<string>('')
const decoded = ref<DecodedSerial | null>(null)
const decodeError = ref<string>('')
const deserializedEditor = ref<string>('')
const deserializedError = ref<string>('')

const itemType = ref<number>(0)
const version = ref<number>(0)
const fields = ref<EditableField[]>([])
const parts = ref<EditablePart[]>([])
const keySeed = ref<number>(0)

let decodeTimer: ReturnType<typeof setTimeout> | null = null
let deserializedTimer: ReturnType<typeof setTimeout> | null = null
let syncingFromStructure = false

function nextKey(): number {
  const key = keySeed.value
  keySeed.value += 1
  return key
}

function normalizeNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (value === null || value === undefined) {
    return 0
  }
  const parsed = Number.parseInt(String(value).trim(), 10)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

function createField(field?: FieldInfo): EditableField {
  return {
    key: nextKey(),
    id: normalizeNumber(field?.id ?? 0),
    value: normalizeNumber(field?.value ?? 0)
  }
}

function createPart(part?: PartInfo): EditablePart {
  return {
    key: nextKey(),
    id: normalizeNumber(part?.id ?? 0),
    chunks: Array.isArray(part?.chunks) ? part.chunks.map((chunk) => normalizeNumber(chunk)) : []
  }
}

function loadStructure(structure: DeserializedStructure) {
  itemType.value = normalizeNumber(structure.itemType)
  version.value = normalizeNumber(structure.version)
  fields.value = structure.fields.map((field) => createField(field))
  parts.value = structure.parts.map((part) => createPart(part))
}

function decodeCurrentSerial(options: { setAsOriginal?: boolean } = {}) {
  const serial = serialInput.value.trim()
  if (serial.length === 0) {
    decodeError.value = 'Serial is empty. Paste or type a serial first.'
    decoded.value = null
    return
  }

  try {
    const result = decodeSerial(serial)
    decoded.value = result
    decodeError.value = ''
    deserializedError.value = ''

    const structure: DeserializedStructure = {
      itemType: result.itemType,
      version: result.version,
      fields: result.fields,
      parts: result.parts
    }
    loadStructure(structure)

    if (options.setAsOriginal || (!originalSerial.value && serial.length > 0)) {
      originalSerial.value = serial
    }
  } catch (error) {
    decoded.value = null
    if (error instanceof Error) {
      decodeError.value = error.message
    } else {
      decodeError.value = 'Failed to decode serial.'
    }
  }
}

function handleReset() {
  if (decoded.value) {
    loadStructure({
      itemType: decoded.value.itemType,
      version: decoded.value.version,
      fields: decoded.value.fields,
      parts: decoded.value.parts
    })
  }
}

function handleRevert() {
  if (!originalSerial.value) return
  serialInput.value = originalSerial.value
  decodeCurrentSerial({ setAsOriginal: true })
}

function handleClose() {
  emit('close')
}

function handleSave() {
  if (!encodedSerial.value || encodingError.value) {
    decodeError.value = encodingError.value ?? 'Unable to encode current data.'
    return
  }

  emit('save', {
    serial: encodedSerial.value,
    flags: props.flags,
    state_flags: props.state_flags
  })
  emit('close')
}

function updateItemType(raw: string) {
  itemType.value = normalizeNumber(raw)
}

function updateVersion(raw: string) {
  version.value = normalizeNumber(raw)
}

function setOrCreateField(fieldId: number, value: number) {
  const existing = fields.value.find((field) => field.id === fieldId)
  if (existing) {
    existing.value = value
  } else {
    fields.value = [createField({ id: fieldId, value }), ...fields.value]
  }
}

function updateLevel(raw: string) {
  setOrCreateField(1, normalizeNumber(raw))
}

function updateSeed(raw: string) {
  setOrCreateField(2, normalizeNumber(raw))
}

function addField() {
  fields.value = [...fields.value, createField({ id: 0, value: 0 })]
}

function removeField(index: number) {
  fields.value = fields.value.filter((_, idx) => idx !== index)
}

function updateFieldId(field: EditableField, raw: string) {
  field.id = normalizeNumber(raw)
}

function updateFieldValue(field: EditableField, raw: string) {
  field.value = normalizeNumber(raw)
}

function addPart() {
  parts.value = [...parts.value, createPart({ id: 0, chunks: [] })]
}

function removePart(index: number) {
  parts.value = parts.value.filter((_, idx) => idx !== index)
}

function updatePartId(part: EditablePart, raw: string) {
  part.id = normalizeNumber(raw)
}

function addChunk(part: EditablePart) {
  part.chunks = [...part.chunks, 0]
}

function removeChunk(part: EditablePart, index: number) {
  part.chunks = part.chunks.filter((_, idx) => idx !== index)
}

function updateChunk(part: EditablePart, index: number, raw: string) {
  part.chunks[index] = normalizeNumber(raw)
}

function copyToClipboard(value: string) {
  if (!value) return
  navigator.clipboard.writeText(value).catch(() => {
    decodeError.value = 'Failed to copy to clipboard.'
  })
}

const levelValue = computed<number>(() => fields.value.find((field) => field.id === 1)?.value ?? 0)
const seedValue = computed<number>(() => fields.value.find((field) => field.id === 2)?.value ?? 0)

const editableStructure = computed<DeserializedStructure>(() => ({
  itemType: normalizeNumber(itemType.value),
  version: normalizeNumber(version.value),
  fields: fields.value.map((field) => ({
    id: normalizeNumber(field.id),
    value: normalizeNumber(field.value)
  })),
  parts: parts.value.map((part) => {
    const cleaned = part.chunks.map((chunk) => normalizeNumber(chunk)).filter((chunk) => Number.isFinite(chunk))
    return cleaned.length > 0
      ? { id: normalizeNumber(part.id), chunks: cleaned }
      : { id: normalizeNumber(part.id) }
  })
}))

const deserializedPreview = computed<string>(() => buildDeserializedString(editableStructure.value))

const encodingState = computed<{ serial: string | null; error: string | null }>(() => {
  try {
    const serialBlocks = serialFromString(deserializedPreview.value)
    const bytes = serialize(serialBlocks)
    const serial = encodeBase85(bytes)
    return { serial, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to encode serial.'
    return { serial: null, error: message }
  }
})

const encodedSerial = computed<string>(() => encodingState.value.serial ?? '')
const encodingError = computed<string | null>(() => encodingState.value.error)
const saveDisabled = computed<boolean>(() => !encodedSerial.value || !!encodingError.value)
const structureReady = computed<boolean>(() => fields.value.length > 0 || parts.value.length > 0 || decoded.value !== null)
const hasSerial = computed<boolean>(() => serialInput.value.trim().length > 0)

const itemTypeLabel = computed<string>(() => getItemTypeName(itemType.value))

watch(deserializedPreview, (value) => {
  syncingFromStructure = true
  deserializedEditor.value = value
  deserializedError.value = ''
  setTimeout(() => {
    syncingFromStructure = false
  }, 0)
})

watch(deserializedEditor, (value, _oldValue, onCleanup) => {
  if (syncingFromStructure) {
    return
  }
  if (deserializedTimer) {
    clearTimeout(deserializedTimer)
  }
  deserializedTimer = setTimeout(() => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      deserializedError.value = 'Deserialized string is empty.'
      deserializedTimer = null
      return
    }

    try {
      serialFromString(trimmed) // validation
      const structure = parseDeserializedStructure(trimmed)
      loadStructure(structure)
      deserializedError.value = ''
    } catch (error) {
      deserializedError.value = error instanceof Error ? error.message : 'Invalid deserialized string.'
    } finally {
      deserializedTimer = null
    }
  }, 200)

  onCleanup(() => {
    if (deserializedTimer) {
      clearTimeout(deserializedTimer)
      deserializedTimer = null
    }
  })
})

watch(serialInput, (_value, _oldValue, onCleanup) => {
  if (decodeTimer) {
    clearTimeout(decodeTimer)
  }
  decodeTimer = setTimeout(() => {
    decodeCurrentSerial()
    decodeTimer = null
  }, 200)

  onCleanup(() => {
    if (decodeTimer) {
      clearTimeout(decodeTimer)
      decodeTimer = null
    }
  })
})

watch(
  () => props.serial,
  (value) => {
    const serial = typeof value === 'string' ? value : ''
    originalSerial.value = serial
    serialInput.value = serial
    if (!serial.trim()) {
      decoded.value = null
      fields.value = []
      parts.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}
</style>
