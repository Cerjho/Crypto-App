'use client'

import React from 'react'
import clsx from 'clsx'
import { calculatePasswordStrength } from '@/lib/crypto'

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, entropy, feedback } = calculatePasswordStrength(password)

  const getColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-red-500'
      case 1: return 'bg-orange-500'
      case 2: return 'bg-yellow-500'
      case 3: return 'bg-lime-500'
      case 4: return 'bg-green-500'
      default: return 'bg-slate-300'
    }
  }

  const getTextColor = (score: number) => {
    switch (score) {
      case 0: return 'text-red-600 dark:text-red-400'
      case 1: return 'text-orange-600 dark:text-orange-400'
      case 2: return 'text-yellow-600 dark:text-yellow-400'
      case 3: return 'text-lime-600 dark:text-lime-400'
      case 4: return 'text-green-600 dark:text-green-400'
      default: return 'text-slate-500'
    }
  }

  if (!password) return null

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={clsx(
              'h-2 flex-1 rounded-full transition-all duration-300',
              i <= score ? getColor(score) : 'bg-slate-200 dark:bg-slate-700'
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className={clsx('font-medium', getTextColor(score))}>
          {feedback}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          ~{entropy} bits
        </span>
      </div>
    </div>
  )
}
