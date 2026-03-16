"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ProductProfile = {
  id: string
  slug: string
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  product_format: string
  price_text: string | null
  who_its_for: string
  benefits: string[]
  cta_text: string | null
  cta_url: string | null
  business: { id: string; name: string; logo_url: string | null }
}

export default function ProductProfileModal({
  product,
  onClose,
}: {
  product: ProductProfile | null
  onClose: () => void
}) {
  if (!product) return null

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* 1. Header: product image, title, Offered by */}
          {product.image_url && (
            <div className="w-full overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={product.image_url}
                alt={product.name}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[320px] object-cover"
                priority
              />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium text-gray-500">Offered by</span>
            <Image
              src={product.business.logo_url || "/placeholder.svg?height=32&width=32"}
              alt={product.business.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-contain bg-gray-100 border border-gray-200"
            />
            <span className="font-medium text-gray-900">{product.business.name}</span>
          </div>

          {/* 2. Quick context: product format, optional price */}
          <div className="flex flex-wrap gap-2 items-center">
            {product.product_format && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {product.product_format}
              </span>
            )}
            {product.price_text && (
              <span className="text-sm font-medium text-gray-700">{product.price_text}</span>
            )}
          </div>

          {/* 3. Who this is for */}
          {product.who_its_for && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Who this is for</h3>
              <p className="text-gray-700 leading-relaxed">{product.who_its_for}</p>
            </div>
          )}

          {/* 4. Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.long_description || product.short_description || "—"}
            </p>
          </div>

          {/* 5. Key benefits / outcomes */}
          {product.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key benefits</h3>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700">
                {product.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. CTA section */}
          {product.cta_text && product.cta_url && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button
                onClick={() => window.open(product.cta_url!, "_blank")}
                className="w-full text-white text-lg py-6 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-5 h-5 mr-2 inline" />
                {product.cta_text}
              </Button>
              <p className="text-xs text-gray-500 text-center">You&apos;ll be redirected to their site.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
