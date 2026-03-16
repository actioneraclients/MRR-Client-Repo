"use client"

import { useState } from "react"

type FaqItem = {
  question?: string | null
  answer?: string | null
}

export default function FoundersFaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index

        return (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full text-left px-8 py-6 flex items-center justify-between"
            >
              <h3 className="text-xl font-bold text-gray-900">
                {item?.question}
              </h3>
              <i
                className={`fa-solid ${
                  isOpen ? "fa-minus" : "fa-plus"
                } text-gray-500 transition-transform duration-200`}
              />
            </button>

            {isOpen && (
              <div className="px-8 pb-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item?.answer}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
