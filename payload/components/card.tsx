"use client"

import React, { Fragment } from "react"
import Link from "next/link"

import type { Post } from "@/types/payload-types"
import { Media } from "@/payload/components/media"
import useClickableCard from "@/lib/hooks/useClickableCard"
import { cn } from "@/lib/utils"

export type CardPostData = Pick<Post, "slug" | "categories" | "meta" | "title">

export const Card: React.FC<{
  alignItems?: "center"
  className?: string
  doc?: CardPostData
  relationTo?: string
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, " ") // replace non-breaking space with white space
  const href = `/${relationTo}/${slug}`

  return (
    <article className={cn("border-border bg-card overflow-hidden rounded-lg border hover:cursor-pointer", className)} ref={card.ref}>
      <div className="relative w-full">
        {!metaImage && <div>No image</div>}
        {metaImage && typeof metaImage !== "string" && <Media resource={metaImage} size="33vw" />}
      </div>
      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="mb-4 text-sm uppercase">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  if (typeof category === "object") {
                    const { title: titleFromCategory } = category
                    const isLast = index === categories.length - 1
                    const categoryTitle = titleFromCategory || "Untitled category"

                    return (
                      <Fragment key={index}>
                        {categoryTitle}
                        {!isLast && <Fragment>, &nbsp;</Fragment>}
                      </Fragment>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        )}
        {titleToUse && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && <div className="mt-2">{description && <p>{sanitizedDescription}</p>}</div>}
      </div>
    </article>
  )
}
