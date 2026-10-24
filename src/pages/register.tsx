import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth'
import type { AuthUser } from '../types'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/register', {
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        email: form.get('email'),
        phone: String(form.get('phone') || '') || undefined,
        password: form.get('password'),
      })
      setAuth(data.accessToken, data.user)
      navigate('/account')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6 sm:pt-16">
      <Link to="/" className="text-sm font-semibold text-muted">
        Back to salons
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Create an account</h1>
      <form className="mt-6 grid gap-4 rounded-[24px] bg-white p-5 shadow-sm" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input name="firstName" required autoComplete="given-name" />
          </Field>
          <Field label="Last name">
            <Input name="lastName" required autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Phone">
          <Input name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
        <p className="text-sm text-muted">
          Already booked here?{' '}
          <Link to="/login" className="font-semibold text-ink underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
