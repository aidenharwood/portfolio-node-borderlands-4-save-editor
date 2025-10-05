<template>
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <!-- Serial Editor Button -->
        <router-link v-if="$route.path !== '/serialeditor'" to="/serialeditor"
            class="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            title="Open Serial Editor">
            <i class="pi pi-code text-sm"></i>
            Serial Editor
        </router-link>

        <!-- PWA Install Button -->
        <button v-if="showInstallButton" @click="installApp"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            title="Install this app">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Install App
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

const showInstallButton = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null

onMounted(() => {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault()
        deferredPrompt = e as BeforeInstallPromptEvent
        showInstallButton.value = true
        console.log('Install prompt available')
    })

    // Hide the install button if app is already installed
    window.addEventListener('appinstalled', () => {
        showInstallButton.value = false
        deferredPrompt = null
        console.log('App was installed')
    })

    // Check if app is already installed (for standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        showInstallButton.value = false
    }
})

const installApp = async () => {
    if (!deferredPrompt) {
        console.log('No install prompt available')
        return
    }

    try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
            showInstallButton.value = false
        } else {
            console.log('User dismissed the install prompt')
        }

        deferredPrompt = null
    } catch (error) {
        console.error('Error showing install prompt:', error)
    }
}
</script>