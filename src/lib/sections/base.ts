/**
 * Base interfaces and classes for BL4 save file sections
 */

import { getItemDisplayName, tryDecodeSerial, buildNicnlSummary, normalizeNicnlLabel } from "../utils/serial-utils"

// ===== CORE INTERFACES =====

export interface SaveSection {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: string
}

export interface FieldDefinition {
  readonly path: string
  readonly name: string
  readonly type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'array'
  readonly placeholder?: string
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly options?: Array<{ value: any; label: string }>
  readonly validation?: (value: any) => boolean
}

export interface SerializableSection extends SaveSection {
  fields: FieldDefinition[]
  serialize(data: any): Record<string, any>
  deserialize(data: Record<string, any>): any
  validate(data: any): boolean
}

export interface ItemContainer extends SaveSection {
  readonly itemSchema: readonly FieldDefinition[]
  readonly maxItems: number
  readonly itemIdField: string
  serializeItems(items: any[]): Record<string, any>
  deserializeItems(data: Record<string, any>): any[]
  createEmptyItem(): any
  getContainerPath(): string[]
}

export interface SlotBasedSection extends SaveSection {
  readonly itemSchema: readonly FieldDefinition[]
  readonly maxItems: number
  generateSlotSections(saveData: any): Array<{
    id: string
    title: string
    description: string
    icon: string
    fields: readonly FieldDefinition[]
    actions?: Array<{
      id: string
      label: string
      icon: string
      variant?: 'primary' | 'secondary' | 'danger'
    }>
  }>
  serializeItems(items: any[]): Record<string, any>
  deserializeItems(data: Record<string, any>): any[]
  createEmptyItem(): any
  getContainerPath(): string[]
}

/**
 * Base class for inventory-style sections (backpack, bank, etc.)
 * Provides shared functionality for slot-based item management
 */
export abstract class BaseInventorySection implements SlotBasedSection {
  abstract readonly id: string
  abstract readonly title: string
  abstract readonly description: string
  abstract readonly icon: string
  abstract readonly maxItems: number
  abstract getContainerPath(): string[]
  
  // Default item schema - subclasses can override this
  readonly itemSchema: readonly FieldDefinition[] = [
    {
      path: 'serial',
      name: 'Serial Number',
      type: 'string',
      placeholder: 'Item serial number...'
    },
    {
      path: 'flags',
      name: 'Equipped',
      type: 'select',
      options: [
        { value: 0, label: 'No' },
        { value: 1, label: 'Yes' }
      ],
      validation: (value: any) => value === 0 || value === 1
    },
    {
      path: 'state_flags', 
      name: 'State Flags',
      type: 'select',
      options: [
        { value: 0, label: 'Unseen' },
        { value: 1, label: 'Seen' },
        { value: 3, label: 'Favorite' },
        { value: 5, label: 'Trash' },
        { value: 17, label: 'Tag group 1' },
        { value: 33, label: 'Tag group 2' },
        { value: 65, label: 'Tag group 3' },
        { value: 129, label: 'Tag group 4' }
      ],
      validation: (value: any) => [0,1,3,5,17,33,65,129].includes(value)
    }
  ]
  
  // Default empty item template - subclasses can override this
  protected getItemTemplate(): Record<string, any> {
    return {
      serial: '',
      flags: 0,
      state_flags: 0
    }
  }

  generateSlotSections(saveData: any): Array<{
    id: string
    title: string
    description: string
    icon: string
    fields: readonly FieldDefinition[]
    actions?: Array<{
      id: string
      label: string
      icon: string
      variant?: 'primary' | 'secondary' | 'danger'
    }>
  }> {
    const items = this.deserializeItems(saveData)
    const sections: Array<any> = []

    items.forEach((item, index) => {
      if (!item || !item.serial) {
        return
      }

      const displayName = getItemDisplayName(item.serial)

      const decoded = tryDecodeSerial(item.serial)

      const normalizedItemType = normalizeNicnlLabel(decoded?.itemTypeName)
      const normalizedManufacturer = normalizeNicnlLabel(decoded?.manufacturer)
      const normalizedWeaponType = normalizeNicnlLabel(decoded?.weaponType)

      const stateLabel = (() => {
        switch (item.state_flags) {
          case 1: return 'Seen'
          case 3: return 'Favorite'
          case 5: return 'Trash'
          case 17: return 'Tag group 1'
          case 33: return 'Tag group 2'
          case 65: return 'Tag group 3'
          case 129: return 'Tag group 4'
          default: return ''
        }
      })()
      const summary = buildNicnlSummary(decoded, {
        includeEquipped: item.flags === 1,
        stateLabel,
        fallback: displayName || item.serial
      })

      sections.push({
        id: `${this.id}_slot_${index}`,
        title: `Item ${index + 1}`,
        description: summary,
        meta: {
          serial: item.serial,
          flags: item.flags,
          state_flags: item.state_flags,
          summary,
          itemCategory: normalizedItemType || null,
          itemTypeName: normalizedItemType || null,
          manufacturer: normalizedManufacturer || null,
          weaponType: normalizedWeaponType || null,
          level: decoded?.level ?? null,
          rarity: null,
          primaryStat: null,
          secondaryStat: null,
          randomSeed: decoded?.randomSeed ?? null,
          partsCount: decoded?.parts?.length ?? 0
        },
        icon: 'pi pi-box',
        fields: [] as readonly FieldDefinition[],
        actions: [
          {
            id: 'copy-serial',
            icon: 'pi pi-copy',
            label: item.serial,
            variant: 'secondary' as const
          },
          {
            id: 'remove-item',
            icon: 'pi pi-trash',
            variant: 'danger' as const
          },
          {
            id: 'edit-item',
            icon: 'pi pi-pen-to-square',
            variant: 'secondary' as const
          }
        ]
      })
    })

    return sections
  }

  createEmptyItem(): any {
    return this.getItemTemplate()
  }

  // These methods need to be implemented by subclasses for their specific data paths
  abstract serializeItems(items: any[]): Record<string, any>
  abstract deserializeItems(data: Record<string, any>): any[]
}