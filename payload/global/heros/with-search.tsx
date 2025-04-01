import React from "react"

import type { Page } from "@/types/payload-types"
import { Media } from "@/payload/components/media"
import RichText from "@/payload/components/richtext"
import { Input } from "@/payload/components/ui/input"
import Icons from "@/lib/icons"

export const WithSearchHero: React.FC<Page["hero"]> = ({ media, richText }) => {
  return (
    <section className="relative h-[80svh] w-full">
      <div className="absolute inset-0 z-10" />
      {media && typeof media === "object" && <Media fill imgClassName="object-cover" priority resource={media} />}
      <div className="relative z-20 container mx-auto flex h-full flex-col items-center justify-center px-4">
        {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
        <div className="w-full max-w-3xl">
          <div className="bg-background mb-3 flex items-center rounded-lg p-2">
            <Icons.MapPin className="mr-1 ml-2 flex-shrink-0 text-red-500" />
            <Input
              placeholder="Lanka, Sankat Mochan, Durgakund ..."
              className="border-none text-black outline-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
