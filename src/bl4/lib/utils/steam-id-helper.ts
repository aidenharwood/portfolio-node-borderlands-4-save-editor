const VANITY_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export function extractVanityName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const urlMatch = trimmed.match(/steamcommunity\.com\/id\/([^\/\s]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  if (VANITY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getSteamProfileLink(vanityName: string): string {
  const safe = encodeURIComponent(vanityName);
  return `https://steamcommunity.com/id/${safe}`;
}

export function getSteamIdLookupLink(vanityName: string): string {
  const safe = encodeURIComponent(vanityName);
  return `https://steamid.io/lookup/${safe}`;
}
