import { decodeSerial, type DecodedSerial } from '../serial-decoder'

export interface SummaryOptions {
  includeEquipped?: boolean
  stateLabel?: string
  fallback?: string
}

const UNKNOWN_LABEL_PREFIX = 'Unknown'
const SERIAL_PREVIEW_LENGTH = 24

const includesIgnoreCase = (source: string, candidate: string): boolean =>
  source.toLowerCase().includes(candidate.toLowerCase())

const truncateSerial = (serial: string): string =>
  serial.length <= SERIAL_PREVIEW_LENGTH ? serial : `${serial.slice(0, SERIAL_PREVIEW_LENGTH)}...`

export const normalizeNicnlLabel = (value?: string | null): string => {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (
    trimmed === UNKNOWN_LABEL_PREFIX ||
    trimmed.startsWith(`${UNKNOWN_LABEL_PREFIX} `) ||
    trimmed.startsWith(`${UNKNOWN_LABEL_PREFIX}(`)
  ) {
    return ''
  }

  return trimmed
}

export const tryDecodeSerial = (serial: string): DecodedSerial | null => {
  if (!serial) {
    return null
  }

  try {
    return decodeSerial(serial)
  } catch (error) {
    console.warn('Failed to decode serial using nicnl decoder:', error)
    return null
  }
}

export const buildNicnlSummary = (
  decoded: DecodedSerial | null,
  options: SummaryOptions = {}
): string => {
  const primaryParts: string[] = []

  if (decoded && decoded.level !== undefined && decoded.level !== null) {
    primaryParts.push(`[${decoded.level}]`)
  }

  const itemTypeName = normalizeNicnlLabel(decoded?.itemTypeName)
  const manufacturer = normalizeNicnlLabel(decoded?.manufacturer)
  const weaponType = normalizeNicnlLabel(decoded?.weaponType)

  if (itemTypeName) {
    primaryParts.push(itemTypeName)
  }

  if (manufacturer && (!itemTypeName || !includesIgnoreCase(itemTypeName, manufacturer))) {
    primaryParts.push(manufacturer)
  }

  if (weaponType && (!itemTypeName || !includesIgnoreCase(itemTypeName, weaponType))) {
    primaryParts.push(weaponType)
  }

  const summaryParts = [...primaryParts]

  if (!summaryParts.length && options.fallback) {
    summaryParts.push(options.fallback)
  }

  if (options.includeEquipped) {
    summaryParts.push('Equipped')
  }

  if (options.stateLabel) {
    summaryParts.push(options.stateLabel)
  }

  return summaryParts
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' - ')
}

export const getItemDisplayName = (serial: string): string => {
  if (!serial) {
    return 'None'
  }

  if (!serial.startsWith('@U')) {
    return serial
  }

  const decoded = tryDecodeSerial(serial)
  const fallback = truncateSerial(serial)
  const summary = buildNicnlSummary(decoded, { fallback })

  return summary || fallback
}
