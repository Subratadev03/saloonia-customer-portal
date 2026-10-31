import axios from 'axios'
import { api } from './api'

export function priceToPaise(price: string | number) {
  const normalized = typeof price === 'number' ? price.toFixed(2) : price.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw Object.assign(new Error('This visit cannot be paid online.'), { releaseHold: true })
  }
  const [rupees, fraction = ''] = normalized.split('.')
  return Number(rupees) * 100 + Number((fraction + '00').slice(0, 2))
}

export function releasesHold(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'releaseHold' in error && (error as { releaseHold?: boolean }).releaseHold)
}

type RazorpaySuccess = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type CheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpaySuccess) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => RazorpayInstance
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(Object.assign(new Error('Could not load Razorpay checkout.'), { releaseHold: true })), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(Object.assign(new Error('Could not load Razorpay checkout.'), { releaseHold: true }))
    document.body.appendChild(script)
  })
}

export type PayBookingInput = {
  bookingId: string
  amount: number
  name: string
  description: string
  prefill: { name: string; email: string; contact?: string }
  onFailed?: (message: string) => void
}

export async function payBooking(input: PayBookingInput): Promise<'paid' | 'dismissed'> {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!key) {
    throw Object.assign(new Error('Razorpay is not configured.'), { releaseHold: true })
  }

  let order: { order_id: string; amount: number; currency: string }
  try {
    const response = await api.post<{ order_id: string; amount: number; currency: string }>('/create-order', {
      amount: input.amount,
      currency: 'INR',
      receipt: input.bookingId,
      bookingId: input.bookingId,
    })
    order = response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      ;(error as { releaseHold?: boolean }).releaseHold = true
    }
    throw error
  }

  await loadRazorpay()
  const RazorpayCheckout = window.Razorpay
  if (!RazorpayCheckout) {
    throw Object.assign(new Error('Could not load Razorpay checkout.'), { releaseHold: true })
  }

  const result = await new Promise<'dismissed' | RazorpaySuccess>((resolve) => {
    let settled = false
    const checkout = new RazorpayCheckout({
      key,
      amount: order.amount,
      currency: order.currency,
      name: input.name,
      description: input.description,
      order_id: order.order_id,
      prefill: {
        name: input.prefill.name,
        email: input.prefill.email,
        contact: input.prefill.contact || undefined,
      },
      theme: { color: '#c57a58' },
      handler(response) {
        if (settled) return
        settled = true
        resolve(response)
      },
      modal: {
        ondismiss() {
          if (settled) return
          settled = true
          resolve('dismissed')
        },
      },
    })
    checkout.on('payment.failed', (response) => {
      input.onFailed?.(response.error?.description || 'Payment failed. You can try another method.')
    })
    checkout.open()
  })

  if (result === 'dismissed') return 'dismissed'

  await api.post('/verify-payment', {
    bookingId: input.bookingId,
    razorpay_order_id: result.razorpay_order_id,
    razorpay_payment_id: result.razorpay_payment_id,
    razorpay_signature: result.razorpay_signature,
  })
  return 'paid'
}
