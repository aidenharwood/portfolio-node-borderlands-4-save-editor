/**
 * File type detection and processing utilities for BL4 save files
 */

import * as yaml from 'js-yaml'

// Custom YAML schema to handle unknown tags (matching backend BL4_SCHEMA)
const unknownTagType = new yaml.Type('!', {
    kind: 'scalar',
    multi: true,
    construct: (data: any) => data
});

const unknownSequenceType = new yaml.Type('!', {
    kind: 'sequence', 
    multi: true,
    construct: (data: any) => data
});

const unknownMappingType = new yaml.Type('!', {
    kind: 'mapping',
    multi: true, 
    construct: (data: any) => data
});

// Handle specific BL4 tags like !<!tags>
const bl4TagsType = new yaml.Type('!<!tags>', {
    kind: 'mapping',
    construct: (data: any) => data
});

const BL4_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
    unknownTagType,
    unknownSequenceType,
    unknownMappingType,
    bl4TagsType
]);

export interface FileTypeInfo {
  type: 'character' | 'profile' | 'unknown'
  format: 'sav' | 'yaml'
  fileName: string
}

/**
 * Detect if a file is a character save or profile save based on its content and name
 */
export async function detectFileType(file: File): Promise<FileTypeInfo> {
  const fileName = file.name.toLowerCase()
  const nameIsYaml = fileName.endsWith('.yaml') || fileName.endsWith('.yml')
  const nameIsSav = fileName.endsWith('.sav')
  
  const result: FileTypeInfo = {
    type: 'unknown',
    format: nameIsSav ? 'sav' : (nameIsYaml ? 'yaml' : 'yaml'),
    fileName: file.name
  }

  // Check file content to determine actual format
  // If file contains null bytes, it's likely a binary SAV file regardless of extension
  const isBinary = await checkIfBinaryFile(file)
  
  if (isBinary) {
    // File contains null bytes, treat as SAV regardless of extension
    result.format = 'sav'
  } else {
    // Text file, use extension-based detection
    result.format = nameIsSav ? 'sav' : 'yaml'
  }

  // Simple filename-based type detection - this is all we need
  if (fileName.includes('profile')) {
    result.type = 'profile'
  } else if (/^\d+\.(sav|ya?ml)$/.test(fileName)) {
    result.type = 'character'
  } else if (fileName.includes('character')) {
    result.type = 'character'
  }

  return result
}

/**
 * Helper function to check if a file contains binary data
 */
async function checkIfBinaryFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const bytes = new Uint8Array(buffer)
      
      // Check for null bytes - definitive indicator of binary data
      // YAML files should never contain null bytes
      const hasNullBytes = bytes.some(byte => byte === 0)
      
      resolve(hasNullBytes)
    }
    reader.onerror = () => resolve(false) // Default to text if can't read
    
    // Read first 1KB to check for binary content
    reader.readAsArrayBuffer(file.slice(0, 1024))
  })
}





/**
 * Convert YAML content to the internal JSON format for editing
 */
export async function processYamlFile(file: File): Promise<{
  fileName: string
  originalContent: string
  yamlContent: string
  jsonData: any
  fileType: FileTypeInfo
}> {
  const content = await file.text()
  const fileType = await detectFileType(file)

  // Safety check: if the file was detected as binary, don't try to parse as YAML
  if (fileType.format === 'sav') {
    throw new Error(`File ${file.name} appears to be a binary SAV file, not YAML. Please upload SAV files through the proper upload process.`)
  }

  try {
    // Parse YAML with BL4 schema to handle unknown tags properly
    const jsonData = yaml.load(content, {
      schema: BL4_SCHEMA,
      onWarning: function(warning) {
        console.warn('YAML warning:', warning)
      }
    })
    
    return {
      fileName: file.name,
      originalContent: content,
      yamlContent: content, // Keep original content
      jsonData,
      fileType
    }
  } catch (error) {
    throw new Error(`Failed to parse YAML file ${file.name}: ${error}`)
  }
}