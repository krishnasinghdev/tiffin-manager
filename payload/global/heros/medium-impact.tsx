import React from "react"

import type { Page } from "@/types/payload-types"
import { CMSLink } from "@/payload/components/link"
import { Media } from "@/payload/components/media"
import RichText from "@/payload/components/richtext"

export const MediumImpactHero: React.FC<Page["hero"]> = ({ links, media, richText }) => {
  return (
    <div>
      <div className="container mb-8">
        {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}

        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex gap-4">
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
      <div className="container">
        {media && typeof media === "object" && (
          <div>
            <Media className="-mx-4 md:-mx-8 2xl:-mx-16" imgClassName="" priority resource={media} />
          </div>
        )}
      </div>
    </div>
  )
}
