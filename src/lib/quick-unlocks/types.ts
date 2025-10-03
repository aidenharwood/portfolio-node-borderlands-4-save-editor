import type { EditorSectionConfig } from '../types/editor-interfaces'

export type QuickUnlockVariant = NonNullable<EditorSectionConfig['actions']>[number]['variant']

export interface QuickUnlockMetadata {
  id: string
  label: string
  icon: string
  variant?: QuickUnlockVariant
}

export interface QuickUnlockResult {
  data: any
  warnings?: string[]
}

export interface QuickUnlockAction extends QuickUnlockMetadata {
  run: (data: any) => QuickUnlockResult
}
