import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Heart, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

export function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className={cn('bg-[linear-gradient(145deg,#ead8c8,#c57a58)]', className)} aria-hidden="true" />
  }
  return <img src={src} alt={alt} className={cn('block object-cover', className)} loading="lazy" onError={() => setFailed(true)} />
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-[0_1px_2px_rgba(44,38,31,0.06)]">
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-[#b3a89c]"
      />
      {value ? (
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted" aria-label="Clear search" onClick={() => onChange('')}>
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  )
}

export function BookLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-clay px-4 text-sm font-semibold text-white hover:bg-[#b56b4a]">
      {children}
    </Link>
  )
}

export function SaveButton({ pressed, label, onClick }: { pressed: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className={cn('grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm', pressed ? 'text-clay' : 'text-muted')}
    >
      <Heart className={cn('h-4 w-4', pressed && 'fill-current')} />
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-3xl bg-[#e7dfd4]', className)} />
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[min(85dvh,640px)] overflow-y-auto rounded-t-[28px] bg-[#fffdf9] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(440px,calc(100%-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
      >
        {children}
      </div>
    </div>
  )
}

