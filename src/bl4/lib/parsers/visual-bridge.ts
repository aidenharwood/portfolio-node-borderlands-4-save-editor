/**
 * Bridge functions to connect the new YAML-based configuration system 
 * with the existing VisualEditor component interface
 */

import type { EditorSectionConfig } from '../types/editor-interfaces'
import { getYAMLBasedConfig } from './yaml-config'
import type { BL4CharacterSave, BL4ProfileSave } from '../types/save-types'
import type { SerializableSection, SlotBasedSection } from '../sections'

// Cache for config to avoid recreating sections repeatedly
let configCache: ReturnType<typeof getYAMLBasedConfig> | null = null
let lastSaveData: any = null



/**
 * Check if a section is a SlotBasedSection
 */
function isSlotBasedSection(section: any): section is SlotBasedSection {
  return section && 
         typeof section.generateSlotSections === 'function' &&
         typeof section.serializeItems === 'function' && 
         typeof section.deserializeItems === 'function' && 
         typeof section.createEmptyItem === 'function' &&
         Array.isArray(section.itemSchema)
}

/**
 * Convert a SlotBasedSection to VisualEditor format with individual slot sections
 */
function convertSlotBasedSectionToEditorConfig(section: SlotBasedSection, saveData?: any): EditorSectionConfig[] {
  const buildHeaderSection = (_usedSlots: number, _maxSlots: number, description?: string): EditorSectionConfig => ({
    id: `${section.id}_container`,
    title: section.title,
    description: description ?? section.description,
    icon: section.icon,
    fields: [],
    collapsible: false,
    defaultExpanded: true,
    actions: [
      {
        id: 'add-item',
        icon: 'pi pi-plus',
        variant: 'primary' as const
      }
    ]
  })

  if (!saveData) {
    return [buildHeaderSection(0, section.maxItems, `${section.description} - No items`)]
  }

  try {
    const allItems = section.deserializeItems(saveData)
    const usedSlots = allItems.filter(item => item && item.serial).length
  const headerSection = buildHeaderSection(usedSlots, section.maxItems, `${usedSlots} slots in use`)
    const slotSections = section.generateSlotSections(saveData)
		
    return [
      headerSection,
      ...slotSections.map(slotSection => {
        const mappedFields = slotSection.fields.map((field: any) => {
          const inputType = field.type === 'select' ? 'dropdown' : mapFieldTypeToInputType(field.type)
          return {
            yamlPath: field.path,
            semanticName: field.name,
            inputType,
            placeholder: field.placeholder,
            description: `${field.name}`,
            // Add type-specific options
            ...(field.type === 'number' && {
              numberMin: field.min,
              numberMax: field.max,
              numberStep: field.step
            }),
            ...(inputType === 'dropdown' && {
              dropdownOptions: Array.isArray(field.options)
                ? field.options
                : (field.options ? Object.keys(field.options).map(k => ({ value: k, label: String((field.options as any)[k]) })) : [])
            }),
            ...(field.type === 'multiselect' && {
              multiselectOptions: field.options || []
            })
          }
        })

        return {
          id: slotSection.id,
          // When meta is present, prefer metadata-driven UI; don't use title/description
          title: (slotSection as any).meta ? '' : slotSection.title,
          description: (slotSection as any).meta ? undefined : slotSection.description,
          icon: slotSection.icon,
          fields: mappedFields,
          collapsible: true,
          defaultExpanded: false,
          actions: slotSection.actions || [],
          // Preserve any metadata provided by the SlotBasedSection implementation
          ...((slotSection as any).meta ? { meta: (slotSection as any).meta } : {})
        }
      })
    ]
  } catch (error) {
    console.warn('Error converting SlotBasedSection:', error)
    return [{
      id: `${section.id}_error`,
      title: `${section.title} (Error)`,
      description: 'Error loading slot sections',
      icon: section.icon,
      fields: [],
      collapsible: true,
      defaultExpanded: false
    }]
  }
}

/**
 * Convert a SerializableSection to VisualEditor format
 */
function convertSerializableSectionToEditorConfig(section: SerializableSection, saveData?: any): EditorSectionConfig {
  // Use dynamic fields if available (for equipment section)
  const fieldsToUse = ('getFields' in section && typeof section.getFields === 'function') 
    ? section.getFields(saveData) 
    : section.fields
  
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    icon: section.icon,
    fields: fieldsToUse.map((field: any) => {
      const inputType = field.type === 'select' ? 'dropdown' : mapFieldTypeToInputType(field.type)
      return {
        yamlPath: field.path,
        semanticName: field.name,
        inputType,
        placeholder: field.placeholder,
        description: `${field.name}${field.validation ? ' (validated)' : ''}`,
        // Add type-specific options
        ...(field.type === 'number' && {
          numberMin: field.min,
          numberMax: field.max,
          numberStep: field.step
        }),
        ...(inputType === 'dropdown' && {
          dropdownOptions: Array.isArray(field.options) ? field.options : (field.options ? Object.keys(field.options).map(k => ({ value: k, label: String((field.options as any)[k]) })) : [])
        }),
        ...(field.type === 'multiselect' && {
          multiselectOptions: field.options || []
        })
      }
    }),
    collapsible: true,
    defaultExpanded: false
  }
}

/**
 * Convert a section to VisualEditor format (handles SlotBasedSection and SerializableSection)
 */
function convertSectionToEditorConfig(section: SerializableSection | SlotBasedSection, saveData?: any): EditorSectionConfig | EditorSectionConfig[] {
  if (isSlotBasedSection(section)) {
    return convertSlotBasedSectionToEditorConfig(section, saveData)
  } else {
    return convertSerializableSectionToEditorConfig(section as SerializableSection, saveData)
  }
}

/**
 * Map field types from the new system to VisualEditor input types
 */
function mapFieldTypeToInputType(fieldType: string): 'string' | 'number' | 'boolean' | 'dropdown' | 'multiselect' | 'array' | 'nested' | 'objectArray' | 'button' {
  switch (fieldType) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'select': return 'dropdown'
    case 'multiselect': return 'multiselect'
    case 'array': return 'array'
    case 'button': return 'button'
    default: return 'string'
  }
}

/**
 * Get available tabs for the VisualEditor based on save data
 */
export function getOptimizedTabs(saveData?: any) {
  if (!saveData) {
    // Return default tabs if no save data
    return [
      { id: 'character-info', title: 'Character Info', icon: '👤' },
      { id: 'backpack', title: 'Backpack', icon: '🎒' },
      { id: 'equipped', title: 'Equipped', icon: '⚔️' }
    ]
  }

  // Update cache if save data changed
  if (!configCache || lastSaveData !== saveData) {
    configCache = getYAMLBasedConfig(saveData as BL4CharacterSave | BL4ProfileSave)
    lastSaveData = saveData
  }

  return configCache.tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    icon: tab.icon
  }))
}

/**
 * Get BL4 configuration for the VisualEditor - tab-specific approach
 */
export function getBL4Config(saveData: BL4CharacterSave | BL4ProfileSave, tabId?: string): EditorSectionConfig[] {
  if (!configCache || lastSaveData !== saveData) {
    configCache = getYAMLBasedConfig(saveData)
    lastSaveData = saveData
  }

  const sections: EditorSectionConfig[] = []
  
  if (!tabId) {
    // If no tab specified, return all sections (fallback behavior)
    Object.entries(configCache.sections).forEach(([, section]) => {
      const editorConfig = convertSectionToEditorConfig(section, saveData)
      
      if (Array.isArray(editorConfig)) {
        sections.push(...editorConfig)
      } else {
        sections.push(editorConfig)
      }
    })
  } else {
    // Find the tab configuration and get its associated section
    const tab = configCache.tabs.find(t => t.id === tabId)
    if (tab) {
      const section = (configCache.sections as any)[tab.sectionId]
      if (section) {
        const editorConfig = convertSectionToEditorConfig(section, saveData)
        
        if (Array.isArray(editorConfig)) {
          // For ItemContainer: add all slot sections
          sections.push(...editorConfig)
        } else {
          // For regular sections: add single section
          sections.push(editorConfig)
        }
      }
    }
  }

  return sections
}

/**
 * Legacy compatibility function (for existing code)
 */
export function getSaveFileStructureOptimized(saveData: any) {
  return getYAMLBasedConfig(saveData)
}