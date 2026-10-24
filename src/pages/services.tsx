import { useMemo, useState } from 'react'
import { BookLink, SearchField, Skeleton } from '../components/discovery'
import { Button, Page } from '../components/ui'
import { formatMoney } from '../lib/format'
import { useCatalog } from '../lib/use-catalog'
import { sectionName, serviceGroup, serviceGroups, type ServiceGroup } from '../lib/presentation'
import { cn } from '../lib/cn'
import type { PublicSalon, SalonService } from '../types'

type ListedService = SalonService & { salon: PublicSalon }

export function ServicesPage() {
  const { salons, error, loading, retry } = useCatalog()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ServiceGroup | 'All'>('All')

  const services = useMemo(() => {
    const rows: ListedService[] = []
    for (const salon of salons ?? []) {
      for (const service of salon.services) rows.push({ ...service, salon })
    }
    return rows
  }, [salons])

  const availableGroups = serviceGroups.filter((item) => services.some((service) => serviceGroup(service.category) === item))

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return services.filter((service) => {
      if (group !== 'All' && serviceGroup(service.category) !== group) return false
      if (!needle) return true
      return `${service.name} ${service.description ?? ''} ${service.salon.name} ${service.category}`.toLowerCase().includes(needle)
    })
  }, [group, query, services])

  const sections = (group === 'All' ? availableGroups : [group]).filter((item) => filtered.some((service) => serviceGroup(service.category) === item))

  return (
    <Page>
      <h1 className="text-[1.7rem] font-bold tracking-tight sm:text-4xl">Services</h1>
      <div className="mt-4">
        <SearchField value={query} onChange={setQuery} placeholder="Search" label="Search services" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={group === 'All'} onClick={() => setGroup('All')}>
          All
        </Chip>
        {availableGroups.map((item) => (
          <Chip key={item} active={group === item} onClick={() => setGroup(item)}>
            {item}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : null}
      {error ? (
        <div className="mt-6">
          <p className="text-sm text-[#7a3030]">{error}</p>
          <Button type="button" className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? <p className="mt-6 text-sm text-muted">No treatments match this search.</p> : null}

      <div className="mt-5 grid gap-6">
        {sections.map((item) => (
          <section key={item}>
            <h2 className="text-lg font-semibold">{sectionName(item)}</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {filtered
                .filter((service) => serviceGroup(service.category) === item)
                .map((service) => (
                  <article key={service.id} className="rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(44,38,31,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="shrink-0 font-semibold text-clay">{formatMoney(service.price)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{service.durationMinutes} min</p>
                    <p className="mt-1 text-sm text-muted">{service.salon.name}{service.salon.city ? ` · ${service.salon.city}` : ''}</p>
                    {service.description ? <p className="mt-2 text-sm leading-relaxed text-[#5f564c]">{service.description}</p> : null}
                    <div className="mt-3 flex justify-end">
                      <BookLink to={`/salons/${service.salon.slug}?service=${service.id}`}>Book</BookLink>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('h-10 shrink-0 rounded-full px-4 text-sm font-semibold', active ? 'bg-white text-ink shadow-sm' : 'text-muted')}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
