'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/components/ThemeProvider'
import { isCryptoSupported } from '@/lib/crypto'
import { Alert } from '@/components/ui/Alert'
import { EncryptTab } from '@/components/crypto/EncryptTab'
import { DecryptTab } from '@/components/crypto/DecryptTab'
import clsx from 'clsx'

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (!isCryptoSupported()) {
      setError('Web Crypto API is not supported in this browser. Please use a modern browser.')
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              🔐 Secure Crypto App
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Client-side AES-GCM encryption & decryption
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Browser support warning */}
        {error && error.includes('not supported') && (
          <Alert type="error" message={error} />
        )}

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('encrypt')}
            className={clsx(
              'flex-1 px-6 py-3 rounded-lg font-semibold transition-all',
              activeTab === 'encrypt'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
            )}
            aria-label="Switch to encrypt mode"
          >
            🔒 Encrypt
          </button>
          <button
            onClick={() => setActiveTab('decrypt')}
            className={clsx(
              'flex-1 px-6 py-3 rounded-lg font-semibold transition-all',
              activeTab === 'decrypt'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 dark:shadow-green-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500'
            )}
            aria-label="Switch to decrypt mode"
          >
            🔓 Decrypt
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'encrypt' ? <EncryptTab /> : <DecryptTab />}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
          <p>🔒 All cryptographic operations happen in your browser. No data is sent to any server.</p>
          <p className="mt-1">
            Uses AES-GCM with PBKDF2 key derivation • Open source
          </p>
        </footer>
      </div>
    </main>
  )
}
