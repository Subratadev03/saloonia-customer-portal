import { CalendarDays, CreditCard, Gift, Heart, LogOut, MessageCircle, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatVisit, initials } from '../lib/format'
import { loyaltyPoints, loyaltyTier, nextBooking } from '../lib/visits'
import { useAuthStore } from '../store/auth'
import { useBookingsStore } from '../store/bookings'
import { Role } from '../types'

const menu = [
  { to: '/account/history', label: 'Booking History & Formulas', detail: 'past bookings details', icon: CalendarDays },
  { to: '/account/favorites', label: 'My Faves', detail: 'salons, stylists', icon: Heart },
  { to: '/account/rewards', label: 'Rewards & Gift Cards', detail: 'points, tiers', icon: Gift },
  { to: '/account/payments', label: 'Payments & Deposits', detail: 'Razorpay checkout', icon: CreditCard },
  { to: '/account/preferences', label: 'Preferences', detail: 'hair history, beverage choice', icon: SlidersHorizontal },
  { to: '/account/support', label: 'Support & Help', detail: 'chat, FAQ', icon: MessageCircle },
]

export function AccountPage() {
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const bookings = useBookingsStore((state) => state.bookings)
  const loading = useBookingsStore((state) => state.loading)
  const bookingsError = useBookingsStore((state) => state.error)
  const upcoming = nextBooking(bookings ?? [])
  const points = loyaltyPoints(bookings ?? [])
  const isCustomer = user?.role === Role.CUSTOMER
  const mapsQuery = [upcoming?.tenant?.address, upcoming?.tenant?.city, upcoming?.tenant?.name].filter(Boolean).join(', ')

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div>
          {isCustomer && user ? (
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-clay text-lg font-bold text-white">
                {initials(user.firstName, user.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-sm text-[#c9c2b4]">{user.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex rounded-full bg-[#243026] px-2.5 py-1 text-[11px] font-semibold">{loyaltyTier(bookings ?? [])}</span>
                <p className="mt-1 text-sm font-semibold">{bookings === null ? '…' : `${points.toLocaleString('en-IN')} pts`}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">Your account</p>
              <p className="mt-1 text-sm text-[#c9c2b4]">Sign in to hold a chair and keep your visits.</p>
              <Link to="/login?next=/account" className="mt-4 inline-flex h-11 items-center rounded-full bg-clay px-4 text-sm font-semibold text-white">
                Sign in
              </Link>
            </div>
          )}

          <section className="mt-5 rounded-[24px] bg-[#3e4c3c] p-4">
            <p className="text-sm text-[#d9d3c7]">My Next Booking</p>
            {isCustomer && loading && bookings === null ? <p className="mt-3 text-sm text-[#d9d3c7]">Checking the book…</p> : null}
            {isCustomer && bookingsError ? <p className="mt-3 text-sm text-[#f0c2bc]">{bookingsError}</p> : null}
            {isCustomer && upcoming ? (
              <div className="mt-2">
                <p className="text-lg font-semibold">{upcoming.tenant?.name ?? 'Salon'}</p>
                <p className="mt-1 text-sm text-[#d9d3c7]">
                  {upcoming.service?.name ? `${upcoming.service.name} · ` : ''}
                  {formatVisit(upcoming.startAt)}
                </p>
                <div className="mt-4 flex gap-2">
                  {mapsQuery ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#2a3127] px-3 text-sm font-semibold"
                    >
                      Directions
                    </a>
                  ) : null}
                  <Link to="/account/history" className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#2a3127] px-3 text-sm font-semibold">
                    Manage
                  </Link>
                </div>
              </div>
            ) : null}
            {isCustomer && !loading && !bookingsError && bookings !== null && !upcoming ? (
              <div className="mt-2">
                <p className="font-semibold">No chair on the book yet</p>
                <Link to="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#2a3127] px-4 text-sm font-semibold">
                  Discover salons
                </Link>
              </div>
            ) : null}
            {!isCustomer ? (
              <div className="mt-2">
                <p className="font-semibold">Sign in to see your next visit</p>
                <Link to="/login?next=/account" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#2a3127] px-4 text-sm font-semibold">
                  Sign in
                </Link>
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-2 lg:mt-0">
          <ul>
            {menu.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to} className="border-b border-white/10">
                  <Link to={item.to} className="flex min-h-[4.25rem] items-center gap-3 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block text-sm text-[#c9c2b4]">{item.detail}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {isCustomer ? (
            <button type="button" className="relative mt-6 flex h-12 w-full items-center justify-center rounded-full bg-clay text-sm font-semibold text-white" onClick={clear}>
              <LogOut className="absolute left-4 h-4 w-4" />
              Sign out
              <Sparkles className="absolute right-4 h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
