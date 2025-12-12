'use client'

import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import { readFileAsText, readFileAsArrayBuffer, isFileSizeValid } from '@/lib/utils'

interface FileUploadProps {
  onFileLoad: (content: string | ArrayBuffer, filename: string) => void
  maxSizeMB?: number
}

export function FileUpload({ onFileLoad, maxSizeMB = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)

    if (!isFileSizeValid(file, maxSizeMB)) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB`)
      return
    }

    try {
      // Try reading as text first
      const content = file.type.startsWith('text/') 
        ? await readFileAsText(file)
        : await readFileAsArrayBuffer(file)
      
      onFileLoad(content, file.name)
    } catch (err) {
      setError('Failed to read file')
      console.error(err)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div>
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          'hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload file"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          aria-label="File input"
        />
        <div className="text-4xl mb-2">📎</div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Click or drag file to upload
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Maximum size: {maxSizeMB}MB
        </p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
