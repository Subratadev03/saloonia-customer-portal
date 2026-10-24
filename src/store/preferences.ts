import { create } from 'zustand'

export const beverageChoices = ['No preference', 'Still water', 'Sparkling water', 'Tea', 'Coffee'] as const

export type Preferences = {
  hairHistory: string
  beverage: (typeof beverageChoices)[number]
}

type PreferencesState = Preferences & {
  save: (next: Preferences) => void
}

const storageKey = 'saloonia.customer.preferences'

function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { hairHistory: '', beverage: 'No preference' }
    const parsed = JSON.parse(raw) as Partial<Preferences>
    const beverage = beverageChoices.find((choice) => choice === parsed.beverage) ?? 'No preference'
    return {
      hairHistory: typeof parsed.hairHistory === 'string' ? parsed.hairHistory : '',
      beverage,
    }
  } catch {
    return { hairHistory: '', beverage: 'No preference' }
  }
}

export const usePreferences = create<PreferencesState>((set) => ({
  ...readPreferences(),
  save: (next) => {
    localStorage.setItem(storageKey, JSON.stringify(next))
    set(next)
  },
}))
