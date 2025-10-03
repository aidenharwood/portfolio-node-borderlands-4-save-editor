// Lightweight port of parts of bl4editor.py for client-side serial decode/encode
// This is a pragmatic implementation focused on fields useful for the UI
export interface DecodedItem {
  serial: string
  item_type: string
  item_category: string
  length: number
  stats: {
    primary_stat?: number | null
    secondary_stat?: number | null
    level?: number | null
    rarity?: number | null
    manufacturer?: number | null
    item_class?: number | null
    flags?: number[] | null
  }
  raw_fields: Record<string, any>
  confidence: string
  original_binary: Uint8Array
  original_prefix: string
  original_payload: string
  data_positions: number[]
  char_offsets: number[]
  weapon_name?: string
  markers: Record<string, [number, string]>
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=!$%&*()[]{}~`^_<>?#;'
const CHAR_MAP: Record<string, number> = {}
for (let i = 0; i < CHARS.length; i++) CHAR_MAP[CHARS[i]] = i

export function bitPackDecode(serial: string) {
  const markerList = ['Fme!K', '}TYg', '}TYs', 'RG}', 'RG/', '/A', '/B', '/C', '/D', '/F']

  const original_prefix = serial.startsWith('@Ug') ? '@Ug' : ''
  const payload = original_prefix ? serial.substring(3) : serial

  const data_positions: number[] = []
  const char_offsets: number[] = []
  const markers: Record<string, [number, string]> = {}

  for (const m of markerList) {
    const idx = payload.indexOf(m)
    if (idx !== -1) markers[m] = [idx, m]
  }

  const nonBinaryPositions = new Set<number>()
  if (markers['Fme!K']) {
    const rarityStart = markers['Fme!K'][0] + 'Fme!K'.length
    for (let i = rarityStart; i < rarityStart + 5; i++) nonBinaryPositions.add(i)
  }

  let bitString = ''
  for (let i = 0; i < payload.length; i++) {
    if (!(payload[i] in CHAR_MAP)) continue
    if (nonBinaryPositions.has(i)) continue
    const val = CHAR_MAP[payload[i]]
    bitString += (val % 64).toString(2).padStart(6, '0')
    data_positions.push(i)
    char_offsets.push(Math.floor(val / 64))
  }

  while (bitString.length % 8 !== 0) bitString += '0'
  const bytes = new Uint8Array(bitString.length / 8)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bitString.slice(i * 8, i * 8 + 8), 2)
  }

  return { data: bytes, original_prefix, payload, data_positions, char_offsets, markers }
}

export function bitPackEncode(modifiedData: Uint8Array, original_prefix: string, original_payload: string, data_positions: number[], char_offsets: number[]) {
  // create bitstring from modifiedData
  let bitString = ''
  for (let i = 0; i < modifiedData.length; i++) bitString += modifiedData[i].toString(2).padStart(8, '0')

  const targetBitLength = data_positions.length * 6
  if (bitString.length > targetBitLength) bitString = bitString.slice(0, targetBitLength)
  else if (bitString.length < targetBitLength) bitString = bitString.padEnd(targetBitLength, '0')

  const newChars: string[] = []
  for (let i = 0; i < targetBitLength; i += 6) {
    const chunk = bitString.slice(i, i + 6)
    const val = parseInt(chunk, 2)
    const idx = i / 6
    const offset = char_offsets[idx] ?? 0
    if (offset === 1 && val <= 20) newChars.push(CHARS[val + 64])
    else newChars.push(CHARS[val])
  }

  const payloadArr = original_payload.split('')
  for (let i = 0; i < data_positions.length; i++) {
    payloadArr[data_positions[i]] = newChars[i] ?? payloadArr[data_positions[i]]
  }

  return original_prefix + payloadArr.join('')
}

function extractFields(data: Uint8Array) {
  const fields: Record<string, any> = {}
  if (data.length >= 4) {
    // little/big endian headers
    fields['header_le'] = (data[0]) | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)
    fields['header_be'] = (data[3]) | (data[2] << 8) | (data[1] << 16) | (data[0] << 24)
  }
  if (data.length >= 8) fields['field2_le'] = (data[4]) | (data[5] << 8) | (data[6] << 16) | (data[7] << 24)
  if (data.length >= 12) fields['field3_le'] = (data[8]) | (data[9] << 8) | (data[10] << 16) | (data[11] << 24)

  const stats16: [number, number][] = []
  for (let i = 0; i < Math.min(data.length - 1, 20); i += 2) {
    const val = data[i] | (data[i + 1] << 8)
    fields[`val16_at_${i}`] = val
    if (val >= 100 && val <= 10000) stats16.push([i, val])
  }
  fields['potential_stats'] = stats16

  const flags: [number, number][] = []
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    fields[`byte_${i}`] = data[i]
    if (data[i] < 100) flags.push([i, data[i]])
  }
  fields['potential_flags'] = flags

  return fields
}

export function decodeItemSerial(serial: string): DecodedItem {
  try {
    const { data, original_prefix, payload, data_positions, char_offsets, markers } = bitPackDecode(serial)
    const fields = extractFields(data)

    const stats: any = {}
    let item_type = '?'
    if (serial.length >= 4 && serial.startsWith('@Ug')) item_type = serial[3]

    // heuristics similar to bl4editor.py
    if (item_type === 'r') {
      stats.primary_stat = fields['val16_at_0']
      stats.secondary_stat = fields['val16_at_12']
      stats.manufacturer = fields['byte_4']
      stats.item_class = fields['byte_8']
      stats.rarity = fields['byte_1']
      stats.level = fields['byte_13']
      if (serial.startsWith('@Ugr') && payload.length >= 3) fields['tail_triad'] = payload.endsWith('00') ? payload.slice(-5, -2) : payload.slice(-3)
    } else if (item_type === 'e') {
      stats.primary_stat = fields['val16_at_2']
      stats.secondary_stat = fields['val16_at_8']
      stats.manufacturer = fields['byte_1']
      stats.item_class = fields['byte_3']
      stats.rarity = fields['byte_9']
      stats.level = fields['val16_at_10']
      if (serial.startsWith('@Ugr') && payload.length >= 3) fields['tail_triad'] = payload.endsWith('00') ? payload.slice(-5, -2) : payload.slice(-3)
    } else if (item_type === 'd') {
      stats.primary_stat = fields['val16_at_4']
      stats.secondary_stat = fields['val16_at_8']
      stats.manufacturer = fields['byte_5']
      stats.item_class = fields['byte_6']
      stats.rarity = fields['byte_14']
      stats.level = fields['val16_at_10']
      if (serial.startsWith('@Ugr') && payload.length >= 3) fields['tail_triad'] = payload.endsWith('00') ? payload.slice(-5, -2) : payload.slice(-3)
    } else {
      // generic
      const pot = fields['potential_stats'] || []
      if (pot.length) {
        stats.primary_stat = pot[0][1]
        stats.secondary_stat = pot[1]?.[1] ?? null
      }
      stats.manufacturer = fields['byte_1']
      stats.rarity = fields['byte_2']
      stats.item_class = fields['byte_3']
      stats.level = fields['val16_at_10']
    }

    const weaponName = undefined

    return {
      serial,
      item_type,
      item_category: item_type === 'r' ? 'weapon' : item_type === 'e' || item_type === 'd' ? 'equipment' : 'unknown',
      length: data.length,
      stats,
      raw_fields: fields,
      confidence: 'medium',
      original_binary: data,
      original_prefix: original_prefix,
      original_payload: payload,
      data_positions,
      char_offsets,
      weapon_name: weaponName,
      markers
    }
  } catch (err) {
    return {
      serial,
      item_type: 'error',
      item_category: 'decode_failed',
      length: 0,
      stats: {},
      raw_fields: { error: String(err) },
      confidence: 'none',
      original_binary: new Uint8Array(),
      original_prefix: '',
      original_payload: '',
      data_positions: [],
      char_offsets: [],
      markers: {}
    }
  }
}

export function encodeItemSerial(decoded: DecodedItem): string {
  try {
    const data = new Uint8Array(decoded.original_binary)
  // track if binary was modified
  let modified = false
    const stats = decoded.stats || {}

    // write back heuristic fields (mirror Python logic)
    if (decoded.item_type === 'r') {
      if (stats.primary_stat != null && stats.primary_stat !== decoded.raw_fields['val16_at_0'] && data.length >= 2) {
        data[0] = stats.primary_stat & 0xff
        data[1] = (stats.primary_stat >> 8) & 0xff
        modified = true
      }
      if (stats.secondary_stat != null && stats.secondary_stat !== decoded.raw_fields['val16_at_12'] && data.length >= 14) {
        const pos = 12
        data[pos] = stats.secondary_stat & 0xff
        data[pos + 1] = (stats.secondary_stat >> 8) & 0xff
        modified = true
      }
      if (stats.rarity != null && stats.rarity !== decoded.raw_fields['byte_1'] && data.length >= 2) {
        data[1] = stats.rarity
        modified = true
      }
      if (stats.manufacturer != null && stats.manufacturer !== decoded.raw_fields['byte_4'] && data.length >= 5) {
        data[4] = stats.manufacturer
        modified = true
      }
      if (stats.item_class != null && stats.item_class !== decoded.raw_fields['byte_8'] && data.length >= 9) {
        data[8] = stats.item_class
        modified = true
      }
      if (stats.level != null && stats.level !== decoded.raw_fields['byte_13'] && data.length >= 14) {
        data[13] = stats.level
        modified = true
      }
      // tail_triad handled via raw_fields if present
      if (decoded.raw_fields['tail_triad'] && decoded.serial.startsWith('@Ugr')) {
        const triad = decoded.raw_fields['tail_triad']
        if (triad && triad.length === 3) {
          decoded.original_payload = decoded.original_payload.slice(0, -5) + triad + '00'
        }
      }
    } else if (decoded.item_type === 'e') {
      if (stats.primary_stat != null && stats.primary_stat !== decoded.raw_fields['val16_at_2'] && data.length >= 4) {
        data[2] = stats.primary_stat & 0xff
        data[3] = (stats.primary_stat >> 8) & 0xff
        modified = true
      }
      if (stats.secondary_stat != null && stats.secondary_stat !== decoded.raw_fields['val16_at_8'] && data.length >= 10) {
        data[8] = stats.secondary_stat & 0xff
        data[9] = (stats.secondary_stat >> 8) & 0xff
        modified = true
      }
      if (stats.manufacturer != null && stats.manufacturer !== decoded.raw_fields['byte_1'] && data.length >= 2) { data[1] = stats.manufacturer; modified = true }
      if (stats.item_class != null && stats.item_class !== decoded.raw_fields['byte_3'] && data.length >= 4) { data[3] = stats.item_class; modified = true }
      if (stats.rarity != null && stats.rarity !== decoded.raw_fields['byte_9'] && data.length >= 10) { data[9] = stats.rarity; modified = true }
      if (stats.level != null && stats.level !== decoded.raw_fields['val16_at_10'] && data.length >= 12) { data[10] = stats.level & 0xff; data[11] = (stats.level >> 8) & 0xff; modified = true }
    } else if (decoded.item_type === 'd') {
      if (stats.primary_stat != null && stats.primary_stat !== decoded.raw_fields['val16_at_4'] && data.length >= 6) { data[4] = stats.primary_stat & 0xff; data[5] = (stats.primary_stat >> 8) & 0xff; modified = true }
      if (stats.secondary_stat != null && stats.secondary_stat !== decoded.raw_fields['val16_at_8'] && data.length >= 10) { data[8] = stats.secondary_stat & 0xff; data[9] = (stats.secondary_stat >> 8) & 0xff; modified = true }
      if (stats.manufacturer != null && stats.manufacturer !== decoded.raw_fields['byte_5'] && data.length >= 6) { data[5] = stats.manufacturer; modified = true }
      if (stats.item_class != null && stats.item_class !== decoded.raw_fields['byte_6'] && data.length >= 7) { data[6] = stats.item_class; modified = true }
      if (stats.rarity != null && stats.rarity !== decoded.raw_fields['byte_14'] && data.length >= 15) { data[14] = stats.rarity; modified = true }
      if (stats.level != null && stats.level !== decoded.raw_fields['val16_at_10'] && data.length >= 12) { data[10] = stats.level & 0xff; data[11] = (stats.level >> 8) & 0xff; modified = true }
    } else {
      // generic writes for potential_stats/flags
      if (Array.isArray(decoded.raw_fields['potential_stats'])) {
        for (const [pos, val] of decoded.raw_fields['potential_stats']) {
          if (decoded.original_binary.length > pos + 1) {
            data[pos] = val & 0xff
            data[pos + 1] = (val >> 8) & 0xff
            modified = true
          }
        }
      }
    }

    // Pool selector / length nibble handling
    if (decoded.raw_fields['pool_selector'] && decoded.raw_fields['length_nibble']) {
      const pool = decoded.raw_fields['pool_selector']
      const nibble = decoded.raw_fields['length_nibble']
      if (pool === '/F' && nibble !== '5') throw new Error('Pool /F requires length nibble 5')
      if (decoded.markers[pool]) {
        const poolPos = decoded.markers[pool][0]
        decoded.original_payload = decoded.original_payload.slice(0, poolPos) + pool + '`' + nibble + decoded.original_payload.slice(poolPos + pool.length + 2)
      }
    }

    const newSerial = bitPackEncode(data, decoded.original_prefix, decoded.original_payload, decoded.data_positions, decoded.char_offsets)
    // use modified to satisfy linting (no-op)
    if (modified) {
      // nothing special to do client-side
    }
    return newSerial
  } catch (err) {
    console.warn('encodeItemSerial failed', err)
    return decoded.serial
  }
}
