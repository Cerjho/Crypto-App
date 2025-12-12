'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { FileUpload } from '@/components/crypto/FileUpload'
import { PasswordStrengthMeter } from '@/components/crypto/PasswordStrengthMeter'
import { PassphraseGenerator } from '@/components/crypto/PassphraseGenerator'
import { EncryptedOutput } from '@/components/crypto/EncryptedOutput'
import { encrypt, deriveKey } from '@/lib/crypto'
import { addToHistory, getHistory, removeFromHistory, clearHistory } from '@/lib/storage'
import { formatTimestamp } from '@/lib/utils'
import type { EncryptionPayload } from '@/lib/crypto'
import type { HistoryItem } from '@/lib/storage'

export function EncryptTab() {
  const [plaintext, setPlaintext] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [filename, setFilename] = useState('encrypted')
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [result, setResult] = useState<{ payload: EncryptionPayload; key: CryptoKey } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  React.useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleFileLoad = (content: string | ArrayBuffer, name: string) => {
    if (typeof content === 'string') {
      setPlaintext(content)
    } else {
      // For binary files, convert to base64 string
      const base64 = btoa(String.fromCharCode(...new Uint8Array(content)))
      setPlaintext(base64)
    }
    setFilename(name.replace(/\.[^/.]+$/, ''))
    setError(null)
  }

  const handleEncrypt = async () => {
    if (!plaintext.trim()) {
      setError('Please enter text or upload a file')
      return
    }

    if (!passphrase.trim()) {
      setError('Please enter a passphrase')
      return
    }

    try {
      setIsEncrypting(true)
      setError(null)
      setResult(null)

      const payload = await encrypt(plaintext, passphrase)
      
      // Also derive key for export option
      const salt = new Uint8Array(atob(payload.salt).split('').map(c => c.charCodeAt(0)))
      const key = await deriveKey(passphrase, salt, payload.iterations)

      setResult({ payload, key })

      // Save to history
      addToHistory({
        name: filename || 'Untitled',
        payload,
        size: plaintext.length,
      })
      setHistory(getHistory())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed')
      console.error(err)
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearHistory()
      setHistory([])
    }
  }

  const handleDeleteHistoryItem = (id: string) => {
    removeFromHistory(id)
    setHistory(getHistory())
  }

  return (
    <>
      {/* Main Card */}
      <Card>
        <div className="space-y-6">
          {/* Text Input */}
          <div>
            <Textarea
              label="📝 Enter Your Text"
              placeholder="Type your secret message here..."
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              rows={6}
              disabled={isEncrypting}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {plaintext.length} characters
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Or Upload a File
            </label>
            <FileUpload onFileLoad={handleFileLoad} />
          </div>

          {/* Filename */}
          {plaintext && (
            <Input
              label="💾 Filename (optional)"
              placeholder="encrypted"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isEncrypting}
            />
          )}

          {/* Passphrase */}
          <div className="space-y-3">
            <Input
              label="🔑 Passphrase"
              type="password"
              placeholder="Enter a strong passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={isEncrypting}
            />
            <PasswordStrengthMeter password={passphrase} />
            <PassphraseGenerator onGenerate={setPassphrase} />
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {/* Encrypt Button */}
          <Button
            onClick={handleEncrypt}
            variant="primary"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={isEncrypting || !plaintext.trim() || !passphrase.trim()}
            aria-label="Encrypt data"
          >
            {isEncrypting ? '🔄 Encrypting...' : '🔐 Encrypt'}
          </Button>

          {/* Result */}
          {result && (
            <EncryptedOutput
              payload={result.payload}
              filename={filename}
              cryptoKey={result.key}
            />
          )}
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📚 Local History ({history.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearHistory}
                >
                  Clear All
                </Button>
              </div>
            </div>

            {showHistory && (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTimestamp(new Date(item.timestamp))} • {item.size} bytes
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      aria-label="Delete history item"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              ℹ️ History is stored locally in your browser only
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
