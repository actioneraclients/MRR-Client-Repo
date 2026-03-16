"use client"

import { useState } from "react"
import Image from "next/image"
import AboutModal from "./AboutModal"

type TeamMember = {
  name?: string
  role?: string
  image_url?: string
  bio?: string
}

export type TeamContent = {
  heading?: string
  subheading?: string
  members?: TeamMember[]
}

export default function TeamSection({
  content,
  brandBackground,
  brandPrimary,
  brandAccent,
}: {
  content: TeamContent
  brandBackground: string
  brandPrimary: string
  brandAccent: string
}) {
  const [selected, setSelected] = useState<TeamMember | null>(null)

  return (
    <>
      <section
        className="w-full py-24 lg:py-32"
        style={{ backgroundColor: brandBackground }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <div className="text-center mb-20">

            {content.heading && (
              <h2
                className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: brandPrimary }}
              >
                {content.heading}
              </h2>
            )}

            {content.subheading && (
              <p className="text-lg md:text-xl text-charcoal/70 max-w-3xl mx-auto">
                {content.subheading}
              </p>
            )}

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">

            {content.members?.map((member, i) => (
              <div
                key={i}
                onClick={() => setSelected(member)}
                className="cursor-pointer group text-center"
              >

                {member.image_url && (
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                    <Image
                      src={member.image_url}
                      alt={member.name || ""}
                      fill
                      sizes="192px"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}

                <h4
                  className="font-serif text-2xl font-semibold"
                  style={{ color: brandPrimary }}
                >
                  {member.name}
                </h4>

                <div
                  className="text-sm uppercase tracking-widest mt-2"
                  style={{ color: brandAccent }}
                >
                  {member.role}
                </div>

              </div>
            ))}

          </div>
        </div>
      </section>

      <AboutModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.bio}
        imageUrl={selected?.image_url}
      />
    </>
  )
}
