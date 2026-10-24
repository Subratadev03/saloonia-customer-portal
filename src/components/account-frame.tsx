import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AccountFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 text-[#f6f1e8] sm:px-6 sm:pt-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Link to="/account" className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Back to account">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

export function SignInCard({ next }: { next: string }) {
  return (
    <div className="rounded-[24px] bg-[#fffdf9] p-5 text-ink">
      <p className="text-lg font-semibold">Sign in to see this</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">Guest bookings, points, and saved places stay with your account.</p>
      <Link to={`/login?next=${encodeURIComponent(next)}`} className="mt-4 inline-flex h-11 items-center rounded-full bg-clay px-4 text-sm font-semibold text-white">
        Sign in
      </Link>
    </div>
  )
}
