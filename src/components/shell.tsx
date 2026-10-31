import { useEffect, type ReactNode } from 'react'
import { CircleUser, Scissors, Sparkles, Store } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { subscribeBookingChanges } from '../lib/realtime'
import { useAuthStore } from '../store/auth'
import { useBookingsStore } from '../store/bookings'

const tabs = [
  { to: '/', label: 'Salons', icon: Store, match: (path: string) => path === '/' || path.startsWith('/salons') },
  { to: '/services', label: 'Services', icon: Scissors, match: (path: string) => path.startsWith('/services') },
  { to: '/stylists', label: 'Stylists', icon: Sparkles, match: (path: string) => path.startsWith('/stylists') },
  { to: '/account', label: 'Account', icon: CircleUser, match: (path: string) => path.startsWith('/account') },
]

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const loadBookings = useBookingsStore((state) => state.load)
  const path = location.pathname
  const hideNav = path === '/login' || path === '/register' || /^\/salons\/[^/]+$/.test(path)
  const dark = path.startsWith('/account')

  useEffect(() => {
    document.body.classList.toggle('theme-account', dark)
    return () => document.body.classList.remove('theme-account')
  }, [dark])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings, userId])

  useEffect(() => {
    return subscribeBookingChanges(token, () => {
      useBookingsStore.getState().touch()
      void useBookingsStore.getState().load()
    })
  }, [token])

  return (
    <div className={cn('min-h-dvh', dark ? 'bg-account text-[#f6f1e8]' : 'bg-canvas text-ink')}>
      <div className={cn('mx-auto min-h-dvh w-full', hideNav ? 'pb-6' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]')}>{children}</div>
      {hideNav ? null : <TabBar dark={dark} path={path} />}
    </div>
  )
}

function TabBar({ dark, path }: { dark: boolean; path: string }) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md',
        dark ? 'border-white/10 bg-[#2a3127]/95' : 'border-[#e6ddd0] bg-[#fffdf9]/95',
      )}
      aria-label="Primary"
    >
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.match(path)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                dark ? (active ? 'text-white' : 'text-[#b7b1a6]') : active ? 'font-semibold text-ink' : 'text-[#a3988c]',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
