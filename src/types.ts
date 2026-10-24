export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SALON_ADMIN: 'SALON_ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
  tenantId: string | null
}

export type SalonSummary = {
  id: string
  name: string
  slug: string
  city: string | null
  description: string | null
  openingTime: string
  closingTime: string
  brandColor: string
}

export type SalonService = {
  id: string
  name: string
  description: string | null
  category: string
  durationMinutes: number
  price: string
  isActive: boolean
}

export type PublicStaff = {
  id: string
  firstName: string
  lastName: string
  specialty: string | null
  bio: string | null
  serviceIds: string[]
}

export type PublicSalon = SalonSummary & {
  email: string
  phone: string | null
  address: string | null
  timezone: string
  slotIntervalMinutes: number
  services: SalonService[]
  staff: PublicStaff[]
}

export type Slot = {
  startAt: string
  endAt: string
  staffId: string
  staffName: string
}

export type Booking = {
  id: string
  startAt: string
  endAt: string
  status: BookingStatus
  notes: string | null
  service?: SalonService
  staff?: {
    id: string
    user?: { firstName: string; lastName: string }
  }
  tenant?: { name: string; slug: string; address?: string | null; city?: string | null }
}
