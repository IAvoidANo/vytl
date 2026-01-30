// Recent items tracking for command palette

const STORAGE_KEY = 'vytl-recent-items'
const MAX_ITEMS = 5

export interface RecentItem {
  id: string
  title: string
  type: 'risk' | 'kri'
  refCode?: string
  visitedAt: number
}

export function getRecentItems(): RecentItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function addRecentItem(item: Omit<RecentItem, 'visitedAt'>): void {
  if (typeof window === 'undefined') return

  try {
    const items = getRecentItems()

    // Remove if already exists
    const filtered = items.filter(i => !(i.id === item.id && i.type === item.type))

    // Add to front with timestamp
    const updated: RecentItem[] = [
      { ...item, visitedAt: Date.now() },
      ...filtered.slice(0, MAX_ITEMS - 1)
    ]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentItems(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
