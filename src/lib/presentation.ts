import type { PublicSalon, SalonService } from '../types'

const salonImages = ['/media/salon-luxe.jpg', '/media/salon-urban.jpg', '/media/salon-botanical.jpg', '/media/salon-color.jpg']

const portraits = [
  '/media/portrait-anaya.jpg',
  '/media/portrait-b.jpg',
  '/media/portrait-a.jpg',
  '/media/portrait-arjun.jpg',
  '/media/portrait-sana.jpg',
  '/media/portrait-kabir.jpg',
]

const salonBySlug: Record<string, string> = {
  'luxe-atelier': '/media/salon-luxe.jpg',
  'urban-cuts': '/media/salon-urban.jpg',
  fashion: '/media/salon-color.jpg',
}

const portraitByName: Record<string, string> = {
  anaya: '/media/portrait-anaya.jpg',
  kabir: '/media/portrait-kabir.jpg',
  arjun: '/media/portrait-arjun.jpg',
  sana: '/media/portrait-sana.jpg',
}

export type ServiceGroup = 'Hair' | 'Color' | 'Spa' | 'Nails' | 'Grooming'
export type StylistRole = 'Colorist' | 'Stylist' | 'Barber'
export type PriceTier = '$' | '$$' | '$$$'

export const serviceGroups: ServiceGroup[] = ['Hair', 'Color', 'Spa', 'Nails', 'Grooming']
export const stylistRoles: StylistRole[] = ['Colorist', 'Stylist', 'Barber']

const sectionTitle: Record<ServiceGroup, string> = {
  Hair: 'Hair & Styling',
  Color: 'Hair & Coloring',
  Spa: 'Spa & Treatments',
  Nails: 'Nails',
  Grooming: 'Grooming',
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

export function salonImage(slug: string) {
  return salonBySlug[slug] ?? salonImages[hashString(slug) % salonImages.length]
}

export function portraitImage(firstName: string, id: string) {
  return portraitByName[firstName.toLowerCase()] ?? portraits[hashString(id) % portraits.length]
}

export function serviceGroup(category: string): ServiceGroup {
  const value = category.toLowerCase()
  if (value.includes('colour') || value.includes('color')) return 'Color'
  if (value.includes('nail')) return 'Nails'
  if (value.includes('skin') || value.includes('spa') || value.includes('care') || value.includes('scalp')) return 'Spa'
  if (value.includes('groom') || value.includes('beard')) return 'Grooming'
  return 'Hair'
}

export function sectionName(group: ServiceGroup) {
  return sectionTitle[group]
}

export function stylistRole(specialty: string | null): StylistRole {
  const value = (specialty ?? '').toLowerCase()
  if (value.includes('colour') || value.includes('color')) return 'Colorist'
  if (value.includes('fade') || value.includes('beard') || value.includes('barber') || value.includes('groom')) return 'Barber'
  return 'Stylist'
}

export function priceTier(prices: number[]): PriceTier {
  if (prices.length === 0) return '$$'
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
  if (average < 1000) return '$'
  if (average < 3000) return '$$'
  return '$$$'
}

export function salonPrices(salon: Pick<PublicSalon, 'services'>) {
  return salon.services.map((service) => Number(service.price)).filter((price) => !Number.isNaN(price))
}

export function primaryGroup(services: Pick<SalonService, 'category'>[]) {
  if (services.length === 0) return 'Hair'
  return serviceGroup(services[0].category)
}

export function shortName(firstName: string, lastName: string) {
  const initial = lastName.trim().charAt(0)
  return initial ? `${firstName} ${initial}.` : firstName
}
