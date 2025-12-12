import clsx from 'clsx'
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-lg',
        'border border-slate-200 dark:border-slate-700',
        'p-6 md:p-8',
        'transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  )
}
