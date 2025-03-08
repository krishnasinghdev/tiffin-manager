"use client"

import React, { useEffect } from "react"

import type { Page } from "@/types/payload-types"
import { CMSLink } from "@/payload/components/link"
import { Media } from "@/payload/components/media"
import RichText from "@/payload/components/richtext"
import { useHeaderTheme } from "@/payload/providers/header-theme"

export const HighImpactHero: React.FC<Page["hero"]> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme("dark")
  })
  console.log(media)
  return (
    <div className="relative -mt-[10.4rem] flex items-center justify-center text-white" data-theme="dark">
      <div className="relative z-10 container mb-8 flex items-center justify-center">
        <div className="max-w-[36.5rem] md:text-center">
          {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex gap-4 md:justify-center">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="min-h-[80vh] select-none">
        {media && typeof media === "object" && <Media fill imgClassName="-z-10 object-cover" priority resource={media} />}
      </div>
    </div>
  )
}
