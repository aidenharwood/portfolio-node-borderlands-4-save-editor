import { ref, computed } from 'vue'
import {
  extractSteamId as extractSteamIdUtil,
  extractEpicId,
  detectPlatform
} from '../lib/utils/platform-validation'
import {
  extractVanityName,
  getSteamProfileLink,
  getSteamIdLookupLink
} from '../lib/utils/steam-id-helper'

export interface SteamProfile {
  personaName?: string
  profileUrl?: string
  avatarUrl?: string
  summary?: string
}

export type GamePlatform = 'steam' | 'epic'

export interface GamePlatformValidation {
  platformId: string
  platform: GamePlatform
  isValid: boolean
  error: string
  displayValue: string
  needsResolution?: boolean
  profile?: SteamProfile | EpicProfile
}

export interface EpicProfile {
  displayName: string
  epicAccountId?: string
  profileUrl?: string
  // Epic doesn't have avatars in the same way Steam does
}

// Keep legacy interface for compatibility
export interface SteamIdValidation extends GamePlatformValidation {
  steamId: string
}

export function useSteamId() {
  const profileIdInput = ref('')
  const profileError = ref('')
  const isResolving = ref(false)
  const gameProfile = ref<SteamProfile | EpicProfile | null>(null)

  // Cookie utility functions
  function setCookie(name: string, value: string, days = 30) {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  }

  function getCookie(name: string): string | null {
    const nameEQ = name + "="
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  // Extract platform ID from various input formats
  function extractGamePlatformId(input: string): GamePlatformValidation {
    const trimmedInput = input.trim()
    
    if (!trimmedInput) {
      return {
        platformId: '',
        platform: 'steam', // default
        isValid: false,
        error: 'Gaming platform ID or profile URL is required',
        displayValue: trimmedInput
      }
    }

    // Detect platform type
    const detectedPlatform = detectPlatform(trimmedInput)
    
    if (detectedPlatform === 'epic') {
      // Epic Games Account ID validation
      const epicResult = extractEpicId(trimmedInput)
      if (epicResult.epicId) {
        return {
          platformId: epicResult.epicId,
          platform: 'epic',
          isValid: true,
          error: '',
          displayValue: epicResult.epicId,
          needsResolution: false
        }
      } else {
        return {
          platformId: '',
          platform: 'epic',
          isValid: false,
          error: epicResult.error || 'Invalid Epic Games Account ID',
          displayValue: trimmedInput,
          needsResolution: false
        }
      }
    }
    
    if (detectedPlatform === 'steam') {
      // Steam ID validation
      const steamResult = extractSteamIdUtil(trimmedInput)
      
      if (steamResult.steamId && !steamResult.needsResolution) {
        return {
          platformId: steamResult.steamId,
          platform: 'steam',
          isValid: true,
          error: '',
          displayValue: steamResult.steamId,
          needsResolution: false
        }
      } else if (steamResult.needsResolution) {
        return {
          platformId: steamResult.steamId || '',
          platform: 'steam',
          isValid: false,
          error: 'Please use your numeric Steam ID (17 digits starting with 7656119). Find it at: steamcommunity.com/profiles/YOUR_ID',
          displayValue: trimmedInput,
          needsResolution: true
        }
      } else {
        return {
          platformId: '',
          platform: 'steam',
          isValid: false,
          error: steamResult.error || 'Invalid Steam ID',
          displayValue: trimmedInput,
          needsResolution: false
        }
      }
    }

    // Unknown platform
    return {
      platformId: '',
      platform: 'steam', // default
      isValid: false,
      error: 'Please enter a valid Steam ID, Steam profile URL, or Epic Games Account ID (32-character hex string)',
      displayValue: trimmedInput
    }
  }

  // Extract Steam ID from various input formats (legacy function for Steam-specific logic)
  function extractSteamId(input: string): SteamIdValidation {
    const trimmedInput = input.trim()
    
    if (!trimmedInput) {
      return {
        steamId: '',
        platformId: '',
        platform: 'steam',
        isValid: false,
        error: 'Steam ID or profile URL is required',
        displayValue: trimmedInput
      }
    }

    // Use the utility function
    const result = extractSteamIdUtil(trimmedInput)
    
    if (result.steamId && !result.needsResolution) {
      return {
        steamId: result.steamId,
        platformId: result.steamId,
        platform: 'steam',
        isValid: true,
        error: '',
        displayValue: result.steamId
      }
    } else if (result.needsResolution) {
      return {
        steamId: result.steamId || '',
        platformId: result.steamId || '',
        platform: 'steam',
        isValid: false,
        error: 'Please use your numeric Steam ID (17 digits starting with 7656119). Find it at: steamcommunity.com/profiles/YOUR_ID',
        displayValue: trimmedInput,
        needsResolution: true
      }
    } else {
      return {
        steamId: '',
        platformId: '',
        platform: 'steam',
        isValid: false,
        error: result.error || 'Invalid Steam ID',
        displayValue: trimmedInput
      }
    }
  }

  // Computed properties
  const platformValidation = computed(() => extractGamePlatformId(profileIdInput.value))
  const steamIdValidation = computed(() => extractSteamId(profileIdInput.value)) // Keep for compatibility
  const steamId = computed(() => platformValidation.value.isValid ? platformValidation.value.platformId : '')
  const profileIdValid = computed(() => platformValidation.value.isValid)
  const platformType = computed(() => platformValidation.value.platform)

  // Validate and update error state (now async to handle resolution)
  async function validateProfileId() {
    // If clicking "Change" or clearing validation, reset profile and error state
    if (!profileIdInput.value || profileIdInput.value.trim() === '') {
      gameProfile.value = null
      profileError.value = ''
      return
    }
    
    // Handle platform validation differently
    const platform = platformType.value
    const validation = platformValidation.value
    
    if (platform === 'epic') {
      // For Epic Games, just validate the format - no API lookup
      if (validation.isValid) {
        profileError.value = ''
        // Create a basic Epic profile for display
        gameProfile.value = {
          displayName: `Epic User ${validation.platformId.substring(0, 8)}...`,
          epicAccountId: validation.platformId
        }
        // Save Epic Account ID to cookie for persistence
        setCookie('bl4_platform_id', validation.platformId)
      } else {
        profileError.value = 'Invalid Epic Games Account ID format. Must be a 32-character hexadecimal string.'
        gameProfile.value = null
      }
    } else {
      isResolving.value = false

      if (validation.isValid && !validation.needsResolution) {
        profileError.value = ''
        const maskedId = `${validation.platformId.substring(0, 8)}...`
        gameProfile.value = {
          personaName: `Steam User ${maskedId}`,
          profileUrl: `https://steamcommunity.com/profiles/${validation.platformId}`
        }
        setCookie('bl4_platform_id', validation.platformId)
      } else if (validation.needsResolution) {
        const vanityName = extractVanityName(profileIdInput.value)
        if (vanityName) {
          const lookupLink = getSteamIdLookupLink(vanityName)
          const profileLink = getSteamProfileLink(vanityName)
          profileError.value = `Cannot resolve "${vanityName}". Find your Steam ID via: <a href="${lookupLink}">steamid.io</a> or get our steamID64 from: <a href="${profileLink}?xml=1">Steam</a>`
        } else {
          profileError.value = 'Please use your numeric Steam ID (17 digits starting with 7656119). Find it at: steamcommunity.com/profiles/YOUR_ID'
        }
        gameProfile.value = null
      } else {
        profileError.value = validation.error || 'Invalid Steam ID format. Please enter a 17-digit Steam ID starting with 7656119.'
        gameProfile.value = null
      }
    }
  }

  function clearSavedProfileId() {
    setCookie('bl4_platform_id', '', -1) // Delete cookie (keep same name for compatibility)
    profileIdInput.value = ''
    profileError.value = ''
    gameProfile.value = null
  }

  function resetValidation() {
    profileError.value = ''
    gameProfile.value = null
  }

  // Initialize from cookie - detect platform and handle appropriately
  async function initializeProfileId() {
    const savedId = getCookie('bl4_platform_id') // Keep checking same cookie for compatibility
    if (savedId) {
      profileIdInput.value = savedId
      const platformValidation = extractGamePlatformId(savedId)
      
      if (platformValidation.platform === 'epic' && platformValidation.isValid) {
        // For Epic, just create the profile without API call
        profileError.value = '' // Clear any previous errors
        gameProfile.value = {
          displayName: `Epic User ${savedId.substring(0, 8)}...`,
          epicAccountId: savedId
        }
      } else if (platformValidation.platform === 'steam' && platformValidation.isValid && !platformValidation.needsResolution) {
        profileError.value = ''
        gameProfile.value = {
          personaName: `Steam User ${savedId.substring(0, 8)}...`,
          profileUrl: `https://steamcommunity.com/profiles/${savedId}`
        }
      } else {
        // Invalid or needs resolution - fall back to validation flow
        await validateProfileId()
      }
    }
  }

  return {
    // New generic names
    profileIdInput,
    profileError,
    profileIdValid,
    gameProfile,
    validateProfileId,
    clearSavedProfileId,
    initializeProfileId,
    
    // Legacy compatibility - map new variables to old names
    steamIdInput: profileIdInput,
    steamIdError: profileError,
    steamId,
    steamIdValid: profileIdValid,
    isValidSteamId: profileIdValid, // Alias for compatibility
    steamIdValidation,
    steamProfile: gameProfile,
    isResolving,
    validateSteamId: validateProfileId,
    resetValidation,
    clearSavedSteamId: clearSavedProfileId,
    initializeSteamId: initializeProfileId,
    getCookie,
    setCookie
  }
}