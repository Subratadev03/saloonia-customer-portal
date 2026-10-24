import { useMemo, useState } from 'react'
import { BookLink, Photo, SaveButton, Skeleton } from '../components/discovery'
import { Button, Page } from '../components/ui'
import { useCatalog } from '../lib/use-catalog'
import { portraitImage, shortName, stylistRole, stylistRoles, type StylistRole } from '../lib/presentation'
import { cn } from '../lib/cn'
import { isSaved, useFavorites } from '../store/favorites'
import type { PublicSalon, PublicStaff } from '../types'

type ListedStylist = PublicStaff & { salon: PublicSalon }

export function StylistsPage() {
  const { salons, error, loading, retry } = useCatalog()
  const favorites = useFavorites((state) => state.items)
  const toggleFavorite = useFavorites((state) => state.toggle)
  const [role, setRole] = useState<StylistRole | 'All'>('All')

  const stylists = useMemo(() => {
    const rows: ListedStylist[] = []
    for (const salon of salons ?? []) {
      for (const member of salon.staff) rows.push({ ...member, salon })
    }
    return rows
  }, [salons])

  const visible = stylists.filter((member) => role === 'All' || stylistRole(member.specialty) === role)

  return (
    <Page>
      <h1 className="text-[1.7rem] font-bold tracking-tight sm:text-4xl">Top Rated Stylists</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={role === 'All'} onClick={() => setRole('All')}>
          All
        </Chip>
        {stylistRoles.map((item) => (
          <Chip key={item} active={role === item} onClick={() => setRole(item)}>
            {item}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">Recommended Artists</h2>
        <p className="text-sm text-muted">Based on specialty</p>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
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
      {!loading && !error && visible.length === 0 ? <p className="mt-6 text-sm text-muted">No stylists in this chair yet.</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((member) => {
          const saved = isSaved(favorites, { type: 'stylist', id: member.id })
          const serviceId = member.serviceIds[0]
          const href = `/salons/${member.salon.slug}?staff=${member.id}${serviceId ? `&service=${serviceId}` : ''}`
          return (
            <article key={member.id} className="rounded-[28px] bg-white p-4 shadow-[0_1px_2px_rgba(44,38,31,0.05)]">
              <div className="flex gap-3">
                <Photo src={portraitImage(member.firstName, member.id)} alt="" className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{shortName(member.firstName, member.lastName)}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted">{member.specialty || stylistRole(member.specialty)}</p>
                    </div>
                    <SaveButton
                      pressed={saved}
                      label={saved ? `Remove ${member.firstName} from favorites` : `Save ${member.firstName}`}
                      onClick={() => toggleFavorite({ type: 'stylist', id: member.id })}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f6f1ea] px-2.5 py-1 text-xs font-medium">{member.salon.name}</span>
                    <span className="rounded-full bg-[#f6f1ea] px-2.5 py-1 text-xs font-medium">{stylistRole(member.specialty)}</span>
                  </div>
                </div>
              </div>
              {member.bio ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{member.bio}</p> : null}
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-sm text-muted">{member.salon.city || 'Open times on the book'}</p>
                <BookLink to={href}>Book Stylist</BookLink>
              </div>
            </article>
          )
        })}
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
