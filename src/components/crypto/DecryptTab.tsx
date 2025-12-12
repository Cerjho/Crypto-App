'use client'

import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { decrypt, decryptWithKey, importKey, parsePayload } from '@/lib/crypto'
import { copyToClipboard, downloadFile, readFileAsText, truncate } from '@/lib/utils'
import type { EncryptionPayload } from '@/lib/crypto'

export function DecryptTab() {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text')
  const [ciphertextInput, setCiphertextInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<EncryptionPayload | null>(null)
  const [importedKey, setImportedKey] = useState<CryptoKey | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await readFileAsText(file)
      setCiphertextInput(content)
      setError(null)
    } catch (err) {
      setError('Failed to read file')
    }
  }

  const handleKeyImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await readFileAsText(file)
      const key = await importKey(content)
      setImportedKey(key)
      setError(null)
      setPassphrase('') // Clear passphrase since we're using key
    } catch (err) {
      setError('Failed to import key. Please check the file format.')
    }
  }

  const handleDecrypt = async () => {
    if (!ciphertextInput.trim()) {
      setError('Please enter encrypted data or upload a file')
      return
    }

    if (!passphrase.trim() && !importedKey) {
      setError('Please enter a passphrase or import a key')
      return
    }

    try {
      setIsDecrypting(true)
      setError(null)
      setResult(null)
      setMetadata(null)

      // Parse payload
      const payload = parsePayload(ciphertextInput)
      setMetadata(payload)

      // Decrypt
      const plaintext = importedKey
        ? await decryptWithKey(payload, importedKey)
        : await decrypt(payload, passphrase)

      setResult(plaintext)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed')
      console.error(err)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await copyToClipboard(result)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadFile(result, 'decrypted.txt', 'text/plain')
  }

  return (
    <>
      {/* Main Card */}
      <Card>
        <div className="space-y-6">
          {/* Input Method Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              📥 Input Method
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setInputMethod('text')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  inputMethod === 'text'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                📝 Paste Text
              </button>
              <button
                onClick={() => setInputMethod('file')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  inputMethod === 'file'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                📎 Upload File
              </button>
            </div>
          </div>

          {/* Text Input */}
          {inputMethod === 'text' && (
            <Textarea
              label="Encrypted Data"
              placeholder="Paste encrypted data here (Base64 or JSON format)..."
              value={ciphertextInput}
              onChange={(e) => setCiphertextInput(e.target.value)}
              rows={6}
              disabled={isDecrypting}
            />
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload Encrypted File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".enc,.txt,.json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100
                  dark:file:bg-green-900/20 dark:file:text-green-300
                  dark:hover:file:bg-green-900/30
                  cursor-pointer"
              />
              {ciphertextInput && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  ✓ File loaded ({ciphertextInput.length} characters)
                </p>
              )}
            </div>
          )}

          {/* Passphrase or Key Import */}
          <div className="space-y-3">
            <Input
              label="🔑 Passphrase"
              type="password"
              placeholder="Enter the passphrase used for encryption"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={isDecrypting || !!importedKey}
            />
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">OR</span>
              <div className="flex-1">
                <input
                  ref={keyInputRef}
                  type="file"
                  accept=".key"
                  onChange={handleKeyImport}
                  className="block w-full text-xs text-slate-500
                    file:mr-4 file:py-1.5 file:px-3
                    file:rounded file:border-0
                    file:text-xs file:font-semibold
                    file:bg-slate-100 file:text-slate-700
                    hover:file:bg-slate-200
                    dark:file:bg-slate-700 dark:file:text-slate-300
                    cursor-pointer"
                />
                {importedKey && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Key imported successfully
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {/* Decrypt Button */}
          <Button
            onClick={handleDecrypt}
            variant="primary"
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            disabled={isDecrypting || !ciphertextInput.trim() || (!passphrase.trim() && !importedKey)}
            aria-label="Decrypt data"
          >
            {isDecrypting ? '🔄 Decrypting...' : '🔓 Decrypt'}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Decrypted Successfully!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your data has been decrypted
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <pre className="text-sm whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 font-mono max-h-64 overflow-y-auto">
                  {result}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCopy}
                  variant="primary"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                  aria-label="Copy decrypted data"
                >
                  📋 Copy
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="sm"
                  aria-label="Download decrypted data"
                >
                  💾 Download
                </Button>
              </div>

              {/* Metadata */}
              {metadata && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                    ℹ️ Encryption Metadata
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded">
                    <p><strong>Algorithm:</strong> {metadata.alg}</p>
                    <p><strong>KDF:</strong> {metadata.kdf}</p>
                    <p><strong>Iterations:</strong> {metadata.iterations.toLocaleString()}</p>
                    <p><strong>Salt:</strong> {truncate(metadata.salt, 40)}</p>
                    <p><strong>IV:</strong> {truncate(metadata.iv, 40)}</p>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            ℹ️ How to Use
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Paste the encrypted data or upload the .enc file</li>
            <li>• Enter the passphrase used during encryption</li>
            <li>• Or import the exported key file (.key)</li>
            <li>• Click Decrypt to retrieve your original data</li>
          </ul>
        </div>
      </Card>
    </>
  )
}
