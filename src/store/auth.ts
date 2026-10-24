import { create } from 'zustand'
import type { AuthUser } from '../types'

type AuthState = {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
}

const storageKey = 'saloonia.customer.auth'

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { token: null, user: null }
    return JSON.parse(raw) as { token: string | null; user: AuthUser | null }
  } catch {
    return { token: null, user: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...readStoredAuth(),
  setAuth: (token, user) => {
    localStorage.setItem(storageKey, JSON.stringify({ token, user }))
    set({ token, user })
  },
  clear: () => {
    localStorage.removeItem(storageKey)
    set({ token: null, user: null })
  },
}))
