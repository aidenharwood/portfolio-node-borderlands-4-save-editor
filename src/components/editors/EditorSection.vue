<template>
  <section class="editor-section rounded-2xl bg-card/80 shadow-sm transition hover:border-border/80 flex-col"
    :class="{ 'compact-section': section && section.id && section.id.includes('_slot_') }"
    :data-collapsible="isCollapsible">
    <div class="flex-col w-full justify-space-between">

      <div class="flex" :class="isCollapsible ? 'cursor-pointer' : ''">
        <div
          class="w-full border-1 rounded-lg section-header flex flex-col gap-4 border-b border-border/40 p-5 sm:flex-row sm:items-start sm:gap-6"
          :class="isCollapsible ? 'cursor-pointer hover:bg-background/60' : ''"
          @click="isCollapsible ? toggleSection() : undefined">
          <div class="flex flex-1 items-start gap-4 min-w-0">
            <div v-if="section.icon"
              class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-accent shadow-sm">
              <i :class="section.icon"></i>
            </div>
            <div class="flex flex-col gap-2 w-full min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h4 class="text-base font-semibold text-foreground">{{ section.title }}</h4>
              </div>
              <!-- Item summary + actions for slot sections -->
              <div v-if="isSlotSection && (itemSummary || itemSerial)"
                class="mt-1 flex flex-col gap-2 overflow-hidden min-w-0">
                <div v-if="itemSummary" class="text-sm font-semibold text-foreground truncate min-w-0">
                  {{ itemSummary }}
                </div>
                <button v-if="itemSerial" type="button"
                  :class="[BUTTON_BASE, 'mt-1', 'w-full', 'justify-between', 'px-3', 'overflow-hidden', 'max-w-full', 'min-w-0', 'whitespace-nowrap']"
                  :title="`Copy serial \u2022 ${itemSerial}`"
                  @click.stop="handleSerialCopy">
                  <span class="truncate flex-1 text-left text-xs font-mono min-w-0">
                    {{ itemSerial }}
                  </span>
                  <i class="pi pi-copy text-sm flex-shrink-0"></i>
                </button>
              </div>
            </div>

          </div>
            <div v-if="sectionActions.length" class="flex flex-col gap-2">
              <template v-for="action in sectionActions" :key="action.id">
                <button type="button"
                  :class="[BUTTON_BASE, actionButtonClass(action.variant), action.disabled ? 'opacity-60 cursor-not-allowed' : 'font-semibold', 'uppercase']"
                  :disabled="action.disabled" :title="action.label"
                  @click.stop="handleActionClick(action.id)">
                  <i v-if="action.icon" :class="[action.icon, action.label ? 'text-xl' : 'text-2xl']"></i>
                  <span v-if="action.label">{{ action.label }}</span>
                </button>
              </template>
            </div>

            <button v-if="isCollapsible" type="button"
              :class="[BUTTON_BASE, 'justify-center', 'text-muted-foreground', 'bg-background/80']"
              @click.stop="toggleSection()" :aria-expanded="expanded"
              :aria-label="expanded ? 'Collapse section' : 'Expand section'">
              <i class="pi" :class="expanded ? 'pi-chevron-up' : 'pi-chevron-right'"></i>
            </button>
          </div>
        </div>

      <div v-if="hasFields && (expanded || section.collapsible === false)" class="section-content space-y-4 p-5">
        <div class="section-fields space-y-2">
          <EditorField v-for="field in dedupedFields" :key="field.yamlPath" v-bind="field"
            :value="getFieldValue(field.yamlPath)" @update="(value) => handleFieldUpdate(field.yamlPath, value)"
            @openItemEditor="(yamlPath) => emit('openItemEditor', yamlPath)" />
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EditorField from './EditorField.vue'
import { getValueByPath } from '../../lib/utils'
// getItemDisplayName not needed here; section.meta.summary provides summary info
import type { EditorSectionConfig } from '../../lib/types/editor-interfaces'

interface Props {
  section: EditorSectionConfig
  yamlData: any
  expanded: boolean
}

interface Emits {
  (e: 'toggle', sectionId: string): void
  (e: 'fieldUpdate', yamlPath: string, value: any): void
  (e: 'sectionAction', actionId: string, sectionId: string): void
  (e: 'openItemEditor', yamlPath: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Deduplicate fields by yamlPath to avoid showing duplicate inputs
const dedupedFields = computed(() => {
  const seen = new Set<string>()
  const fields = props.section.fields ?? []
  const result: any[] = []
  for (const f of fields) {
    const path = String((f && (f as any).yamlPath) ?? '')
    if (!path) continue
    if (seen.has(path)) continue
    seen.add(path)
    result.push(f)
  }
  return result
})

const hasFields = computed(() => (dedupedFields.value?.length ?? 0) > 0)
const isCollapsible = computed(() => hasFields.value && props.section.collapsible !== false)

// Determine whether this section is a slot-based item section (e.g., _slot_backpack_3)
const isSlotSection = computed(() => !!(props.section?.id && String(props.section.id).includes('_slot_')))

// Try to locate a serial field within this section's fields and read the serial from yamlData
const serialFieldPath = computed(() => {
  const fields = props.section?.fields ?? []
  const serialField = fields.find((f: any) => {
    if (!f || !f.yamlPath) return false
    const p = String(f.yamlPath).toLowerCase()
    return p.endsWith('.serial') || (f.semanticName && String(f.semanticName).toLowerCase().includes('serial'))
  })
  return serialField?.yamlPath ?? null
})

const itemSerial = computed(() => {
  // Prefer explicit meta.serial provided for slot sections
  const metaAny = (props.section as any)?.meta
  if (metaAny && metaAny.serial) return metaAny.serial
  if (!serialFieldPath.value) return null
  try {
    return getValueByPath(props.yamlData, serialFieldPath.value)
  } catch {
    return null
  }
})

// Friendly summary surfaces in slot headers; fallback to serial as needed
const itemSummary = computed(() => {
  const metaAny = (props.section as any)?.meta
  if (metaAny && typeof metaAny.summary === 'string' && metaAny.summary.length > 0) {
    return metaAny.summary
  }
  if (metaAny && typeof metaAny.serial === 'string' && metaAny.serial.length > 0) {
    return metaAny.serial
  }
  if (itemSerial.value) {
    return itemSerial.value
  }
  return ''
})

const sectionActions = computed(() => {
  return (props.section.actions ?? []).filter(action => action.id !== 'copy-serial')
})

const toggleSection = () => {
  if (!isCollapsible.value) {
    return
  }
  emit('toggle', props.section.id)
}

const getFieldValue = (yamlPath: string): any => {
  return getValueByPath(props.yamlData, yamlPath)
}

const handleFieldUpdate = (yamlPath: string, value: any) => {
  emit('fieldUpdate', yamlPath, value)
}

const handleActionClick = (actionId: string) => {
  emit('sectionAction', actionId, props.section.id)
}

const handleSerialCopy = () => {
  emit('sectionAction', 'copy-serial', props.section.id)
}

const actionButtonClass = (variant: 'primary' | 'secondary' | 'danger' | undefined) => {
  switch (variant) {
    case 'primary':
      return 'text-primary'
    case 'danger':
      return ' text-destructive hover:border-destructive/50 hover:bg-destructive/10 '
    default:
      return 'text-foreground'
  }
}

// Standard button base consistent with EditorField
const BUTTON_BASE = 'inline-flex items-center h-10 gap-2 rounded-lg border border-border/60 bg-background/80 px-3 text-xs font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10 max-w-full min-w-0'
</script>