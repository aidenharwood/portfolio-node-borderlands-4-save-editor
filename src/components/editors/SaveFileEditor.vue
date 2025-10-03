<template>
  <div class="flex flex-col gap-6">
    <div v-if="saveFiles.length" class="">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="flex min-w-0 flex-1 flex-wrap gap-2 max-h-44 overflow-y-auto pr-1" role="tablist">
          <button v-for="file in saveFiles" :key="file.name" type="button"
            class="group relative inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            :class="[
              props.activeSaveFile === file.name
                ? 'background-none text-muted-foreground border-none underline underline-offset-4 decoration-accent/50'
                : 'border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted'
            ]" @click="emit('update:activeSaveFile', file.name)">
            <span class="text-base">
              <i :class="getFileIcon(file.name)"></i>
            </span>
            <span class="truncate text-left">{{ getFileDisplayName(file.name) }}</span>
            <span v-if="file.hasChanges"
              class="absolute right-2 top-1/2 h-2 w-2 -translate-y-3 -translate-x--3 rounded-full bg-accent shadow shadow-accent/20"
              title="Modified"></span>
          </button>
        </div>
        <div class="flex items-center gap-3 self-start md:self-auto md:pl-4">
          <div class="flex gap-1 rounded-xl border border-border/60 bg-background/80 p-1 shadow-sm">
            <button type="button"
              class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              :class="editorMode === 'text'
                ? 'bg-accent/15 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'" @click="editorMode = 'text'" title="YAML editor">
              <i class="pi pi-file-edit"></i>
              YAML
            </button>
            <button type="button"
              class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              :class="editorMode === 'visual'
                ? 'bg-accent/15 text-muted-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'" @click="editorMode = 'visual'" title="Visual editor">
              <i class="pi pi-list"></i>
              Visual
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeSaveFile">
      <div v-for="file in saveFiles" :key="file.name" v-show="props.activeSaveFile === file.name"
        class="flex flex-col gap-6 p-6">
        <div
          class="flex gap-4 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-x-2 flex">
            <h3 class="text-lg font-semibold text-foreground">{{ getFileDisplayName(file.name) }}</h3>
            <div class="items-center gap-3 text-sm text-muted-foreground">
              <span
                class="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                <i class="pi pi-file text-xs"></i>
                  {{ file.name }} - {{ (file.size / 1024).toFixed(1) }} KB
              </span>
            </div>
          </div>
          <!-- <div class="flex items-center gap-2">
            <button v-if="file.hasChanges" type="button"
              class="inline-flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
              @click="revertFile(file.name)" title="Revert changes">
              <i class="pi pi-undo text-xs"></i>
              Revert
            </button>
          </div> -->
        </div>

        <div class="flex flex-col gap-4">
          <div v-if="file.yamlError"
            class="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ file.yamlError }}</span>
          </div>

          <div v-if="editorMode === 'text'" class="relative rounded-xl border border-border/60 bg-background/90">
            <span
              class="absolute right-4 top-3 rounded-md border border-border/60 bg-muted px-2 py-0.5 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              YAML
            </span>
            <textarea ref="yamlTextarea" :value="file.yamlContent" @input="handleYamlChange(file.name, $event)"
              class="h-[420px] w-full resize-vertical rounded-xl bg-transparent p-4 font-mono text-sm text-foreground outline-none"
              spellcheck="false" placeholder="YAML content will appear here..."></textarea>
          </div>

          <div v-else class=" p-1">
            <visual-editor class="min-h-[420px]" :jsonData="file.jsonData" :fileName="file.name" :saveType="getSaveType(file.name)"
              @update:jsonData="handleVisualJsonChange(file.name, $event)" />
          </div>
        </div>
      </div>
    </div>

    <div v-else
      class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-card/60 py-16 text-center text-muted-foreground">
      <i class="pi pi-file-o text-5xl opacity-40"></i>
      <p class="text-lg font-medium">No save files loaded. Upload a save folder to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type SaveFile } from '../../composables/useSaveFiles'
import VisualEditor from './VisualEditor.vue'
import { resolveClassName } from '@/lib/sections'

interface Props {
  saveFiles: SaveFile[]
  activeSaveFile: string
}

interface Emits {
  (e: 'update:activeSaveFile', value: string): void
  (e: 'yamlChange', fileName: string, event: Event): void
  (e: 'jsonChange', fileName: string, newJsonData: any): void
  (e: 'createBackup', fileName: string): void
  (e: 'revertFile', fileName: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const yamlTextarea = ref<HTMLTextAreaElement>()
const editorMode = ref<'text' | 'visual'>('visual')

function handleYamlChange(fileName: string, event: Event) {
  emit('yamlChange', fileName, event)
}

function handleVisualJsonChange(fileName: string, newJsonData: any) {
  // Emit JSON change instead of YAML change
  emit('jsonChange', fileName, newJsonData)
}

function resolveFile(fileName: string): SaveFile | undefined {
  return props.saveFiles.find(f => f.name === fileName)
}

function formatProfileDisplay(file?: SaveFile): string {
  if (!file) return 'Profile'
  const info = file.profileInfo
  if (!info) return 'Profile'

  return `Profile - ${file.name}`
}

function getFileIcon(fileName: string): string {
  const file = resolveFile(fileName)
  if (file?.fileType?.type === 'profile') {
    return 'pi pi-user'
  }
  if (file?.fileType?.type === 'character') {
    return 'pi pi-user-plus'
  }
  if (fileName.match(/\d+\.sav/)) {
    return 'pi pi-user-plus'
  }
  return 'pi pi-file'
}

function getFileDisplayName(fileName: string): string {
  const file = resolveFile(fileName)
  if (file?.fileType?.type === 'profile') {
    return formatProfileDisplay(file)
  }

  if (file?.fileType?.type === 'character' || fileName.match(/\d+\.sav/)) {
    const match = fileName.match(/(\d+)\.sav/)
    const fileIndex = match ? match[1] : fileName.replace('.sav', '')
    if (file?.characterInfo?.name) {
      const classLabel = getClass(file.characterInfo)
      const levelLabel = file.characterInfo.level ? `Lv. ${file.characterInfo.level}` : ''
      const details = [file.characterInfo.name]
      if (classLabel) details.push(classLabel)
      if (levelLabel) details.push(levelLabel)
      const prefix = match ? `[${fileIndex}] ` : ''
      return `${prefix}${details.join(' - ')}`
    }
    return `Character ${fileIndex}`
  }

  return fileName
}

function getClass(characterInfo: { className?: string }): string {
  return characterInfo.className ? resolveClassName(characterInfo.className) : ''
}

// Determine saveType in SaveFileEditor and pass to VisualEditor
function getSaveType(fileName: string): 'character' | 'profile' {
  const file = resolveFile(fileName)
  if (file?.fileType?.type === 'profile') return 'profile'
  return 'character'
}
</script>