// Editor interface definitions
export interface EditorSectionConfig {
  id: string
  title: string
  description?: string
  icon?: string
  meta?: Record<string, any>
  fields: EditorFieldConfig[]
  collapsible?: boolean
  defaultExpanded?: boolean
  // Item management actions for containers
  actions?: Array<{
    id: string
    label?: string
    icon: string
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
  }>
}

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