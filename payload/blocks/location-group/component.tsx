import React from "react"
import Link from "next/link"

import type { LocationGroupBlock as LocationGroupProps } from "@/types/payload-types"
import RichText from "@/payload/components/richtext"
import Icons from "@/lib/icons"

export const LocationGroupBlock: React.FC<LocationGroupProps> = (props) => {
  const { introContent, locations } = props

  return (
    <section className="container my-16">
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      {locations && locations.length > 0 && (
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          {locations.map((location, index) => (
            <Link
              href="#"
              key={index}
              className="flex items-center justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              {typeof location.value === "object" && location.value?.title && <h3 className="font-medium">{location.value.title}</h3>}
              <Icons.ChevronRight className="text-muted-foreground h-5 w-5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
