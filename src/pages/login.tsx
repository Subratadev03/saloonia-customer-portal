import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { Role, type AuthUser } from '../types'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      if (data.user.role !== Role.CUSTOMER) {
        setError('This app is for guests. Use a guest account to book a chair.')
        return
      }
      setAuth(data.accessToken, data.user)
      const next = params.get('next')
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/account')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6 sm:pt-16">
      <Link to="/" className="text-sm font-semibold text-muted">
        Back to salons
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">See your next booking, points, and saved salons.</p>
      <form className="mt-6 grid gap-4 rounded-[24px] bg-white p-5 shadow-sm" onSubmit={onSubmit}>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required minLength={8} autoComplete="current-password" />
        </Field>
        {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Continue'}
        </Button>
        <p className="text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-ink underline">
            Create a guest account
          </Link>
        </p>
        <p className="rounded-2xl bg-[#f6f1ea] px-4 py-3 text-xs leading-relaxed text-muted">Seeded guest: customer@saloonia.com · Salon@123</p>
      </form>
    </div>
  )
}
