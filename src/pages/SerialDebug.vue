<template>
  <div class="min-h-screen bg-background">
    <SerialEditorFullPage
      :serial="currentSerial"
      @close="closeEditor"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SerialEditorFullPage from '@/components/editors/SerialEditorFullPage.vue'

const router = useRouter()
const currentSerial = ref('')

function closeEditor() {
  router.push('/')
}

function handleSave(payload: { serial: string }) {
  currentSerial.value = payload.serial
  // Optionally navigate back or show a success message
}
</script>