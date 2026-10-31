import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountFrame, SignInCard } from '../components/account-frame'
import { Button, Field, Select, Textarea } from '../components/ui'
import { api, getErrorMessage } from '../lib/api'
import { payBooking, priceToPaise } from '../lib/razorpay'
import { formatDay, formatMoney, formatTime, formatVisit } from '../lib/format'
import { cn } from '../lib/cn'
import { useCatalog } from '../lib/use-catalog'
import { loyaltyPoints, loyaltyTier } from '../lib/visits'
import { useAuthStore } from '../store/auth'
import { useBookingsStore } from '../store/bookings'
import { isSaved, useFavorites } from '../store/favorites'
import { beverageChoices, usePreferences } from '../store/preferences'
import { BookingStatus, PaymentStatus, Role, type Booking } from '../types'
import { Photo } from '../components/discovery'
import { portraitImage, salonImage, shortName } from '../lib/presentation'

const tone: Record<Booking['status'], string> = {
  [BookingStatus.CONFIRMED]: 'bg-[#dcecd6] text-[#245532]',
  [BookingStatus.PENDING]: 'bg-[#f6e7c4] text-[#6d5014]',
  [BookingStatus.COMPLETED]: 'bg-[#ece7e1] text-[#4d463f]',
  [BookingStatus.CANCELLED]: 'bg-[#f6d9d6] text-[#7a3030]',
  [BookingStatus.NO_SHOW]: 'bg-[#efe4d4] text-[#6a5340]',
}

const statusLabel: Record<Booking['status'], string> = {
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.COMPLETED]: 'Completed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.NO_SHOW]: 'No show',
}

function useCustomer() {
  const user = useAuthStore((state) => state.user)
  return user?.role === Role.CUSTOMER ? user : null
}

export function HistoryPage() {
  const user = useCustomer()
  const bookings = useBookingsStore((state) => state.bookings)
  const loading = useBookingsStore((state) => state.loading)
  const error = useBookingsStore((state) => state.error)
  const load = useBookingsStore((state) => state.load)
  const [actionError, setActionError] = useState('')
  const [payingId, setPayingId] = useState('')

  async function pay(booking: Booking) {
    if (!user || !booking.service) return
    setPayingId(booking.id)
    setActionError('')
    try {
      const result = await payBooking({
        bookingId: booking.id,
        amount: priceToPaise(booking.service.price),
        name: booking.tenant?.name ?? 'Saloonia',
        description: booking.service.name,
        prefill: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          contact: user.phone ?? '',
        },
        onFailed: (reason) => setActionError(reason),
      })
      if (result === 'dismissed') {
        setActionError('Checkout closed. This chair stays held until the timer ends.')
      }
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err, err instanceof Error ? err.message : 'Payment could not be completed.'))
    } finally {
      setPayingId('')
    }
  }

  async function cancel(id: string) {
    setActionError('')
    try {
      await api.patch(`/bookings/${id}/status`, { status: BookingStatus.CANCELLED })
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not cancel this visit.'))
    }
  }

  return (
    <AccountFrame title="Booking History & Formulas">
      {!user ? <SignInCard next="/account/history" /> : null}
      {user && loading && bookings === null ? <p className="text-sm text-[#c9c2b4]">Loading your visits…</p> : null}
      {error ? <p className="text-sm text-[#f0c2bc]">{error}</p> : null}
      {actionError ? <p className="mb-3 text-sm text-[#f0c2bc]">{actionError}</p> : null}
      {user && bookings && bookings.length === 0 ? (
        <div className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
          <p className="text-sm text-muted">No visits yet. Pick a salon and take an open time.</p>
          <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-full bg-clay px-4 text-sm font-semibold text-white">
            Discover salons
          </Link>
        </div>
      ) : null}
      <div className="grid gap-3">
        {user
          ? bookings?.map((booking) => {
              const canCancel =
                (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING) &&
                new Date(booking.endAt).getTime() >= Date.now()
              return (
                <article key={booking.id} className="rounded-[24px] bg-[#fffdf9] p-4 text-ink">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold">{booking.service?.name ?? 'Visit'}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {booking.tenant?.name} · {booking.staff?.user?.firstName} {booking.staff?.user?.lastName}
                      </p>
                      <p className="mt-1 text-sm">
                        {formatDay(booking.startAt)} · {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                      </p>
                      {booking.notes ? <p className="mt-2 text-sm leading-relaxed text-[#5f564c]">Formula: {booking.notes}</p> : null}
                      {booking.payment?.status === PaymentStatus.PAID ? <p className="mt-2 text-sm text-[#245532]">Paid online</p> : null}
                      {booking.payment?.status === PaymentStatus.DUE ? <p className="mt-2 text-sm text-[#6d5014]">Pay later</p> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', tone[booking.status])}>{statusLabel[booking.status]}</span>
                      {booking.service &&
                      booking.payment?.status !== PaymentStatus.PAID &&
                      (booking.status === BookingStatus.PENDING || booking.payment?.status === PaymentStatus.DUE) ? (
                        <Button type="button" disabled={payingId === booking.id} onClick={() => pay(booking)}>
                          {payingId === booking.id ? 'Opening checkout…' : `Pay ${formatMoney(booking.service.price)}`}
                        </Button>
                      ) : null}
                      {canCancel ? (
                        <Button type="button" variant="secondary" onClick={() => cancel(booking.id)}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })
          : null}
      </div>
    </AccountFrame>
  )
}

export function FavoritesPage() {
  const { salons, loading, error } = useCatalog()
  const items = useFavorites((state) => state.items)
  const toggle = useFavorites((state) => state.toggle)
  const savedSalons = (salons ?? []).filter((salon) => isSaved(items, { type: 'salon', id: salon.id }))
  const savedStylists = (salons ?? []).flatMap((salon) =>
    salon.staff.filter((member) => isSaved(items, { type: 'stylist', id: member.id })).map((member) => ({ ...member, salon })),
  )

  return (
    <AccountFrame title="My Faves">
      {loading ? <p className="text-sm text-[#c9c2b4]">Loading saved places…</p> : null}
      {error ? <p className="text-sm text-[#f0c2bc]">{error}</p> : null}
      {!loading && savedSalons.length === 0 && savedStylists.length === 0 ? (
        <div className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
          <p className="text-sm text-muted">Tap the heart on a salon or stylist and it will stay here.</p>
          <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-full bg-clay px-4 text-sm font-semibold text-white">
            Discover salons
          </Link>
        </div>
      ) : null}
      {savedSalons.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-[#c9c2b4]">Salons</h2>
          <div className="mt-3 grid gap-3">
            {savedSalons.map((salon) => (
              <Link key={salon.id} to={`/salons/${salon.slug}`} className="flex items-center gap-3 rounded-[24px] bg-[#fffdf9] p-3 text-ink">
                <Photo src={salonImage(salon.slug)} alt="" className="h-14 w-14 rounded-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{salon.name}</span>
                  <span className="block truncate text-sm text-muted">{salon.city || 'Salon'}</span>
                </span>
                <button
                  type="button"
                  className="h-10 shrink-0 px-2 text-sm font-semibold text-clay"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggle({ type: 'salon', id: salon.id })
                  }}
                >
                  Remove
                </button>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {savedStylists.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[#c9c2b4]">Stylists</h2>
          <div className="mt-3 grid gap-3">
            {savedStylists.map((member) => (
              <Link
                key={member.id}
                to={`/salons/${member.salon.slug}?staff=${member.id}${member.serviceIds[0] ? `&service=${member.serviceIds[0]}` : ''}`}
                className="flex items-center gap-3 rounded-[24px] bg-[#fffdf9] p-3 text-ink"
              >
                <Photo src={portraitImage(member.firstName, member.id)} alt="" className="h-14 w-14 rounded-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{shortName(member.firstName, member.lastName)}</span>
                  <span className="block truncate text-sm text-muted">{member.salon.name}</span>
                </span>
                <button
                  type="button"
                  className="h-10 shrink-0 px-2 text-sm font-semibold text-clay"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggle({ type: 'stylist', id: member.id })
                  }}
                >
                  Remove
                </button>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AccountFrame>
  )
}

export function RewardsPage() {
  const user = useCustomer()
  const bookings = useBookingsStore((state) => state.bookings) ?? []
  const points = loyaltyPoints(bookings)

  return (
    <AccountFrame title="Rewards & Gift Cards">
      {!user ? <SignInCard next="/account/rewards" /> : null}
      {user ? (
        <div className="grid gap-3">
          <section className="rounded-[24px] bg-[#3e4c3c] p-5">
            <p className="text-sm text-[#d9d3c7]">{loyaltyTier(bookings)}</p>
            <p className="mt-2 text-4xl font-bold">{points.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-sm text-[#d9d3c7]">points</p>
          </section>
          <section className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
            <h2 className="font-semibold">How points work</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Every visit you keep is worth 250 points. Cancelled visits and no-shows do not count.</p>
          </section>
          <section className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
            <h2 className="font-semibold">Gift cards</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Ask the salon to apply a gift card when you arrive. The balance stays with that salon.</p>
          </section>
        </div>
      ) : null}
    </AccountFrame>
  )
}

export function PaymentsPage() {
  const user = useCustomer()
  const bookings = useBookingsStore((state) => state.bookings)
  const load = useBookingsStore((state) => state.load)
  const kept = (bookings ?? []).filter((booking) => booking.status !== BookingStatus.CANCELLED)
  const due = kept.filter(
    (booking) =>
      booking.payment?.status === PaymentStatus.DUE ||
      booking.payment?.status === PaymentStatus.CREATED ||
      booking.status === BookingStatus.PENDING,
  )
  const paid = kept.filter((booking) => booking.payment?.status === PaymentStatus.PAID)
  const paidTotal = paid.reduce((sum, booking) => sum + Number(booking.service?.price ?? 0), 0)
  const dueTotal = due.reduce((sum, booking) => sum + Number(booking.service?.price ?? 0), 0)
  const [payingId, setPayingId] = useState('')
  const [actionError, setActionError] = useState('')

  async function pay(booking: Booking) {
    if (!user || !booking.service) return
    setPayingId(booking.id)
    setActionError('')
    try {
      const result = await payBooking({
        bookingId: booking.id,
        amount: priceToPaise(booking.service.price),
        name: booking.tenant?.name ?? 'Saloonia',
        description: booking.service.name,
        prefill: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          contact: user.phone ?? '',
        },
        onFailed: (reason) => setActionError(reason),
      })
      if (result === 'dismissed') {
        setActionError('Checkout closed. You can pay again while the chair is held.')
      }
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err, err instanceof Error ? err.message : 'Payment could not be completed.'))
    } finally {
      setPayingId('')
    }
  }

  return (
    <AccountFrame title="Payments & Deposits">
      {!user ? <SignInCard next="/account/payments" /> : null}
      {user ? (
        <div className="grid gap-3">
          <section className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
            <p className="text-sm text-muted">Paid with Razorpay</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(paidTotal)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {dueTotal > 0
                ? `${formatMoney(dueTotal)} is still due. Pay now with Razorpay, or at the salon.`
                : 'Pay now checks out with Razorpay. Pay later keeps the chair until you are ready.'}
            </p>
          </section>
          {actionError ? <p className="text-sm text-[#f0c2bc]">{actionError}</p> : null}
          {kept.length === 0 ? <p className="text-sm text-[#c9c2b4]">No visit charges yet.</p> : null}
          {kept.map((booking) => {
            const unpaid =
              booking.service &&
              booking.payment?.status !== PaymentStatus.PAID &&
              (booking.status === BookingStatus.PENDING ||
                booking.payment?.status === PaymentStatus.DUE ||
                booking.payment?.status === PaymentStatus.CREATED)
                ? booking.service
                : null
            const chargeLabel =
              booking.payment?.status === PaymentStatus.PAID
                ? 'Paid'
                : booking.payment?.status === PaymentStatus.DUE
                  ? 'Pay later'
                  : booking.status === BookingStatus.PENDING
                    ? 'Waiting for payment'
                    : 'Booked by the salon'
            return (
              <article key={booking.id} className="rounded-[24px] bg-[#fffdf9] p-4 text-ink">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{booking.service?.name ?? 'Visit'}</p>
                    <p className="mt-1 text-sm text-muted">
                      {booking.tenant?.name} · {formatVisit(booking.startAt)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {chargeLabel}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{booking.service ? formatMoney(booking.service.price) : '—'}</p>
                </div>
                {unpaid ? (
                  <Button type="button" className="mt-4 w-full" disabled={payingId === booking.id} onClick={() => pay(booking)}>
                    {payingId === booking.id ? 'Opening checkout…' : `Pay ${formatMoney(unpaid.price)}`}
                  </Button>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </AccountFrame>
  )
}

export function PreferencesPage() {
  const stored = usePreferences()
  const save = usePreferences((state) => state.save)
  const [hairHistory, setHairHistory] = useState(stored.hairHistory)
  const [beverage, setBeverage] = useState(stored.beverage)
  const [saved, setSaved] = useState(false)

  return (
    <AccountFrame title="Preferences">
      <form
        className="rounded-[24px] bg-[#fffdf9] p-5 text-ink"
        onSubmit={(event) => {
          event.preventDefault()
          save({ hairHistory: hairHistory.trim(), beverage })
          setSaved(true)
        }}
      >
        <Field label="Hair history">
          <Textarea
            value={hairHistory}
            onChange={(event) => {
              setHairHistory(event.target.value)
              setSaved(false)
            }}
            placeholder="Colour, cut, or anything the stylist should know"
          />
        </Field>
        <div className="mt-4">
          <Field label="Beverage">
            <Select
              value={beverage}
              onChange={(event) => {
                const next = beverageChoices.find((choice) => choice === event.target.value) ?? 'No preference'
                setBeverage(next)
                setSaved(false)
              }}
            >
              {beverageChoices.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {saved ? <p className="mt-4 text-sm text-[#245532]">Saved on this device.</p> : null}
        <Button type="submit" className="mt-5 w-full">
          Save preferences
        </Button>
      </form>
    </AccountFrame>
  )
}

const faqs = [
  {
    question: 'How do I book?',
    answer: 'Choose a salon, a treatment, a stylist, and an open time. Pay now opens Razorpay. Pay later confirms the chair and you can pay at the salon or from Payments.',
  },
  {
    question: 'How do I cancel?',
    answer: 'Open Booking History and cancel any upcoming visit. The time goes back on the book.',
  },
  {
    question: 'How do points work?',
    answer: 'Each visit you keep adds 250 points. Cancelled visits and no-shows do not.',
  },
  {
    question: 'Can I request a stylist?',
    answer: 'Yes. Open Top Rated Stylists and tap Book Stylist, or pick a name while you are choosing a time.',
  },
]

export function SupportPage() {
  const [open, setOpen] = useState(0)

  return (
    <AccountFrame title="Support & Help">
      <div className="grid gap-3">
        {faqs.map((item, index) => {
          const expanded = open === index
          return (
            <section key={item.question} className="rounded-[24px] bg-[#fffdf9] text-ink">
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? -1 : index)}
              >
                {item.question}
                <span className="text-muted">{expanded ? '–' : '+'}</span>
              </button>
              {expanded ? <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{item.answer}</p> : null}
            </section>
          )
        })}
        <a href="mailto:hello@saloonia.com" className="inline-flex h-12 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white">
          Email support
        </a>
      </div>
    </AccountFrame>
  )
}
