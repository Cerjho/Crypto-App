'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { copyToClipboard, downloadFile, truncate } from '@/lib/utils'
import type { EncryptionPayload } from '@/lib/crypto'
import { encodePayload, exportKey } from '@/lib/crypto'

interface EncryptedOutputProps {
  payload: EncryptionPayload
  filename: string
  cryptoKey?: CryptoKey
}

export function EncryptedOutput({ payload, filename, cryptoKey }: EncryptedOutputProps) {
  const [copied, setCopied] = useState(false)
  const [exportingKey, setExportingKey] = useState(false)

  const encodedPayload = encodePayload(payload)

  const handleCopy = async () => {
    try {
      await copyToClipboard(encodedPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const jsonPayload = JSON.stringify(payload, null, 2)
    downloadFile(jsonPayload, `${filename}.enc`, 'application/json')
  }

  const handleExportKey = async () => {
    if (!cryptoKey) return
    
    try {
      setExportingKey(true)
      const exportedKey = await exportKey(cryptoKey)
      downloadFile(exportedKey, `${filename}.key`, 'text/plain')
    } catch (err) {
      console.error('Failed to export key:', err)
    } finally {
      setExportingKey(false)
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-2xl">✅</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Encrypted Successfully!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your data has been encrypted with AES-GCM
          </p>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <code className="text-xs break-all text-slate-700 dark:text-slate-300 font-mono">
          {truncate(encodedPayload, 200)}
        </code>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleCopy}
          variant="primary"
          size="sm"
          aria-label="Copy encrypted data to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </Button>
        <Button
          onClick={handleDownload}
          variant="secondary"
          size="sm"
          aria-label="Download encrypted file"
        >
          💾 Download
        </Button>
        {cryptoKey && (
          <Button
            onClick={handleExportKey}
            variant="secondary"
            size="sm"
            disabled={exportingKey}
            aria-label="Export encryption key"
          >
            🔑 Export Key
          </Button>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
          ℹ️ Metadata
        </summary>
        <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded">
          <p><strong>Algorithm:</strong> {payload.alg}</p>
          <p><strong>KDF:</strong> {payload.kdf}</p>
          <p><strong>Iterations:</strong> {payload.iterations.toLocaleString()}</p>
          <p><strong>Salt:</strong> {truncate(payload.salt, 40)}</p>
          <p><strong>IV:</strong> {truncate(payload.iv, 40)}</p>
        </div>
      </details>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>⚠️ Security Note:</strong> Keep your passphrase safe. Without it, this data cannot be decrypted. The encryption key is never sent to any server.
        </p>
      </div>
    </div>
  )
}
