import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8', className)}>{children}</div>
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-[24px] border border-[#efe7dc] bg-card shadow-[0_1px_2px_rgba(44,38,31,0.04)]', className)}>{children}</section>
}

export function Button({
  className,
  variant = 'dark',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'dark' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'dark' && 'bg-clay text-white hover:bg-[#b56b4a]',
        variant === 'secondary' && 'border border-[#e6ddd0] bg-white text-ink hover:bg-[#f6f1ea]',
        variant === 'ghost' && 'text-ink hover:bg-[#f6f1ea]',
        variant === 'danger' && 'bg-[#7a3030] text-white hover:bg-[#642626]',
        className,
      )}
      {...props}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

const control = 'min-h-11 w-full rounded-2xl border border-[#e6ddd0] bg-[#fffdf9] px-3 text-base text-ink outline-none focus:border-clay'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-24 py-3', className)} {...props} />
}
