import { api } from './api'
import type { PublicSalon, SalonSummary } from '../types'

let cached: PublicSalon[] | null = null
let pending: Promise<PublicSalon[]> | null = null

export function resetCatalog() {
  cached = null
  pending = null
}

export function loadCatalog() {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = api
    .get<SalonSummary[]>('/public/salons')
    .then(async ({ data }) => {
      const details = await Promise.all(
        data.map((salon) => api.get<PublicSalon>(`/public/salons/${salon.slug}`).then((response) => response.data)),
      )
      cached = details
      pending = null
      return details
    })
    .catch((error: unknown) => {
      pending = null
      throw error
    })
  return pending
}
