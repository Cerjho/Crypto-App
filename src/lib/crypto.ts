/**
 * Combined Crypto Library for Encryption and Decryption
 * Uses Web Crypto API (SubtleCrypto) for all cryptographic operations
 */

export interface EncryptionPayload {
  alg: string
  kdf: string
  salt: string
  iv: string
  iterations: number
  ct: string
}

export interface EncryptionOptions {
  iterations?: number
  algorithm?: 'AES-GCM'
}

export function isCryptoSupported(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto
}

export function generateSalt(length = 16): Uint8Array {
  const buffer = new ArrayBuffer(length)
  return crypto.getRandomValues(new Uint8Array(buffer))
}

export function generateIV(): Uint8Array {
  const buffer = new ArrayBuffer(12)
  return crypto.getRandomValues(new Uint8Array(buffer))
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = 200000
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passphraseBytes = encoder.encode(passphrase)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(
  plaintext: string | ArrayBuffer,
  passphrase: string,
  options: EncryptionOptions = {}
): Promise<EncryptionPayload> {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser')
  }

  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Passphrase cannot be empty')
  }

  const iterations = options.iterations || 200000
  const algorithm = options.algorithm || 'AES-GCM'

  const salt = generateSalt(16)
  const iv = generateIV()
  const key = await deriveKey(passphrase, salt, iterations)

  const plaintextBytes = typeof plaintext === 'string' 
    ? new TextEncoder().encode(plaintext)
    : new Uint8Array(plaintext)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: algorithm,
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBytes
  )

  return {
    alg: algorithm,
    kdf: 'PBKDF2',
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    iterations,
    ct: arrayBufferToBase64(ciphertextBuffer),
  }
}

export async function decrypt(
  payload: EncryptionPayload,
  passphrase: string
): Promise<string> {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser')
  }

  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Passphrase cannot be empty')
  }

  try {
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt))
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
    const ciphertext = base64ToArrayBuffer(payload.ct)

    const key = await deriveKey(passphrase, salt, payload.iterations)

    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: payload.alg,
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(plaintextBuffer)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('operation-specific')) {
        throw new Error('Incorrect passphrase or corrupted data')
      }
      if (err.message.includes('InvalidAccessError')) {
        throw new Error('Incorrect passphrase')
      }
      throw err
    }
    throw new Error('Decryption failed. Please check your passphrase and payload.')
  }
}

export function parsePayload(input: string | object): EncryptionPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any

  try {
    if (typeof input === 'string') {
      try {
        const decoded = atob(input)
        payload = JSON.parse(decoded)
      } catch {
        payload = JSON.parse(input)
      }
    } else {
      payload = input
    }
  } catch (err) {
    throw new Error('Invalid payload format. Must be valid JSON or Base64-encoded JSON.')
  }

  if (!payload.alg || !payload.kdf || !payload.salt || !payload.iv || !payload.iterations || !payload.ct) {
    throw new Error('Payload missing required fields: alg, kdf, salt, iv, iterations, ct')
  }

  if (payload.alg !== 'AES-GCM') {
    throw new Error(`Unsupported algorithm: ${payload.alg}. Only AES-GCM is supported.`)
  }

  if (payload.kdf !== 'PBKDF2') {
    throw new Error(`Unsupported KDF: ${payload.kdf}. Only PBKDF2 is supported.`)
  }

  return payload as EncryptionPayload
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('jwk', key)
  return btoa(JSON.stringify(exported))
}

export async function importKey(exportedKey: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(atob(exportedKey))
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (err) {
    throw new Error('Invalid key format')
  }
}

export async function decryptWithKey(
  payload: EncryptionPayload,
  key: CryptoKey
): Promise<string> {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser')
  }

  try {
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
    const ciphertext = base64ToArrayBuffer(payload.ct)

    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: payload.alg,
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(plaintextBuffer)
  } catch (err) {
    throw new Error('Decryption with key failed. The key may not match this payload.')
  }
}

export function encodePayload(payload: EncryptionPayload): string {
  const json = JSON.stringify(payload)
  return btoa(json)
}

export function generatePassphrase(length = 6): string {
  const words = [
    'anchor', 'brief', 'cloak', 'dance', 'ember', 'frost',
    'glory', 'haven', 'iron', 'jewel', 'knight', 'lunar',
    'maple', 'noble', 'ocean', 'prism', 'quest', 'raven',
    'sage', 'tiger', 'unity', 'viper', 'waves', 'xenon',
    'yield', 'zenith', 'alpha', 'bravo', 'coral', 'delta',
    'echo', 'flame', 'gamma', 'halo', 'iris', 'jade',
  ]
  
  const selected: string[] = []
  const randomValues = crypto.getRandomValues(new Uint32Array(length))
  
  for (let i = 0; i < length; i++) {
    const index = randomValues[i] % words.length
    selected.push(words[index])
  }
  
  return selected.join('-')
}

export function calculatePasswordStrength(password: string): {
  score: number
  entropy: number
  feedback: string
} {
  if (!password) {
    return { score: 0, entropy: 0, feedback: 'Password required' }
  }

  let charSetSize = 0
  if (/[a-z]/.test(password)) charSetSize += 26
  if (/[A-Z]/.test(password)) charSetSize += 26
  if (/[0-9]/.test(password)) charSetSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) charSetSize += 32

  const entropy = password.length * Math.log2(charSetSize || 1)

  let score = 0
  let feedback = ''

  if (entropy < 28) {
    score = 0
    feedback = 'Very weak - use longer passphrase'
  } else if (entropy < 36) {
    score = 1
    feedback = 'Weak - add more characters'
  } else if (entropy < 60) {
    score = 2
    feedback = 'Fair - consider more complexity'
  } else if (entropy < 128) {
    score = 3
    feedback = 'Strong - good passphrase'
  } else {
    score = 4
    feedback = 'Very strong - excellent'
  }

  return { score, entropy: Math.round(entropy), feedback }
}
