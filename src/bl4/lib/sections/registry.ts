/**
 * Central registry for all BL4 save file sections
 */

import type { SaveSection } from './base'
import { CharacterInfoSection } from './character'
import { BackpackInventorySection, BankStorageSection, LostItemsSection, EquippedInventorySection } from './inventory'
import { InputPreferencesSection } from './profile'

export class SectionRegistry {
  private static sections: Map<string, SaveSection> = new Map()

  static {
    // Initialize sections based on actual YAML structure
    this.sections.set('character-info', new CharacterInfoSection())
    this.sections.set('backpack', new BackpackInventorySection())
    this.sections.set('equipped', new EquippedInventorySection())
    this.sections.set('input-prefs', new InputPreferencesSection())
    this.sections.set('bankStorage', new BankStorageSection())
    this.sections.set('lostloot', new LostItemsSection())
  }

  static getSection(id: string): SaveSection | undefined {
    return this.sections.get(id)
  }

  static getAllSections(): SaveSection[] {
    return Array.from(this.sections.values())
  }

  static getCharacterSections(): SaveSection[] {
    return this.getAllSections().filter(section => 
      ['character-info', 'backpack', 'equipped', 'lostloot'].includes(section.id)
    )
  }

  static getProfileSections(): SaveSection[] {
    return this.getAllSections().filter(section =>
      ['input-prefs', 'bankStorage'].includes(section.id)
    )
  }

  static registerSection(section: SaveSection): void {
    this.sections.set(section.id, section)
  }
}

// ===== HELPER FUNCTIONS =====

export function getCharacterTabs(): Array<{ id: string; title: string; icon: string }> {
  return SectionRegistry.getCharacterSections().map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon
  }))
}

export function getProfileTabs(): Array<{ id: string; title: string; icon: string }> {
  return SectionRegistry.getProfileSections().map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon
  }))
}