<template>
  <div v-if="needRefresh" class="fixed bottom-4 right-4 z-50 max-w-sm">
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Update Available
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A new version of the app is ready to install.
          </p>
          <div class="mt-3 flex space-x-2">
            <button
              @click="updateApp"
              class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-medium"
            >
              Update Now
            </button>
            <button
              @click="dismissUpdate"
              class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded font-medium"
            >
              Later
            </button>
          </div>
        </div>
        <div class="flex-shrink-0 ml-4">
          <button
            @click="dismissUpdate"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="offlineReady" class="fixed bottom-4 right-4 z-50 max-w-sm">
    <div class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-green-800 dark:text-green-200">
            App is ready to work offline
          </p>
          <p class="text-sm text-green-600 dark:text-green-300 mt-1">
            You can now use this app even without an internet connection.
          </p>
          <button
            @click="dismissOffline"
            class="mt-2 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-800 dark:text-green-200 text-xs px-3 py-1.5 rounded font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const needRefresh = ref(false)
const offlineReady = ref(false)

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

onMounted(() => {
  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh.value = true
    },
    onOfflineReady() {
      offlineReady.value = true
      // Auto-dismiss offline notification after 5 seconds
      setTimeout(() => {
        offlineReady.value = false
      }, 5000)
    },
  })
})

const updateApp = async () => {
  if (updateSW) {
    await updateSW(true)
  }
}

const dismissUpdate = () => {
  needRefresh.value = false
}

const dismissOffline = () => {
  offlineReady.value = false
}
</script>