'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { generatePassphrase } from '@/lib/crypto'

interface PassphraseGeneratorProps {
  onGenerate: (passphrase: string) => void
}

export function PassphraseGenerator({ onGenerate }: PassphraseGeneratorProps) {
  const [length, setLength] = useState(6)

  const handleGenerate = () => {
    const passphrase = generatePassphrase(length)
    onGenerate(passphrase)
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleGenerate}
        aria-label="Generate random passphrase"
      >
        🎲 Generate
      </Button>
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <label htmlFor="passphrase-length">Words:</label>
        <select
          id="passphrase-length"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value={4}>4</option>
          <option value={6}>6</option>
          <option value={8}>8</option>
        </select>
      </div>
    </div>
  )
}
