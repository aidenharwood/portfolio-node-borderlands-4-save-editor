import { inflate, inflateRaw, deflate } from 'pako'
import * as yaml from 'js-yaml'
import aesjs from 'aes-js'
import { detectFileType, type FileTypeInfo } from './file-detection'

const BASE_KEY = new Uint8Array([
  0x35, 0xEC, 0x33, 0x77, 0xF3, 0x5D, 0xB0, 0xEA,
  0xBE, 0x6B, 0x83, 0x11, 0x54, 0x03, 0xEB, 0xFB,
  0x27, 0x25, 0x64, 0x2E, 0xD5, 0x49, 0x06, 0x29,
  0x05, 0x78, 0xBD, 0x60, 0xBA, 0x4A, 0xA7, 0x87
])

const unknownTagType = new yaml.Type('!', {
  kind: 'scalar',
  multi: true,
  construct: (data: any) => data
})

const unknownSequenceType = new yaml.Type('!', {
  kind: 'sequence',
  multi: true,
  construct: (data: any) => data
})

const unknownMappingType = new yaml.Type('!', {
  kind: 'mapping',
  multi: true,
  construct: (data: any) => data
})

const bl4TagsType = new yaml.Type('!<!tags>', {
  kind: 'mapping',
  construct: (data: any) => data
})

const BL4_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  unknownTagType,
  unknownSequenceType,
  unknownMappingType,
  bl4TagsType
])

interface DeriveKeyOptions {
  platform?: 'steam' | 'epic' | 'auto'
}

interface ProcessedSavFile {
  yamlContent: string
  jsonData: any
  fileType: FileTypeInfo
}

function deriveKey(uid: string, options: DeriveKeyOptions = {}): Uint8Array {
  const { platform = 'auto' } = options
  if (!uid) {
    return new Uint8Array(BASE_KEY)
  }

  const key = new Uint8Array(BASE_KEY)
  const cleaned = uid.trim()
  const looksLikeSteam = /\d/.test(cleaned) && !/@/.test(cleaned)
  const mode = platform === 'auto' ? (looksLikeSteam ? 'steam' : 'epic') : platform

  if (mode === 'epic') {
    const utf16 = encodeUtf16Le(cleaned)
    const len = Math.min(utf16.length, key.length)
    for (let i = 0; i < len; i++) {
      key[i] = key[i] ^ utf16[i]
    }
    return key
  }

  const digits = cleaned.replace(/\D/g, '') || '0'
  const sid = BigInt(digits)
  const sidBuffer = new Uint8Array(8)
  const view = new DataView(sidBuffer.buffer)
  view.setBigUint64(0, sid, true)

  for (let i = 0; i < sidBuffer.length; i++) {
    key[i % key.length] = key[i % key.length] ^ sidBuffer[i]
  }

  return key
}

function encodeUtf16Le(input: string): Uint8Array {
  const buffer = new Uint8Array(input.length * 2)
  const view = new DataView(buffer.buffer)
  for (let i = 0; i < input.length; i++) {
    view.setUint16(i * 2, input.charCodeAt(i), true)
  }
  return buffer
}

function pkcs7Strip(data: Uint8Array): Uint8Array {
  if (data.length === 0) return data
  const padLen = data[data.length - 1]
  if (padLen < 1 || padLen > 16) {
    return data
  }
  for (let i = data.length - padLen; i < data.length; i++) {
    if (data[i] !== padLen) {
      return data
    }
  }
  return data.slice(0, data.length - padLen)
}

function pkcs7Pad(data: Uint8Array): Uint8Array {
  const remainder = data.length % 16
  const padLen = remainder === 0 ? 16 : 16 - remainder
  const padded = new Uint8Array(data.length + padLen)
  padded.set(data)
  padded.fill(padLen, data.length)
  return padded
}

function calculateAdler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  const MOD_ADLER = 65521

  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % MOD_ADLER
    b = (b + a) % MOD_ADLER
  }

  return ((b << 16) | a) >>> 0
}

function aesEcbBlockTransform(data: Uint8Array, key: Uint8Array, mode: 'encrypt' | 'decrypt'): Uint8Array {
  const cipher = new aesjs.ModeOfOperation.ecb(key)
  const result = new Uint8Array(data.length)

  for (let offset = 0; offset < data.length; offset += 16) {
    const block = data.slice(offset, offset + 16)
    const transformed = mode === 'encrypt' ? cipher.encrypt(block) : cipher.decrypt(block)
    result.set(transformed, offset)
  }

  return result
}

type CompressionMode = 'zlib' | 'raw'

interface CompressionCandidate {
  data: Uint8Array
  expectedLength?: number
  expectedAdler?: number
  preferredMode: CompressionMode
}

function readFooterValues(body: Uint8Array): { expectedAdler?: number; expectedLength?: number } {
  if (body.length < 4) {
    return {}
  }

  const expectedLength = new DataView(body.buffer, body.byteOffset + body.length - 4, 4).getUint32(0, true)
  let expectedAdler: number | undefined

  if (body.length >= 8) {
    expectedAdler = new DataView(body.buffer, body.byteOffset + body.length - 8, 4).getUint32(0, true)
  }

  return { expectedLength, expectedAdler }
}

function extractCompressionCandidates(body: Uint8Array): CompressionCandidate[] {
  const candidates: CompressionCandidate[] = []
  const { expectedAdler, expectedLength } = readFooterValues(body)

  if (body.length > 4) {
    const withoutLength = body.slice(0, body.length - 4)
    candidates.push({
      data: withoutLength,
      expectedLength,
      expectedAdler,
      preferredMode: 'zlib'
    })
  }

  if (body.length > 8) {
    const withoutTrailer = body.slice(0, body.length - 8)
    candidates.push({
      data: withoutTrailer,
      expectedLength,
      preferredMode: 'raw'
    })
  }

  if (body.length > 10) {
    const rawWithoutHeaderAndTrailer = body.slice(2, body.length - 8)
    candidates.push({
      data: rawWithoutHeaderAndTrailer,
      expectedLength,
      preferredMode: 'raw'
    })

    const rawWithoutHeaderOnly = body.slice(2)
    candidates.push({
      data: rawWithoutHeaderOnly,
      expectedLength,
      preferredMode: 'raw'
    })
  }

  // Always fall back to the raw body as a last resort (matches server behaviour)
  candidates.push({
    data: body,
    expectedLength,
    expectedAdler,
    preferredMode: 'zlib'
  })

  return candidates
}

function validateDecompressedOutput(result: Uint8Array, candidate: CompressionCandidate): boolean {
  if (candidate.expectedLength !== undefined && result.length !== candidate.expectedLength) {
    return false
  }

  if (candidate.expectedAdler !== undefined) {
    const computedAdler = calculateAdler32(result)
    if (computedAdler !== candidate.expectedAdler) {
      return false
    }
  }

  return true
}

function hasZlibHeader(data: Uint8Array): boolean {
  if (data.length < 2) return false
  const cmf = data[0]
  const flg = data[1]
  if ((cmf & 0x0f) !== 8) return false
  if ((cmf >> 4) > 7) return false
  return ((cmf << 8) + flg) % 31 === 0
}

function tryDecompress(candidate: CompressionCandidate): Uint8Array {
  const modes: CompressionMode[] = candidate.preferredMode === 'raw'
    ? ['raw', 'zlib']
    : hasZlibHeader(candidate.data)
      ? ['zlib', 'raw']
      : ['raw', 'zlib']

  let lastError: unknown = undefined

  for (const mode of modes) {
    try {
      if (mode === 'zlib') {
        return inflate(candidate.data)
      }
      return inflateRaw(candidate.data)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'unknown error'))
}

function decompressYaml(body: Uint8Array, steamId: string): Uint8Array {
  const candidates = extractCompressionCandidates(body)
  let lastError: unknown = undefined

  for (const candidate of candidates) {
    try {
      const result = tryDecompress(candidate)
      if (candidate.expectedLength !== undefined && candidate.expectedLength > 0 && result.length === 0) {
        throw new Error('Decompressed length was zero despite non-zero expectation')
      }

      if (!validateDecompressedOutput(result, candidate)) {
        throw new Error('Decompressed output failed checksum/length validation')
      }

      return result
    } catch (err) {
      lastError = err
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error')
  throw new Error(`zlib decompression error for Steam ID ${steamId}. This usually indicates an incorrect Steam ID or corrupted file: ${errorMessage}`)
}

function decryptSavToYamlBytes(savData: Uint8Array, steamId: string): Uint8Array {
  if (savData.length % 16 !== 0) {
    throw new Error(`File size not multiple of 16: ${savData.length} bytes. This indicates a corrupted save file.`)
  }

  const key = deriveKey(steamId)
  let decrypted: Uint8Array
  try {
    decrypted = aesEcbBlockTransform(savData, key, 'decrypt')
  } catch (error) {
    throw new Error(`AES decryption failed. This usually indicates an incorrect Steam ID: ${(error as Error).message}`)
  }

  const body = pkcs7Strip(decrypted)
  return decompressYaml(body, steamId)
}

function encryptYamlToSavBytes(yamlData: Uint8Array, steamId: string): Uint8Array {
  const compressed = deflate(yamlData, { level: 9 })
  const adler32 = calculateAdler32(yamlData)
  const footer = new Uint8Array(8)
  const footerView = new DataView(footer.buffer)
  footerView.setUint32(0, adler32, true)
  footerView.setUint32(4, yamlData.length, true)

  const packed = new Uint8Array(compressed.length + footer.length)
  packed.set(compressed)
  packed.set(footer, compressed.length)

  const padded = pkcs7Pad(packed)
  const key = deriveKey(steamId)
  return aesEcbBlockTransform(padded, key, 'encrypt')
}

export async function processSavFile(file: File, steamId: string): Promise<ProcessedSavFile> {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const yamlBytes = decryptSavToYamlBytes(bytes, steamId)
  const yamlContent = new TextDecoder().decode(yamlBytes)

  let jsonData: any = null
  try {
    jsonData = yaml.load(yamlContent, { schema: BL4_SCHEMA })
  } catch (error) {
    throw new Error(`Failed to parse YAML from ${file.name}: ${(error as Error).message}`)
  }

  const fileType: FileTypeInfo = await detectFileType(file)
  fileType.format = 'sav'

  return {
    yamlContent,
    jsonData,
    fileType
  }
}

export async function convertYamlToSav(yamlContent: string, steamId: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const yamlBytes = encoder.encode(yamlContent)
  return encryptYamlToSavBytes(yamlBytes, steamId)
}

export function verifyRoundTrip(savData: Uint8Array, steamId: string): boolean {
  try {
    const yamlBytes = decryptSavToYamlBytes(savData, steamId)
    const roundTrip = encryptYamlToSavBytes(yamlBytes, steamId)
    return roundTrip.byteLength > 0
  } catch (error) {
    console.warn('Round-trip verification failed:', error)
    return false
  }
}
