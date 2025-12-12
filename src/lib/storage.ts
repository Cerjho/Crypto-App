/**
 * Local Storage Manager for Encryption History
 * 
 * Security Note: 
 * - History items are stored in browser localStorage (unencrypted metadata)
 * - Actual encrypted payloads are stored, not plaintext
 * - Users should understand this is local-only and can be cleared
 */

import type { EncryptionPayload } from './crypto'

export interface HistoryItem {
  id: string
  name: string
  timestamp: number
  payload: EncryptionPayload
  size: number // Size of original plaintext
}

const STORAGE_KEY = 'encryption_history'
const MAX_ITEMS = 20

/**
 * Get all history items from localStorage
 */
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const items: HistoryItem[] = JSON.parse(stored)
    return items.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to load history:', error)
    return []
  }
}

/**
 * Add item to history
 */
export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getHistory()
    
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    
    // Add to beginning and limit size
    history.unshift(newItem)
    const trimmed = history.slice(0, MAX_ITEMS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save to history:', error)
    throw new Error('Could not save to history. Storage may be full.')
  }
}

/**
 * Remove item from history
 */
export function removeFromHistory(id: string): void {
  try {
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from history:', error)
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear history:', error)
  }
}

/**
 * Get single history item by ID
 */
export function getHistoryItem(id: string): HistoryItem | null {
  const history = getHistory()
  return history.find((item) => item.id === id) || null
}
