/**
 * Optimized YAML-based BL4 configuration for production use
 * This configuration is based on actual character.yaml and profile.yaml structure analysis
 */

import type { BL4CharacterSave, BL4ProfileSave } from '../types/save-types'
import { isCharacterSave, isProfileSave } from '../types/save-types'
import {
  CharacterInfoSection,
  BackpackInventorySection, 
  EquippedInventorySection,
  InputPreferencesSection,
  BankStorageSection,
  LostItemsSection
} from '../sections'

// Define tab configuration interface
export interface TabConfig {
  id: string
  title: string
  icon: string
  sectionId: string
  validation?: (data: unknown) => boolean
}

// Get configured sections and tabs based on actual YAML structure
export function getYAMLBasedConfig(saveData: BL4CharacterSave | BL4ProfileSave) {
  // Check if this is character save data
  if ('state' in saveData) {
    // Character save - create character-specific sections
    const equippedSection = new EquippedInventorySection()
    const characterSections = {
      character: new CharacterInfoSection(),
      backpack: new BackpackInventorySection(), 
      equipped: equippedSection,
      lostloot: new LostItemsSection()
    }
    
    // Generate dynamic fields for equipped inventory based on available items
    if (equippedSection.getFieldsWithOptions) {
      (equippedSection as any).fields = equippedSection.getFieldsWithOptions(saveData)
    }

    const CHARACTER_TABS: TabConfig[] = [
      {
        id: 'character-info',
        title: 'Character Info',
        icon: 'pi pi-user',
        sectionId: 'character',
        validation: (data: unknown) => isCharacterSave(data)
      },
      {
        id: 'backpack',
        title: 'Backpack',
        icon: 'pi pi-briefcase', 
        sectionId: 'backpack'
      },
      {
        id: 'equipped',
        title: 'Equipped',
        icon: 'pi pi-shield',
        sectionId: 'equipped'
      },
      {
        id: 'lost-items',
        title: 'Lost Items',
        icon: 'pi pi-trash',
        sectionId: 'lostloot'
      }
    ]
    
    return { 
      tabs: CHARACTER_TABS, 
      sections: characterSections,
      type: 'character' as const
    }
  } else {
    // Profile save - create profile-specific sections
    const profileSections = {
      inputPreferences: new InputPreferencesSection(),
      bankStorage: new BankStorageSection()
    }

    const PROFILE_TABS: TabConfig[] = [
      {
        id: 'bank-storage',
        title: 'Bank Storage',
        icon: 'pi pi-wallet',
        sectionId: 'bankStorage'
      },
      {
        id: 'input-preferences',
        title: 'Input Preferences', 
        icon: 'pi pi-cog',
        sectionId: 'inputPreferences',
        validation: (data: unknown) => isProfileSave(data)
      },
    ]
    
    return { 
      tabs: PROFILE_TABS, 
      sections: profileSections,
      type: 'profile' as const
    }
  }
}

// Compact UI styling constants for high-density interface
export const COMPACT_UI = {
  // Reduced spacing for dense layouts
  itemPadding: '4px 8px',
  sectionPadding: '8px 12px',
  fieldPadding: '2px 4px',
  
  // Smaller font sizes for more data visibility
  fontSize: '13px',
  headerFontSize: '14px',
  labelFontSize: '12px',
  
  // Tighter line heights
  lineHeight: '1.3',
  
  // Reduced margins
  fieldMargin: '4px 0',
  sectionMargin: '8px 0',
  
  // Smaller input heights
  inputHeight: '28px',
  buttonHeight: '26px'
}

// Helper function to get section by ID
export function getSection(config: ReturnType<typeof getYAMLBasedConfig>, sectionId: string) {
  const sections = config.sections as any
  return sections[sectionId] || null
}

// Legacy compatibility exports (will be removed in future versions)
export const getSaveFileStructureOptimized = getYAMLBasedConfig