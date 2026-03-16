"use client"

import { useState } from "react"
import Image from "next/image"
import AboutModal from "./AboutModal"

export type OffersContent = {
  heading?: string
  subheading?: string
  categories?: Array<{
    title?: string
    layout?: "grid" | "feature"
    items?: Array<{
      title?: string
      description?: string
      image_url?: string
      icon?: string
      badge?: string
      bullets?: string[]
      cta?: {
        mode: "community" | "external"
        label: string
        url?: string
      }
    }>
  }>
}

export default function OffersSection({ content }: { content: OffersContent }) {
  const [selectedItem, setSelectedItem] = useState<{
    title?: string
    description?: string
    image_url?: string
    bullets?: string[]
    badge?: string
    cta?: { mode: "community" | "external"; label: string; url?: string }
  } | null>(null)

  return (
    <>
      <section id="ways-we-work" className="w-full py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Section Heading */}
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-6">
              {content.heading}
            </h2>
            {content.subheading && (
              <p className="font-sans text-lg md:text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
                {content.subheading}
              </p>
            )}
          </div>

          {/* Categories */}
          {content.categories?.map((category, cIndex) => (
            <div key={cIndex} className="mb-20">

              {category.title && (
                <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-charcoal mb-12 text-center lg:text-left">
                  {category.title}
                </h3>
              )}

              {/* GRID LAYOUT */}
              {category.layout !== "feature" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                  {category.items?.map((item, i) => (
                    <div key={i} className="group bg-white rounded-2xl shadow-md hover:shadow-xl hover-lift transition-all duration-300 overflow-hidden flex flex-col">
                      {item.image_url && (
                        <div className="relative aspect-[16/9] w-full">
                          <Image
                            src={item.image_url}
                            alt={item.title || ""}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="p-8 flex flex-col flex-grow space-y-4">
                        {item.icon && (
                          <div className="w-16 h-16 bg-terracotta/20 flex items-center justify-center rounded-lg">
                            <i className={`${item.icon} text-terracotta text-2xl`} />
                          </div>
                        )}

                        <h4 className="font-serif text-2xl font-semibold text-charcoal">
                          {item.title}
                        </h4>

                        <p className="font-sans text-base text-charcoal/70 leading-relaxed">
                          {item.description}
                        </p>

                        {item.badge && (
                          <span className="font-sans text-sm uppercase tracking-widest text-terracotta">
                            {item.badge}
                          </span>
                        )}

                        {item.bullets && (
                          <div className="space-y-2">
                            {item.bullets.map((b, bi) => (
                              <div key={bi} className="flex gap-3">
                                <span className="text-terracotta">•</span>
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="w-full px-6 py-3 bg-charcoal text-cream rounded-lg text-sm uppercase tracking-wide hover:bg-charcoal/90 transition"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FEATURE LAYOUT */}
              {category.layout === "feature" &&
                category.items?.map((item, i) => (
                  <div key={i} className="grid lg:grid-cols-2 gap-16 items-center mb-16">

                    {item.image_url && (
                      <div className="relative h-[400px] w-full overflow-hidden rounded-2xl">
                        <Image
                          src={item.image_url}
                          alt={item.title || ""}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover shadow-lg rounded-2xl"
                        />
                      </div>
                    )}

                    <div className="space-y-6">
                      <h4 className="font-serif text-3xl font-semibold text-charcoal">
                        {item.title}
                      </h4>

                      <p className="font-sans text-base md:text-lg text-charcoal/80 leading-relaxed">
                        {item.description}
                      </p>

                      {item.bullets && (
                        <div className="space-y-3">
                          {item.bullets.map((b, bi) => (
                            <div key={bi} className="flex gap-3">
                              <span className="text-terracotta">•</span>
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-8 py-4 bg-charcoal text-cream rounded-lg text-sm uppercase tracking-wide hover:bg-charcoal/90 transition"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

            </div>
          ))}
        </div>
      </section>

      <AboutModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title}
        description={selectedItem?.description}
        bullets={selectedItem?.bullets}
        badge={selectedItem?.badge}
        imageUrl={selectedItem?.image_url}
        cta={selectedItem?.cta}
      />
    </>
  )
}
