import { ref } from 'vue'
import * as yaml from 'js-yaml'
import { processYamlFile, type FileTypeInfo } from '../lib/utils/file-detection'
import { processSavFile, convertYamlToSav } from '../lib/utils/bl4-crypto-browser'
import { isCharacterSave, isProfileSave } from '../lib/types/save-types'

export interface SaveFile {
  name: string
  size: number
  originalContent: string
  yamlContent: string        // YAML string for display
  jsonData: any             // Parsed JSON object for editing
  yamlError: string
  hasChanges: boolean
  fileType?: FileTypeInfo   // File type detection info
  characterInfo?: {
    name: string
    level: string
    className: string
  }
  profileInfo?: {
    selectedCharacterName?: string
    selectedCharacterId?: string
    totalCharacters?: number
  }
}

export function useSaveFiles() {
  const saveFiles = ref<SaveFile[]>([])
  const activeSaveFile = ref('')
  const uploading = ref(false)
  const downloading = ref(false)
  const error = ref('')

  // Helper function to check if a file contains binary data
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

  async function isZipLike(file: File): Promise<boolean> {
    const nameLooksZip = file.name.toLowerCase().endsWith('.zip')
    try {
      const headerBuffer = await file.slice(0, 4).arrayBuffer()
      const header = new Uint8Array(headerBuffer)
      if (header.length >= 2 && header[0] === 0x50 && header[1] === 0x4b) {
        return true
      }
    } catch (err) {
      console.warn(`Unable to inspect file header for ${file.name}:`, err)
    }

    return nameLooksZip
  }

  async function processZipArchive(file: File, steamId: string): Promise<SaveFile[]> {
    const JSZip = (await import('jszip')).default
    const archiveData = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(archiveData)
    const extractedFiles: SaveFile[] = []

    const entries = Object.values(zip.files)
    for (const entry of entries) {
      if (entry.dir) continue

      const normalizedName = entry.name.split('/').pop() ?? entry.name
      const lowerName = normalizedName.toLowerCase()

      try {
        if (lowerName.endsWith('.sav')) {
          const content = await entry.async('uint8array')
          const contentView = new Uint8Array(content)
          const entryFile = new File([contentView], normalizedName, { type: 'application/octet-stream' })
          const processed = await processSavFile(entryFile, steamId)
          const metadata = deriveSaveMetadata(processed.jsonData, processed.fileType)

          extractedFiles.push({
            name: normalizedName,
            size: entryFile.size,
            originalContent: processed.yamlContent,
            yamlContent: processed.yamlContent,
            jsonData: processed.jsonData,
            yamlError: '',
            hasChanges: false,
            fileType: metadata.fileType,
            characterInfo: metadata.characterInfo,
            profileInfo: metadata.profileInfo
          })
        } else if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) {
          const textContent = await entry.async('text')
          const entryFile = new File([textContent], normalizedName, { type: 'text/yaml' })
          const processed = await processYamlFile(entryFile)
          const metadata = deriveSaveMetadata(processed.jsonData, processed.fileType)

          extractedFiles.push({
            name: processed.fileName,
            size: entryFile.size,
            originalContent: processed.originalContent,
            yamlContent: processed.yamlContent,
            jsonData: processed.jsonData,
            yamlError: '',
            hasChanges: processed.yamlContent !== processed.originalContent,
            fileType: metadata.fileType,
            characterInfo: metadata.characterInfo,
            profileInfo: metadata.profileInfo
          })
        } else {
          console.warn(`Skipping unsupported entry ${entry.name} in ${file.name}`)
        }
      } catch (error) {
        console.error(`Failed to process ${entry.name} from ${file.name}:`, error)
      }
    }

    if (extractedFiles.length === 0) {
      console.warn(`No supported save files found in ${file.name}`)
    }

    return extractedFiles
  }

  // Process YAML files directly (client-side)
  async function processYamlFiles(yamlFiles: File[]): Promise<SaveFile[]> {
    const processedFiles: SaveFile[] = []

    for (const file of yamlFiles) {
      try {
        const processed = await processYamlFile(file)
        const metadata = deriveSaveMetadata(processed.jsonData, processed.fileType)
        
        processedFiles.push({
          name: processed.fileName,
          size: file.size,
          originalContent: processed.originalContent,
          yamlContent: processed.yamlContent,
          jsonData: processed.jsonData,
          yamlError: '',
          hasChanges: processed.yamlContent !== processed.originalContent, // Mark as changed if account ID was injected
          fileType: metadata.fileType,
          characterInfo: metadata.characterInfo,
          profileInfo: metadata.profileInfo
        })
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err)
        error.value = `Failed to process ${file.name}: ${(err as Error).message}`
      }
    }

    return processedFiles
  }

  async function processSavFiles(savFiles: File[], steamId: string): Promise<SaveFile[]> {
    const processedFiles: SaveFile[] = []

    for (const file of savFiles) {
      try {
        if (await isZipLike(file)) {
          const extracted = await processZipArchive(file, steamId)
          processedFiles.push(...extracted)
          continue
        }

        const processed = await processSavFile(file, steamId)
        const metadata = deriveSaveMetadata(processed.jsonData, processed.fileType)

        processedFiles.push({
          name: file.name,
          size: file.size,
          originalContent: processed.yamlContent,
          yamlContent: processed.yamlContent,
          jsonData: processed.jsonData,
          yamlError: '',
          hasChanges: false,
          fileType: metadata.fileType,
          characterInfo: metadata.characterInfo,
          profileInfo: metadata.profileInfo
        })
      } catch (err) {
        console.error(`Failed to decrypt ${file.name}:`, err)
        error.value = `Failed to decrypt ${file.name}: ${(err as Error).message}`
      }
    }

    return processedFiles
  }

  function deduplicateSaveFiles(files: SaveFile[]): SaveFile[] {
    const byName = new Map<string, SaveFile>()

    for (const file of files) {
      if (!byName.has(file.name)) {
        byName.set(file.name, file)
      } else {
        console.warn(`Duplicate save detected for ${file.name}; keeping the first instance and discarding the rest.`)
      }
    }

    return Array.from(byName.values())
  }

  function extractProfileInfo(jsonData: any) {
    if (!jsonData || typeof jsonData !== 'object') {
      return undefined
    }

    try {
      const domains = jsonData.domains
      const local = domains?.local
      const selectedKey = typeof local?.characters_selected === 'string' ? local.characters_selected : undefined
      const characters = local?.characters && typeof local.characters === 'object' ? local.characters : undefined
      const selectedCharacter = selectedKey && characters ? characters[selectedKey] : undefined

      const selectedName = selectedCharacter?.char_name || selectedCharacter?.character_name || selectedCharacter?.name
      const totalCharacters = characters ? Object.keys(characters).length : undefined

      return {
        selectedCharacterName: selectedName ? String(selectedName) : undefined,
        selectedCharacterId: selectedKey ? String(selectedKey) : undefined,
        totalCharacters: typeof totalCharacters === 'number' && totalCharacters > 0 ? totalCharacters : undefined
      }
    } catch (err) {
      console.warn('Failed to extract profile info:', err)
      return undefined
    }
  }

  function deriveSaveMetadata(jsonData: any, baseType: FileTypeInfo): {
    fileType: FileTypeInfo
    characterInfo?: SaveFile['characterInfo']
    profileInfo?: SaveFile['profileInfo']
  } {
    const updatedType: FileTypeInfo = { ...baseType }
    let characterInfo: SaveFile['characterInfo'] | undefined
    let profileInfo: SaveFile['profileInfo'] | undefined

    if (isCharacterSave(jsonData)) {
      updatedType.type = 'character'
      characterInfo = extracted_character_info(jsonData)
    } else if (isProfileSave(jsonData)) {
      updatedType.type = 'profile'
      profileInfo = extractProfileInfo(jsonData)
    }

    return {
      fileType: updatedType,
      characterInfo,
      profileInfo
    }
  }

  // Extract character info from YAML data
  // Extract character info from parsed YAML/JSON data
  // Be permissive about structure: BL4 data often nests under `state`, but
  // other YAML exports may use different top-level keys. Try several common
  // patterns and fall back to safe defaults rather than failing outright.
  function extracted_character_info(jsonData: any) {
    if (!jsonData || typeof jsonData !== 'object') return undefined

    try {
      // Prefer the BL4 `state` object when present, otherwise fall back to
      // other common container names or the root object itself.
      const candidate = jsonData.state || jsonData.character_data || jsonData.player_character || jsonData

      // Name may be under several keys depending on exporter/version
      const name = candidate.char_name || candidate.character_name || candidate.name || candidate.player_name || (candidate.player && candidate.player.name)

      // Class likewise has a few common keys
      const className = candidate.class || candidate.character_class || candidate.player_class || (candidate.player && candidate.player.class)

      // Level is most commonly stored in state.experience[0].level for BL4
      let level: any = undefined
      if (Array.isArray(candidate.experience) && candidate.experience[0]?.level !== undefined) {
        level = candidate.experience[0].level
      } else if (candidate.level !== undefined) {
        level = candidate.level
      } else if (candidate.experience_level !== undefined) {
        level = candidate.experience_level
      } else if (candidate.stats && candidate.stats.level !== undefined) {
        level = candidate.stats.level
      }

      return {
        name: name ? String(name) : 'Unknown',
        level: level !== undefined ? String(level) : '1',
        className: className ? String(className) : 'Unknown'
      }
    } catch (err) {
      console.warn('Failed to extract character info:', err)
      return undefined
    }
  }

  // Upload save files (SAV or YAML)
  async function uploadSaveFolder(files: FileList, steamId: string): Promise<void> {
    if (!steamId) {
      throw new Error('Steam ID is required')
    }

    uploading.value = true
    error.value = ''
    saveFiles.value = []

    try {
      // Separate files by actual content type, not just extension
      const yamlFiles: File[] = []
      const savFiles: File[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file content to determine if it's binary (SAV) or text (YAML)
        const isBinary = await checkIfBinaryFile(file)
        
        if (isBinary) {
          savFiles.push(file)
        } else {
          yamlFiles.push(file)
        }
      }

      const processedFiles: SaveFile[] = []

      if (yamlFiles.length > 0) {
        const yamlProcessed = await processYamlFiles(yamlFiles)
        processedFiles.push(...yamlProcessed)
      }

      if (savFiles.length > 0) {
        const savProcessed = await processSavFiles(savFiles, steamId)
        processedFiles.push(...savProcessed)
      }

      if (processedFiles.length === 0) {
        throw new Error('No supported save files were processed. Ensure you selected .sav or .yaml files.')
      }

      const uniqueFiles = deduplicateSaveFiles(processedFiles)
      saveFiles.value = uniqueFiles

      if (uniqueFiles.length > 0) {
        activeSaveFile.value = uniqueFiles[0].name
      }

      updatePageTitle()

    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      uploading.value = false
    }
  }

  // Handle YAML changes (manual text editing)
  function handleYamlChange(fileName: string, event: Event) {
    const textarea = event.target as HTMLTextAreaElement
    const newContent = textarea.value

    const fileIndex = saveFiles.value.findIndex(f => f.name === fileName)
    if (fileIndex !== -1) {
      saveFiles.value[fileIndex].yamlContent = newContent
      
      // Try to parse the YAML and update jsonData
      try {
        const parsedData = yaml.load(newContent)
        saveFiles.value[fileIndex].jsonData = parsedData
        saveFiles.value[fileIndex].yamlError = ''
      } catch (error) {
        saveFiles.value[fileIndex].yamlError = error instanceof Error ? error.message : 'Invalid YAML'
      }
      
      saveFiles.value[fileIndex].hasChanges = 
        newContent !== saveFiles.value[fileIndex].originalContent
    }
  }

  // Handle JSON changes (visual editor)
  function handleJsonChange(fileName: string, newJsonData: any) {
    const fileIndex = saveFiles.value.findIndex(f => f.name === fileName)
    if (fileIndex !== -1) {
      const file = saveFiles.value[fileIndex]
      file.jsonData = newJsonData
      
      // Convert JSON back to YAML for display
      try {
        const yamlContent = yaml.dump(newJsonData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
          schema: yaml.DEFAULT_SCHEMA, // Use DEFAULT_SCHEMA for consistency with backend BL4_SCHEMA
          skipInvalid: true, // Skip invalid values instead of failing
          flowLevel: -1,
          styles: {
            '!!null': 'canonical' // Handle null values properly
          },
          // Ensure we preserve all data types correctly
          replacer: (_key, value) => {
            // Handle special cases for BL4 data
            if (typeof value === 'number' && !isFinite(value)) {
              return null // Replace NaN/Infinity with null
            }
            return value
          }
        })
        file.yamlContent = yamlContent
        file.yamlError = ''
      } catch (error) {
        file.yamlError = error instanceof Error ? error.message : 'Failed to convert to YAML'
        console.error('YAML dump error:', error)
      }
      
      // Visual editing always creates changes
      file.hasChanges = true

      // Deduplicate unique_rewards to avoid duplicates introduced elsewhere
      try {
        if (Array.isArray(file.jsonData?.state?.unique_rewards)) {
          file.jsonData.state.unique_rewards = Array.from(new Set(file.jsonData.state.unique_rewards))
        }
      } catch (e) {
        // ignore
      }

      // Debug: log updated stats.challenge for the file (temporary)
      try {
        // eslint-disable-next-line no-console
        console.debug('[useSaveFiles] handleJsonChange updated stats.challenge for', fileName, file.jsonData?.stats?.challenge)
      } catch (e) {}
    }
  }

  // Create backup
  function createBackup(fileName: string) {
    const file = saveFiles.value.find(f => f.name === fileName)
    if (file) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const backupName = `${fileName.replace('.sav', '')}-backup-${timestamp}.yaml`
      
      const blob = new Blob([file.yamlContent], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backupName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  // Revert file
  function revertFile(fileName: string) {
    const fileIndex = saveFiles.value.findIndex(f => f.name === fileName)
    if (fileIndex !== -1) {
      const file = saveFiles.value[fileIndex]
      
      // Reset all content to original
      file.yamlContent = file.originalContent
      
      // Reparse the original content to reset jsonData
      try {
        // Use safer YAML loading options to handle problematic content
        const parsedData = yaml.load(file.originalContent, {
          schema: yaml.FAILSAFE_SCHEMA, // Use safer schema
          json: true // Allow JSON fallback
        })
        file.jsonData = parsedData
        file.yamlError = ''
        console.log(`Successfully reverted file ${fileName}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid YAML'
        file.yamlError = errorMessage
        console.error(`Error reverting file ${fileName}:`, error)
        
        // Try to parse as JSON as fallback
        try {
          const jsonData = JSON.parse(file.originalContent)
          file.jsonData = jsonData
          file.yamlError = 'Loaded as JSON (YAML parse failed)'
          console.log(`Fallback: loaded ${fileName} as JSON`)
        } catch (jsonError) {
          console.error(`Both YAML and JSON parsing failed for ${fileName}:`, jsonError)
          // Keep the original error message
        }
      }
      
      // Mark as no changes
      file.hasChanges = false
      
      console.log(`Reverted file ${fileName} - hasChanges: ${file.hasChanges}`)
    }
  }

  // Create all backups
  function createAllBackups() {
    saveFiles.value.forEach(file => createBackup(file.name))
  }

  // Download files in specified format
  async function downloadSaveFolder(steamId: string, format: 'sav' | 'yaml' = 'sav'): Promise<void> {
    downloading.value = true
    error.value = ''

    try {
      if (format === 'yaml') {
        // Download as YAML files directly (client-side)
        await downloadAsYaml()
      } else {
        // Download as SAV files (requires API conversion)
        await downloadAsSav(steamId)
      }
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      downloading.value = false
    }
  }

  // Download as YAML files (client-side)
  async function downloadAsYaml(): Promise<void> {
    // Create a zip file with all YAML files
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    saveFiles.value.forEach(file => {
      // Use .yaml extension for all files
      const yamlFileName = file.name.replace(/\.(sav|ya?ml)$/, '.yaml')
      zip.file(yamlFileName, file.yamlContent)
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, 'bl4-saves-yaml.zip')
  }

  // Download as SAV files (client-side conversion)
  async function downloadAsSav(steamId: string): Promise<void> {
    if (!steamId) {
      throw new Error('Steam ID is required to encrypt and download SAV files')
    }

    if (saveFiles.value.length === 0) {
      throw new Error('No save files are loaded')
    }

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const file of saveFiles.value) {
      try {
        const savBytes = await convertYamlToSav(file.yamlContent, steamId)
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const savFileName = `${baseName}.sav`
        zip.file(savFileName, savBytes)
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error)
        throw new Error(`Failed to convert ${file.name}: ${(error as Error).message}`)
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, 'bl4-saves-sav.zip')
  }

  // Helper function to download a blob
  function downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const timestamp = new Date().toISOString().slice(0, 10)
    a.download = `${timestamp}-${fileName}`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Update page title with character information
  function updatePageTitle() {
    const characterFiles = saveFiles.value.filter(file => 
      file.fileType?.type === 'character' && file.characterInfo?.name
    )
    
    if (characterFiles.length > 0) {
      const names = characterFiles.map(file => file.characterInfo?.name).join(', ')
      document.title = `BL4 Save Editor - ${names}`
    } else if (saveFiles.value.length > 0) {
      document.title = `BL4 Save Editor - ${saveFiles.value.length} saves loaded`
    }
  }

  // Clear all loaded files and reset state
  function clearFiles() {
    saveFiles.value = []
    activeSaveFile.value = ''
    updatePageTitle()
  }

  function formatProfileDisplay(profile?: SaveFile['profileInfo']): string {
    if (!profile) return 'Profile'

    const parts: string[] = ['Profile']
    if (profile.selectedCharacterName) {
      parts.push(`Selected: ${profile.selectedCharacterName}`)
    } else if (profile.selectedCharacterId) {
      parts.push(`Selected ID: ${profile.selectedCharacterId}`)
    }

    if (typeof profile.totalCharacters === 'number' && profile.totalCharacters > 0) {
      const label = profile.totalCharacters === 1 ? 'character' : 'characters'
      parts.push(`${profile.totalCharacters} ${label}`)
    }

  return parts.join(' - ')
  }

  // Get file icon
  function getFileIcon(fileName: string): string {
    const file = saveFiles.value.find(f => f.name === fileName)
    if (file?.fileType?.type === 'profile') {
      return 'pi pi-user'
    } else if (file?.fileType?.type === 'character' || fileName.match(/\d+\.sav/)) {
      return 'pi pi-user-plus'
    }
    return 'pi pi-file'
  }

  // Get file display name
  function getFileDisplayName(fileName: string): string {
    const file = saveFiles.value.find(f => f.name === fileName)

    if (file?.fileType?.type === 'profile') {
      return formatProfileDisplay(file.profileInfo)
    }

    if (file?.fileType?.type === 'character' || fileName.match(/\d+\.sav/)) {
      const match = fileName.match(/(\d+)\.sav/)
      const fileIndex = match ? match[1] : fileName.replace('.sav', '')

      if (file?.characterInfo?.name) {
        return `${file.characterInfo.name} (${fileIndex})`
      }
      return `Character ${fileIndex}`
    }
    return fileName
  }

  return {
    saveFiles,
    activeSaveFile,
    uploading,
    downloading,
    error,
    uploadSaveFolder,
    handleYamlChange,
    handleJsonChange,
    createBackup,
    revertFile,
    createAllBackups,
    downloadSaveFolder,
    updatePageTitle,
    clearFiles,
    getFileIcon,
    getFileDisplayName
  }
}