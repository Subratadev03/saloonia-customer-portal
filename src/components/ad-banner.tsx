import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export type PublicAdvertisement = {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  salonName: string
  salonSlug: string
}

function destination(ad: PublicAdvertisement) {
  return ad.linkUrl?.trim() || `/salons/${ad.salonSlug}`
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href)
}

export function AdBanner() {
  const [ads, setAds] = useState<PublicAdvertisement[]>([])
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    api
      .get<PublicAdvertisement[]>('/public/advertisements')
      .then(({ data }) => {
        if (active) setAds(data)
      })
      .catch(() => {
        if (active) setAds([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (ads.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ads.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [ads.length])

  if (ads.length === 0) return null

  const ad = ads[index] ?? ads[0]
  const href = destination(ad)
  const external = isExternal(href)
  const content = (
    <>
      {failed[ad.id] ? (
        <div className="h-40 w-full bg-[linear-gradient(145deg,#ead8c8,#c57a58)] sm:h-48 lg:h-56" />
      ) : (
        <img
          src={ad.imageUrl}
          alt=""
          className="h-40 w-full object-cover sm:h-48 lg:h-56"
          onError={() => setFailed((current) => ({ ...current, [ad.id]: true }))}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/20" />
      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">Ad</span>
      <div className="absolute bottom-4 left-4 right-16 text-white">
        <p className="text-lg font-semibold sm:text-2xl">{ad.title}</p>
        {ad.subtitle ? <p className="mt-1 text-sm text-white/85">{ad.subtitle}</p> : null}
      </div>
    </>
  )

  return (
    <section className="mt-4" aria-roledescription="carousel" aria-label="Advertisements">
      <div className="relative overflow-hidden rounded-[28px] bg-[#ddd4c8]">
        {external ? (
          <a href={href} target="_blank" rel="noreferrer" className="block" aria-label={ad.title}>
            {content}
          </a>
        ) : (
          <Link to={href} className="block" aria-label={ad.title}>
            {content}
          </Link>
        )}
        {ads.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm"
              aria-label="Previous advertisement"
              onClick={() => setIndex((current) => (current - 1 + ads.length) % ads.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm"
              aria-label="Next advertisement"
              onClick={() => setIndex((current) => (current + 1) % ads.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {ads.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show advertisement ${itemIndex + 1}`}
                  aria-current={itemIndex === index}
                  className={`h-2 rounded-full ${itemIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}
                  onClick={() => setIndex(itemIndex)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
