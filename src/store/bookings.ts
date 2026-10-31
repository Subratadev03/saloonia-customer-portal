import { create } from 'zustand'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from './auth'
import { Role, type Booking } from '../types'

type BookingsState = {
  bookings: Booking[] | null
  loading: boolean
  error: string
  changes: number
  load: () => Promise<void>
  touch: () => void
}

export const useBookingsStore = create<BookingsState>((set) => ({
  bookings: null,
  loading: true,
  error: '',
  changes: 0,
  touch: () => set((state) => ({ changes: state.changes + 1 })),
  load: async () => {
    const user = useAuthStore.getState().user
    if (!user || user.role !== Role.CUSTOMER) {
      set({ bookings: [], loading: false, error: '' })
      return
    }
    const userId = user.id
    set({ loading: true, error: '' })
    try {
      const { data } = await api.get<Booking[]>('/bookings')
      if (useAuthStore.getState().user?.id !== userId) return
      set({ bookings: data, loading: false })
    } catch (error) {
      if (useAuthStore.getState().user?.id !== userId) return
      set({ error: getErrorMessage(error, 'Could not load your bookings.'), loading: false })
    }
  },
}))
