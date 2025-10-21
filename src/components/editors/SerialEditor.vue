<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-0"
      leave-to-class="opacity-100">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200"
          leave-from-class="opacity-0 scale-95" leave-to-class="opacity-100 scale-100">
          <div v-if="show"
            class="relative h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl flex flex-col">
            <SerialEditorFullPage
              :serial="serial"
              :flags="flags"
              :state_flags="state_flags"
              :is-modal="true"
              @close="handleClose"
              @save="handleSave"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SerialEditorFullPage from './SerialEditorFullPage.vue'

// Props & Emits
interface Props {
  serial: string
  flags?: number
  state_flags?: number
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [payload: { serial: string; flags?: number; state_flags?: number }]
}>()

const show = ref(true)

function handleClose() {
  show.value = false
  setTimeout(() => emit('close'), 200)
}

function handleSave(payload: { serial: string; flags?: number; state_flags?: number }) {
  emit('save', payload)
  handleClose()
}
</script>
