/**
 * Inventory-related save file sections
 */

import { BaseInventorySection, type SerializableSection, type FieldDefinition } from './base'

/**
 * Backpack inventory section - generates individual collapsible slot sections
 */
export class BackpackInventorySection extends BaseInventorySection {
  readonly id = 'backpack'
  readonly title = 'Backpack Inventory'
  readonly description = 'Items stored in your backpack'
  readonly icon = 'pi pi-briefcase'
  readonly maxItems = 500

  getContainerPath(): string[] {
    return ['state', 'inventory', 'items', 'backpack']
  }

  serializeItems(items: any[]): Record<string, any> {
    const backpack: Record<string, any> = {}
    
    // Filter out empty items and reindex to eliminate gaps
    const validItems = items.filter(item => item && item.serial)
    
    validItems.forEach((item, index) => {
      const slotData: Record<string, any> = {
        serial: item.serial
      }
      if (item.flags !== undefined && Number(item.flags) !== 0) slotData.flags = item.flags
      if (item.state_flags !== undefined && Number(item.state_flags) !== 0) slotData.state_flags = item.state_flags
      
      backpack[`slot_${index}`] = slotData
    })
    
    return {
      state: {
        inventory: {
          items: {
            backpack
          }
        }
      }
    }
  }

  deserializeItems(data: Record<string, any>): any[] {
    const backpackData = data.state?.inventory?.items?.backpack || {}
    
    // Extract slot numbers and sort them
    const slots = Object.keys(backpackData)
      .filter(key => key.startsWith('slot_'))
      .map(key => ({
        index: parseInt(key.replace('slot_', '')),
        data: backpackData[key]
      }))
      .sort((a, b) => a.index - b.index)
    
    // Create compact array by filtering out empty items and mapping to compact indices
    const validItems = slots
      .filter(({ data }) => data && data.serial) // Only include items with serials
      .map(({ data }) => ({
        serial: data.serial || '',
        flags: data.flags !== undefined ? data.flags : 0,
        state_flags: data.state_flags !== undefined ? data.state_flags : 0
      }))
    
    return validItems
  }
}

/**
 * Bank storage section - shared items across all characters
 */
export class BankStorageSection extends BaseInventorySection {
  readonly id = 'bankStorage'
  readonly title = 'Bank Storage'
  readonly description = 'Shared bank items across all characters'
  readonly icon = 'pi pi-database'
  readonly maxItems = 200

  getContainerPath(): string[] {
    return ['domains', 'local', 'shared', 'inventory', 'items', 'bank']
  }

  serializeItems(items: any[]): Record<string, any> {
    const bank: Record<string, any> = {}
    
    // Filter out empty items and reindex to eliminate gaps
    const validItems = items.filter(item => item && item.serial)
    
    validItems.forEach((item, index) => {
      const slotObj: Record<string, any> = { serial: item.serial }
      if (item.state_flags !== undefined && Number(item.state_flags) !== 0) {
        slotObj.state_flags = item.state_flags
      }
      if (item.flags !== undefined && Number(item.flags) !== 0) {
        slotObj.flags = item.flags
      }

      bank[`slot_${index}`] = slotObj
    })
    
    return {
      domains: {
        local: {
          shared: {
            inventory: {
              items: {
                bank
              }
            }
          }
        }
      }
    }
  }

  deserializeItems(data: Record<string, any>): any[] {
    const bankData = data.domains?.local?.shared?.inventory?.items?.bank || {}
    const slots: Array<{index: number, item: any}> = []
    
    // Collect all slots with their original indices
    Object.keys(bankData).forEach(key => {
      if (key.startsWith('slot_')) {
        const index = parseInt(key.replace('slot_', ''))
        const item = bankData[key]
        
        if (item && item.serial) { // Only include items with serials
          const obj: any = {
            serial: item.serial || '',
            state_flags: item.state_flags !== undefined ? item.state_flags : 0,
            flags: item.flags !== undefined ? item.flags : 0
          }
          slots.push({
            index,
            item: obj
          })
        }
      }
    })
    
    // Sort by original slot index to maintain order, then return compact array
    slots.sort((a, b) => a.index - b.index)
    return slots.map(slot => slot.item)
  }
}

/**
 * Lost Items section - Items that have been lost and can be recovered
 */
export class LostItemsSection extends BaseInventorySection {
  readonly id = 'lostloot'
  readonly title = 'Lost Items'
  readonly description = 'Items that have been lost and can be recovered'
  readonly icon = 'pi pi-search'
  readonly maxItems = 50 // Reasonable limit for lost items

  getContainerPath(): string[] {
    return ['state', 'lostloot', 'items']
  }
  
  // Override item schema for lost items (only serial and in_machine)
  readonly itemSchema: readonly FieldDefinition[] = [
    {
      path: 'serial',
      name: 'Serial Number',
      type: 'string',
      placeholder: 'Item serial number...'
    },
    {
      path: 'in_machine',
      name: 'In Machine',
      type: 'boolean'
    }
  ]
  
  // Override item template for lost items
  protected getItemTemplate(): Record<string, any> {
    return {
      serial: '',
      in_machine: false
    }
  }

  serializeItems(items: any[]): Record<string, any> {
    const lostItems: any[] = []
    
    items.forEach((item) => {
      if (item && item.serial) {
        lostItems.push({
          serial: item.serial,
          in_machine: item.in_machine || false
        })
      }
    })
    
    return {
      state: {
        lostloot: {
          cooldown: '-1',
          items: lostItems
        }
      }
    }
  }

  deserializeItems(data: Record<string, any>): any[] {
    const lostData = data.state?.lostloot?.items || []
    
    if (!Array.isArray(lostData)) {
      return []
    }
    
    return lostData.map((item: any) => ({
      serial: item.serial || '',
      in_machine: item.in_machine || false
    }))
  }
}

/**
 * Helper function to get item display name from serial
 */
function getItemDisplayName(serial: string, allItems: any[]): string {
  if (!serial) return 'None'
  
  // Try to find the item in inventory to get more info
  const item = allItems.find(i => i && i.serial === serial)
  if (item && typeof item.getName === 'function') {
    return item.getName()
  }
  
  return `Item: ${serial}`
}

/**
 * Equipped inventory section (weapons/gear currently equipped)
 * Uses dropdowns to select from available inventory items
 */
export class EquippedInventorySection implements SerializableSection {
  readonly id = 'equipped'
  readonly title = 'Equipped Inventory'
  readonly description = 'Currently equipped weapons and gear'
  readonly icon = 'pi pi-shield'

  // Dynamic fields - will be populated based on available items
  fields: FieldDefinition[] = []

  // Get fields with dropdown options based on available items
  getFieldsWithOptions(saveData: any): FieldDefinition[] {
    const availableItems = this.getAvailableItems(saveData)
    
    const equipmentSlots = [
      { path: 'state.inventory.equipped_inventory.equipped.slot_0.0.serial', name: 'Weapon Slot 1', type: 'weapon' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_1.0.serial', name: 'Weapon Slot 2', type: 'weapon' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_2.0.serial', name: 'Weapon Slot 3', type: 'weapon' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_3.0.serial', name: 'Weapon Slot 4', type: 'weapon' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_4.0.serial', name: 'Shield', type: 'shield' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_5.0.serial', name: 'Ordnance', type: 'grenade' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_6.0.serial', name: 'Repkit', type: 'repkit' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_7.0.serial', name: 'Enhancement', type: 'enhancement' },
      { path: 'state.inventory.equipped_inventory.equipped.slot_8.0.serial', name: 'Class Mod', type: 'classmod' }
    ]

    return equipmentSlots.map(slot => ({
      path: slot.path,
      name: slot.name,
      type: 'select' as const,
      options: [
        { value: '', label: 'None' },
        ...availableItems.map(item => ({
          value: item.serial,
          label: getItemDisplayName(item.serial, availableItems)
        }))
      ]
    }))
  }

  // Get all available items from backpack and bank
  private getAvailableItems(saveData: any): any[] {
    const items: any[] = []
    
    try {
      // Get backpack items
      const backpackSection = new BackpackInventorySection()
      const backpackItems = backpackSection.deserializeItems(saveData)
      items.push(...backpackItems.filter(item => item && item.serial))
      
      // Get bank items if this is a profile save
      if (saveData.domains?.local?.shared) {
        const bankSection = new BankStorageSection()
        const bankItems = bankSection.deserializeItems(saveData)
        items.push(...bankItems.filter(item => item && item.serial))
      }
    } catch (error) {
      console.error('Error getting available items for equipment:', error)
    }
    
    return items
  }

  serialize(data: any): Record<string, any> {
    return {
      state: {
        inventory: {
          equipped_inventory: data.state?.inventory?.equipped_inventory || {}
        }
      }
    }
  }

  deserialize(data: Record<string, any>): any {
    return data.state?.inventory?.equipped_inventory || {}
  }

  validate(data: any): boolean {
    return data && data.state && data.state.inventory
  }
}