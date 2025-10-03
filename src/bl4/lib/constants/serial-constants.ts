/**
 * Borderlands serial number constants and mappings
 * Based on BL3 serial number understanding and BL4 observations
 */

export interface NumericDropdownOption {
  value: number
  label: string
}

export interface StringDropdownOption {
  value: string
  label: string
}

export type DropdownOption = NumericDropdownOption | StringDropdownOption

// Rarity mappings (0-4: common, uncommon, rare, epic, legendary)
export const RARITY_OPTIONS: NumericDropdownOption[] = [
  { value: 0, label: 'Common' },
  { value: 1, label: 'Uncommon' },
  { value: 2, label: 'Rare' },
  { value: 3, label: 'Epic' },
  { value: 4, label: 'Legendary' }
]

// Manufacturer mappings (based on BL4 manufacturers)
export const MANUFACTURER_OPTIONS: NumericDropdownOption[] = [
  { value: 1, label: '?' },
]

// Item class mappings (weapon types and equipment classes)
export const ITEM_CLASS_OPTIONS: NumericDropdownOption[] = [
  // Weapons
  { value: 1, label: 'Unknown Item Class' }
]

// Item type mappings (from serial prefixes)
export const ITEM_TYPE_OPTIONS: StringDropdownOption[] = [
  { value: 'r', label: 'Weapon (r)' },
]

// Helper functions to get labels
export function getRarityLabel(value: number): string {
  const option = RARITY_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : `Unknown (${value})`
}

export function getManufacturerLabel(value: number): string {
  const option = MANUFACTURER_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : `Unknown (${value})`
}

export function getItemClassLabel(value: number): string {
  const option = ITEM_CLASS_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : `Unknown (${value})`
}

export function getItemTypeLabel(type: string): string {
  const option = ITEM_TYPE_OPTIONS.find(opt => opt.value === type)
  return option ? option.label : `Unknown (${type})`
}

// Reverse lookup functions (get value from label)
export function getRarityValue(label: string): number | undefined {
  const option = RARITY_OPTIONS.find(opt => opt.label === label)
  return option?.value
}

export function getManufacturerValue(label: string): number | undefined {
  const option = MANUFACTURER_OPTIONS.find(opt => opt.label === label)
  return option?.value
}

export function getItemClassValue(label: string): number | undefined {
  const option = ITEM_CLASS_OPTIONS.find(opt => opt.label === label)
  return option?.value
}