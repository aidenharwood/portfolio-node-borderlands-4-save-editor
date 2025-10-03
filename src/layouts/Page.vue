<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  component?: Component
  renderLayout?: boolean
  showNavigation?: boolean
  showSidebar?: boolean
  showArgoCDCard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  renderLayout: true,
  showNavigation: true,
  showSidebar: true,
  showArgoCDCard: false
})

// Compute layout classes based on props
const mainClasses = computed(() => {
  const baseClasses = "flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 text-foreground transition-all duration-500"
  
  if (!props.renderLayout) {
    return `${baseClasses} p-4`
  }

  return `${baseClasses} px-4 lg:px-10 pt-10 lg:pt-30 pb-30 lg:pb-10`
})

const contentClasses = computed(() => {
  if (!props.renderLayout) {
    return "w-full h-full"
  }

  return "max-w-full w-full min-w-0 flex-1"
})
</script>

<template>
  <main :class="mainClasses">
    <!-- Full page layout (no navigation or sidebar) -->
    <template v-if="!renderLayout">
      <component v-if="component" :is="component" :class="contentClasses" />
      <slot v-else :contentClasses="contentClasses" />
    </template>
    
    <!-- Standard layout -->
    <template v-else>
      <header v-if="showNavigation" class="flex items-center justify-between pb-6">
        <slot name="navigation" />
      </header>

      <section class="lg:flex w-full lg:space-y-0 space-y-10 justify-items-center justify-center items-start">
        <aside v-if="showSidebar" class="lg:flex-col space-y-10 hidden lg:flex">
          <slot name="sidebar" />
        </aside>

        <!-- Main content -->
        <section class="flex flex-col w-full max-w-full items-start lg:px-10 px-0 flex-1 min-w-0 min-h-0
          [&_*::-webkit-scrollbar]:w-0.25
          [&_*::-webkit-scrollbar]:h-2
          [&_*::-webkit-scrollbar-track]:rounded-full
          [&_*::-webkit-scrollbar-track]:bg-transparent
          [&_*::-webkit-scrollbar-thumb]:rounded-full
          [&_*::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <component v-if="component" :is="component" :class="contentClasses" />
          <slot v-else :contentClasses="contentClasses" />
        </section>
      </section>
    </template>
  </main>
</template>