import { create } from 'zustand'

export type Favorite = {
  type: 'salon' | 'stylist'
  id: string
}

type FavoritesState = {
  items: Favorite[]
  toggle: (item: Favorite) => void
}

const storageKey = 'saloonia.customer.favorites'

function readItems() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Favorite[]
    return Array.isArray(parsed) ? parsed.filter((item) => item && (item.type === 'salon' || item.type === 'stylist') && item.id) : []
  } catch {
    return []
  }
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  items: readItems(),
  toggle: (item) => {
    const exists = get().items.some((entry) => entry.type === item.type && entry.id === item.id)
    const items = exists
      ? get().items.filter((entry) => !(entry.type === item.type && entry.id === item.id))
      : [...get().items, item]
    localStorage.setItem(storageKey, JSON.stringify(items))
    set({ items })
  },
}))

export function isSaved(items: Favorite[], item: Favorite) {
  return items.some((entry) => entry.type === item.type && entry.id === item.id)
}
