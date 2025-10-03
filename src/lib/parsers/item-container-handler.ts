/**
 * ItemContainer data handler for VisualEditor integration
 * Handles serialization/deserialization between slot format and array format
 */

import { getYAMLBasedConfig } from './yaml-config'
import type { BL4CharacterSave, BL4ProfileSave } from '../types/save-types'
import type { ItemContainer } from '../sections'
import { deepClone } from '../utils'

/**
 * Check if a YAML path is for an ItemContainer slot
 */
export function isItemContainerPath(yamlPath: string): boolean {
  return yamlPath.startsWith('_slot_')
}

/**
 * Extract section ID and slot index from ItemContainer path
 * Returns { sectionId: string, slotIndex: number } or null if invalid
 */
export function extractSectionAndSlotFromPath(yamlPath: string): { sectionId: string, slotIndex: number } | null {
  const match = yamlPath.match(/^_slot_([^_]+)_(\d+)/)
  if (!match) return null
  
  return {
    sectionId: match[1],
    slotIndex: parseInt(match[2], 10)
  }
}

/**
 * Extract section ID from ItemContainer path (legacy function)
 */
export function extractSectionIdFromPath(yamlPath: string): string {
  const result = extractSectionAndSlotFromPath(yamlPath)
  return result ? result.sectionId : yamlPath.replace('_items_', '')
}

/**
 * Get ItemContainer section by ID from save data
 */
function getItemContainerSection(saveData: any, sectionId: string): ItemContainer | null {
  try {
    const config = getYAMLBasedConfig(saveData as BL4CharacterSave | BL4ProfileSave)
    const sections = config.sections as any
    const section = sections[sectionId]
    
    // Check if it's an ItemContainer
    if (section && 
        typeof section.serializeItems === 'function' && 
        typeof section.deserializeItems === 'function') {
      return section as ItemContainer
    }
  } catch (error) {
    console.error('Error getting ItemContainer section:', error)
  }
  return null
}

/**
 * Get items array for an ItemContainer from save data
 */
export function getItemContainerData(saveData: any, sectionId: string): any[] {
  const section = getItemContainerSection(saveData, sectionId)
  if (!section) {
    console.warn(`ItemContainer section not found: ${sectionId}`)
    return []
  }

  try {
    return section.deserializeItems(saveData)
  } catch (error) {
    console.error(`Error deserializing items for ${sectionId}:`, error)
    return []
  }
}

/**
 * Set items array for an ItemContainer and update save data
 */
export function setItemContainerData(saveData: any, sectionId: string, items: any[]): any {
  const section = getItemContainerSection(saveData, sectionId)
  if (!section) {
    console.warn(`ItemContainer section not found: ${sectionId}`)
    return saveData
  }

  try {
    const cloned = deepClone(saveData)

    // Remove any existing container data before applying new serialized structure
    const containerPath = section.getContainerPath?.()
    if (containerPath && containerPath.length > 0) {
      clearNestedPath(cloned, containerPath)
    }

    // Serialize the items back to slot format
    const serializedData = section.serializeItems(items)
    
    // Deep merge the serialized data with the cloned save data
    return deepMerge(cloned, serializedData)
  } catch (error) {
    console.error(`Error serializing items for ${sectionId}:`, error)
    return saveData
  }
}

function clearNestedPath(target: any, path: string[]): void {
  if (!path.length) return
  let current = target
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  const lastKey = path[path.length - 1]
  if (Array.isArray(current)) {
    delete (current as any)[lastKey]
  } else if (current && typeof current === 'object') {
    delete (current as Record<string, any>)[lastKey]
  }
}

/**
 * Deep merge utility function
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  
  return result
}

/**
 * Expand save data to include ItemContainer slot fields for editing
 */
export function expandSaveDataWithItemContainers(saveData: any): any {
  if (!saveData) return saveData
  
  try {
    const config = getYAMLBasedConfig(saveData as BL4CharacterSave | BL4ProfileSave)
    const expandedData = { ...saveData }
    
    // Add individual slot fields for each ItemContainer section
    for (const [sectionId, section] of Object.entries(config.sections)) {
      if (section && 
          typeof (section as any).serializeItems === 'function' && 
          typeof (section as any).deserializeItems === 'function') {
        
        const itemContainer = section as ItemContainer
        const items = itemContainer.deserializeItems(saveData)
        
  // Create individual slot fields up to the section's maxItems
  // (previously capped at 25 for UI performance; remove cap so large containers like backpack/bank can expand)
        // Only expand existing items into slot fields. Do not pre-create empty slots.
        // This removes any artificial UI-imposed limits on how many slots can exist.
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item) {
            expandedData[`_slot_${sectionId}_${i}`] = item
          }
        }
      }
    }
    
    return expandedData
  } catch (error) {
    console.error('Error expanding save data with ItemContainers:', error)
    return saveData
  }
}

/**
 * Contract save data to remove ItemContainer slot fields and use slot format
 */
export function contractSaveDataFromItemContainers(saveData: any): any {
  if (!saveData) return saveData
  
  const contractedData = { ...saveData }
  const itemsBySection: Record<string, Array<{slotIndex: number, itemData: any}>> = {}
  
  // Collect all slot data grouped by section with their original slot indices
  Object.keys(contractedData).forEach(key => {
    if (key.startsWith('_slot_')) {
      const slotInfo = extractSectionAndSlotFromPath(key)
      if (slotInfo) {
        const { sectionId, slotIndex } = slotInfo
        
        if (!itemsBySection[sectionId]) {
          itemsBySection[sectionId] = []
        }
        
        const itemData = contractedData[key]
        // Only add items that have actual content (non-empty serial is the key requirement)
        if (itemData && itemData.serial && itemData.serial.trim() !== '') {
          itemsBySection[sectionId].push({ slotIndex, itemData })
        }
        
        // Remove the slot property
        delete contractedData[key]
      }
    }
  })
  
  // Apply collected items to their respective sections
  for (const [sectionId, slotItems] of Object.entries(itemsBySection)) {
    if (slotItems.length > 0) {
      // Sort by original slot index to maintain relative order
      slotItems.sort((a, b) => a.slotIndex - b.slotIndex)
      
      // Create a compact array (no gaps) from the sorted items
      const compactItems = slotItems.map(slot => slot.itemData)
      
      const updatedData = setItemContainerData(contractedData, sectionId, compactItems)
      Object.assign(contractedData, updatedData)
    } else {
      // If no items, we should clear the section completely
      const updatedData = setItemContainerData(contractedData, sectionId, [])
      Object.assign(contractedData, updatedData)
    }
  }
  
  return contractedData
}