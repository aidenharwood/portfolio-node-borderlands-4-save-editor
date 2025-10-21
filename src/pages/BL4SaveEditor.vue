<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="backdrop-blur-sm">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center gap-3 mb-4">
          <h1 class="text-3xl font-bold">Borderlands 4 Save Editor</h1>
        </div>
        <p class="text-muted-foreground text-lg mb-4">
          Upload your save folder, edit character data, and download the modified files
        </p>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <i class="pi pi-info-circle"></i>
          <span>Based on the amazing work by</span>
          <a href="https://github.com/Nicnl/borderlands4-serials?tab=readme-ov-file#credits" target="_blank" rel="noopener noreferrer"
            class="text-accent hover:text-accent/80 underline transition-colors">
            @Nicnl, @InflamedSebi, @Sparkie & the wider modding community
          </a>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8 space-y-8">
      <!-- Gaming Platform Input Section -->
  <section v-if="!hasLoadedFiles" class="bg-card rounded-lg border p-6">
        <div class="flex items-center gap-3 mb-6">
        </div>
        <SteamIdInput v-model="steamIdInput" :error="steamIdError" :is-resolving="isResolvingCombined"
          :steam-profile="steamProfile" @validate="validateSteamId" @reset="resetValidation" @locked="handleSteamLocked"
          @resolving="handleTimerResolving" />
      </section>

      <!-- Upload Section -->
  <section v-if="!hasLoadedFiles && steamIdLocked"
        class="bg-card rounded-lg border p-6 transition-all duration-300 ease-out"
        :class="{'':isDragOverEditor}">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 bg-green-500/20 rounded-md flex items-center justify-center">
            <i class="pi pi-folder-open text-green-500"></i>
          </div>
          <h2 class="text-xl font-semibold">Upload Save Folder</h2>
        </div>
        <SaveFolderUpload :uploading="uploading" @upload="handleFolderUpload" />
      </section>

      <!-- File Editor Section -->
      <section v-if="hasLoadedFiles" class="bg-card rounded-lg border" @drop.prevent="handleEditorDrop"
        @dragover.prevent="handleEditorDragOver" @dragleave="handleEditorDragLeave"
        :class="{ 'border-dashed border-accent/50': isDragOverEditor }">
        <div class="flex items-center justify-between p-6 border-b">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-accent/20 rounded-md flex items-center justify-center">
              <i class="pi pi-file-edit text-accent"></i>
            </div>
            <h2 class="text-xl font-semibold">Save Files Editor</h2>
            <span v-if="isDragOverEditor" class="text-sm text-blue-500 font-medium">
              Drop to replace save files
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="handleDownload('sav')" :disabled="downloading || saveFiles.length === 0"
              class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Download as SAV files">
              <i class="pi pi-download" :class="{ 'pi-spin pi-spinner': downloading }"></i>
              {{ downloading ? 'Creating ZIP...' : 'SAV' }}
            </button>
            <button @click="handleDownload('yaml')" :disabled="downloading || saveFiles.length === 0"
              class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Download as YAML files">
              <i class="pi pi-download" :class="{ 'pi-spin pi-spinner': downloading }"></i>
              {{ downloading ? 'Creating ZIP...' : 'YAML' }}
            </button>
            <button @click="confirmAndClear" 
              class="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-accent-foreground-destructive rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Close editor and unload files">
              <i class="pi pi-times"></i>
              Close
            </button>
          </div>
        </div>

        <div class="p-6">
          <SaveFileEditor :saveFiles="saveFiles" v-model:activeSaveFile="activeSaveFile" @yamlChange="handleYamlChange"
            @jsonChange="handleJsonChange" @createBackup="createBackup" @revertFile="revertFile" @close="clearFiles" />
        </div>
      </section>

      <!-- Error Display -->
      <div v-if="error" class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-destructive">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
          <button @click="error = ''" class="text-destructive/60 hover:text-destructive transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSteamId, useSaveFiles } from '../composables'
import SteamIdInput from '../components/SteamIdInput.vue'
import SaveFolderUpload from '../components/SaveFolderUpload.vue'
import SaveFileEditor from '../components/editors/SaveFileEditor.vue'

// Drag and drop state
const isDragOverEditor = ref(false)

// Steam ID composable
const {
  steamIdInput,
  steamIdError,
  steamId,
  steamIdValid,
  validateSteamId,
  resetValidation,
  initializeSteamId,
  isResolving,
  steamProfile
} = useSteamId()

// Save files composable
const {
  saveFiles,
  activeSaveFile,
  uploading,
  downloading,
  error,
  uploadSaveFolder,
  handleYamlChange,
  handleJsonChange,
  createBackup,
  revertFile,
  downloadSaveFolder
  , clearFiles
} = useSaveFiles()

const hasLoadedFiles = computed(() => saveFiles.value.length > 0)

// track whether the Steam ID has been locked (validated and accepted)
const steamIdLocked = ref(steamIdValid.value)

function handleSteamLocked(locked: boolean) {
  steamIdLocked.value = locked
}

// Initialize Steam ID from cookie on mount
onMounted(() => {
  initializeSteamId()
})

// Timer-driven resolving state from the input component
const steamTimerResolving = ref(false)
function handleTimerResolving(val: boolean) { steamTimerResolving.value = val }

const isResolvingCombined = computed(() => !!isResolving.value || steamTimerResolving.value)

// Handle folder upload from child component
async function handleFolderUpload(files: FileList) {
  try {
    await uploadSaveFolder(files, steamId.value)
  } catch (err) {
    // Error is already handled in the composable
  }
}

// Handle download with Steam ID
async function handleDownload(format: 'sav' | 'yaml' = 'sav') {
  console.log("Downloading in format:", format, "using ID: ", steamId.value);
  await downloadSaveFolder(steamId.value, format)
}

// Drag and drop handlers for editor area
function handleEditorDragOver(_: DragEvent) {
  isDragOverEditor.value = true
}

function handleEditorDragLeave(_: DragEvent) {
  isDragOverEditor.value = false
}

async function handleEditorDrop(event: DragEvent) {
  isDragOverEditor.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    try {
      // Replace current save files with the new ones
      await uploadSaveFolder(files, steamId.value)
    } catch (err) {
      // Error is already handled in the composable
    }
  }
}

// Confirm and clear files at page level (mirrors SaveFileEditor confirmation)
function confirmAndClear() {
  const hasUnsaved = saveFiles.value.some(f => f.hasChanges)
  if (hasUnsaved) {
    const confirmed = window.confirm('You have unsaved changes. Close and discard changes?')
    if (!confirmed) return
  }
  clearFiles()
}

</script>

<style scoped>
/* Only keeping minimal custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container section,
.container>div {
  animation: fadeIn 0.4s ease-out;
}
</style>