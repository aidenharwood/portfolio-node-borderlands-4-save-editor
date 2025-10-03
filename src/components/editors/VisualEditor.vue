<template>
  <div class="flex flex-col ">
    <div v-if="availableTabs.length > 1">
      <!-- Quick Unlocks Section: Grouped Buttons -->
      <div class="space-y-4 mb-4">
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Unlocks</div>
          <div>
            <button type="button"
              class="unlock-everything-btn inline-flex items-center gap-3 rounded-md border border-border/60 bg-accent/90 px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95 transition"
              :class="{ 'quick-action-animate': quickActionStates['unlock-everything'] }"
              @click="handleUnlockEverything">
              <i class="pi pi-unlock"></i>
              <span>UNLOCK EVERYTHING</span>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-6">
          <div v-for="group in quickUnlockGroups" :key="group.id" class="min-w-[180px]">
            <div class="flex items-center gap-2 mb-2">
              <i v-if="group.icon" :class="group.icon" class="text-base text-accent" />
              <span class="font-semibold">{{ group.label }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button v-for="action in group.actions" :key="action.id" type="button"
                class="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition duration-300"
                :class="{ 'quick-action-animate': quickActionStates[action.id] }"
                @click="handleQuickUnlockAction(action.id)">
                <!-- Icon container keeps a fixed size so swapping icons doesn't change layout -->
                <span class="quick-action-icon" aria-hidden="true">
                  <i v-if="action.icon" :class="action.icon" class="icon-original" />
                  <i class="pi pi-unlock icon-check" />
                </span>
                <span>{{ action.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- End Quick Unlocks Section -->

      <div class="flex flex-wrap gap-2 mx-8">
        <button v-for="tab in availableTabs" :key="tab.id" type="button"
          class="relative inline-flex items-center gap-2 rounded-t-lg border-t border-x px-4 py-2 text-sm font-semibold"
          :class="[
            activeTab === tab.id
              ? 'text-muted-foreground shadow-sm'
              : 'border-none bg-none text-muted-foreground hover:bg-muted hover:text-foreground'
          ]" @click="activeTab = tab.id">
          <span class="text-base text-muted-foreground">
            <i :class="getTabIcon(tab.icon)"></i>
          </span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="parseError"
      class="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <i class="pi pi-exclamation-triangle text-base"></i>
        <div class="space-y-41">
          <p class="font-semibold">YAML Parse Error</p>
          <p>{{ parseError }}</p>
          <p class="text-xs italic text-destructive/80">
            Fix the YAML syntax in the text editor or switch to text mode.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-6 background-transparent">
      <div v-if="!fileName || currentTabSections.length === 0" class="flex justify-center">
        <div
          class="inline-flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
          <i class="pi pi-info-circle text-base"></i>
          <span v-if="!fileName">No file selected for editing.</span>
          <span v-else>No editable fields configured for this tab.</span>
        </div>
      </div>

      <div v-else class="rounded-xl border bg-none p-4">
        <div v-if="currentTabSections.length === 1" class="space-y-4">
          <EditorSection :key="currentTabSections[0].id" :section="{
            ...currentTabSections[0],
            collapsible: false,
            defaultExpanded: true
          }" :yamlData="yamlData" :expanded="true" @toggle="() => { }" @fieldUpdate="handleFieldUpdate"
            @sectionAction="handleSectionAction" @openItemEditor="handleOpenItemEditor" />
        </div>
        <div v-else class="space-y-4 section-stack maximized-section">
          <EditorSection v-for="section in currentTabSections" :key="section.id" :section="section" :yamlData="yamlData"
            :expanded="expandedSections[section.id] ?? section.defaultExpanded ?? false" @toggle="toggleSection"
            @fieldUpdate="handleFieldUpdate" @sectionAction="handleSectionAction" @openItemEditor="handleOpenItemEditor" />
        </div>
      </div>

      <!-- <div v-if="uncategorizedList.length" class="space-y-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Uncategorized
        </div>
        <EditorSection
          v-for="[categoryName, sectionConfig] in uncategorizedList"
          :key="`uncategorized-${categoryName}`"
          :section="sectionConfig"
          :yamlData="yamlData"
          :expanded="expandedSections[`uncategorized-${categoryName}`] ?? false"
          @toggle="toggleSection"
          @fieldUpdate="handleFieldUpdate"
          @sectionAction="handleSectionAction"
        />
      </div> -->
    </div>

    <SerialEditor
      v-if="editingSlot && editingItem"
      :serial="editingItem?.serial || ''"
      :flags="editingItem?.flags"
      :state_flags="editingItem?.state_flags"
      @save="saveSlotItemEditor"
      @close="closeSlotItemEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import EditorSection from './EditorSection.vue'
import SerialEditor from './SerialEditor.vue'
import { setValueByPath, getUncategorizedPaths, categorizePaths, deepClone, createEditorConfigFromUncategorized } from '../../lib/utils'
import {
  getOptimizedTabs,
  getBL4Config,
  setItemContainerData,
  getItemContainerData,
  isItemContainerPath,
  extractSectionAndSlotFromPath,
  expandSaveDataWithItemContainers,
  contractSaveDataFromItemContainers
} from '../../lib/parsers'
import { SectionRegistry, type SlotBasedSection } from '../../lib/sections'
import { runQuickUnlock, getQuickUnlockGroups } from '../../lib/quick-unlocks'
import { copyToClipboard } from '../../lib/utils/clipboard'

export interface EditorFieldConfig {
  yamlPath: string
  semanticName: string
  inputType: 'string' | 'number' | 'boolean' | 'dropdown' | 'multiselect' | 'array' | 'nested' | 'objectArray' | 'button'
  placeholder?: string
  description?: string
  dropdownOptions?: Array<{ value: any; label: string }>
  // Number options
  numberStep?: number
  numberMin?: number
  numberMax?: number
  // Boolean options
  booleanLabel?: string
  // Multi-select options
  multiselectOptions?: Array<{ value: any; label: string }>
  multiselectValueMap?: { [key: string]: string } // For mapping values (e.g., slot numbers to names)
  // Array options
  arrayItemType?: 'string' | 'number' | 'boolean' | 'dropdown' | 'nested'
  arrayItemOptions?: Array<{ value: any; label: string }>
  // Nested object options
  nestedConfig?: EditorFieldConfig[]
  nestedCollapsible?: boolean
  // Object array options (for inventory items, etc.)
  objectArrayItemConfig?: EditorFieldConfig[]
  objectArrayDisplayField?: string // Field to show as item title
  objectArrayMaxItems?: number
  objectArrayAddButtonText?: string
}

export interface EditorSectionConfig {
  id: string
  title: string
  description?: string
  icon?: string
  fields: EditorFieldConfig[]
  collapsible?: boolean
  defaultExpanded?: boolean
  // Item management actions for containers
  actions?: Array<{
    id: string
    label: string
    icon: string
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
  }>
}

interface Props {
  jsonData: any
  fileName: string
  saveType: 'character' | 'profile'
}

interface Emits {
  (e: 'update:jsonData', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const parseError = ref('')
const expandedSections = reactive<Record<string, boolean>>({})
const activeTab = ref('')

const yamlData = computed(() => {
  try {
    parseError.value = ''
    if (!props.jsonData) {
      return {}
    }
    return expandSaveDataWithItemContainers(props.jsonData)
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Invalid data'
    return {}
  }
})

const availableTabs = computed(() => {
  if (!props.fileName) return []

  try {
    return getOptimizedTabs(yamlData.value).map((tab) => ({
      id: tab.id,
      label: tab.title,
      icon: tab.icon
    }))
  } catch (error) {
    console.error('Error getting available tabs:', error)
    return []
  }
})

const currentTabSections = computed(() => {
  if (!props.fileName) {
    return []
  }

  try {
    return getBL4Config(yamlData.value, activeTab.value)
  } catch (error) {
    console.error('Error getting editor config:', error)
    return []
  }
})

const configuredPaths = computed(() => {
  const paths: string[] = []

  for (const section of currentTabSections.value) {
    for (const field of section.fields) {
      paths.push(field.yamlPath)

      if (field.inputType === 'nested' && field.nestedConfig) {
        for (const nestedField of field.nestedConfig) {
          paths.push(`${field.yamlPath}.${nestedField.yamlPath}`)
        }
      }
    }
  }

  return paths
})

const uncategorizedSections = computed(() => {
  try {
    if (!yamlData.value || !configuredPaths.value?.length) return {}

    const uncategorized = getUncategorizedPaths(yamlData.value, configuredPaths.value)
    if (!uncategorized?.length) return {}

    const categorized = categorizePaths(uncategorized)
    if (!categorized) return {}

    const sections: Record<string, EditorSectionConfig> = {}

    for (const [categoryName, categoryData] of Object.entries(categorized)) {
      if (!categoryData) continue

      const editorConfig = createEditorConfigFromUncategorized(categoryName, categoryData)

      if (Array.isArray(editorConfig)) {
        editorConfig.forEach((config, index) => {
          const key = index === 0 ? categoryName : `${categoryName}-${index}`
          sections[key] = config
        })
      } else if (editorConfig) {
        sections[categoryName] = editorConfig
      }
    }

    return sections
  } catch (error) {
    console.error('Error generating uncategorized sections:', error)
    return {}
  }
})

watch(
  availableTabs,
  (tabs) => {
    if (tabs.length > 0 && !activeTab.value) {
      activeTab.value = tabs[0].id
    }
  },
  { immediate: true }
)

watch(
  currentTabSections,
  (sections) => {
    for (const section of sections) {
      if (!(section.id in expandedSections)) {
        expandedSections[section.id] = section.defaultExpanded ?? false
      }
    }
  },
  { immediate: true }
)

watch(
  uncategorizedSections,
  (newUncategorized) => {
    for (const categoryName of Object.keys(newUncategorized)) {
      const sectionId = `uncategorized-${categoryName}`
      if (!(sectionId in expandedSections)) {
        expandedSections[sectionId] = false
      }
    }
  },
  { immediate: true }
)

const toggleSection = (sectionId: string) => {
  expandedSections[sectionId] = !expandedSections[sectionId]
}

const handleFieldUpdate = (yamlPath: string, value: any) => {
  const updatedData = deepClone(yamlData.value)

  if (isItemContainerPath(yamlPath)) {
    const slotInfo = extractSectionAndSlotFromPath(yamlPath)
    if (slotInfo) {
      if (setValueByPath(updatedData, yamlPath, value)) {
        const contractedData = contractSaveDataFromItemContainers(updatedData)
        emit('update:jsonData', contractedData)
      } else {
        console.warn(`Failed to set ItemContainer slot value at path: ${yamlPath}`)
      }
    }
  } else {
    if (setValueByPath(updatedData, yamlPath, value)) {
      const contractedData = contractSaveDataFromItemContainers(updatedData)
      emit('update:jsonData', contractedData)
    } else {
      console.warn(`Failed to set value at path: ${yamlPath}`)
    }
  }
}

const handleSectionAction = (actionId: string, sectionId: string) => {
  if (sectionId === 'quickUnlocks') {
    handleQuickUnlockAction(actionId)
    return
  }

  const containerMatch = sectionId.match(/^(.+)_container$/)
  if (containerMatch) {
    const [, containerId] = containerMatch

    if (actionId === 'add-item') {
      handleAddItemToContainer(containerId)
    } else {
      console.warn(`Unknown container action: ${actionId}`)
    }
    return
  }

  const slotMatch = sectionId.match(/^(.+)_slot_(\d+)$/)
  if (slotMatch) {
    const [, containerId, slotIndex] = slotMatch
    const slotNum = parseInt(slotIndex, 10)

    switch (actionId) {
      case 'copy-serial':
        try {
          const items = getItemContainerData(props.jsonData, containerId)
          const item = items[slotNum]
          if (item && item.serial) {
            copyToClipboard(item.serial)
          }
        } catch (error) {
          console.warn('Failed to copy serial:', error)
        }
        break
      case 'edit-item':
        openSlotItemEditor(containerId, slotNum)
        break
      case 'remove-item':
        handleRemoveItem(containerId, slotNum)
        break
      case 'clear-slot':
        handleClearSlot(containerId, slotNum)
        break
      default:
        console.warn(`Unknown slot action: ${actionId}`)
    }
    return
  }

  const addItemMatch = sectionId.match(/^(.+)_add_item$/)
  if (addItemMatch) {
    const [, containerId] = addItemMatch
    if (actionId === 'add-item') {
      handleAddItemToContainer(containerId)
    } else {
      console.warn(`Unknown add item action: ${actionId}`)
    }
  }
}

// --- Quick Unlock Groups UI ---
const saveType = computed(() => props.saveType)

const quickUnlockGroups = computed(() => getQuickUnlockGroups(saveType.value))

// Animation state for quick actions
const quickActionStates = ref<Record<string, boolean>>({})

function triggerQuickActionAnimation(actionId: string) {
  if (!quickActionStates.value) quickActionStates.value = {}
  quickActionStates.value[actionId] = true
  setTimeout(() => {
    quickActionStates.value[actionId] = false
  }, 700)
}

const handleQuickUnlockAction = (actionId: string) => {
  const result = runQuickUnlock(actionId, yamlData.value)
  if (!result) {
    console.warn(`Unknown quick unlock action: ${actionId}`)
    return
  }
  if (Array.isArray(result.warnings) && result.warnings.length) {
    console.warn(`Quick unlock action "${actionId}" reported warnings:`, result.warnings)
  }
  const contractedData = contractSaveDataFromItemContainers(result.data)
  emit('update:jsonData', contractedData)
  triggerQuickActionAnimation(actionId)
}

const handleUnlockEverything = async () => {
  // Fire all quick-unlock actions 'simultaneously' from the same snapshot and animate all buttons at once.
  const groups = quickUnlockGroups.value || []

  // Flatten actions preserving order
  const actions: Array<{ id: string } & any> = []
  for (const group of groups) {
    for (const action of group.actions) {
      actions.push(action)
    }
  }

  if (!actions.length) return

  // Snapshot of the current data so all actions operate from the same base
  const baseData = yamlData.value

  // Trigger all animations at once so UI shows every button activating
  for (const action of actions) {
    triggerQuickActionAnimation(action.id)
  }
  // also animate the big button
  triggerQuickActionAnimation('unlock-everything')

  // Run all actions in parallel (they run synchronously so this wraps them into promises)
  const promises = actions.map((action) => {
    return Promise.resolve().then(() => {
      try {
        return runQuickUnlock(action.id, baseData)
      } catch (err) {
        console.warn(`Quick unlock '${action.id}' failed during parallel apply:`, err)
        return null
      }
    })
  })

  const results = await Promise.all(promises)

  // Merge results: start from base and apply each result's data in order (deterministic merge)
  let mergedData = baseData
  for (const res of results) {
    if (res && res.data) {
      mergedData = res.data
    }
  }

  const contractedData = contractSaveDataFromItemContainers(mergedData)
  emit('update:jsonData', contractedData)
}

const handleAddItemToContainer = (containerId: string) => {
  // Open the editor in "new item" mode (slotIndex = -1)
  // The item will be added when the user saves
  openSlotItemEditor(containerId, -1)
}

const handleRemoveItem = (containerId: string, slotIndex: number) => {
  const baseSection = SectionRegistry.getSection(containerId)
  if (!baseSection || !('deserializeItems' in baseSection) || !('serializeItems' in baseSection)) {
    console.error(`Invalid ItemContainer section: ${containerId}`)
    return
  }

  const section = baseSection as SlotBasedSection
  const currentItems = section.deserializeItems(props.jsonData)

  if (slotIndex >= 0 && slotIndex < currentItems.length && currentItems[slotIndex]) {
    currentItems.splice(slotIndex, 1)
  } else {
    console.warn(`No item found at slot ${slotIndex} in ${containerId}`)
    return
  }

  const updatedSaveData = setItemContainerData(props.jsonData, containerId, currentItems)
  emit('update:jsonData', updatedSaveData)
}

const handleClearSlot = (containerId: string, slotIndex: number) => {
  const slotPath = `_slot_${containerId}_${slotIndex}`
  const emptyItem = {
    slot: slotIndex,
    serial: '',
    flags: 0,
    state_flags: 0
  }
  handleFieldUpdate(slotPath, emptyItem)
}

const getTabIcon = (icon?: string) => {
  if (icon && icon.startsWith('pi ')) {
    return icon
  }
  return 'pi pi-folder'
}

function handleOpenItemEditor(yamlPath: string) {
  // yamlPath should reference a slot path like '_slot_backpack_3.serial' or similar
  const slotInfo = extractSectionAndSlotFromPath(yamlPath)
  if (!slotInfo) {
    console.warn('openItemEditor: failed to parse slot from path:', yamlPath)
    return
  }
  const { sectionId, slotIndex } = slotInfo
  openSlotItemEditor(sectionId, slotIndex)
}

// Per-slot item editor state
const editingSlot = ref<{ containerId: string; slotIndex: number } | null>(null)
const editingItem = ref<any | null>(null)

function openSlotItemEditor(containerId: string, slotIndex: number) {
  editingSlot.value = { containerId, slotIndex }
  
  if (slotIndex === -1) {
    // New item mode - create an empty item
    const baseSection = SectionRegistry.getSection(containerId)
    if (baseSection && 'createEmptyItem' in baseSection) {
      const section = baseSection as SlotBasedSection
      editingItem.value = section.createEmptyItem()
      editingItem.value.serial = ''
    } else {
      editingItem.value = { serial: '' }
    }
  } else {
    // Edit existing item mode
    try {
      const items = getItemContainerData(props.jsonData, containerId)
      editingItem.value = items[slotIndex] ? { ...items[slotIndex] } : null
    } catch (error) {
      editingItem.value = null
    }
  }
}

function closeSlotItemEditor() {
  editingSlot.value = null
  editingItem.value = null
}

function saveSlotItemEditor(updated: any) {
  if (!editingSlot.value) return
  const { containerId, slotIndex } = editingSlot.value
  const items = getItemContainerData(props.jsonData, containerId)
  
  // Handle flags/state_flags omission semantics
  if ('flags' in updated && updated.flags === 0) {
    delete updated.flags
  }
  if ('state_flags' in updated && updated.state_flags === 0) {
    delete updated.state_flags
  }
  
  if (slotIndex === -1) {
    // New item mode - add to beginning of array
    items.unshift(updated)
  } else if (slotIndex >= 0 && slotIndex < items.length) {
    // Edit existing item mode
    // Remove flags/state_flags from existing item if they're 0
    if ('flags' in updated) {
      if (updated.flags === undefined && items[slotIndex] && 'flags' in items[slotIndex]) {
        delete items[slotIndex].flags
      } else if (updated.flags !== undefined) {
        items[slotIndex].flags = updated.flags
      }
      delete updated.flags
    }
    
    if ('state_flags' in updated) {
      if (updated.state_flags === undefined && items[slotIndex] && 'state_flags' in items[slotIndex]) {
        delete items[slotIndex].state_flags
      } else if (updated.state_flags !== undefined) {
        items[slotIndex].state_flags = updated.state_flags
      }
      delete updated.state_flags
    }
    
    // Merge remaining updates (serial, rawFields, stats, etc.)
    items[slotIndex] = { ...items[slotIndex], ...updated }
  }
  
  const updatedSaveData = setItemContainerData(props.jsonData, containerId, items)
  emit('update:jsonData', updatedSaveData)
  closeSlotItemEditor()
}
</script>

<style scoped>
.visual-editor {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100%;
  --editor-padding: 1rem;
  --editor-field-gap: 1rem;
  --editor-section-gap: 1.25rem;
  --editor-input-height: 2.25rem;
  --editor-input-padding: 0.55rem 0.85rem;
  --editor-label-size: 0.78rem;
  --editor-input-size: 0.875rem;
}

.tab-strip {
  border: 1px solid oklch(var(--border));
  background: linear-gradient(135deg, oklch(var(--muted) / 0.2), oklch(var(--background)));
  border-radius: 999px;
  padding: 0.65rem 0.75rem;
  box-shadow: 0 22px 45px -38px oklch(var(--accent) / 0.7);
}

.tab-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.tab-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background: oklch(var(--background));
  color: oklch(var(--muted-foreground));
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.tab-chip i {
  font-size: 0.9rem;
}

.tab-chip:hover {
  transform: translateY(-1px);
  background: oklch(var(--muted) / 0.25);
  color: oklch(var(--foreground));
}

.tab-chip.is-active {
  background: linear-gradient(135deg, oklch(var(--accent) / 0.95), oklch(var(--accent) / 0.7));
  color: oklch(var(--accent-foreground));
  box-shadow: 0 16px 36px -26px oklch(var(--accent) / 0.8);
}

.callout {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.2rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--border));
  background: oklch(var(--muted) / 0.12);
  font-size: 0.85rem;
}

.callout i {
  font-size: 1.1rem;
}

.callout strong {
  display: block;
  margin-bottom: 0.25rem;
}

.callout p {
  margin: 0.15rem 0;
}

.callout-note {
  font-size: 0.78rem;
  opacity: 0.75;
  font-style: italic;
}

.callout-danger {
  background: oklch(var(--destructive) / 0.12);
  border-color: oklch(var(--destructive) / 0.4);
  color: oklch(var(--destructive));
}

.editor-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--editor-section-gap);
  overflow-y: auto;
  padding: 0.25rem 0.25rem 0.5rem;
}

.status-info {
  display: flex;
  justify-content: center;
}

.status-card {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-radius: 0.85rem;
  border: 1px dashed oklch(var(--border));
  background: oklch(var(--muted) / 0.12);
  color: oklch(var(--muted-foreground));
  font-size: 0.85rem;
}

.status-card i {
  font-size: 0.95rem;
}

.single-section-container,
.section-stack {
  display: flex;
  flex-direction: column;
  gap: var(--editor-section-gap);
}

.maximized-section {
  border-radius: 1rem !important;
  border: 1px solid oklch(var(--border)) !important;
  background: linear-gradient(135deg, oklch(var(--muted) / 0.14), oklch(var(--background)));
}

/* Shared styling for nested section content */
:deep(.editor-section) {
  border-radius: 1rem;
  border: 1px solid oklch(var(--border));
  background: linear-gradient(140deg, oklch(var(--background)), oklch(var(--muted) / 0.08));
  box-shadow: 0 22px 45px -38px oklch(var(--accent) / 0.6);
}

:deep(.editor-section .section-header) {
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid oklch(var(--border));
}

:deep(.editor-section .section-content) {
  padding: 0 1.1rem 1.1rem;
}

:deep(.editor-section .section-fields) {
  gap: var(--editor-field-gap);
}

/* Compact inventory sections use slightly reduced padding and gaps */
:deep(.editor-section.compact-section) {
  border-radius: 0.85rem;
}

:deep(.editor-section.compact-section .section-header) {
  padding: 0.75rem 1rem;
}

:deep(.editor-section.compact-section .section-content) {
  padding: 0 0.75rem 0.75rem;
}

:deep(.editor-section.compact-section .section-fields) {
  gap: 0.5rem;
}

/* Make individual fields inside compact inventory sections denser */
:deep(.editor-section.compact-section .editor-field) {
  padding: 0.25rem 0 !important;
}

:deep(.editor-section.compact-section .editor-field > .grid) {
  padding: 0.5rem !important;
  gap: 0.5rem !important;
}

/* Reduce the size of the header icon for compact inventory entries */
:deep(.editor-section.compact-section .section-header .h-12.w-12) {
  width: 2.25rem !important;
  height: 2.25rem !important;
}

/* Tighten inputs inside compact fields */
:deep(.editor-section.compact-section .editor-field .input-field),
:deep(.editor-section.compact-section .editor-field input[type='text']),
:deep(.editor-section.compact-section .editor-field select) {
  padding: 0.35rem 0.5rem !important;
  height: 1.9rem !important;
  font-size: 0.875rem !important;
}

/* Reduce borders and radius slightly to save vertical space */
:deep(.editor-section.compact-section .editor-field .rounded-xl) {
  border-radius: 0.5rem !important;
}

:deep(.editor-field) {
  padding: 0.5rem 0;
}

:deep(.editor-field .field-label) {
  font-size: var(--editor-label-size);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: oklch(var(--muted-foreground));
}

:deep(.editor-field .input-field),
:deep(.editor-field .array-item-input),
:deep(.editor-field .checkbox-input),
:deep(.editor-field select) {
  height: var(--editor-input-height);
  padding: var(--editor-input-padding);
  font-size: var(--editor-input-size);
  border-radius: 0.65rem;
  border: 1px solid oklch(var(--border));
  background: oklch(var(--background));
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

:deep(.editor-field .input-field:focus),
:deep(.editor-field select:focus) {
  border-color: oklch(var(--accent));
  box-shadow: 0 0 0 2px oklch(var(--accent) / 0.25);
  outline: none;
}

:deep(.editor-field .field-description) {
  color: oklch(var(--muted-foreground));
}

.quick-action-animate {
  animation: quickActionPulse 0.7s cubic-bezier(.4, 0, .2, 1);
  box-shadow: 0 0 0 4px oklch(var(--accent) / 0.25), 0 2px 8px -2px oklch(var(--accent) / 0.5);
  color: oklch(var(--accent-foreground));
}

.quick-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  /* fixed width to prevent layout shift */
  height: 1.1rem;
  position: relative;
}

.quick-action-icon .icon-original,
.quick-action-icon .icon-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 220ms cubic-bezier(.4, 0, .2, 1), transform 220ms cubic-bezier(.4, 0, .2, 1);
  opacity: 1;
}

.quick-action-icon .icon-check {
  opacity: 0;
  transform: translate(-50%, -60%) scale(0.85);
  color: oklch(var(--accent));
}

.unlock-everything-btn {
  --btn-accent: oklch(var(--accent));
  --btn-accent-foreground: oklch(var(--accent-foreground));
}

.unlock-everything-btn i {
  font-size: 1rem;
}

.quick-action-animate .quick-action-icon .icon-original {
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.85);
}

.quick-action-animate .quick-action-icon .icon-check {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

@media (max-width: 768px) {
  .tab-strip {
    padding: 0.55rem;
  }

  .tab-chip {
    flex: 1 1 calc(50% - 0.5rem);
    justify-content: center;
  }

  .callout {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.editor-section .section-header) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>