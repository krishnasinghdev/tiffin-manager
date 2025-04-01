import React from "react"

import { Card, CardPostData } from "@/payload/components/card"
import { cn } from "@/lib/utils"

export type Props = {
  posts: CardPostData[]
  relationTo: string
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts, relationTo } = props

  return (
    <div className={cn("container")}>
      <div>
        <div className="grid grid-cols-4 gap-x-4 gap-y-4 sm:grid-cols-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === "object" && result !== null) {
              return (
                <div className="col-span-4" key={index}>
                  <Card className="h-full" doc={result} relationTo={relationTo} showCategories />
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
