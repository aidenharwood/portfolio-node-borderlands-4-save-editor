/**
 * YAML Path Utilities for handling dot notation paths in YAML/JSON data
 */

/**
 * Get a value from an object using dot notation path
 * @param obj - The object to get the value from
 * @param path - Dot notation path (e.g., "character.stats.level")
 * @returns The value at the path, or undefined if not found
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    // Handle array indices in brackets [0]
    if (key.includes('[') && key.includes(']')) {
      const [arrayKey, indexPart] = key.split('[')
      const index = parseInt(indexPart.replace(']', ''), 10)
      
      if (arrayKey) {
        current = current?.[arrayKey]
      }
      
      if (Array.isArray(current) && !isNaN(index)) {
        current = current[index]
      } else {
        return undefined
      }
    } else {
      current = current?.[key]
    }
    
    if (current === undefined) {
      return undefined
    }
  }
  
  return current
}

/**
 * Set a value in an object using dot notation path
 * @param obj - The object to set the value in
 * @param path - Dot notation path (e.g., "character.stats.level")
 * @param value - The value to set
 * @returns True if successful, false otherwise
 */
export function setValueByPath(obj: any, path: string, value: any): boolean {
  if (!obj || !path) return false
  
  const keys = path.split('.')
  let current = obj
  
  // Navigate to the parent of the target key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    // Handle array indices in brackets [0]
    if (key.includes('[') && key.includes(']')) {
      const [arrayKey, indexPart] = key.split('[')
      const index = parseInt(indexPart.replace(']', ''), 10)
      
      if (arrayKey) {
        if (!current[arrayKey]) {
          current[arrayKey] = []
        }
        current = current[arrayKey]
      }
      
      if (Array.isArray(current)) {
        // Ensure array has enough elements
        while (current.length <= index) {
          current.push({})
        }
        current = current[index]
      } else {
        return false
      }
    } else {
      if (!current[key]) {
        // Create nested object if it doesn't exist
        current[key] = {}
      }
      current = current[key]
    }
  }
  
  // Set the final value
  const finalKey = keys[keys.length - 1]
  
  if (finalKey.includes('[') && finalKey.includes(']')) {
    const [arrayKey, indexPart] = finalKey.split('[')
    const index = parseInt(indexPart.replace(']', ''), 10)
    
    if (arrayKey) {
      if (!current[arrayKey]) {
        current[arrayKey] = []
      }
      current = current[arrayKey]
    }
    
    if (Array.isArray(current)) {
      current[index] = value
    } else {
      return false
    }
  } else {
    current[finalKey] = value
  }
  
  return true
}

/**
 * Check if a path exists in an object
 * @param obj - The object to check
 * @param path - Dot notation path
 * @returns True if the path exists, false otherwise
 */
export function hasPath(obj: any, path: string): boolean {
  return getValueByPath(obj, path) !== undefined
}

/**
 * Get the type of a value at a path
 * @param obj - The object to check
 * @param path - Dot notation path
 * @returns The type string or 'undefined' if path doesn't exist
 */
export function getTypeByPath(obj: any, path: string): string {
  const value = getValueByPath(obj, path)
  
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  
  return typeof value
}

/**
 * Parse a path to extract array information
 * @param path - Dot notation path that may contain array indices
 * @returns Object with parsed path information
 */
export function parsePath(path: string): {
  segments: string[]
  hasArrays: boolean
  arrayIndices: number[]
} {
  const segments: string[] = []
  const arrayIndices: number[] = []
  let hasArrays = false
  
  const keys = path.split('.')
  
  for (const key of keys) {
    if (key.includes('[') && key.includes(']')) {
      hasArrays = true
      const [arrayKey, indexPart] = key.split('[')
      const index = parseInt(indexPart.replace(']', ''), 10)
      
      if (arrayKey) {
        segments.push(arrayKey)
      }
      arrayIndices.push(index)
    } else {
      segments.push(key)
    }
  }
  
  return { segments, hasArrays, arrayIndices }
}

/**
 * Validate a dot notation path
 * @param path - The path to validate
 * @returns True if valid, false otherwise
 */
export function isValidPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false
  
  // Check for valid characters and structure
  const pathRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*(\[[0-9]+\])?$/
  
  // Allow paths with array notation
  const arrayPathRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\[[0-9]+\])?(\.[a-zA-Z_][a-zA-Z0-9_]*(\[[0-9]+\])?)*$/
  
  return pathRegex.test(path) || arrayPathRegex.test(path)
}

/**
 * Convert array index notation to dot notation
 * @param path - Path that might use array[0] notation
 * @returns Path using dot notation where possible
 */
export function normalizePath(path: string): string {
  return path.replace(/\[(\d+)\]/g, '.$1')
}

/**
 * Get all paths in an object recursively
 * @param obj - The object to analyze
 * @param prefix - Current path prefix
 * @returns Array of all possible paths
 */
export function getAllPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = []
  
  if (!obj || typeof obj !== 'object') {
    return paths
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    paths.push(currentPath)
    
    if (Array.isArray(value)) {
      // Add array itself as a path
      value.forEach((item, index) => {
        const arrayPath = `${currentPath}[${index}]`
        paths.push(arrayPath)
        
        // Recursively get paths from array items if they're objects
        if (item && typeof item === 'object') {
          const subPaths = getAllPaths(item, arrayPath)
          paths.push(...subPaths)
        }
      })
    } else if (value && typeof value === 'object') {
      // Recursively get paths from nested objects
      const subPaths = getAllPaths(value, currentPath)
      paths.push(...subPaths)
    }
  }
  
  return paths
}

/**
 * Find uncategorized paths that aren't covered by a configuration
 * @param obj - The YAML data object
 * @param configuredPaths - Array of paths that are already configured
 * @returns Array of uncategorized paths with their values
 */
export function getUncategorizedPaths(obj: any, configuredPaths: string[]): Array<{
  path: string
  value: any
  type: string
}> {
  const allPaths = getAllPaths(obj)
  const uncategorized: Array<{ path: string; value: any; type: string }> = []
  
  for (const path of allPaths) {
    const isConfigured = configuredPaths.some(configPath => {
      // Check exact match or if the path is a parent/child of a configured path
      return path === configPath || 
             path.startsWith(configPath + '.') || 
             configPath.startsWith(path + '.')
    })
    
    if (!isConfigured) {
      const value = getValueByPath(obj, path)
      const type = getTypeByPath(obj, path)
      uncategorized.push({ path, value, type })
    }
  }
  
  return uncategorized
}

/**
 * Categorize uncategorized paths into logical groups with nested structures
 * @param uncategorizedPaths - Array of uncategorized path objects
 * @returns Categorized groups of paths with nested structure information
 */
export function categorizePaths(uncategorizedPaths: Array<{
  path: string
  value: any
  type: string
}>): Record<string, any> {
  const categories: Record<string, any> = {}
  
  // First pass: Group by top-level category and detect patterns
  const topLevelGroups: Record<string, Array<{ path: string; value: any; type: string }>> = {}
  
  for (const pathObj of uncategorizedPaths) {
    const { path } = pathObj
    const segments = path.split('.')
    
    // Use the top-level property as the category
    const category = segments[0] || 'root'
    
    if (!topLevelGroups[category]) {
      topLevelGroups[category] = []
    }
    
    topLevelGroups[category].push(pathObj)
  }
  
  // Second pass: Analyze each category for nested patterns
  for (const [categoryName, paths] of Object.entries(topLevelGroups)) {
    const categoryStructure = analyzeCategoryStructure(categoryName, paths)
    categories[categoryName] = categoryStructure
  }
  
  return categories
}

/**
 * Analyze a category's structure to detect nested patterns and create UI definitions
 */
function analyzeCategoryStructure(categoryName: string, paths: Array<{ path: string; value: any; type: string }>) {
  // Detect if this is a collection of similar items (like inventory slots)
  const structure = detectCollectionPattern(categoryName, paths)
  
  if (structure.isCollection) {
    return createCollectionStructure(categoryName, structure, paths)
  } else {
    return createFlatStructure(categoryName, paths)
  }
}

/**
 * Detect if paths represent a collection pattern (e.g., slot_0, slot_1, etc.)
 */
function detectCollectionPattern(categoryName: string, paths: Array<{ path: string; value: any; type: string }>) {
  // Group paths by their structure pattern
  const patterns: Record<string, Array<{ path: string; value: any; type: string }>> = {}
  
  for (const pathObj of paths) {
    const segments = pathObj.path.split('.')
    if (segments.length >= 3) {
      // Look for patterns like "category.items.slot_0.property"
      const potentialCollection = segments[1] // e.g., "items"
      const potentialItem = segments[2] // e.g., "slot_0"
      
      // Check if this looks like a collection item (numbered slots, array indices, etc.)
      if (potentialItem.match(/^(slot_\d+|\d+|item_\d+|[a-zA-Z]+_\d+)$/)) {
        const pattern = `${potentialCollection}.${potentialItem.replace(/\d+/, 'X')}`
        if (!patterns[pattern]) {
          patterns[pattern] = []
        }
        patterns[pattern].push(pathObj)
      }
    }
  }
  
  // If we found patterns, this is likely a collection
  const isCollection = Object.keys(patterns).length > 0
  
  return {
    isCollection,
    patterns,
    collectionName: categoryName
  }
}

/**
 * Create a collection structure for items like inventory slots
 */
function createCollectionStructure(_categoryName: string, structure: any, allPaths: Array<{ path: string; value: any; type: string }>) {
  const collections: Record<string, any> = {}
  
  // Process each pattern
  for (const [patternKey, patternPaths] of Object.entries(structure.patterns) as Array<[string, Array<{ path: string; value: any; type: string }>]>) {
    const patternSegments = patternKey.split('.')
    const collectionType = patternSegments[0] // e.g., "items"
    
    if (!collections[collectionType]) {
      collections[collectionType] = {
        type: 'collection',
        items: {},
        itemStructure: {}
      }
    }
    
    // Analyze item structure
    const itemStructure: Record<string, string> = {}
    const items: Record<string, Record<string, any>> = {}
    
    for (const pathObj of patternPaths) {
      const segments = pathObj.path.split('.')
      const itemId = segments[2] // e.g., "slot_0"
      const propertyName = segments.slice(3).join('.') // e.g., "serial" or nested property
      
      if (!items[itemId]) {
        items[itemId] = {}
      }
      
      items[itemId][propertyName] = pathObj.value
      itemStructure[propertyName] = pathObj.type
    }
    
    collections[collectionType].items = items
    collections[collectionType].itemStructure = itemStructure
  }
  
  // Add any remaining flat properties
  const flatProperties = allPaths.filter(pathObj => {
    const segments = pathObj.path.split('.')
    return segments.length <= 2 || !segments[2]?.match(/^(slot_\d+|\d+|item_\d+|[a-zA-Z]+_\d+)$/)
  })
  
  if (flatProperties.length > 0) {
    collections['_properties'] = createFlatStructure('Properties', flatProperties)
  }
  
  return {
    type: 'nested',
    collections
  }
}

/**
 * Create a flat structure for simple properties
 */
function createFlatStructure(_categoryName: string, paths: Array<{ path: string; value: any; type: string }>) {
  return {
    type: 'flat',
    fields: paths
  }
}

/**
 * Convert structured uncategorized data into EditorSectionConfig format
 * @param categoryName - The name of the category
 * @param categoryData - The structured category data
 * @returns EditorSectionConfig compatible structure
 */
export function createEditorConfigFromUncategorized(categoryName: string, categoryData: any): any {
  if (categoryData.type === 'flat') {
    // Create a simple section for flat properties
    return {
      id: `uncategorized-${categoryName}`,
      title: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} (Uncategorized)`,
      description: 'Properties found in the YAML that aren\'t in the predefined configuration',
      icon: 'pi pi-question-circle',
      defaultExpanded: false,
      fields: categoryData.fields.map((field: any) => ({
        yamlPath: field.path,
        semanticName: getSemanticName(field.path),
        inputType: mapTypeToInputType(field.type),
        description: `Auto-detected ${field.type} property`
      }))
    }
  } else if (categoryData.type === 'nested') {
    // Create nested sections for collections
    const sections: any[] = []
    
    for (const [collectionName, collectionData] of Object.entries(categoryData.collections)) {
      if (collectionName === '_properties') {
        // Add flat properties section
        sections.push(createEditorConfigFromUncategorized(`${categoryName}-properties`, collectionData))
      } else {
        // Create collection section with items
        sections.push(createCollectionEditorConfig(categoryName, collectionName, collectionData))
      }
    }
    
    return sections
  }
  
  return null
}

/**
 * Create editor config for collections (like inventory items)
 */
function createCollectionEditorConfig(categoryName: string, collectionName: string, collectionData: any) {
  const sectionId = `uncategorized-${categoryName}-${collectionName}`
  
  // Create fields for each item in the collection
  const itemFields: any[] = []
  
  for (const [itemId, itemProperties] of Object.entries(collectionData.items)) {
    // Create a nested field for each item
    const itemNestedFields: any[] = []
    
    for (const [propertyName, propertyValue] of Object.entries(itemProperties as Record<string, any>)) {
      itemNestedFields.push({
        yamlPath: propertyName,
        semanticName: getSemanticName(propertyName),
        inputType: mapTypeToInputType(typeof propertyValue),
        description: `${propertyName} for ${itemId}`
      })
    }
    
    // Create a nested field for the entire item
    itemFields.push({
      yamlPath: `${categoryName}.${collectionName}.${itemId}`,
      semanticName: formatItemName(itemId),
      inputType: 'nested' as const,
      nestedConfig: itemNestedFields,
      nestedCollapsible: true,
      description: `Configuration for ${itemId}`
    })
  }
  
  return {
    id: sectionId,
    title: `${formatCollectionName(collectionName)} (${Object.keys(collectionData.items).length} items)`,
    description: `Auto-detected ${collectionName} collection with structured items`,
    icon: 'pi pi-list',
    defaultExpanded: false,
    collapsible: true,
    fields: itemFields
  }
}

/**
 * Get a semantic name from a path
 */
function getSemanticName(path: string): string {
  const segments = path.split('.')
  const lastSegment = segments[segments.length - 1]
  
  // Convert snake_case and camelCase to Title Case
  return lastSegment
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Map JavaScript types to input types
 */
function mapTypeToInputType(type: string): 'string' | 'number' | 'boolean' | 'array' {
  switch (type) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return 'array'
    default:
      return 'string'
  }
}

/**
 * Format item names (like slot_0 -> Slot 0)
 */
function formatItemName(itemId: string): string {
  return itemId
    .replace(/_(\d+)$/, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

/**
 * Format collection names (like backpack -> Backpack)
 */
function formatCollectionName(collectionName: string): string {
  return collectionName
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
}

/**
 * Deep clone an object to prevent reference issues
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }
  
  const cloned: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

/**
 * Create a safe path for YAML that handles special characters
 * @param path - The path to sanitize
 * @returns Sanitized path safe for YAML operations
 */
export function sanitizePath(path: string): string {
  return path.replace(/[^a-zA-Z0-9._\[\]]/g, '_')
}

// Test function to validate pattern detection - for development/debugging only
export function testPatternDetection(): void {
  console.log('Testing pattern detection...')
  
  // Test inventory-like data
  const testData = [
    { path: 'inventory.slot_0.serial', value: '12345', type: 'string' },
    { path: 'inventory.slot_0.flags', value: 1, type: 'number' },
    { path: 'inventory.slot_1.serial', value: '67890', type: 'string' },
    { path: 'inventory.slot_1.flags', value: 2, type: 'number' },
    { path: 'inventory.slot_2.serial', value: 'abcde', type: 'string' },
    { path: 'inventory.slot_2.flags', value: 0, type: 'number' },
    { path: 'character.stats.level', value: 50, type: 'number' },
    { path: 'character.stats.experience', value: 1000000, type: 'number' },
    { path: 'settings.graphics.quality', value: 'high', type: 'string' }
  ]
  
  const categorized = categorizePaths(testData)
  console.log('Categorized paths:', categorized)
  
  // Test pattern detection on inventory
  if (categorized.inventory) {
    const pattern = detectCollectionPattern('inventory', categorized.inventory.items || [])
    console.log('Detected inventory pattern:', pattern)
    
    if (pattern) {
      const structure = createCollectionStructure('inventory', pattern, categorized.inventory.items || [])
      console.log('Created inventory structure:', structure)
    }
  }
  
  // Test full editor config generation
  for (const [categoryName, categoryData] of Object.entries(categorized)) {
    if (!categoryData) continue
    const editorConfig = createEditorConfigFromUncategorized(categoryName, categoryData)
    console.log(`Editor config for ${categoryName}:`, editorConfig)
  }
}