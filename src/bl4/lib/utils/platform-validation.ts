const STEAM_ID_PATTERN = /^7656119\d{10}$/;
const EPIC_ID_PATTERN = /^[a-f0-9]{32}$/i;
const VANITY_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export type DetectedPlatform = 'steam' | 'epic' | 'unknown';

export interface SteamIdExtraction {
  steamId: string;
  isValid: boolean;
  error: string;
  displayValue: string;
  needsResolution: boolean;
}

export interface EpicIdExtraction {
  epicId: string;
  isValid: boolean;
  error: string;
}

export function detectPlatform(input: string): DetectedPlatform {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'unknown';
  }

  if (EPIC_ID_PATTERN.test(trimmed) || /epicgames\.com/i.test(trimmed)) {
    return 'epic';
  }

  if (STEAM_ID_PATTERN.test(trimmed)) {
    return 'steam';
  }

  if (/steamcommunity\.com/i.test(trimmed)) {
    return 'steam';
  }

  if (VANITY_PATTERN.test(trimmed)) {
    return 'steam';
  }

  return 'unknown';
}

export function extractEpicId(input: string): EpicIdExtraction {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      epicId: '',
      isValid: false,
      error: 'Epic Games Account ID is required'
    };
  }

  if (EPIC_ID_PATTERN.test(trimmed)) {
    return {
      epicId: trimmed.toLowerCase(),
      isValid: true,
      error: ''
    };
  }

  const match = trimmed.match(/epicgames\.com\/(?:id|profile)\/([a-f0-9]{32})/i);
  if (match && match[1]) {
    return {
      epicId: match[1].toLowerCase(),
      isValid: true,
      error: ''
    };
  }

  return {
    epicId: '',
    isValid: false,
    error: 'Invalid Epic Games Account ID'
  };
}

export function extractSteamId(input: string): SteamIdExtraction {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      steamId: '',
      isValid: false,
      error: 'Steam ID or profile URL is required',
      displayValue: trimmed,
      needsResolution: false
    };
  }

  if (STEAM_ID_PATTERN.test(trimmed)) {
    return {
      steamId: trimmed,
      isValid: true,
      error: '',
      displayValue: trimmed,
      needsResolution: false
    };
  }

  const profileUrlMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
  if (profileUrlMatch) {
    const candidate = profileUrlMatch[1];
    if (STEAM_ID_PATTERN.test(candidate)) {
      return {
        steamId: candidate,
        isValid: true,
        error: '',
        displayValue: candidate,
        needsResolution: false
      };
    }

    return {
      steamId: '',
      isValid: false,
      error: 'Invalid Steam ID format in profile URL',
      displayValue: trimmed,
      needsResolution: false
    };
  }

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^\/\s]+)/i);
  if (vanityMatch) {
    const vanity = vanityMatch[1];
    return {
      steamId: vanity,
      isValid: false,
      error: '',
      displayValue: trimmed,
      needsResolution: true
    };
  }

  if (trimmed.includes('steamcommunity.com')) {
    return {
      steamId: '',
      isValid: false,
      error: 'Please provide the complete Steam profile URL',
      displayValue: trimmed,
      needsResolution: false
    };
  }

  if (VANITY_PATTERN.test(trimmed)) {
    return {
      steamId: trimmed,
      isValid: false,
      error: '',
      displayValue: trimmed,
      needsResolution: true
    };
  }

  return {
    steamId: '',
    isValid: false,
    error: 'Please enter a valid Steam ID (17 digits starting with 7656119) or Steam profile URL',
    displayValue: trimmed,
    needsResolution: false
  };
}
