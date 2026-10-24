import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdBanner } from '../components/ad-banner'
import { Photo, SaveButton, SearchField, Sheet, Skeleton } from '../components/discovery'
import { Button, Page } from '../components/ui'
import { hoursStatus } from '../lib/format'
import { useCatalog } from '../lib/use-catalog'
import { priceTier, primaryGroup, salonImage, salonPrices, serviceGroup, serviceGroups, type PriceTier, type ServiceGroup } from '../lib/presentation'
import { cn } from '../lib/cn'
import { isUpcoming } from '../lib/visits'
import { useAuthStore } from '../store/auth'
import { useBookingsStore } from '../store/bookings'
import { isSaved, useFavorites } from '../store/favorites'
import type { PublicSalon } from '../types'

const sorts = [
  { id: 'recommended', label: 'Location / Distance' },
  { id: 'name', label: 'Name' },
  { id: 'price', label: 'Lowest price' },
] as const

type SortId = (typeof sorts)[number]['id']

export function SalonsPage() {
  const { salons, error, loading, retry } = useCatalog()
  const user = useAuthStore((state) => state.user)
  const bookings = useBookingsStore((state) => state.bookings)
  const favorites = useFavorites((state) => state.items)
  const toggleFavorite = useFavorites((state) => state.toggle)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [sort, setSort] = useState<SortId>('recommended')
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [tier, setTier] = useState<PriceTier | ''>('')
  const [menu, setMenu] = useState<'city' | 'sort' | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    function onPointer(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenu(null)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [menu])

  const cities = useMemo(() => {
    const names = new Set<string>()
    for (const salon of salons ?? []) {
      if (salon.city) names.add(salon.city)
    }
    return [...names].sort((left, right) => left.localeCompare(right))
  }, [salons])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = (salons ?? []).filter((salon) => {
      if (city && salon.city !== city) return false
      if (groups.length > 0 && !salon.services.some((service) => groups.includes(serviceGroup(service.category)))) return false
      if (tier && priceTier(salonPrices(salon)) !== tier) return false
      if (!needle) return true
      const staff = salon.staff.map((member) => `${member.firstName} ${member.lastName} ${member.specialty ?? ''}`).join(' ')
      const services = salon.services.map((service) => `${service.name} ${service.category} ${service.description ?? ''}`).join(' ')
      return `${salon.name} ${salon.city ?? ''} ${salon.description ?? ''} ${staff} ${services}`.toLowerCase().includes(needle)
    })
    const sorted = [...list]
    if (sort === 'name') sorted.sort((left, right) => left.name.localeCompare(right.name))
    if (sort === 'price') {
      sorted.sort((left, right) => {
        const leftPrice = Math.min(...salonPrices(left), Number.POSITIVE_INFINITY)
        const rightPrice = Math.min(...salonPrices(right), Number.POSITIVE_INFINITY)
        return leftPrice - rightPrice
      })
    }
    return sorted
  }, [city, groups, query, salons, sort, tier])

  const upcomingCount = (bookings ?? []).filter(isUpcoming).length
  const filterCount = groups.length + (tier ? 1 : 0)
  const featured = visible[0]
  const rest = visible.slice(1)

  return (
    <Page>
      <div ref={headerRef}>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0">
            <button
              type="button"
              className="inline-flex h-11 max-w-[70vw] items-center gap-1.5 text-sm font-semibold"
              aria-expanded={menu === 'city'}
              aria-haspopup="listbox"
              onClick={() => setMenu((current) => (current === 'city' ? null : 'city'))}
            >
              <MapPin className="h-4 w-4 shrink-0 text-clay" />
              <span className="truncate">{city || 'All cities'}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            </button>
            {menu === 'city' ? (
              <div role="listbox" aria-label="City" className="absolute left-0 z-20 mt-1 w-52 overflow-hidden rounded-2xl bg-white py-1 shadow-lg">
                <CityOption label="All cities" selected={city === ''} onSelect={() => { setCity(''); setMenu(null) }} />
                {cities.map((name) => (
                  <CityOption key={name} label={name} selected={city === name} onSelect={() => { setCity(name); setMenu(null) }} />
                ))}
              </div>
            ) : null}
          </div>
          <Link
            to={user ? '/account/history' : '/login?next=/account/history'}
            className="relative ml-auto grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
            aria-label={upcomingCount ? `Bookings, ${upcomingCount} upcoming` : 'Bookings'}
          >
            <Bell className="h-4 w-4" />
            {upcomingCount > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-clay" /> : null}
          </Link>
        </div>

        <div className="mt-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search salons, service, or stylist..." label="Search salons, services, or stylists" />
        </div>

        <AdBanner />

        <h1 className="mt-5 text-[1.7rem] font-bold tracking-tight sm:text-4xl">Discover Salons</h1>

        <div className="relative mt-3 flex gap-2">
          <button
            type="button"
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-white px-3 text-sm font-medium shadow-sm"
            aria-expanded={menu === 'sort'}
            aria-haspopup="listbox"
            onClick={() => setMenu((current) => (current === 'sort' ? null : 'sort'))}
          >
            <span className="truncate">{sorts.find((item) => item.id === sort)?.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
          </button>
          <button type="button" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium shadow-sm" onClick={() => { setMenu(null); setFiltersOpen(true) }}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filterCount > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white">{filterCount}</span> : null}
          </button>
          {menu === 'sort' ? (
            <div role="listbox" aria-label="Sort salons" className="absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-lg">
              {sorts.map((item) => (
                <CityOption key={item.id} label={item.label} selected={sort === item.id} onSelect={() => { setSort(item.id); setMenu(null) }} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-56" />
          <div className="grid gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[24px] bg-white p-5">
          <p className="text-sm text-[#7a3030]">{error}</p>
          <Button type="button" className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}

      {!loading && !error && visible.length === 0 ? <p className="mt-6 text-sm text-muted">No salons match this search. Clear a filter or try another city.</p> : null}

      {featured ? (
        <div className={cn('mt-4 grid items-start gap-3', rest.length > 0 && 'lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]')}>
          <FeaturedSalon
            salon={featured}
            saved={isSaved(favorites, { type: 'salon', id: featured.id })}
            onSave={() => toggleFavorite({ type: 'salon', id: featured.id })}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((salon) => (
              <SalonRow
                key={salon.id}
                salon={salon}
                saved={isSaved(favorites, { type: 'salon', id: salon.id })}
                onSave={() => toggleFavorite({ type: 'salon', id: salon.id })}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Sheet open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            type="button"
            className="text-sm font-semibold text-clay"
            onClick={() => {
              setGroups([])
              setTier('')
            }}
          >
            Clear
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold">Category</p>
        <div className="mt-2 grid gap-1">
          {serviceGroups.map((group) => (
            <label key={group} className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#c57a58]"
                checked={groups.includes(group)}
                onChange={() => setGroups((current) => (current.includes(group) ? current.filter((item) => item !== group) : [...current, group]))}
              />
              {group}
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold">Price</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['', '$', '$$', '$$$'] as const).map((option) => (
            <button
              key={option || 'any'}
              type="button"
              onClick={() => setTier(option)}
              className={cn('h-10 rounded-full px-4 text-sm font-semibold', tier === option ? 'bg-ink text-white' : 'bg-[#f6f1ea] text-ink')}
            >
              {option || 'Any'}
            </button>
          ))}
        </div>
        <Button type="button" className="mt-6 w-full" onClick={() => setFiltersOpen(false)}>
          Show {visible.length} salon{visible.length === 1 ? '' : 's'}
        </Button>
      </Sheet>
    </Page>
  )
}

function CityOption({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" role="option" aria-selected={selected} className={cn('flex min-h-11 w-full items-center px-4 text-left text-sm', selected && 'bg-[#f6f1ea] font-semibold')} onClick={onSelect}>
      {label}
    </button>
  )
}

function FeaturedSalon({ salon, saved, onSave }: { salon: PublicSalon; saved: boolean; onSave: () => void }) {
  const group = primaryGroup(salon.services)
  return (
    <article className="relative overflow-hidden rounded-[28px] bg-[#ddd4c8]">
      <Link to={`/salons/${salon.slug}`} className="block">
        <Photo src={salonImage(salon.slug)} alt="" className="h-56 w-full sm:h-72 lg:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" />
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">Featured</span>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink">Category / {group}</span>
        <div className="absolute bottom-4 left-4 right-16 text-white">
          <h2 className="text-2xl font-semibold">{salon.name}</h2>
          <p className="mt-1 text-sm text-white/85">
            {salon.city || 'Salon'} · {hoursStatus(salon.openingTime, salon.closingTime)}
          </p>
        </div>
      </Link>
      <div className="absolute bottom-3 right-3">
        <SaveButton pressed={saved} label={saved ? `Remove ${salon.name} from favorites` : `Save ${salon.name}`} onClick={onSave} />
      </div>
    </article>
  )
}

function SalonRow({ salon, saved, onSave }: { salon: PublicSalon; saved: boolean; onSave: () => void }) {
  return (
    <article className="flex items-center gap-2 rounded-[24px] bg-white p-3 shadow-[0_1px_2px_rgba(44,38,31,0.05)]">
      <Link to={`/salons/${salon.slug}`} className="flex min-w-0 flex-1 gap-3">
        <Photo src={salonImage(salon.slug)} alt="" className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl" />
        <div className="min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-semibold">{salon.name}</h2>
            <span className="shrink-0 text-sm tracking-wide text-muted">{priceTier(salonPrices(salon))}</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">{primaryGroup(salon.services)} · {salon.city || 'Salon'}</p>
          <p className="mt-1 truncate text-xs text-muted">{hoursStatus(salon.openingTime, salon.closingTime)}</p>
        </div>
      </Link>
      <SaveButton pressed={saved} label={saved ? `Remove ${salon.name} from favorites` : `Save ${salon.name}`} onClick={onSave} />
    </article>
  )
}
