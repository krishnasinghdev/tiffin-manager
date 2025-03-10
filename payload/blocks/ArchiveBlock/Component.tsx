import React from "react"
import Link from "next/link"
import { getPayload } from "payload"

import type { ArchiveBlock as ArchiveBlockProps, Post } from "@/types/payload-types"
import { CollectionArchive } from "@/payload/components/collection-archive"
import RichText from "@/payload/components/richtext"
import configPromise from "@/payload/payload.config"

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  let posts: Post[] = []
  let relationTo: string = "vendors"
  const limit = limitFromProps || 3

  if (populateBy === "collection") {
    relationTo = "posts"
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === "object") return category.id
      else return category
    })

    const fetchedPosts = await payload.find({
      collection: "posts",
      depth: 1,
      limit,
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    posts = fetchedPosts.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs.map((post) => {
        if (typeof post.value === "object") return post.value
      }) as Post[]

      posts = filteredSelectedPosts
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
          <Link href={`/${relationTo}`} className="text-primary-foreground">
            View all
          </Link>
        </div>
      )}
      <CollectionArchive posts={posts} relationTo={relationTo} />
    </div>
  )
}
