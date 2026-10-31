import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Photo } from '../components/discovery'
import { Button, Field, Input, Textarea } from '../components/ui'
import { api, getErrorMessage } from '../lib/api'
import { payBooking, priceToPaise, releasesHold } from '../lib/razorpay'
import { formatDay, formatMoney, formatTime, hoursStatus, localDateInput } from '../lib/format'
import { cn } from '../lib/cn'
import { salonImage } from '../lib/presentation'
import { watchSalon } from '../lib/realtime'
import { useAuthStore } from '../store/auth'
import { useBookingsStore } from '../store/bookings'
import { BookingStatus, Role, type Booking, type PublicSalon, type Slot } from '../types'

function overlapsOwnVisit(slot: Slot, bookings: Booking[] | null, slug: string | undefined) {
  return (bookings ?? []).some((booking) => {
    if (!slug || booking.tenant?.slug !== slug) return false
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) return false
    return new Date(slot.startAt) < new Date(booking.endAt) && new Date(slot.endAt) > new Date(booking.startAt)
  })
}

export function BookPage() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loadBookings = useBookingsStore((state) => state.load)
  const myBookings = useBookingsStore((state) => state.bookings)
  const bookingChanges = useBookingsStore((state) => state.changes)
  const touchBookings = useBookingsStore((state) => state.touch)
  const [salon, setSalon] = useState<PublicSalon | null>(null)
  const [serviceId, setServiceId] = useState(params.get('service') ?? '')
  const [staffId, setStaffId] = useState(params.get('staff') ?? '')
  const [date, setDate] = useState(localDateInput())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loadingSalon, setLoadingSalon] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState<'now' | 'later' | null>(null)

  useEffect(() => {
    if (!slug) return
    const search = new URLSearchParams(window.location.search)
    const requested = search.get('service')
    const requestedStaff = search.get('staff')
    setLoadingSalon(true)
    api
      .get<PublicSalon>(`/public/salons/${slug}`)
      .then(({ data }) => {
        setSalon(data)
        const staffMember = data.staff.find((member) => member.id === requestedStaff)
        let nextService = data.services.find((service) => service.id === requested)
        if (staffMember && (!nextService || !staffMember.serviceIds.includes(nextService.id))) {
          nextService = data.services.find((service) => staffMember.serviceIds.includes(service.id))
        }
        const resolved = nextService ?? data.services[0]
        setServiceId(resolved?.id ?? '')
        setStaffId(staffMember && resolved && staffMember.serviceIds.includes(resolved.id) ? staffMember.id : '')
        const [closeHour, closeMinute] = data.closingTime.split(':').map(Number)
        const closing = new Date()
        closing.setHours(closeHour || 0, closeMinute || 0, 0, 0)
        if (Date.now() >= closing.getTime()) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          setDate(localDateInput(tomorrow))
        }
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not open this salon.')))
      .finally(() => setLoadingSalon(false))
  }, [slug])

  const service = salon?.services.find((item) => item.id === serviceId)
  const stylists = useMemo(
    () => salon?.staff.filter((member) => !serviceId || member.serviceIds.includes(serviceId)) ?? [],
    [salon, serviceId],
  )
  const openSlots = useMemo(
    () => slots.filter((slot) => !overlapsOwnVisit(slot, myBookings, slug)),
    [myBookings, slug, slots],
  )

  useEffect(() => {
    if (!user || !slug || openSlots.length === 0) return
    const raw = sessionStorage.getItem('saloonia.customer.pending')
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as { slug?: string; startAt?: string; staffId?: string; notes?: string }
      if (pending.slug !== slug) return
      const match = openSlots.find((slot) => slot.startAt === pending.startAt && slot.staffId === pending.staffId)
      if (!match) return
      setSelected(match)
      setNotes(pending.notes ?? '')
      sessionStorage.removeItem('saloonia.customer.pending')
    } catch {
      sessionStorage.removeItem('saloonia.customer.pending')
    }
  }, [user, slug, openSlots])

  useEffect(() => {
    if (!slug) return
    return watchSalon(slug)
  }, [slug])

  useEffect(() => {
    if (!slug || !serviceId || !date) return
    const query = new URLSearchParams({ date, serviceId })
    if (staffId) query.set('staffId', staffId)
    setLoadingSlots(true)
    api
      .get<Slot[]>(`/public/salons/${slug}/slots?${query.toString()}`)
      .then(({ data }) => {
        setSlots(data)
        setSelected((current) =>
          current &&
          data.some((slot) => slot.startAt === current.startAt && slot.staffId === current.staffId) &&
          !overlapsOwnVisit(current, useBookingsStore.getState().bookings, slug)
            ? current
            : null,
        )
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load open times.')))
      .finally(() => setLoadingSlots(false))
  }, [slug, serviceId, staffId, date, bookingChanges])

  function chooseService(id: string) {
    setServiceId(id)
    setStaffId('')
    const next = new URLSearchParams(params)
    next.set('service', id)
    next.delete('staff')
    setParams(next, { replace: true })
  }

  function chooseStaff(id: string) {
    setStaffId(id)
    const next = new URLSearchParams(params)
    if (serviceId) next.set('service', serviceId)
    if (id) next.set('staff', id)
    else next.delete('staff')
    setParams(next, { replace: true })
  }

  async function book(payNow: boolean) {
    if (!selected || !slug || !serviceId) return
    if (!user) {
      sessionStorage.setItem(
        'saloonia.customer.pending',
        JSON.stringify({ slug, serviceId, staffId: selected.staffId, startAt: selected.startAt, notes }),
      )
      navigate(`/login?next=${encodeURIComponent(`/salons/${slug}?service=${serviceId}&staff=${selected.staffId}`)}`)
      return
    }
    if (user.role !== Role.CUSTOMER) {
      setError('Sign in with a guest account to book a chair.')
      return
    }
    if (!service) return
    setSaving(payNow ? 'now' : 'later')
    setError('')
    setMessage('')
    let bookingId = ''
    try {
      const { data } = await api.post<Booking>(`/public/salons/${slug}/bookings`, {
        serviceId,
        staffId: selected.staffId,
        startAt: selected.startAt,
        notes: notes.trim() || undefined,
        payLater: !payNow,
      })
      bookingId = data.id
      if (!payNow) {
        setMessage('The chair is booked. Pay at the salon, or pay from Payments whenever you like.')
        setSelected(null)
        setNotes('')
        touchBookings()
        void loadBookings()
        return
      }
      const result = await payBooking({
        bookingId: data.id,
        amount: priceToPaise(service.price),
        name: salon?.name ?? 'Saloonia',
        description: service.name,
        prefill: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          contact: user.phone ?? '',
        },
        onFailed: (reason) => setError(reason),
      })
      if (result === 'dismissed') {
        await api.patch(`/bookings/${data.id}/status`, { status: BookingStatus.CANCELLED }).catch(() => undefined)
        setMessage('Payment cancelled. The chair was released.')
      } else {
        setMessage('Paid. The chair is booked.')
        setSelected(null)
        setNotes('')
      }
      touchBookings()
      void loadBookings()
    } catch (err) {
      if (bookingId && releasesHold(err)) {
        await api.patch(`/bookings/${bookingId}/status`, { status: BookingStatus.CANCELLED }).catch(() => undefined)
      }
      setError(getErrorMessage(err, err instanceof Error ? err.message : 'Could not complete the booking.'))
      touchBookings()
      void loadBookings()
    } finally {
      setSaving(null)
    }
  }

  const payNowLabel = saving === 'now' ? 'Opening checkout…' : service ? `Pay now ${formatMoney(service.price)}` : 'Pay now'
  const payLaterLabel = saving === 'later' ? 'Booking…' : 'Pay later'

  if (loadingSalon) {
    return <p className="px-4 pt-6 text-sm text-muted">Loading the salon…</p>
  }

  if (!salon) {
    return <p className="px-4 pt-6 text-sm text-[#7a3030]">{error || 'This salon is not on the book.'}</p>
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:px-8 lg:pb-8">
      <Link to="/" className="inline-flex h-11 items-center gap-1 text-sm font-semibold">
        <ChevronLeft className="h-4 w-4" />
        Salons
      </Link>
      <div className="mt-2 overflow-hidden rounded-[28px]">
        <Photo src={salonImage(salon.slug)} alt="" className="h-44 w-full sm:h-56" />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted">{salon.city || 'SALON'}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{salon.name}</h1>
        {salon.description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{salon.description}</p> : null}
        <p className="mt-2 text-sm text-muted">
          {[salon.address, hoursStatus(salon.openingTime, salon.closingTime)].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <section className="rounded-[24px] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="font-semibold">Choose a treatment</h2>
          <div className="mt-3 grid gap-2">
            {salon.services.map((item) => {
              const active = item.id === serviceId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseService(item.id)}
                  className={cn('rounded-[20px] border px-4 py-3 text-left', active ? 'border-[#e3c3b4] bg-[#f8efe9]' : 'border-[#f0ebe4] bg-[#fffdf9]')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.durationMinutes} min · {item.category}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-clay">{formatMoney(item.price)}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <h2 className="mt-6 font-semibold">Stylist</h2>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => chooseStaff('')}
              className={cn('h-11 shrink-0 rounded-full px-4 text-sm font-semibold', staffId === '' ? 'bg-ink text-white' : 'bg-[#f6f1ea]')}
            >
              Any open chair
            </button>
            {stylists.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => chooseStaff(member.id)}
                className={cn('h-11 shrink-0 rounded-full px-4 text-sm font-semibold', staffId === member.id ? 'bg-ink text-white' : 'bg-[#f6f1ea]')}
              >
                {member.firstName} {member.lastName}
              </button>
            ))}
          </div>

          <div className="mt-6 sm:max-w-xs">
            <Field label="Date">
              <Input type="date" value={date} min={localDateInput()} onChange={(event) => setDate(event.target.value)} />
            </Field>
          </div>

          <h2 className="mt-6 font-semibold">Open times</h2>
          {loadingSlots ? <p className="mt-3 text-sm text-muted">Checking the book…</p> : null}
          {!loadingSlots && openSlots.length === 0 ? <p className="mt-3 text-sm text-muted">No open chairs for this day. Try another date or stylist.</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {openSlots.map((slot) => {
              const active = selected?.startAt === slot.startAt && selected.staffId === slot.staffId
              return (
                <button
                  key={`${slot.staffId}-${slot.startAt}`}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={cn('min-h-16 rounded-2xl border px-3 py-2 text-left text-sm', active ? 'border-[#e3c3b4] bg-[#f8efe9]' : 'border-[#f0ebe4] bg-white')}
                >
                  <p className="font-semibold">{formatTime(slot.startAt)}</p>
                  <p className="mt-1 text-muted">{slot.staffName}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-4">
          <h2 className="font-semibold">Booking</h2>
          {selected && service ? (
            <div className="mt-4 grid gap-2 text-sm">
              <p className="text-2xl font-semibold">{service.name}</p>
              <p className="text-muted">
                {service.durationMinutes} min · {formatMoney(service.price)}
              </p>
              <p>{selected.staffName}</p>
              <p>
                {formatDay(selected.startAt)} · {formatTime(selected.startAt)} – {formatTime(selected.endAt)}
              </p>
              {user ? (
                <p className="text-muted">
                  {user.firstName} {user.lastName}
                </p>
              ) : (
                <p className="text-muted">Sign in as a guest to confirm this chair.</p>
              )}
              <Field label="Note for the salon">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
              </Field>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted">Select a time to see the chair and confirm.</p>
          )}
          {error ? <p className="mt-4 text-sm text-[#7a3030]">{error}</p> : null}
          {message ? (
            <p className="mt-4 text-sm text-[#245532]">
              {message}{' '}
              <Link to="/account/history" className="font-semibold underline">
                Open visits
              </Link>
            </p>
          ) : null}
          <div className="mt-5 hidden gap-2 lg:grid">
            <Button type="button" disabled={!selected || saving !== null} onClick={() => book(true)}>
              {payNowLabel}
            </Button>
            <Button type="button" variant="secondary" disabled={!selected || saving !== null} onClick={() => book(false)}>
              {payLaterLabel}
            </Button>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e6ddd0] bg-[#fffdf9]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <Button type="button" disabled={!selected || saving !== null} onClick={() => book(true)}>
            {payNowLabel}
          </Button>
          <Button type="button" variant="secondary" disabled={!selected || saving !== null} onClick={() => book(false)}>
            {payLaterLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
