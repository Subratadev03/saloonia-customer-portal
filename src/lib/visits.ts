import { BookingStatus, type Booking } from '../types'

export function isUpcoming(booking: Booking) {
  if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) return false
  return new Date(booking.endAt).getTime() >= Date.now()
}

export function nextBooking(bookings: Booking[]) {
  return bookings.filter(isUpcoming).sort((left, right) => left.startAt.localeCompare(right.startAt))[0] ?? null
}

export function loyaltyPoints(bookings: Booking[]) {
  return (
    bookings.filter((booking) => booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.NO_SHOW).length * 250
  )
}

export function loyaltyTier(bookings: Booking[]) {
  return loyaltyPoints(bookings) > 0 ? 'Saloonia VIP' : 'Member'
}
