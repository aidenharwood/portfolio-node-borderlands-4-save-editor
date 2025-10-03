<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-2xl bg-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Edit Item</h3>
          <div class="flex items-center gap-2">
            <button type="button" class="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm" @click="$emit('close')">Close</button>
            <button type="button" class="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1 text-sm text-accent-foreground" @click="save">Save</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Serial</label>
            <input v-model="local.serial" type="text" class="w-full rounded-md border px-3 py-2" />
            <button type="button" class="mt-2 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm" @click="openSerialEditor">Edit Serial...</button>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Flags</label>
            <select v-model.number="local.flags" class="w-full rounded-md border px-3 py-2">
              <option :value="0">None</option>
              <option :value="1">1</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">State Flags</label>
            <select v-model.number="local.state_flags" class="w-full rounded-md border px-3 py-2">
              <option :value="0">None</option>
              <option :value="1">Seen</option>
              <option :value="3">Favorite</option>
              <option :value="5">Trash</option>
              <option :value="17">Tag group 1</option>
              <option :value="33">Tag group 2</option>
              <option :value="65">Tag group 3</option>
              <option :value="129">Tag group 4</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Additional JSON</label>
            <textarea v-model="extraJson" rows="6" class="w-full rounded-md border px-3 py-2 text-xs"></textarea>
            <p class="text-xs text-muted-foreground mt-1">Edit raw fields JSON (for advanced use). Changes will be merged into item.rawFields.</p>
          </div>
        </div>
      </div>
    </div>
    <SerialEditor
      v-if="showSerialEditor"
      :serial="local.serial"
      @close="showSerialEditor = false"
      @update:serial="(s: string) => (local.serial = s)"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import SerialEditor from './SerialEditor.vue'

interface Props {
  item: any
}

const props = defineProps<Props>()
interface Emits {
  (e: 'save', item: any): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()

const local = reactive({ ...props.item })
const extraJson = ref(JSON.stringify(props.item.rawFields || {}, null, 2))
const showSerialEditor = ref(false)

function openSerialEditor() {
  showSerialEditor.value = true
}

function save() {
  try {
    const parsed = JSON.parse(extraJson.value || '{}')
    local.rawFields = parsed
  } catch (error) {
    // ignore parse errors; keep existing rawFields
  }
  emit('save', { ...local })
}
</script>
