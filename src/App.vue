<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import PWAUpdateNotification from '@/components/PWAUpdateNotification.vue'
import PWAInstallButton from '@/components/PWAInstallButton.vue'

// Initialize theme on app startup
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <router-view />
  <PWAUpdateNotification />
  <PWAInstallButton />
</template>